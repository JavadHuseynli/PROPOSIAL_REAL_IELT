import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const FRAMES_DIR = "./docs/frames";

// Clean and create frames dir
if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
fs.mkdirSync(FRAMES_DIR, { recursive: true });

let frameNum = 0;

async function login(page, loginVal, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 500));
  const inputs = await page.$$("input");
  // Clear and type
  await inputs[0].click({ clickCount: 3 });
  await inputs[0].type(loginVal);
  await inputs[1].click({ clickCount: 3 });
  await inputs[1].type(password);
  await capture(page, 800); // show login filled
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));
}

async function logout(page) {
  await page.goto(`${BASE}/api/auth/signout`, { waitUntil: "networkidle2" });
  try { await page.click('button[type="submit"]'); await new Promise((r) => setTimeout(r, 800)); } catch {}
}

async function capture(page, wait = 600, count = 1) {
  await new Promise((r) => setTimeout(r, wait));
  for (let i = 0; i < count; i++) {
    const num = String(frameNum++).padStart(5, "0");
    await page.screenshot({ path: `${FRAMES_DIR}/frame-${num}.png` });
    // Duplicate frame for longer display (each frame = ~0.5s in video)
    for (let d = 1; d <= 3; d++) {
      const dupNum = String(frameNum++).padStart(5, "0");
      fs.copyFileSync(`${FRAMES_DIR}/frame-${num}.png`, `${FRAMES_DIR}/frame-${dupNum}.png`);
    }
  }
}

async function goAndCapture(page, url, wait = 1200) {
  await page.goto(url, { waitUntil: "networkidle2" });
  await capture(page, wait);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--window-size=1400,900"],
    defaultViewport: { width: 1400, height: 900 },
  });

  const page = await browser.newPage();

  console.log("Recording...");

  // === INTRO: Login page ===
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await capture(page, 1000);

  // === ADMIN FLOW ===
  console.log("  Admin flow...");
  await login(page, "admin@ielts.az", "admin123");
  await capture(page, 1500); // dashboard
  await goAndCapture(page, `${BASE}/admin/users`, 1500);
  await goAndCapture(page, `${BASE}/admin/tests`, 1500);
  await goAndCapture(page, `${BASE}/admin/monitoring`, 1500);
  await goAndCapture(page, `${BASE}/admin/reports`, 1500);
  await logout(page);

  // === TEACHER FLOW ===
  console.log("  Teacher flow...");
  await login(page, "teacher@ielts.az", "teacher123");
  await capture(page, 1500); // dashboard
  await goAndCapture(page, `${BASE}/teacher/groups`, 1500);
  await goAndCapture(page, `${BASE}/teacher/questions`, 1500);
  await goAndCapture(page, `${BASE}/teacher/questions/create`, 1500);
  await goAndCapture(page, `${BASE}/teacher/writing-review`, 1500);
  await logout(page);

  // === STUDENT FLOW ===
  console.log("  Student flow...");
  await login(page, "5AE1234", "5AE1234");
  await capture(page, 1500); // listening
  await goAndCapture(page, `${BASE}/student/reading`, 1500);
  await goAndCapture(page, `${BASE}/student/writing`, 1500);
  await logout(page);

  // === DEAN FLOW ===
  console.log("  Dean flow...");
  await login(page, "dean@ielts.az", "dean123");
  await capture(page, 1500); // dashboard
  await goAndCapture(page, `${BASE}/dean/groups`, 1500);
  await goAndCapture(page, `${BASE}/dean/monitoring`, 1500);
  await logout(page);

  // Final login screen
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await capture(page, 1000);

  await browser.close();
  console.log(`  ${frameNum} frames captured`);

  // Create video with ffmpeg
  console.log("Creating video...");
  const { execSync } = await import("child_process");
  execSync(
    `ffmpeg -y -framerate 2 -i ${FRAMES_DIR}/frame-%05d.png -vf "scale=1400:900" -c:v libx264 -pix_fmt yuv420p -preset slow -crf 23 docs/IELTS-Demo.mp4`,
    { stdio: "inherit" }
  );

  console.log("Done! Video: docs/IELTS-Demo.mp4");

  // Cleanup frames
  fs.rmSync(FRAMES_DIR, { recursive: true });
}

main().catch(console.error);
