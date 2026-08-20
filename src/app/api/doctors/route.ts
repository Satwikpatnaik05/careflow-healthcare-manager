import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specialization = searchParams.get("specialization");
    const query = searchParams.get("q");

    const whereClause: any = {
      isAvailable: true,
    };

    if (specialization && specialization !== "all") {
      whereClause.specialization = {
        name: { equals: specialization },
      };
    }

    if (query) {
      whereClause.OR = [
        { user: { name: { contains: query } } },
        { bio: { contains: query } },
        { specialization: { name: { contains: query } } },
      ];
    }

    const doctors = await prisma.doctorProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        specialization: true,
        workingHours: true,
      },
      orderBy: { experienceYears: "desc" },
    });

    return NextResponse.json({ doctors });
  } catch (err: any) {
    console.error("[Doctors GET Error]", err);
    return NextResponse.json({ error: "Failed to fetch doctors." }, { status: 500 });
  }
}
