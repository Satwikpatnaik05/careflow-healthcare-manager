import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !session.patientProfileId) {
      return NextResponse.json({ error: "Unauthorized. Patient login required." }, { status: 401 });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: {
        appointment: {
          patientId: session.patientProfileId,
        },
      },
      include: {
        appointment: {
          include: {
            doctor: {
              include: {
                user: { select: { name: true } },
                specialization: true,
              },
            },
          },
        },
        reminders: {
          orderBy: { scheduledTime: "asc" },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ prescriptions });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch medications." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { reminderId, status } = await req.json();

    const reminder = await prisma.medicationReminder.update({
      where: { id: reminderId },
      data: { status: status || "ACKNOWLEDGED" },
    });

    return NextResponse.json({ success: true, reminder });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update reminder." }, { status: 500 });
  }
}
