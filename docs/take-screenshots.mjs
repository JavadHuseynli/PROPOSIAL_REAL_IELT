import puppeteer from "puppeteer-core";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const DIR = "./docs/screenshots";

async function login(page, login, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="text"]', login);
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));
}

async function screenshot(page, url, name, wait = 1500) {
  await page.goto(url, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, wait));
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  console.log(`  ✓ ${name}`);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--window-size=1400,900"],
    defaultViewport: { width: 1400, height: 900 },
  });

  try {
    // Login page
    const page = await browser.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: `${DIR}/01-login.png`, fullPage: true });
    console.log("  ✓ 01-login");

    // Admin screenshots
    console.log("Admin panels...");
    await login(page, "admin@ielts.az", "admin123");
    await screenshot(page, `${BASE}/admin/dashboard`, "02-admin-dashboard");
    await screenshot(page, `${BASE}/admin/users`, "03-admin-users");
    await screenshot(page, `${BASE}/admin/groups`, "04-admin-groups");
    await screenshot(page, `${BASE}/admin/tests`, "05-admin-tests");
    await screenshot(page, `${BASE}/admin/reports`, "06-admin-reports");

    // Teacher screenshots
    console.log("Teacher panels...");
    await page.goto(`${BASE}/api/auth/signout`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 500));
    // Click confirm signout if button exists
    try {
      await page.click('button[type="submit"]');
      await new Promise((r) => setTimeout(r, 1000));
    } catch {}
    await login(page, "teacher@ielts.az", "teacher123");
    await screenshot(page, `${BASE}/teacher/dashboard`, "07-teacher-dashboard");
    await screenshot(page, `${BASE}/teacher/questions`, "08-teacher-questions");
    await screenshot(page, `${BASE}/teacher/questions/create`, "09-teacher-question-create");
    await screenshot(page, `${BASE}/teacher/writing-review`, "10-teacher-writing-review");

    // Student screenshots
    console.log("Student panels...");
    await page.goto(`${BASE}/api/auth/signout`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 500));
    try {
      await page.click('button[type="submit"]');
      await new Promise((r) => setTimeout(r, 1000));
    } catch {}
    await login(page, "5AE1234", "5AE1234");
    await screenshot(page, `${BASE}/student/listening`, "11-student-listening");
    await screenshot(page, `${BASE}/student/reading`, "12-student-reading");
    await screenshot(page, `${BASE}/student/writing`, "13-student-writing");

    // Dean screenshots
    console.log("Dean panels...");
    await page.goto(`${BASE}/api/auth/signout`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 500));
    try {
      await page.click('button[type="submit"]');
      await new Promise((r) => setTimeout(r, 1000));
    } catch {}
    await login(page, "dean@ielts.az", "dean123");
    await screenshot(page, `${BASE}/dean/dashboard`, "14-dean-dashboard");
    await screenshot(page, `${BASE}/dean/groups`, "15-dean-groups");

    console.log("All screenshots done!");
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
