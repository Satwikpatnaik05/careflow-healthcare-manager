import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markDoctorOnLeave } from "@/lib/server/slot-manager";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId") || (session.role === "DOCTOR" ? session.doctorProfileId : undefined);

    const whereClause: any = {};
    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    const leaves = await prisma.doctorLeave.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            user: { select: { name: true, email: true } },
            specialization: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ leaves });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch leaves." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "DOCTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Doctor or Admin permission required." }, { status: 403 });
    }

    const { doctorId: bodyDocId, startDate, endDate, reason } = await req.json();

    const targetDoctorId = session.role === "ADMIN" ? bodyDocId : session.doctorProfileId;

    if (!targetDoctorId || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: "Doctor ID, startDate, endDate, and reason are required." }, { status: 400 });
    }

    const result = await markDoctorOnLeave({
      doctorId: targetDoctorId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    });

    return NextResponse.json({
      success: true,
      leave: result.leave,
      affectedAppointmentsCount: result.affectedAppointmentsCount,
      affectedAppointments: result.affectedAppointments,
      message: `Doctor leave marked. ${result.affectedAppointmentsCount} conflicting appointment(s) rescheduled and patient alerts dispatched.`,
    });
  } catch (err: any) {
    console.error("[Leave POST Error]", err);
    return NextResponse.json({ error: "Failed to record doctor leave." }, { status: 500 });
  }
}
