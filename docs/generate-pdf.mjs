import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DIR = "./docs/screenshots";

// Convert images to base64 for embedding
function imgBase64(name) {
  const p = path.join(DIR, name);
  if (!fs.existsSync(p)) return "";
  const buf = fs.readFileSync(p);
  return `data:image/png;base64,${buf.toString("base64")}`;
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
  .screenshot { margin: 15px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .screenshot img { width: 100%; display: block; }
  .info-box { background: #eff6ff; border-left: 4px solid #1e40af; padding: 12px 16px; margin: 12px 0; border-radius: 0 6px 6px 0; }
  .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 12px 0; border-radius: 0 6px 6px 0; }
  .step { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 10px 0; }
  .step-num { display: inline-block; background: #1e40af; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 8px; }
  .role-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .role-admin { background: #fee2e2; color: #991b1b; }
  .role-teacher { background: #dbeafe; color: #1e40af; }
  .role-student { background: #dcfce7; color: #166534; }
  .role-dean { background: #fef3c7; color: #92400e; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
  th { background: #f1f5f9; padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0; }
  td { padding: 8px 12px; border: 1px solid #e2e8f0; }
  ul { padding-left: 20px; }
  li { margin-bottom: 4px; }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <h1>IELTS Hazırlıq Sistemi</h1>
  <p>Universitet üçün IELTS imtahan hazırlıq platforması</p>
  <p>İstifadəçi Təlimatı</p>
  <div class="ver">Versiya 1.0 | Mart 2026</div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="section">
<h1>Mündəricat</h1>
<ol style="font-size: 15px; line-height: 2.2;">
  <li><b>Sistem Haqqında</b> - Bu sistem nədir, nə işə yarayır</li>
  <li><b>Giriş Səhifəsi</b> - Sistemə necə daxil olmaq</li>
  <li><b>Admin Paneli</b> - İstifadəçi, qrup, test idarəetmə</li>
  <li><b>Müəllim Paneli</b> - Sual yaratma, writing yoxlama</li>
  <li><b>Tələbə Paneli</b> - Test həll etmə (Listening, Reading, Writing)</li>
  <li><b>Dekan Paneli</b> - Statistika və nəticələr</li>
</ol>
</div>

<!-- 1. ABOUT -->
<div class="section">
<h1>1. Sistem Haqqında</h1>

<h3>Bu sistem nədir?</h3>
<p>Bu, universitetdə tələbələrin IELTS imtahanına hazırlaşması üçün onlayn platformadır. Sistem internetdə işləyir, yəni tələbə kompüter və ya telefondan brauzerlə daxil olub test həll edə bilər.</p>

<h3>Sistemdə kimlər var?</h3>
<table>
  <tr>
    <th>Rol</th>
    <th>Kim?</th>
    <th>Nə edə bilər?</th>
  </tr>
  <tr>
    <td><span class="role-badge role-admin">Admin</span></td>
    <td>Sistem administratoru</td>
    <td>Bütün sistemi idarə edir: istifadəçilər, qruplar, testlər yaradır</td>
  </tr>
  <tr>
    <td><span class="role-badge role-teacher">Müəllim</span></td>
    <td>IELTS müəllimi</td>
    <td>Suallar əlavə edir, tələbələrin writing cavablarını yoxlayır, qiymət verir</td>
  </tr>
  <tr>
    <td><span class="role-badge role-student">Tələbə</span></td>
    <td>Tələbə</td>
    <td>Listening, Reading, Writing testləri həll edir</td>
  </tr>
  <tr>
    <td><span class="role-badge role-dean">Dekan</span></td>
    <td>Fakültə dekanı</td>
    <td>Bütün nəticələrə, statistikaya baxır</td>
  </tr>
</table>

<h3>IELTS test növləri</h3>
<ul>
  <li><b>Listening</b> - Audio dinləyib suallara cavab verilir</li>
  <li><b>Reading</b> - Mətn oxuyub suallara cavab verilir</li>
  <li><b>Writing</b> - Verilən tapşırığa esse/mətn yazılır, müəllim yoxlayır</li>
</ul>

<div class="info-box">
  <b>Qiymətləndirmə:</b> Listening və Reading testləri avtomatik yoxlanılır. Writing testlərini müəllim əl ilə yoxlayır və IELTS band balı (0-9) verir.
</div>
</div>

<!-- 2. LOGIN -->
<div class="section">
<h1>2. Giriş Səhifəsi</h1>

<div class="screenshot">
  <img src="${imgBase64("01-login.png")}" alt="Login">
</div>

<h3>Sistemə necə daxil olmaq?</h3>
<p>Brauzerdə sistemin ünvanını yazırsınız və giriş səhifəsi açılır.</p>

<div class="step">
  <span class="step-num">1</span> <b>"FIN kod / Email"</b> xanasına öz FIN kodunuzu və ya email ünvanınızı yazın
</div>
<div class="step">
  <span class="step-num">2</span> <b>"Parol"</b> xanasına parolunuzu yazın (tələbələr üçün parol FIN kodudur)
</div>
<div class="step">
  <span class="step-num">3</span> <b>"Daxil ol"</b> düyməsinə basın
</div>

<div class="info-box">
  <b>Tələbələr üçün:</b> Həm istifadəçi adı, həm də parol FIN kodunuzdur. Məsələn, FIN: <code>5AE1234</code> → login: <code>5AE1234</code>, parol: <code>5AE1234</code>
</div>

<div class="warning-box">
  <b>Diqqət:</b> Sistemə yalnız admin tərəfindən yaradılmış istifadəçilər daxil ola bilər. Kənardan qeydiyyat mümkün deyil.
</div>
</div>

<!-- 3. ADMIN PANEL -->
<div class="section">
<h1>3. Admin Paneli</h1>
<p>Admin - sistemin "sahibi"dir. O, bütün istifadəçiləri yaradır, qrupları düzəldir, testləri əlavə edir. Admin girişi email+parol ilə olur.</p>

<h2>3.1 Dashboard (Ana Səhifə)</h2>
<div class="screenshot">
  <img src="${imgBase64("02-admin-dashboard.png")}" alt="Admin Dashboard">
</div>
<p>Dashboardda adminin gördüyü ümumi rəqəmlər var: neçə istifadəçi var, neçə qrup var, neçə test var. Bir baxışda sistemin vəziyyətini görürsünüz.</p>

<h2>3.2 İstifadəçi İdarəetmə</h2>
<div class="screenshot">
  <img src="${imgBase64("03-admin-users.png")}" alt="Admin Users">
</div>
<p>Bu səhifədə admin yeni tələbə, müəllim, dekan yaradır. Hər istifadəçinin adı, FIN kodu, emaili, rolu və qrupu göstərilir.</p>

<h3>Yeni tələbə necə yaradılır?</h3>
<div class="step">
  <span class="step-num">1</span> <b>"Yeni İstifadəçi"</b> düyməsinə basın
</div>
<div class="step">
  <span class="step-num">2</span> Tələbənin <b>Adını</b> yazın (tam ad-soyad)
</div>
<div class="step">
  <span class="step-num">3</span> <b>FIN kodunu</b> yazın - bu həm giriş adı, həm parol olacaq
</div>
<div class="step">
  <span class="step-num">4</span> <b>Rolu</b> "Tələbə" seçin
</div>
<div class="step">
  <span class="step-num">5</span> <b>Qrupu</b> seçin (əgər qrup yaradılıbsa)
</div>
<div class="step">
  <span class="step-num">6</span> <b>"Yarat"</b> basın - hazırdır!
</div>

<div class="info-box">
  Email xanası boş qala bilər - tələbələr üçün məcburi deyil. Şifrə xanası boş qalsa, FIN kodu şifrə olur.
</div>

<h2>3.3 Qrup İdarəetmə</h2>
<div class="screenshot">
  <img src="${imgBase64("04-admin-groups.png")}" alt="Admin Groups">
</div>
<p>Burada admin qrupları yaradır (məsələn "Qrup A", "101-ci qrup" və s.). Hər qrupa bir müəllim təyin edilir və tələbələr əlavə olunur. Müəllim yalnız öz qrupunun tələbələrinin writing-lərini yoxlaya bilir.</p>

<h3>Qrup yaratmaq:</h3>
<div class="step">
  <span class="step-num">1</span> <b>"Yeni Qrup"</b> düyməsinə basın
</div>
<div class="step">
  <span class="step-num">2</span> Qrupun <b>adını</b> yazın
</div>
<div class="step">
  <span class="step-num">3</span> <b>Müəllimi</b> seçin (siyahıdan)
</div>
<div class="step">
  <span class="step-num">4</span> <b>"Yarat"</b> basın, sonra qrupun içinə girib tələbələri əlavə edin
</div>

<h2>3.4 Test İdarəetmə</h2>
<div class="screenshot">
  <img src="${imgBase64("05-admin-tests.png")}" alt="Admin Tests">
</div>
<p>Bu, ən vacib hissədir. Burada admin yeni testlər yaradır - Listening, Reading və ya Writing. Hər test üçün suallar, audio fayllar və ya writing tapşırıqları əlavə olunur.</p>

<h3>Yeni test necə yaradılır?</h3>
<div class="step">
  <span class="step-num">1</span> <b>"Yeni Test"</b> basın
</div>
<div class="step">
  <span class="step-num">2</span> Testin <b>adını</b> yazın (məs: "Reading Test 1")
</div>
<div class="step">
  <span class="step-num">3</span> <b>Tipi</b> seçin: Listening, Reading və ya Writing
</div>
<div class="step">
  <span class="step-num">4</span> <b>Müddəti</b> yazın (dəqiqə ilə, məs: 60)
</div>
<div class="step">
  <span class="step-num">5</span> <b>"Yarat"</b> basın
</div>
<div class="step">
  <span class="step-num">6</span> Sonra testin üstünə basıb <b>sualları əlavə edin</b>
</div>

<h3>Sual tipləri:</h3>
<table>
  <tr><th>Tip</th><th>İzah</th></tr>
  <tr><td>Multiple Choice</td><td>Bir neçə variantdan birini seçmə</td></tr>
  <tr><td>True/False/Not Given</td><td>Doğru/Yanlış/Verilməyib</td></tr>
  <tr><td>Yes/No/Not Given</td><td>Bəli/Xeyr/Verilməyib</td></tr>
  <tr><td>Fill in the Blank</td><td>Boşluğu doldurma (bir söz)</td></tr>
  <tr><td>Sentence Completion</td><td>Cümləni tamamlama</td></tr>
  <tr><td>Note Completion</td><td>Qeydlərdə boşluqları doldurma (şəkildəki kimi)</td></tr>
  <tr><td>Matching</td><td>Uyğunlaşdırma</td></tr>
</table>

<div class="info-box">
  <b>Sualara şəkil əlavə etmək:</b> Hər sualın altında "Şəkil" sahəsi var. Oradan diagram, qrafik, cədvəl şəkli yükləyə bilərsiniz. Writing tapşırıqlarına da şəkil əlavə olunur.
</div>

<h2>3.5 Hesabatlar</h2>
<div class="screenshot">
  <img src="${imgBase64("06-admin-reports.png")}" alt="Admin Reports">
</div>
<p>Hesabatlar səhifəsində bütün testlərin ümumi nəticələri göstərilir: orta ballar, qrupların müqayisəsi, neçə test tamamlanıb və s.</p>
</div>

<!-- 4. TEACHER PANEL -->
<div class="section">
<h1>4. Müəllim Paneli</h1>
<p>Müəllimin iki əsas işi var: <b>sual əlavə etmək</b> və <b>tələbələrin writing cavablarını yoxlamaq</b>. Müəllim yalnız öz qrupunun tələbələrini görür.</p>

<h2>4.1 Dashboard</h2>
<div class="screenshot">
  <img src="${imgBase64("07-teacher-dashboard.png")}" alt="Teacher Dashboard">
</div>
<p>Müəllimin ana səhifəsində yoxlanılmamış writing-lərin sayı, qrupdakı tələbə sayı və son göndərilən cavablar göstərilir.</p>

<h2>4.2 Sual İdarəetmə</h2>
<div class="screenshot">
  <img src="${imgBase64("08-teacher-questions.png")}" alt="Teacher Questions">
</div>
<p>Burada müəllim mövcud testlərə yeni suallar əlavə edə bilər. Hər test üçün hansı suallar var, göstərilir.</p>

<h2>4.3 Yeni Sual Yaratma</h2>
<div class="screenshot">
  <img src="${imgBase64("09-teacher-question-create.png")}" alt="Teacher Question Create">
</div>
<p>Bu formda müəllim yeni sual yaradır:</p>
<ul>
  <li>Əvvəl <b>testi seçir</b> (hansı testə sual əlavə olunacaq)</li>
  <li>Sonra <b>sual tipini</b> seçir (Multiple Choice, True/False və s.)</li>
  <li><b>Sual mətnini</b> yazır</li>
  <li><b>Doğru cavabı</b> qeyd edir</li>
  <li>Lazım gələrsə <b>şəkil</b> yükləyir</li>
</ul>

<h2>4.4 Writing Yoxlama</h2>
<div class="screenshot">
  <img src="${imgBase64("10-teacher-writing-review.png")}" alt="Teacher Writing Review">
</div>
<p>Bu, müəllimin ən çox vaxt keçirdiyi hissədir. Tələbə writing testini bitirdikdən sonra, cavabı burada görünür. Müəllim:</p>

<div class="step">
  <span class="step-num">1</span> Tələbənin yazdığı mətni oxuyur (sol tərəfdə)
</div>
<div class="step">
  <span class="step-num">2</span> <b>Band bal</b> verir (0-9 arası, 4 kateqoriyada):
  <ul>
    <li>Task Achievement - Tapşırığı nə dərəcədə yerinə yetirib</li>
    <li>Coherence & Cohesion - Mətnin ardıcıllığı</li>
    <li>Lexical Resource - Söz ehtiyatı</li>
    <li>Grammatical Range - Qrammatika</li>
  </ul>
</div>
<div class="step">
  <span class="step-num">3</span> Mətndə səhvləri seçib <b>düzəliş</b> yaza bilər
</div>
<div class="step">
  <span class="step-num">4</span> <b>Ümumi şərh</b> yazır
</div>
<div class="step">
  <span class="step-num">5</span> <b>"Göndər"</b> basır - tələbə nəticəni görə bilir
</div>
</div>

<!-- 5. STUDENT PANEL -->
<div class="section">
<h1>5. Tələbə Paneli</h1>
<p>Tələbə sistemə FIN kodu ilə daxil olur. Qarşısında 3 bölmə görünür: <b>Listening</b>, <b>Reading</b>, <b>Writing</b>. Hər bölmədə tələbəyə təsadüfi bir test təyin olunur.</p>

<div class="warning-box">
  <b>Vacib:</b> Hər test yalnız bir dəfə həll edilə bilər. Testi bitirdikdən sonra yenidən başlamaq mümkün deyil.
</div>

<h2>5.1 Listening Bölməsi</h2>
<div class="screenshot">
  <img src="${imgBase64("11-student-listening.png")}" alt="Student Listening">
</div>
<p>Tələbə Listening bölməsinə daxil olanda ona random bir listening testi təyin olunur. "Testə Başla" düyməsinə basdıqda:</p>
<ul>
  <li>Audio player açılır - dinləyir</li>
  <li>Suallar göstərilir - cavab verir</li>
  <li>Yuxarıda <b>taymer</b> gedir (vaxt bitəndə avtomatik göndərilir)</li>
  <li>Cavablar <b>avtomatik yadda saxlanılır</b> - internet kəsilsə belə, geri qayıdanda cavablar yerindədir</li>
</ul>

<h2>5.2 Reading Bölməsi</h2>
<div class="screenshot">
  <img src="${imgBase64("12-student-reading.png")}" alt="Student Reading">
</div>
<p>Reading testində sol tərəfdə <b>mətn</b>, sağ tərəfdə <b>suallar</b> göstərilir. Tələbə mətni oxuyub suallara cavab verir. Sual tipləri fərqli ola bilər: boşluq doldurma, True/False, Multiple Choice və s.</p>

<div class="info-box">
  <b>Avtomatik qiymətləndirmə:</b> Listening və Reading testləri bitdikdən sonra nəticə <b>dərhal</b> göstərilir. Sistem cavabları yoxlayır və IELTS band balını hesablayır.
</div>

<h2>5.3 Writing Bölməsi</h2>
<div class="screenshot">
  <img src="${imgBase64("13-student-writing.png")}" alt="Student Writing">
</div>
<p>Writing testində tələbəyə tapşırıq verilir (bəzən şəkil - diagram, qrafik və s. ilə birlikdə). Tələbə:</p>
<ul>
  <li>Tapşırığı oxuyur</li>
  <li>Aşağıdakı sahəyə essesini/mətnini yazır</li>
  <li>Söz sayı avtomatik göstərilir</li>
  <li>"Testi Bitir" basır</li>
  <li>Sonra müəllim yoxlayıb qiymət verəcək</li>
</ul>

<div class="info-box">
  <b>Cavablar itirilmir:</b> Yazdığınız mətn hər dəqiqə avtomatik yadda saxlanılır. Əgər internet kəsilsə və ya brauzer bağlansa, geri qayıdanda yazdıqlarınız yerindədir.
</div>
</div>

<!-- 6. DEAN PANEL -->
<div class="section">
<h1>6. Dekan Paneli</h1>
<p>Dekan heç nəyi dəyişə bilmir, sadəcə <b>baxır</b>. Bütün qrupların, tələbələrin nəticələrini görür, müqayisə edir.</p>

<h2>6.1 Dashboard</h2>
<div class="screenshot">
  <img src="${imgBase64("14-dean-dashboard.png")}" alt="Dean Dashboard">
</div>
<p>Ana səhifədə ümumi rəqəmlər var: neçə tələbə, neçə qrup, orta ballar, son fəaliyyətlər.</p>

<h2>6.2 Qrup Nəticələri</h2>
<div class="screenshot">
  <img src="${imgBase64("15-dean-groups.png")}" alt="Dean Groups">
</div>
<p>Burada hər qrupun nəticələri göstərilir. Dekan qrupları müqayisə edə bilir: hansı qrupun Listening-i daha yaxşıdır, hansının Writing-i zəifdir və s. Hər tələbənin fərdi nəticələrinə də baxa bilir.</p>
</div>


</body>
</html>`;

async function main() {
  fs.writeFileSync("./docs/system-guide.html", html);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.pdf({
    path: "./docs/IELTS-Sistem-Telimatı.pdf",
    format: "A4",
    printBackground: true,
    margin: { top: "40px", bottom: "40px", left: "50px", right: "50px" },
  });

  console.log("PDF created: docs/IELTS-Sistem-Telimatı.pdf");
  await browser.close();
}

main().catch(console.error);
