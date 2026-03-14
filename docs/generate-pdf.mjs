import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DIR = "./docs/screenshots";

function img(name) {
  const p = path.join(DIR, name);
  if (!fs.existsSync(p)) return "";
  return `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
}

const html = `<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 40px 50px; size: A4; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.6; font-size: 13px; }
  h1 { color: #1e40af; font-size: 28px; border-bottom: 3px solid #1e40af; padding-bottom: 10px; margin-top: 0; }
  h2 { color: #1e40af; font-size: 20px; margin-top: 35px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  h3 { color: #334155; font-size: 16px; margin-top: 20px; }
  .cover { text-align: center; padding-top: 200px; page-break-after: always; }
  .cover h1 { font-size: 36px; border: none; }
  .cover p { font-size: 16px; color: #64748b; }
  .cover .ver { margin-top: 40px; font-size: 14px; color: #94a3b8; }
  .section { page-break-before: always; }
  .ss { margin: 15px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .ss img { width: 100%; display: block; }
  .info { background: #eff6ff; border-left: 4px solid #1e40af; padding: 12px 16px; margin: 12px 0; border-radius: 0 6px 6px 0; }
  .warn { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 12px 0; border-radius: 0 6px 6px 0; }
  .danger { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 12px 0; border-radius: 0 6px 6px 0; }
  .step { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 10px 0; }
  .sn { display: inline-block; background: #1e40af; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 8px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .b-admin { background: #fee2e2; color: #991b1b; }
  .b-teacher { background: #dbeafe; color: #1e40af; }
  .b-student { background: #dcfce7; color: #166534; }
  .b-dean { background: #fef3c7; color: #92400e; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
  th { background: #f1f5f9; padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0; }
  td { padding: 8px 12px; border: 1px solid #e2e8f0; }
  ul { padding-left: 20px; }
  li { margin-bottom: 4px; }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <h1>IELTS Hazirliq Sistemi</h1>
  <p>Universitet ucun IELTS imtahan hazirliq platformasi</p>
  <p>Istifadeci Telimat</p>
  <div class="ver">Versiya 1.0 | Mart 2026</div>
</div>

<!-- MUNDERICAT -->
<div class="section">
<h1>Mundericat</h1>
<ol style="font-size: 15px; line-height: 2.2;">
  <li><b>Sistem Haqqinda</b> - Bu sistem nedir, ne ise yarayir</li>
  <li><b>Giris Sehifesi</b> - Sisteme nece daxil olmaq</li>
  <li><b>Admin Paneli</b> - Istifadeci, test idareetme</li>
  <li><b>Muellim Paneli</b> - Qrup, sual yaratma, writing yoxlama</li>
  <li><b>Telebe Paneli</b> - Test hell etme (Listening, Reading, Writing)</li>
  <li><b>Dekan Paneli</b> - Statistika ve neticeler</li>
  <li><b>Nezaret Sistemi</b> - Telebe ekranina canli nezaret</li>
</ol>
</div>

<!-- 1. HAQQINDA -->
<div class="section">
<h1>1. Sistem Haqqinda</h1>

<h3>Bu sistem nedir?</h3>
<p>Bu, universitetde telebelerin IELTS imtahanina hazirlashmasi ucun onlayn platformadir. Telebe komputer ve ya telefondan brauzerle daxil olub test hell ede biler.</p>

<h3>Sistemde kimler var?</h3>
<table>
  <tr><th>Rol</th><th>Kim?</th><th>Ne ede biler?</th></tr>
  <tr><td><span class="badge b-admin">Admin</span></td><td>Sistem administratoru</td><td>Istifadeciler, testler yaradir</td></tr>
  <tr><td><span class="badge b-teacher">Muellim</span></td><td>IELTS muellimi</td><td>Qrup yaradir, telebe elave edir, sual elave edir, writing yoxlayir</td></tr>
  <tr><td><span class="badge b-student">Telebe</span></td><td>Telebe</td><td>Listening, Reading, Writing testleri hell edir</td></tr>
  <tr><td><span class="badge b-dean">Dekan</span></td><td>Fakulte dekani</td><td>Butun neticelere, statistikaya, nezarete baxir</td></tr>
</table>

<h3>Giris qaydasi</h3>
<table>
  <tr><th>Rol</th><th>Giris usulu</th></tr>
  <tr><td>Telebe</td><td>FIN kodu ile (hem login, hem parol FIN koddur)</td></tr>
  <tr><td>Muellim</td><td>FIN kodu ve ya email ile</td></tr>
  <tr><td>Admin / Dekan</td><td>Email + parol ile</td></tr>
</table>

<h3>IELTS test novleri</h3>
<ul>
  <li><b>Listening</b> - Audio dinleyib suallara cavab verilir</li>
  <li><b>Reading</b> - Metn oxuyub suallara cavab verilir</li>
  <li><b>Writing</b> - Verilmish tapshiriga esse/metn yazilir, muellim yoxlayir</li>
</ul>

<div class="info">
  <b>Qiymetlendirme:</b> Listening ve Reading testleri avtomatik yoxlanilir. Writing testlerini muellim el ile yoxlayir ve IELTS band bali (0-9) verir.
</div>
</div>

<!-- 2. GIRIS -->
<div class="section">
<h1>2. Giris Sehifesi</h1>
<div class="ss"><img src="${img("01-login.png")}"></div>

<div class="step"><span class="sn">1</span> <b>"FIN kod / Email"</b> xanasina FIN kodunuzu ve ya emailinizi yazin</div>
<div class="step"><span class="sn">2</span> <b>"Parol"</b> xanasina parolunuzu yazin (telebeler ucun parol FIN koddur)</div>
<div class="step"><span class="sn">3</span> <b>"Daxil ol"</b> duymesin basin</div>

<div class="warn"><b>Diqqet:</b> Sisteme yalniz admin terefinden yaradilmish istifadeciler daxil ola biler. Kenardan qeydiyyat mumkun deyil.</div>
</div>

<!-- 3. ADMIN -->
<div class="section">
<h1>3. Admin Paneli</h1>
<p>Admin sistemin sahibidir. Istifadeciler yaradir, testler elave edir, nezaret edir.</p>

<h2>3.1 Dashboard</h2>
<div class="ss"><img src="${img("02-admin-dashboard.png")}"></div>
<p>Umumi reqemler: nece istifadeci, nece test, nece qrup var.</p>

<h2>3.2 Istifadeci Idareetme</h2>
<div class="ss"><img src="${img("03-admin-users.png")}"></div>
<p>Burada admin yeni telebe, muellim, dekan yaradir.</p>

<h3>Yeni telebe yaratmaq:</h3>
<div class="step"><span class="sn">1</span> <b>"Yeni Istifadeci"</b> basin</div>
<div class="step"><span class="sn">2</span> <b>Ad</b> yazin, <b>FIN kod</b> yazin</div>
<div class="step"><span class="sn">3</span> <b>Rol</b> = "Telebe" secin, <b>Qrup</b> secin</div>
<div class="step"><span class="sn">4</span> Shifre bosh qalsa FIN kod shifre olur. <b>"Yarat"</b> basin</div>

<div class="info">Telebe secilende: Ad + FIN + Qrup gorsenid. Muellim secilende: Ad + FIN + Email + Qrup. Admin/Dekan secilende: Ad + Email + Shifre.</div>

<h2>3.3 Test Idareetme</h2>
<div class="ss"><img src="${img("05-admin-tests.png")}"></div>
<p>Burada admin yeni testler yaradir: Listening, Reading, Writing. Her test ucun suallar, audio fayllar, writing tapshiriqlari elave olunur.</p>

<h3>Sual tipleri:</h3>
<table>
  <tr><th>Tip</th><th>Izah</th></tr>
  <tr><td>Multiple Choice</td><td>Bir nece variantdan birini secme</td></tr>
  <tr><td>True/False/Not Given</td><td>Dogru/Yanlish/Verilmeyib</td></tr>
  <tr><td>Fill in the Blank</td><td>Boshluqu doldurma</td></tr>
  <tr><td>Note Completion</td><td>Qeydlerde boshluqlari doldurma</td></tr>
  <tr><td>Matching</td><td>Uygunlashdirma</td></tr>
</table>

<div class="info"><b>Shekil elave etmek:</b> Her sualin ve writing tapshiriginin altinda "Shekil" sahesi var. Oradan diagram, qrafik yukleye bilersimiz.</div>

<h2>3.4 Nezaret Paneli</h2>
<div class="ss"><img src="${img("06-admin-monitoring.png")}"></div>
<p>Telebelerin test zamani fealiyyetine canli nezaret. Her 10 saniyede yenilenir. Iki rejim var:</p>
<ul>
  <li><b>Canli Ekranlar</b> - telebelerin ekranlarini real-time gorursunuz</li>
  <li><b>Pozuntular</b> - kim, ne vaxt, ne edib (tab deyishme, copy/paste ve s.)</li>
</ul>
<p>Shubheli fealiyyet cedvelindeki her setrin ustune basanda o telebenin butun ekran goruntuleri ve pozuntulari acilir.</p>

<h2>3.5 Hesabatlar</h2>
<div class="ss"><img src="${img("07-admin-reports.png")}"></div>
<p>Butun testlerin umumi neticeleri: orta ballar, qruplarin muqayisesi.</p>
</div>

<!-- 4. MUELLIM -->
<div class="section">
<h1>4. Muellim Paneli</h1>
<p>Muellimin esas ishleri: qrup yaratmaq, telebe elave etmek, sual elave etmek, writing yoxlamaq.</p>

<h2>4.1 Dashboard</h2>
<div class="ss"><img src="${img("08-teacher-dashboard.png")}"></div>
<p>Yoxlanilmamish writing sayisi, telebelerin sayi, son gonderilmish cavablar.</p>

<h2>4.2 Qruplar</h2>
<div class="ss"><img src="${img("09-teacher-groups.png")}"></div>
<p>Muellim oz qruplarini yaradir ve idaree edir. Her qrupa telebeler elave ede biler.</p>

<h3>Telebe elave etmek:</h3>
<div class="step"><span class="sn">1</span> Qrupun ustune basin, <b>"Telebe Elave Et"</b> basin</div>
<div class="step"><span class="sn">2</span> Telebenin <b>Ad Soyad</b> ve <b>FIN Kod</b> yazin</div>
<div class="step"><span class="sn">3</span> Parol avtomatik FIN kod olacaq. <b>"Elave Et"</b> basin</div>

<h2>4.3 Sual Yaratma</h2>
<div class="ss"><img src="${img("10-teacher-questions.png")}"></div>
<div class="ss"><img src="${img("11-teacher-question-create.png")}"></div>
<p>Muellim movcud testlere yeni suallar elave ede biler. Test secir, sual tipini secir, metni yazir, dogru cavabi qeyd edir.</p>

<h2>4.4 Writing Yoxlama</h2>
<div class="ss"><img src="${img("12-teacher-writing-review.png")}"></div>
<p>Telebeler writing testini bitirdikden sonra cavab burada gorunur. Muellim:</p>
<ul>
  <li>Telebenin yazdigi metni oxuyur</li>
  <li>Band bal verir (0-9, 4 kateqoriyada): Task Achievement, Coherence, Lexical Resource, Grammar</li>
  <li>Metn uzerinde sehvleri secib duzelis yazar</li>
  <li>Umumi sherh yazir ve gonderir</li>
</ul>
</div>

<!-- 5. TELEBE -->
<div class="section">
<h1>5. Telebe Paneli</h1>
<p>Telebe FIN kodu ile daxil olur. 3 bolme gorunur: Listening, Reading, Writing. Her bolmede random bir test teyin olunur.</p>

<div class="danger"><b>Vacib qaydalar:</b>
<ul>
  <li>Her test yalniz <b>bir defe</b> hell edile biler</li>
  <li>Butun tapshriqlar (L+R+W) tamamlanmadan <b>cixish mumkun deyil</b></li>
  <li>Test zamani ekran <b>nezaret olunur</b></li>
  <li>Tab deyishme, copy/paste, sag klik <b>qeyde alinir</b></li>
  <li>Cavablar avtomatik <b>yadda saxlanilir</b> (internet kecilse bele)</li>
</ul></div>

<h2>5.1 Listening</h2>
<div class="ss"><img src="${img("13-student-listening.png")}"></div>
<p>Random bir listening testi teyin olunur. "Teste Bashla" basanda audio player acilir, suallar gorunur, taymer gedir.</p>

<h2>5.2 Reading</h2>
<div class="ss"><img src="${img("14-student-reading.png")}"></div>
<p>Sol terefde metn, sag terefde suallar. Telebe metni oxuyub suallara cavab verir. Neticeler dehal gorunur.</p>

<h2>5.3 Writing</h2>
<div class="ss"><img src="${img("15-student-writing.png")}"></div>
<p>Tapshiriq verilir (bezen shekil ile). Telebe essesini yazir, soz sayi avtomatik gorunur. Sonra muellim yoxlayir.</p>

<div class="info"><b>Avtomatik saxlama:</b> Yazdiginiz metn her deyishiklikde brauzerin yaddashinda saxlanilir. Internet kecilse ve ya brauzer baghlansa, geri qayidanda yazdiqlariniz yerindedir.</div>
</div>

<!-- 6. DEKAN -->
<div class="section">
<h1>6. Dekan Paneli</h1>
<p>Dekan hech neyi deyishe bilmir, sadece baxir. Butun qruplarin, telebelerin neticelerini gorur, muqayise edir.</p>

<h2>6.1 Dashboard</h2>
<div class="ss"><img src="${img("16-dean-dashboard.png")}"></div>
<p>Umumi reqemler: nece telebe, nece qrup, orta ballar, son fealiyyetler.</p>

<h2>6.2 Qrup Neticeleri</h2>
<div class="ss"><img src="${img("17-dean-groups.png")}"></div>
<p>Her qrupun neticeleri. Dekan qruplari muqayise ede bilir.</p>

<h2>6.3 Nezaret</h2>
<div class="ss"><img src="${img("18-dean-monitoring.png")}"></div>
<p>Dekan da admin kimi telebelerin ekranini canli gore biler, pozuntulara baxa biler.</p>
</div>

<!-- 7. NEZARET -->
<div class="section">
<h1>7. Nezaret (Proctoring) Sistemi</h1>
<p>Bu sistem telebelerin test zamani firildaqchi olub-olmadigini yoxlayir.</p>

<h3>Nece ishleyir?</h3>
<div class="step"><span class="sn">1</span> Telebe teste bashlayanda ekranini paylashmagi teleb olunur</div>
<div class="step"><span class="sn">2</span> Her 15 saniyede ekran goruntusu serveree gonderilir</div>
<div class="step"><span class="sn">3</span> Telebe bashqa tab-a kecende (meselen ChatGPT) dehal screenshot cekilir</div>
<div class="step"><span class="sn">4</span> Admin/Dekan canli ekranlari gorur, shubheli fealiyyete basib screenshotlari acar</div>

<h3>Ashkarlanan pozuntular:</h3>
<table>
  <tr><th>Pozuntu</th><th>Izah</th></tr>
  <tr><td>Tab deyishme</td><td>Telebe bashqa tab-a kecib (ChatGPT, Google ve s.)</td></tr>
  <tr><td>Pencere deyishme</td><td>Alt+Tab ile bashqa proqrama kecib</td></tr>
  <tr><td>Kopyala/Yapishdir</td><td>Ctrl+C, Ctrl+V cehdleri</td></tr>
  <tr><td>Sag klik</td><td>Kontekst menyu cehdi</td></tr>
  <tr><td>Ekran paylashma dayandirma</td><td>Telebe screenshare-i baghlayib</td></tr>
</table>

<div class="danger"><b>Telebe bilmir:</b> Screenshot cekilmesi gizli basd verir. Telebe ekraninda hech bir xeberdarliq gorunmur. Yalniz kicik "aktiv" yazisi var.</div>

<h3>Admin nece istifade edir?</h3>
<ul>
  <li><b>Canli Ekranlar</b> - grid sheklin  her telebenin ekrani gorunur</li>
  <li>Ekranin ustune basanda - <b>boyudulur</b> (tam en), yeniden basanda <b>kicilir</b></li>
  <li><b>Pozuntular</b> tabinda shubheli telebelerin siyahisi var</li>
  <li>Setrin ustune basanda <b>butun screenshotlar</b> ve pozuntu detalari acilir</li>
  <li>Screenshotun ustune basanda <b>tam ekranda</b> boyuk shekil gorunur</li>
</ul>

<h3>Telebe nece meshgul olur?</h3>
<ul>
  <li>Butun tapshriqlar (Listening + Reading + Writing) tamamlanmadan <b>cixish bloklahir</b></li>
  <li>Yalniz qeydiyyatdan kecmish telebeler daxil ola biler</li>
  <li>Her test <b>bir defe</b> hell olunur, tekrar mumkun deyil</li>
</ul>
</div>

</body></html>`;

async function main() {
  fs.writeFileSync("./docs/system-guide.html", html);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: true, args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: "./docs/IELTS-Sistem-Telimatı.pdf",
    format: "A4",
    printBackground: true,
    margin: { top: "40px", bottom: "40px", left: "50px", right: "50px" },
  });
  console.log("PDF created!");
  await browser.close();
}
main().catch(console.error);
