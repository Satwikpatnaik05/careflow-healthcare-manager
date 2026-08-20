import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const specializations = await prisma.specialization.findMany({
      include: {
        _count: {
          select: { doctors: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ specializations });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch specializations." }, { status: 500 });
  }
}
