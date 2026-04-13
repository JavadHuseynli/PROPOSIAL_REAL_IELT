import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

const groups: Record<string, string[]> = {
  "T22": [
    "Həmidzadə Sona Zaur",
    "Behbudova Fatimə Elnur",
    "Əzizova Xəyalə Zamin",
    "Məmmədova Leyla Şahin",
    "Məmmədzadə Nuray Mustafa",
    "Gyulakhmedova Səbinə Mamed",
    "Hüseynova Gülay Anar",
    "Məmmədova Amalya Bəxtiyar",
    "Məmmədzadə Fidan Vüqar",
  ],
  "T22a": [
    "Rəhimli Fəridə Oruc",
    "Şəfiyeva Ayşan Azər",
    "Rəcəbova Gülzar Şahin",
    "Süleymanov Ehtibar Fərəculla",
    "Usubov Tuncay Bəxtiyar",
    "Nəhmətli Jalə Hikmət",
    "Salmanova Ləman Müşfiq",
    "Niftalıyev Məhəmməd Şəhriman",
    "Ağazadə Fatimə Mehman",
  ],
  "T22b": [
    "Daşdəmirova Rəvanə Azər",
    "Həsənova Leyla Şöhrət",
    "Hüseynova Elmira İlqar",
    "İsmayılova Aygün Camal",
    "İsmayılzadə Rəqsanə Elşad",
    "Zeynalova Aytac Müşviq",
    "Mərdanova Fatimə Seymur",
    "Qasımova Nəzrin Ramil",
    "Abasova Aymən Əsəd",
    "Babayeva Rəksanə Cavad",
    "Babayeva Aytac Ramiz",
    "Bayramova Aynur Fəxrəddin",
    "Bubuşova Aysel İlham",
  ],
  "T22c": [
    "Rəsulov Məqsəd Mətləb",
    "Rzayeva Xədicə Təbriz",
    "Sayadlı Məmməd Əbülfəz",
    "Cəbiyeva Nuranə Elnur",
    "Heydərli Nəzakət Səbuhi",
    "Cabbarova Məlahət Aqil",
    "Cəfərova Aysel Asim",
    "Dadaşov Həmdulla Sahət",
    "Əlirzayeva Nurgül Elburus",
    "Əliyeva Fatimə Namiq",
    "Əlizadə Namiq Zamik",
  ],
  "T22d": [
    "Şirəliyeva Aysun Rafiq",
    "Şirinli Sona Mehman",
    "Uğurluyeva Zəhra Elsevər",
    "Umudova Dilşad Eldəniz",
    "Xəlilova Sevinc Çingiz",
    "Yusifova Gülarə Nəsimi",
    "Zəkizadə Narinc Rüstəm",
    "Zeynalov Vahid Müşviq",
    "Zeynalova Lalə İlqar",
    "Əsgərova İnci İlman",
    "Əskərova Şəbnur Şaiq",
    "Güləliyeva Aytəkin Səyavuş",
    "Həmidov Məhəmməd Səmədağa",
    "Novruzlu Fidan Dilqəm",
    "Həmzəyeva Sübhanə",
  ],
};

const azMap: Record<string, string> = {
  ə: "e", Ə: "e", ı: "i", İ: "i", ö: "o", Ö: "o", ü: "u", Ü: "u",
  ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g",
};

function translit(s: string): string {
  return s.split("").map((c) => azMap[c] ?? c).join("").toLowerCase();
}

function makeUsername(full: string, group: string): string {
  // full = "Surname Name Patronymic" → adsoyadqrup (no dot, used for FIN & password)
  const parts = full.trim().split(/\s+/);
  const surname = translit(parts[0]);
  const name = translit(parts[1] ?? "");
  const g = translit(group);
  return `${name}${surname}${g}`.replace(/[^a-z0-9]/g, "");
}

async function main() {
  const lines: string[] = ["group,fullname,fin,password"];

  for (const [groupName, students] of Object.entries(groups)) {
    const group = await prisma.group.upsert({
      where: { name: groupName },
      update: {},
      create: { name: groupName },
    });

    const usernameCounts: Record<string, number> = {};

    for (const fullname of students) {
      let fin = makeUsername(fullname, groupName);
      const n = (usernameCounts[fin] = (usernameCounts[fin] ?? 0) + 1);
      if (n > 1) fin = `${fin}${n}`;

      const email = `${fin}@ielts.az`;
      const password = fin;
      const hashed = await bcrypt.hash(password, 10);

      await prisma.user.upsert({
        where: { email },
        update: {
          fin,
          password: hashed,
          name: fullname,
          groupId: group.id,
        },
        create: {
          email,
          fin,
          password: hashed,
          name: fullname,
          role: "STUDENT",
          groupId: group.id,
        },
      });

      lines.push(`${groupName},"${fullname}",${fin},${password}`);
      console.log(`+ ${groupName} | ${fullname} | FIN=${fin} | pw=${password}`);
    }
  }

  writeFileSync("t22-credentials.csv", lines.join("\n"));
  console.log("\nCredentials written to t22-credentials.csv");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
