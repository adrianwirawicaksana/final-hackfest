import { GoogleGenerativeAI } from "@google/generative-ai";
import { MASTER_QUESTIONS } from "@/app/constants/questions";
import { buildLearningPlanPrompt } from "@/app/prompts/learningPlan";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ✅ Tipe comparison
export type ScreeningComparison = {
  type: "FIRST_TIME" | "IMPROVED" | "STAGNANT" | "REGRESSED";
  oldScore?: number;
  newScore: number;
  scoreDiff?: number;
  levelAdjustment: "decrease" | "increase" | "maintain" | "none";
  requiresReferral: boolean;
};

// ✅ Bandingkan score lama vs baru
export function compareScreeningResults(
  newScreening: any,
  previousScreening?: any,
): ScreeningComparison {
  const newScore = newScreening.score;

  // Tidak ada data lama → screening pertama
  if (!previousScreening || previousScreening.score == null) {
    return {
      type: "FIRST_TIME",
      newScore,
      levelAdjustment: "none",
      requiresReferral: false,
    };
  }

  const oldScore = previousScreening.score;
  const scoreDiff = newScore - oldScore;

  if (oldScore > newScore) {
    // Score turun = anak MEMBAIK
    return {
      type: "IMPROVED",
      oldScore,
      newScore,
      scoreDiff,
      levelAdjustment: "decrease",
      requiresReferral: false,
    };
  }

  if (oldScore === newScore) {
    // Score sama = STAGNAN
    return {
      type: "STAGNANT",
      oldScore,
      newScore,
      scoreDiff: 0,
      levelAdjustment: "increase",
      requiresReferral: false,
    };
  }

  // Score naik = anak MEMBURUK
  return {
    type: "REGRESSED",
    oldScore,
    newScore,
    scoreDiff,
    levelAdjustment: "maintain",
    requiresReferral: true,
  };
}

function sanitizePlan(aiPlan: any) {
  const validIds = new Set(MASTER_QUESTIONS.map((q) => q.id));

  return {
    ...aiPlan,
    learningPlan: aiPlan.learningPlan.map((week: any) => ({
      ...week,
      days: week.days.map((day: any) => {
        const matched = MASTER_QUESTIONS.find((q) => q.id === day.questionId);
        const isValid = validIds.has(day.questionId) && !!matched;

        if (isValid) {
          return { ...day, href: matched!.href };
        }

        const fallback =
          MASTER_QUESTIONS.find(
            (q) =>
              week.focusDomain.includes(q.domain) &&
              q.level === (week.week <= 1 ? 1 : week.week <= 3 ? 2 : 3),
          ) ?? MASTER_QUESTIONS[0];

        return {
          ...day,
          questionId: fallback.id,
          level: fallback.level,
          activityTitle: fallback.title,
          href: fallback.href,
        };
      }),
    })),
  };
}

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-001",
  "gemini-2.0-pro",
];

async function generateWithFallback(prompt: string) {
  let lastError: any;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      console.log(`✅ Berhasil dengan model: ${modelName}`);
      return result;
    } catch (error: any) {
      lastError = error;
      const status = error?.status;
      console.warn(
        `⚠️ ${modelName} gagal (${status}): ${error?.message?.split("\n")[0]}`,
      );

      if (status === 404) {
        continue;
      }

      if (status === 429) {
        const retryMatch = error?.message?.match(/retryDelay":"(\d+)s/);
        const waitMs = retryMatch ? parseInt(retryMatch[1]) * 1000 : 5000;
        console.warn(`⏳ Tunggu ${waitMs / 1000}s...`);
        await new Promise((res) => setTimeout(res, waitMs));
        continue;
      }

      if (status === 503) {
        await new Promise((res) => setTimeout(res, 3000));
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("Semua model Gemini tidak available");
}

export async function generatePlanWithGemini(
  weakAreas: string[],
  resultScreening: any,
  previousScreening?: any, // ✅ dari field previousScore di DB
) {
  const today = new Date();
  const reScreeningDate = new Date(today);
  reScreeningDate.setDate(today.getDate() + 30);

  const formattedToday = today.toISOString().split("T")[0];
  const formattedReScreening = reScreeningDate.toISOString().split("T")[0];

  // ✅ Bandingkan score
  const comparison = compareScreeningResults(
    resultScreening,
    previousScreening,
  );
  console.log("📊 Comparison:", comparison);

  // ✅ Kalau REGRESSED → skip AI, langsung return rujuk dokter
  if (comparison.requiresReferral) {
    return {
      analysis: `Score meningkat dari ${comparison.oldScore} → ${comparison.newScore}. Anak membutuhkan perhatian lebih lanjut.`,
      requiresReferral: true,
      comparison,
      referralMessage:
        "Hasil re-screening menunjukkan peningkatan skor risiko. Segera konsultasikan dengan dokter spesialis anak atau terapis perkembangan.",
      learningPlan: [],
      recommendedPath: [],
      reScreeningDate: formattedReScreening,
      priority: "URGENT",
    };
  }

  const prompt = buildLearningPlanPrompt({
    weakAreas,
    resultScreening,
    formattedToday,
    formattedReScreening,
    comparison, // ✅ dikirim ke prompt untuk instruksi adaptive
  });

  try {
    const result = await generateWithFallback(prompt);
    const text = (await result.response).text();
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      ...sanitizePlan(parsed),
      comparison, // ✅ inject ke output supaya frontend bisa baca
    };
  } catch (error: any) {
    console.error("Gemini Error:", error?.status, error?.message);

    if (
      error?.status === 503 ||
      error?.status === 429 ||
      error?.message?.includes("high demand") ||
      error?.message?.includes("overloaded")
    ) {
      return {
        error: "RATE_LIMIT",
        message:
          "AI sedang overload. Coba lagi dalam beberapa detik atau menit.",
        retryAfter: 30,
        fallback: true,
      };
    }

    return {
      error: "FAILED",
      message: "Gagal generate learning plan",
      fallback: true,
    };
  }
}
