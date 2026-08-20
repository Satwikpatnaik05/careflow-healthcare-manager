import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { acquireSlotHold } from "@/lib/server/slot-manager";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !session.patientProfileId) {
      return NextResponse.json({ error: "Unauthorized. Patient login required." }, { status: 401 });
    }

    const { doctorId, startTime, endTime } = await req.json();

    if (!doctorId || !startTime || !endTime) {
      return NextResponse.json({ error: "doctorId, startTime, and endTime are required." }, { status: 400 });
    }

    const result = await acquireSlotHold({
      doctorId,
      patientProfileId: session.patientProfileId,
      startTimeIso: startTime,
      endTimeIso: endTime,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt,
      message: "Slot held for 10 minutes.",
    });
  } catch (err: any) {
    console.error("[Slot Hold Error]", err);
    return NextResponse.json({ error: "Failed to reserve slot hold." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !session.patientProfileId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await prisma.slotHold.deleteMany({
      where: { patientId: session.patientProfileId },
    });

    return NextResponse.json({ success: true, message: "Slot hold released." });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to release hold." }, { status: 500 });
  }
}
