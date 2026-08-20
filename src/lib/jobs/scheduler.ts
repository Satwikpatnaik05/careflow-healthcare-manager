import cron from "node-cron";
import { prisma } from "../prisma";
import { sendEmail, medicationReminderTemplate } from "../email/mailer";
import { formatDateTime } from "../utils";

let isSchedulerRunning = false;

export async function runSchedulerCycle(): Promise<{
  expiredHoldsRemoved: number;
  medicationRemindersProcessed: number;
  appointmentRemindersProcessed: number;
  failedRetriesProcessed: number;
}> {
  const now = new Date();
  let expiredHoldsRemoved = 0;
  let medicationRemindersProcessed = 0;
  let appointmentRemindersProcessed = 0;
  let failedRetriesProcessed = 0;

  try {
    // 1. Clean up expired temporary slot holds
    const deletedHolds = await prisma.slotHold.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    expiredHoldsRemoved = deletedHolds.count;

    // 2. Process Pending Medication Reminders
    const dueReminders = await prisma.medicationReminder.findMany({
      where: {
        status: "PENDING",
        scheduledTime: { lte: now },
      },
      include: {
        prescription: true,
        patient: {
          include: { user: true },
        },
      },
      take: 20,
    });

    for (const rem of dueReminders) {
      if (rem.patient?.user?.email) {
        const html = medicationReminderTemplate({
          patientName: rem.patient.user.name,
          medicationName: rem.prescription.medicationName,
          dosage: rem.prescription.dosage,
          timing: rem.prescription.timing || undefined,
          instructions: rem.prescription.instructions || undefined,
        });

        const res = await sendEmail({
          to: rem.patient.user.email,
          subject: `Medication Reminder: ${rem.prescription.medicationName}`,
          html,
          recipientRole: "PATIENT",
          type: "MEDICATION_REMINDER",
          userId: rem.patient.userId,
        });

        if (res.success) {
          await prisma.medicationReminder.update({
            where: { id: rem.id },
            data: { status: "SENT", sentAt: new Date() },
          });
          medicationRemindersProcessed++;
        } else {
          await prisma.medicationReminder.update({
            where: { id: rem.id },
            data: { retryCount: { increment: 1 } },
          });
        }
      }
    }

    // 3. Process 24-hour upcoming appointment reminders
    const in24HoursStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in24HoursEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        startTime: { gte: in24HoursStart, lte: in24HoursEnd },
        notifications: {
          none: { type: "APPOINTMENT_REMINDER_24H" },
        },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, specialization: true } },
      },
      take: 10,
    });

    for (const apt of upcomingAppointments) {
      if (apt.patient?.user?.email) {
        const dateTimeStr = formatDateTime(apt.startTime);
        await sendEmail({
          to: apt.patient.user.email,
          subject: `Reminder: Upcoming Consultation with Dr. ${apt.doctor.user.name} Tomorrow`,
          html: `<p>Dear <strong>${apt.patient.user.name}</strong>,</p><p>This is a reminder for your upcoming consultation with <strong>Dr. ${apt.doctor.user.name}</strong> (${apt.doctor.specialization.name}) on <strong>${dateTimeStr}</strong>.</p><p>Please join on time or arrive 10 minutes early.</p>`,
          recipientRole: "PATIENT",
          type: "APPOINTMENT_REMINDER_24H",
          appointmentId: apt.id,
          userId: apt.patient.userId,
        });
        appointmentRemindersProcessed++;
      }
    }

    // 4. Retry Failed Notifications
    const failedLogs = await prisma.notificationLog.findMany({
      where: {
        status: "FAILED",
        retryCount: { lt: 3 },
      },
      take: 10,
    });

    for (const log of failedLogs) {
      const res = await sendEmail({
        to: log.recipientEmail,
        subject: log.subject,
        html: log.bodyHtml,
        recipientRole: log.recipientRole as any,
        type: log.type,
        appointmentId: log.appointmentId || undefined,
        userId: log.userId || undefined,
      });

      if (res.success) {
        await prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: "SENT", sentAt: new Date() },
        });
        failedRetriesProcessed++;
      }
    }
  } catch (err) {
    console.error("[Scheduler Cycle Error]", err);
  }

  return {
    expiredHoldsRemoved,
    medicationRemindersProcessed,
    appointmentRemindersProcessed,
    failedRetriesProcessed,
  };
}

export function initCronScheduler() {
  if (isSchedulerRunning) return;
  isSchedulerRunning = true;

  // Run every 1 minute
  cron.schedule("* * * * *", async () => {
    try {
      await runSchedulerCycle();
    } catch (e) {
      console.error("[Cron Runner Error]", e);
    }
  });

  console.log("[Scheduler] Background cron worker initialized (1-minute intervals).");
}
