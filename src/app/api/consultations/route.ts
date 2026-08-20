import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeClinicalNotes } from "@/lib/ai/llm-client";
import { sendEmail, postVisitSummaryTemplate } from "@/lib/email/mailer";
import { formatDoctorName } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "DOCTOR" || !session.doctorProfileId) {
      return NextResponse.json({ error: "Unauthorized. Doctor access required." }, { status: 401 });
    }

    const {
      appointmentId,
      diagnosis,
      clinicalNotes,
      vitalSigns,
      followUpDate,
      prescriptions = [],
    } = await req.json();

    if (!appointmentId || !diagnosis || !clinicalNotes) {
      return NextResponse.json({ error: "appointmentId, diagnosis, and clinicalNotes are required." }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, specialization: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    // 1. Generate patient-friendly summary via LLM (with heuristic resilience)
    const aiSummary = await summarizeClinicalNotes(clinicalNotes, diagnosis);

    // 2. Transaction to record consultation, prescriptions, reminders & mark completed
    const result = await prisma.$transaction(async (tx) => {
      // Upsert consultation record
      const consultation = await tx.consultationRecord.upsert({
        where: { appointmentId },
        update: {
          diagnosis,
          clinicalNotes,
          patientFriendlySummary: aiSummary.patientFriendlySummary,
          followUpSteps: aiSummary.followUpSteps,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          vitalSigns: vitalSigns ? JSON.stringify(vitalSigns) : null,
        },
        create: {
          appointmentId,
          doctorId: session.doctorProfileId!,
          diagnosis,
          clinicalNotes,
          patientFriendlySummary: aiSummary.patientFriendlySummary,
          followUpSteps: aiSummary.followUpSteps,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          vitalSigns: vitalSigns ? JSON.stringify(vitalSigns) : null,
        },
      });

      // Clear old prescriptions if re-editing
      await tx.prescription.deleteMany({
        where: { appointmentId },
      });

      // Create new prescriptions and their scheduled medication reminders
      for (const rx of prescriptions) {
        if (rx.medicationName && rx.dosage) {
          const duration = Number(rx.durationDays) || 5;
          const createdRx = await tx.prescription.create({
            data: {
              appointmentId,
              consultationRecordId: consultation.id,
              medicationName: rx.medicationName,
              dosage: rx.dosage,
              frequency: rx.frequency || "TWICE_DAILY",
              timing: rx.timing || "After meals",
              durationDays: duration,
              instructions: rx.instructions || "",
              startDate: new Date(),
              endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
            },
          });

          // Schedule daily reminders for the prescription duration
          const numDays = Math.min(duration, 14); // schedule up to 14 days initially
          for (let d = 0; d < numDays; d++) {
            const reminderDate = new Date();
            reminderDate.setDate(reminderDate.getDate() + d);
            reminderDate.setHours(9, 0, 0, 0); // 9:00 AM morning reminder

            await tx.medicationReminder.create({
              data: {
                prescriptionId: createdRx.id,
                patientId: appointment.patientId,
                scheduledTime: reminderDate,
                status: "PENDING",
              },
            });
          }
        }
      }

      // Mark appointment as COMPLETED
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED" },
      });

      return consultation;
    });

    // 3. Dispatch patient-friendly summary email to the patient
    if (appointment.patient?.user?.email) {
      const formattedDocName = formatDoctorName(appointment.doctor.user.name);
      const html = postVisitSummaryTemplate({
        patientName: appointment.patient.user.name,
        doctorName: formattedDocName,
        diagnosis,
        summary: aiSummary.patientFriendlySummary,
        followUpSteps: aiSummary.followUpSteps,
      });

      sendEmail({
        to: appointment.patient.user.email,
        subject: `Your Care Plan & Summary: Consultation with ${formattedDocName}`,
        html,
        recipientRole: "PATIENT",
        type: "POST_VISIT_SUMMARY_READY",
        appointmentId: appointment.id,
        userId: appointment.patient.userId,
      }).catch((e) => console.error("[Post Visit Email Error]", e));
    }

    return NextResponse.json({
      success: true,
      consultation: result,
      aiSummary,
    });
  } catch (err: any) {
    console.error("[Consultation POST Error]", err);
    return NextResponse.json({ error: "Failed to save consultation." }, { status: 500 });
  }
}
