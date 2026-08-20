import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookAppointmentAtomic } from "@/lib/server/slot-manager";
import { createGoogleCalendarEvent } from "@/lib/calendar/google-cal";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date"); // YYYY-MM-DD

    const whereClause: any = {};

    if (session.role === "PATIENT") {
      whereClause.patientId = session.patientProfileId;
    } else if (session.role === "DOCTOR") {
      whereClause.doctorId = session.doctorProfileId;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      whereClause.startTime = { gte: startOfDay, lte: endOfDay };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
            },
            specialization: true,
          },
        },
        symptomAssessment: true,
        consultationRecord: {
          include: {
            prescriptions: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json({ appointments });
  } catch (err: any) {
    console.error("[Appointments GET Error]", err);
    return NextResponse.json({ error: "Failed to fetch appointments." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !session.patientProfileId) {
      return NextResponse.json({ error: "Patient authentication required to book an appointment." }, { status: 401 });
    }

    const { doctorId, startTime, endTime, symptoms, duration, painScale } = await req.json();

    if (!doctorId || !startTime || !endTime || !symptoms) {
      return NextResponse.json({ error: "Doctor, time slot, and symptoms are required." }, { status: 400 });
    }

    const result = await bookAppointmentAtomic({
      patientProfileId: session.patientProfileId,
      doctorId,
      startTimeIso: startTime,
      endTimeIso: endTime,
      rawSymptoms: symptoms,
      duration,
      painScale: painScale ? Number(painScale) : undefined,
    });

    // Optional Google Calendar Sync in background
    createGoogleCalendarEvent({
      userId: session.id,
      title: `Consultation with Dr. ${result.appointment.doctor.user.name}`,
      description: `Chief Complaint: ${result.aiTriage.chiefComplaint}\nAppointment #: ${result.appointment.appointmentNumber}`,
      startTime: result.appointment.startTime,
      endTime: result.appointment.endTime,
      attendeeEmail: result.appointment.doctor.user.email,
    }).then(async (calEventId) => {
      if (calEventId) {
        await prisma.appointment.update({
          where: { id: result.appointment.id },
          data: { googleEventIdPatient: calEventId },
        });
      }
    }).catch((e) => console.error("[Google Cal Sync Error]", e));

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
      aiTriage: result.aiTriage,
    });
  } catch (err: any) {
    console.error("[Appointment Booking Error]", err);
    return NextResponse.json({ error: err.message || "Failed to book appointment." }, { status: 409 });
  }
}
