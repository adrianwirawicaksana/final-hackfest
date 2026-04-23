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

  // Ambil waktu realtime untuk re-screening (30 hari dari sekarang)
  const today = new Date();
  const reScreeningDate = new Date(today);
  reScreeningDate.setDate(today.getDate() + 30);

  const formattedToday = today.toISOString().split("T")[0];
  const formattedReScreening = reScreeningDate.toISOString().split("T")[0];

  const prompt = `
Kamu adalah AI Child Development Therapist. Tugasmu adalah membuat Learning Plan yang murni berbasis data anak tanpa ada data statis default.

KONTEKS REAL-TIME:
- Tanggal Hari Ini: ${formattedToday}
- Target Re-Screening: ${formattedReScreening}
- Day: Wajib bahasa Indonesia

DATA ANAK SPESIFIK:
- Area Kelemahan: ${weakAreas.join(", ")}
- Risk Level: ${resultScreening.riskLevel}
- Skor Assessment: ${resultScreening.score}

DATA MASTER SOAL:
${JSON.stringify(MASTER_QUESTIONS)}

INSTRUKSI KETAT:
1. 'recommendedPath': Identifikasi setiap domain dari Area Kelemahan anak. Tentukan 'startingId' berdasarkan Risk Level (Jika HIGH mulai ID Level 1, Jika selain itu mulai ID Level 2).
2. 'weeklySchedule': Susun jadwal 7 hari ke depan dimulai dari besok. Isi 'day' dengan nama hari yang sesuai dengan urutan kalender real-time. Pilih 'questionId' hanya dari domain kelemahan anak.
3. 'analysis': Tuliskan analisis medis singkat yang spesifik menyebutkan kenapa area ${weakAreas.join(", ")} perlu dilatih berdasarkan Skor ${resultScreening.score}.
4. 'referralMessage': Jika Risk Level adalah HIGH, buat pesan rujukan medis yang sangat mendesak. Jika LOW/MODERATE, buat pesan observasi mandiri yang suportif.
5. 'priority': Isi dari hasil Risk Level.

FORMAT JSON (WAJIB DINAMIS):
{
  "analysis": "",
  "recommendedPath": [
    { "domain": "", "startingId": 0, "priority": "" }
  ],
  "weeklySchedule": [
    { "day": "", "date": "", "questionId": 0, "activityTitle": "" }
  ],
  "reScreeningDate": "${formattedReScreening}",
  "referralMessage": ""
}

HANYA BERIKAN JSON. HARAM MEMBERIKAN TEKS PENJELASAN DI LUAR JSON.`;

  const result = await model.generateContent(prompt);
  const text = (await result.response).text();

  const cleaned = text.replace(/```json\n?|```/g, "").trim();

  try {
    const parsedData = JSON.parse(cleaned);
    return parsedData;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return { error: "Failed to generate dynamic plan", raw: text };
  }
}
