import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: params.id },
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
        leaves: {
          where: {
            endDate: { gte: new Date() },
            status: "APPROVED",
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch doctor details." }, { status: 500 });
  }
}
