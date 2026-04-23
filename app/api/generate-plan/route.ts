import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { generatePlanWithGemini } from "@/app/lib/gemini";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const weakAreas = body.weakAreas || [];

  // 🔥 AMBIL DARI DATABASE
  const resultScreening = await prisma.screeningResult.findFirst({
    where: { clerkId: userId },
    orderBy: { createdAt: "desc" },
  });

  if (!resultScreening) {
    return Response.json({ error: "No screening data" }, { status: 404 });
  }

  const plan = await generatePlanWithGemini(weakAreas, resultScreening);

  return Response.json({ plan });
}
