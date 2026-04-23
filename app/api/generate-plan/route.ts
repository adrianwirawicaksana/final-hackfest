import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { generatePlanWithGemini } from "@/app/lib/gemini";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Ambil data screening terbaru dari DB
  const resultScreening = await prisma.screeningResult.findFirst({
    where: { clerkId: userId },
    orderBy: { createdAt: "desc" },
  });

  if (!resultScreening) {
    return Response.json({ error: "No screening data" }, { status: 404 });
  }

  // ✅ Ambil weakAreas dari field detail (array of { question, answer, risk_point })
  const detailArray = (resultScreening.detail as any[]) ?? [];
  const weakAreas: string[] = detailArray.map((d) => String(d.question));

  // ✅ Bangun previousScreening dari field previousScore di DB
  const previousScreening =
    resultScreening.previousScore != null
      ? {
          score: resultScreening.previousScore,
          riskLevel: resultScreening.previousRiskLevel,
        }
      : null;

  const plan = await generatePlanWithGemini(
    weakAreas,
    resultScreening, // data terbaru
    previousScreening, // data lama (null = screening pertama)
  );

  return Response.json({ plan });
}
