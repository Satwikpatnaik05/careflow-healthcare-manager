import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/mailer";
import { formatDateTime } from "@/lib/utils";
import { deleteGoogleCalendarEvent } from "@/lib/calendar/google-cal";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
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
            prescriptions: {
              include: {
                reminders: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch appointment." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { status, cancellationReason } = await req.json();

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, specialization: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: status || appointment.status,
        cancellationReason: cancellationReason || appointment.cancellationReason,
      },
    });

    // If cancelled, remove calendar events and notify patient & doctor
    if (status === "CANCELLED") {
      if (appointment.googleEventIdPatient) {
        deleteGoogleCalendarEvent({
          userId: appointment.patient.userId,
          eventId: appointment.googleEventIdPatient,
        }).catch((e) => console.error("[Cal Delete Error]", e));
      }

      const dateTimeStr = formatDateTime(appointment.startTime);

      // Email patient
      sendEmail({
        to: appointment.patient.user.email,
        subject: `Appointment Cancelled: Dr. ${appointment.doctor.user.name} (${appointment.appointmentNumber})`,
        html: `<p>Dear <strong>${appointment.patient.user.name}</strong>,</p><p>Your appointment on <strong>${dateTimeStr}</strong> has been cancelled.</p><p>Reason: ${cancellationReason || "Patient requested cancellation"}</p>`,
        recipientRole: "PATIENT",
        type: "APPOINTMENT_CANCELLED",
        appointmentId: appointment.id,
        userId: appointment.patient.userId,
      }).catch((e) => console.error("[Email Error]", e));

      // Email doctor
      sendEmail({
        to: appointment.doctor.user.email,
        subject: `Appointment Cancelled: Patient ${appointment.patient.user.name} (${appointment.appointmentNumber})`,
        html: `<p>Dear <strong>Dr. ${appointment.doctor.user.name}</strong>,</p><p>The scheduled consultation with ${appointment.patient.user.name} for <strong>${dateTimeStr}</strong> has been cancelled.</p>`,
        recipientRole: "DOCTOR",
        type: "APPOINTMENT_CANCELLED",
        appointmentId: appointment.id,
        userId: appointment.doctor.userId,
      }).catch((e) => console.error("[Email Error]", e));
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update appointment." }, { status: 500 });
  }
}
