import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateIcsCalendarEvent } from "@/lib/calendar/ics-builder";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        doctor: {
          include: {
            user: true,
            specialization: true,
          },
        },
        patient: {
          include: {
            user: true,
          },
        },
        symptomAssessment: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    const icsContent = generateIcsCalendarEvent({
      title: `Consultation with Dr. ${appointment.doctor.user.name} (${appointment.doctor.specialization.name})`,
      description: `Appointment Number: ${appointment.appointmentNumber}\nDoctor: Dr. ${appointment.doctor.user.name}\nPatient: ${appointment.patient.user.name}\nChief Complaint: ${appointment.symptomAssessment?.chiefComplaint || "Routine Consultation"}`,
      location: "CareFlow Clinic & Medical Center",
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      organizerName: `Dr. ${appointment.doctor.user.name}`,
      organizerEmail: appointment.doctor.user.email,
    });

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="careflow-apt-${appointment.appointmentNumber}.ics"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to generate .ics file." }, { status: 500 });
  }
}
