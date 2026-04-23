import { MASTER_QUESTIONS } from "@/app/constants/questions";
import { ScreeningComparison } from "@/app/lib/gemini";

export function buildLearningPlanPrompt(params: {
  weakAreas: string[];
  resultScreening: any;
  formattedToday: string;
  formattedReScreening: string;
  comparison?: ScreeningComparison;
}): string {
  const {
    weakAreas,
    resultScreening,
    formattedToday,
    formattedReScreening,
    comparison,
  } = params;

  // Sertakan score per domain agar LLM tahu seberapa lemah tiap area
  const weakAreasDetail = weakAreas
    .map((domain) => {
      const score = resultScreening.domainScores?.[domain];
      return score !== undefined
        ? `  - ${domain}: ${score}% (lemah)`
        : `  - ${domain}`;
    })
    .join("\n");

  // Hitung soal tersedia per domain & level agar LLM tidak hallucinate
  const availabilitySummary = weakAreas
    .map((domain) => {
      const byLevel = [1, 2, 3]
        .map((lvl) => {
          const count = MASTER_QUESTIONS.filter(
            (q) => q.domain === domain && q.level === lvl,
          ).length;
          return `level ${lvl}: ${count} soal`;
        })
        .join(", ");
      return `  - ${domain}: ${byLevel}`;
    })
    .join("\n");

  // Konteks perbandingan screening jika tersedia
  const comparisonContext = comparison
    ? `
=====================
PERBANDINGAN SCREENING SEBELUMNYA
=====================
${JSON.stringify(comparison, null, 2)}
`
    : "";

  // Daftar soal valid — hanya dari weak areas agar prompt lebih fokus
  const relevantQuestions = MASTER_QUESTIONS.filter((q) =>
    weakAreas.includes(q.domain),
  );

  const masterQuestionsRef = relevantQuestions
    .map(
      (q) =>
        `  { id: ${q.id}, domain: "${q.domain}", level: ${q.level}, title: "${q.title}", href: "${q.href}" }`,
    )
    .join("\n");

  return `Kamu adalah AI Child Development Therapist profesional.

Tugasmu membuat ADAPTIVE learning plan 30 hari berdasarkan hasil screening anak.

=====================
KONTEKS
=====================
- Tanggal mulai       : ${formattedToday}
- Tanggal re-screening: ${formattedReScreening}
- Usia Anak           : ${resultScreening.age ?? "tidak diketahui"} bulan
- Risk Level          : ${resultScreening.riskLevel}
- Score Total         : ${resultScreening.score}
- Weak Areas & Score  :
${weakAreasDetail}
${comparisonContext}
=====================
KETERSEDIAAN SOAL PER DOMAIN
=====================
(gunakan ini untuk menghindari pengulangan soal yang melebihi stok)
${availabilitySummary}

=====================
DAFTAR SOAL VALID (MASTER QUESTIONS — hanya weak areas)
=====================
Kamu WAJIB hanya menggunakan data dari daftar berikut. DILARANG mengarang id atau href.

${masterQuestionsRef}

=====================
RULE
=====================
1. Buat recommendedPath berdasarkan weak areas:
   - Urutkan domain dari score terendah ke tertinggi (prioritas tertinggi = paling lemah)
   - Isi "startingId" dengan id soal level 1 pertama dari domain tersebut

2. Buat learningPlan 4 minggu (masing-masing 7 hari):
   - Week 1: level 1 (basic)        — soal dengan level: 1
   - Week 2: mix level 1 & 2        — soal dengan level: 1 atau 2
   - Week 3: level 2 (intermediate) — soal dengan level: 2
   - Week 4: level 3 (advanced)     — soal dengan level: 3

3. Setiap hari WAJIB mengisi field berikut dengan nilai VALID dari MASTER QUESTIONS:
   - questionId    → ambil dari kolom "id"
   - domain        → ambil dari kolom "domain"
   - level         → ambil dari kolom "level"
   - activityTitle → ambil dari kolom "title"
   - href          → ambil dari kolom "href"

4. Aturan distribusi soal:
   - Setiap questionId hanya boleh muncul MAKSIMAL 1x dalam seluruh 30 hari
   - Prioritaskan domain dengan score terendah di setiap minggu (focusDomain)
   - Jika stok soal level tertentu habis untuk suatu domain, gunakan domain weak area lain sebagai pengisi
   - Jangan biarkan field kosong atau null

5. Field "analysis" harus menjelaskan:
   - Kondisi anak berdasarkan score, risk level, DAN usia (dalam bulan)
   - Apakah pencapaian anak sesuai, terlambat, atau lebih maju dari milestone usia tersebut
   - Kenapa urutan domain diprioritaskan demikian
   - Strategi pembelajaran yang dipilih dan apakah sudah sesuai dengan tahap perkembangan usia anak

6. Field "referralMessage" diisi jika riskLevel HIGH atau score < 40, berisi saran konsultasi ke terapis.

=====================
OUTPUT JSON ONLY — tanpa markdown, tanpa komentar, tanpa backtick
=====================

{
  "analysis": "",
  "recommendedPath": [
    { "domain": "", "startingId": 0, "priority": "high|medium|low" }
  ],
  "learningPlan": [
    {
      "week": 1,
      "focusDomain": [],
      "days": [
        {
          "day": "Senin",
          "date": "",
          "questionId": 0,
          "domain": "",
          "level": 0,
          "activityTitle": "",
          "href": ""
        }
      ]
    }
  ],
  "reScreeningDate": "${formattedReScreening}",
  "referralMessage": "",
  "priority": "high|medium|low"
}`;
}
