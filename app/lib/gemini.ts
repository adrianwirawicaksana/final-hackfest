import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const MASTER_QUESTIONS = [
  { id: 1, domain: "attention", level: 1, title: "Fokus Warna Tunggal" },
  { id: 2, domain: "attention", level: 2, title: "Mencari Benda di Keramaian" },
  { id: 3, domain: "attention", level: 3, title: "Instruksi Fokus Beruntun" },
  { id: 4, domain: "motoric", level: 1, title: "Gerakan Tangan Dasar" },
  { id: 5, domain: "motoric", level: 2, title: "Keseimbangan Statis" },
  { id: 6, domain: "motoric", level: 3, title: "Koordinasi Mata dan Tangan" },
  {
    id: 7,
    domain: "communication",
    level: 1,
    title: "Identifikasi Ekspresi Dasar",
  },
  { id: 8, domain: "communication", level: 2, title: "Meniru Suara dan Kata" },
  {
    id: 9,
    domain: "communication",
    level: 3,
    title: "Respon Tanya Jawab Pendek",
  },
  { id: 10, domain: "sensory", level: 1, title: "Diskriminasi Tekstur" },
  { id: 11, domain: "sensory", level: 2, title: "Toleransi Audio Visual" },
  { id: 12, domain: "sensory", level: 3, title: "Adaptasi Lingkungan Ramai" },
  { id: 13, domain: "social", level: 1, title: "Kontak Mata Sederhana" },
  { id: 14, domain: "social", level: 2, title: "Berbagi Mainan (Konsep)" },
  { id: 15, domain: "social", level: 3, title: "Empati dan Antre Dasar" },
];

export async function generatePlanWithGemini(
  weakAreas: string[],
  resultScreening: any,
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // DATE SETUP
  const today = new Date();

  const reScreeningDate = new Date(today);
  reScreeningDate.setDate(today.getDate() + 30);

  const formattedToday = today.toISOString().split("T")[0];
  const formattedReScreening = reScreeningDate.toISOString().split("T")[0];

  const prompt = `
Kamu adalah AI Child Development Therapist profesional.

Tugasmu membuat program terapi anak berbasis 30 hari (4 minggu) yang progresif, terstruktur, dan berbasis level.

=====================
KONTEKS REAL TIME
=====================
- Tanggal Hari Ini: ${formattedToday}
- Target Re-Screening: ${formattedReScreening}
- Risk Level: ${resultScreening.riskLevel}
- Skor Assessment: ${resultScreening.score}

=====================
DATA ANAK
=====================
Area Kelemahan: ${weakAreas.join(", ")}

=====================
MASTER SOAL
=====================
${JSON.stringify(MASTER_QUESTIONS)}

=====================
RULE UTAMA (WAJIB)
=====================

1. recommendedPath
- Tentukan domain prioritas dari weakAreas
- startingId:
  HIGH → level 1
  LOW/MODERATE → level 2

=====================
2. LEARNING PLAN (30 HARI / 4 MINGGU)
=====================

STRUKTUR MINGGU:
- Week 1 → ONLY level 1
- Week 2 → level 1–2 (mix)
- Week 3 → ONLY level 2
- Week 4 → level 2–3 (advanced)

RULE PENTING LEVEL:
- questionId WAJIB sesuai level minggu
- DILARANG memilih questionId di luar level yang diizinkan
- domain + level HARUS MATCH dengan MASTER_QUESTIONS

MAPPING LEVEL:
- level 1 = dasar (simple response, basic skill)
- level 2 = intermediate (multi-step, coordination)
- level 3 = advanced (complex, adaptive response)

SETIAP WEEK:
- focusDomain: max 2 domain dari weakAreas
- days: 7 hari (Senin–Minggu berdasarkan kalender real)
- setiap hari WAJIB memiliki:
  - day
  - date
  - questionId (harus valid dari MASTER_QUESTIONS)
  - activityTitle

RULE DISTRIBUSI DATA:
- Jangan ulang questionId terlalu sering dalam 1 minggu
- Semua domain weakAreas HARUS muncul minimal 1x dalam 30 hari
- Pastikan progres level naik setiap minggu

FALLBACK RULE:
- Jika domain tidak punya cukup soal di level tertentu:
  gunakan level terdekat (+1 atau -1 saja)

=====================
3. ANALYSIS
=====================
- Jelaskan alasan klinis sederhana kenapa weakAreas perlu dilatih
- Hubungkan dengan skor assessment secara logis

=====================
4. REFERRAL MESSAGE
=====================
- HIGH → sangat urgent, wajib evaluasi profesional
- LOW/MODERATE → observasi + latihan mandiri terstruktur

=====================
5. PRIORITY
=====================
- isi = riskLevel

=====================
FORMAT OUTPUT (JSON ONLY)
=====================

{
  "analysis": "",
  "recommendedPath": [
    {
      "domain": "",
      "startingId": 0,
      "priority": ""
    }
  ],
  "learningPlan": [
    {
      "week": 1,
      "focusDomain": [],
      "days": [
        {
          "day": "",
          "date": "",
          "questionId": 0,
          "activityTitle": ""
        }
      ]
    }
  ],
  "reScreeningDate": "${formattedReScreening}",
  "referralMessage": "",
  "priority": ""
}

HANYA OUTPUT JSON. TIDAK BOLEH ADA TEKS TAMBAHAN.
`;

  const result = await model.generateContent(prompt);
  const text = (await result.response).text();

  const cleaned = text.replace(/```json\n?|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return {
      error: "Failed to generate 30-day learning plan",
      raw: text,
    };
  }
}
