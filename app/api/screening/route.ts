import { prisma } from "@/app/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

type DetailItem = {
  question: number;
  answer: string;
  risk_point: number;
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const body = await req.json();

    const { profile, answers } = body;

    // ✅ validasi
    if (!profile || !answers || !Array.isArray(answers)) {
      return Response.json({ error: "Invalid data" }, { status: 400 });
    }

    if (answers.length !== 20) {
      return Response.json({ error: "Answers must be 20" }, { status: 400 });
    }

    // 🔥 normalisasi
    const normalizedAnswers = answers.map((a) => a.toUpperCase());

    // 🔥 scoring
    const resultScreen = processMCHAT(normalizedAnswers);

    let user = null;

    // 🔥 hanya kalau login
    if (userId) {
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        const clerkUser = await currentUser();

        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email:
              clerkUser?.emailAddresses?.[0]?.emailAddress ??
              `${userId}@noemail.local`,
            name: clerkUser?.username || clerkUser?.firstName || "",
          },
        });
      }

      // 🔥 CEK apakah sudah ada screening sebelumnya
      const existing = await prisma.screeningResult.findFirst({
        where: {
          clerkId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existing) {
        // 🔥 UPDATE kalau sudah ada
        await prisma.screeningResult.update({
          where: {
            id: existing.id,
          },
          data: {
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            answers: normalizedAnswers,
            score: resultScreen.score,
            riskLevel: resultScreen.riskLevel,
            action: resultScreen.action,
            detail: resultScreen.detail,
            previousScore: existing.score,
            previousRiskLevel: existing.riskLevel,
          },
        });
      } else {
        // 🔥 CREATE kalau belum ada
        await prisma.screeningResult.create({
          data: {
            userId: user.id,
            clerkId: userId,

            name: profile.name,
            age: profile.age,
            gender: profile.gender,

            answers: normalizedAnswers,
            score: resultScreen.score,
            riskLevel: resultScreen.riskLevel,
            action: resultScreen.action,
            detail: resultScreen.detail,
          },
        });
      }
    }

    // 🔥 response untuk semua user
    return Response.json({
      success: true,
      guest: !userId,
      profile,
      result: resultScreen,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// =======================
// LOGIC M-CHAT
// =======================

function processMCHAT(answers: string[]) {
  const riskItemsYes = [2, 5, 12];
  let score = 0;

  let detail: DetailItem[] = [];

  answers.forEach((ans, i) => {
    const q = i + 1;
    let risk = 0;

    if (riskItemsYes.includes(q)) {
      if (ans === "YA") risk = 1;
    } else {
      if (ans === "TIDAK") risk = 1;
    }

    score += risk;

    if (risk === 1) {
      detail.push({
        question: q,
        answer: ans,
        risk_point: risk,
      });
    }
  });

  let riskLevel = "";
  let action = "";

  if (score <= 2) {
    riskLevel = "LOW";
    action = "Observasi, ulang screening bila perlu";
  } else if (score <= 7) {
    riskLevel = "MODERATE";
    action = "Lanjut ke Follow-Up (Sistem Pembelajaran)";
  } else {
    riskLevel = "HIGH";
    action = "Langsung rujuk evaluasi";
  }

  return {
    score,
    riskLevel,
    action,
    detail,
  };
}
