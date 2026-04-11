import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const azMap: Record<string, string> = {
  ə: "e", Ə: "e", ı: "i", İ: "i", ö: "o", Ö: "o", ü: "u", Ü: "u",
  ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g",
};
const translit = (s: string) =>
  s.split("").map((c) => azMap[c] ?? c).join("").toLowerCase();

function makeFin(fullname: string, group: string): string {
  const parts = fullname.trim().split(/\s+/);
  const surname = translit(parts[0]);
  const name = translit(parts[1] ?? "");
  const g = translit(group);
  return `${name}${surname}${g}`.replace(/[^a-z0-9]/g, "");
}

async function main() {
  const groups = await prisma.group.findMany({
    where: { name: { startsWith: "T22" } },
    include: { students: true },
  });

  for (const group of groups) {
    // Group students by canonical fin
    const byFin = new Map<string, typeof group.students>();
    for (const s of group.students) {
      const fin = makeFin(s.name, group.name);
      if (!byFin.has(fin)) byFin.set(fin, []);
      byFin.get(fin)!.push(s);
    }

    for (const [fin, dupes] of byFin) {
      // Keep the FIRST one, delete the rest
      const [keep, ...others] = dupes;
      const email = `${fin}@ielts.az`;
      const hashed = await bcrypt.hash(fin, 10);

      // Move all related records from duplicates to the keeper, then delete
      for (const dup of others) {
        try {
          await prisma.testAttempt.updateMany({
            where: { userId: dup.id },
            data: { userId: keep.id },
          });
          await prisma.writingReview.updateMany({
            where: { teacherId: dup.id },
            data: { teacherId: keep.id },
          }).catch(() => {});
          await prisma.user.delete({ where: { id: dup.id } });
          console.log(`  - deleted dup: ${dup.email}`);
        } catch (e: any) {
          console.log(`  ! could not delete ${dup.email}: ${e.message}`);
        }
      }

      // Update the one we keep
      try {
        await prisma.user.update({
          where: { id: keep.id },
          data: { fin, email, password: hashed },
        });
        console.log(`+ ${group.name} | ${keep.name} | FIN=${fin}`);
      } catch (e: any) {
        console.log(`! could not update ${keep.name}: ${e.message}`);
      }
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
