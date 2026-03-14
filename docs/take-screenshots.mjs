import puppeteer from "puppeteer-core";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const DIR = "./docs/screenshots";

async function login(page, login, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  const inputs = await page.$$("input");
  await inputs[0].type(login);
  await inputs[1].type(password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));
}

async function screenshot(page, url, name, wait = 1500) {
  await page.goto(url, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, wait));
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  console.log(`  ok ${name}`);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--window-size=1400,900"],
    defaultViewport: { width: 1400, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // Login page
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: `${DIR}/01-login.png`, fullPage: true });
    console.log("  ok 01-login");

    // Admin
    console.log("Admin...");
    await login(page, "admin@ielts.az", "admin123");
    await screenshot(page, `${BASE}/admin/dashboard`, "02-admin-dashboard");
    await screenshot(page, `${BASE}/admin/users`, "03-admin-users");
    await screenshot(page, `${BASE}/admin/tests`, "05-admin-tests");
    await screenshot(page, `${BASE}/admin/monitoring`, "06-admin-monitoring", 2000);
    await screenshot(page, `${BASE}/admin/reports`, "07-admin-reports");

    // Teacher
    console.log("Teacher...");
    await page.goto(`${BASE}/api/auth/signout`, { waitUntil: "networkidle2" });
    try { await page.click('button[type="submit"]'); await new Promise((r) => setTimeout(r, 1000)); } catch {}
    await login(page, "teacher@ielts.az", "teacher123");
    await screenshot(page, `${BASE}/teacher/dashboard`, "08-teacher-dashboard");
    await screenshot(page, `${BASE}/teacher/groups`, "09-teacher-groups");
    await screenshot(page, `${BASE}/teacher/questions`, "10-teacher-questions");
    await screenshot(page, `${BASE}/teacher/questions/create`, "11-teacher-question-create");
    await screenshot(page, `${BASE}/teacher/writing-review`, "12-teacher-writing-review");

    // Student
    console.log("Student...");
    await page.goto(`${BASE}/api/auth/signout`, { waitUntil: "networkidle2" });
    try { await page.click('button[type="submit"]'); await new Promise((r) => setTimeout(r, 1000)); } catch {}
    await login(page, "5AE1234", "5AE1234");
    await screenshot(page, `${BASE}/student/listening`, "13-student-listening");
    await screenshot(page, `${BASE}/student/reading`, "14-student-reading");
    await screenshot(page, `${BASE}/student/writing`, "15-student-writing");

    // Dean
    console.log("Dean...");
    await page.goto(`${BASE}/api/auth/signout`, { waitUntil: "networkidle2" });
    try { await page.click('button[type="submit"]'); await new Promise((r) => setTimeout(r, 1000)); } catch {}
    await login(page, "dean@ielts.az", "dean123");
    await screenshot(page, `${BASE}/dean/dashboard`, "16-dean-dashboard");
    await screenshot(page, `${BASE}/dean/groups`, "17-dean-groups");
    await screenshot(page, `${BASE}/dean/monitoring`, "18-dean-monitoring", 2000);

    console.log("Done!");
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
