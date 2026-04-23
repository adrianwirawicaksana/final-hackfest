import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    // hitung 6 bulan dari sekarang
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    const subscription = await prisma.subscription.upsert({
      where: {
        userId: userId,
      },
      update: {
        plan,
        isActive: true,
        expiresAt,
      },
      create: {
        userId,
        plan,
        isActive: true,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
