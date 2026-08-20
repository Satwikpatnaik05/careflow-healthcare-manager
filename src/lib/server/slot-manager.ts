import { prisma } from "../prisma";
import { analyzeSymptoms } from "../ai/llm-client";
import { sendEmail, bookingConfirmationTemplate, doctorLeaveAlertTemplate } from "../email/mailer";
import { formatDateTime, formatTime, formatDoctorName } from "../utils";
import { addMinutes, parse, format, isBefore, isAfter, areIntervalsOverlapping } from "date-fns";

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  timeDisplay: string; // e.g. "09:00 AM - 09:30 AM"
  isAvailable: boolean;
  holdExpiresAt?: string;
  heldByCurrentPatient?: boolean;
}

/**
 * Calculates all slots for a doctor on a specific calendar date (YYYY-MM-DD)
 */
export async function getDoctorAvailableSlots({
  doctorId,
  dateStr,
  currentPatientId,
}: {
  doctorId: string;
  dateStr: string; // YYYY-MM-DD
  currentPatientId?: string;
}): Promise<TimeSlot[]> {
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
  const dayOfWeek = targetDate.getUTCDay();

  // 1. Fetch Doctor Working Hours and Slot Duration
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    include: {
      workingHours: {
        where: { dayOfWeek, isActive: true },
      },
      leaves: {
        where: {
          status: "APPROVED",
        },
      },
    },
  });

  if (!doctor || doctor.workingHours.length === 0) {
    return [];
  }

  const workingHour = doctor.workingHours[0];
  const slotDuration = doctor.slotDurationMinutes || 30;

  // 2. Check if doctor is on leave on this date
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  const isOnLeave = doctor.leaves.some((leave) => {
    return (
      (leave.startDate <= endOfDay && leave.endDate >= startOfDay)
    );
  });

  if (isOnLeave) {
    return [];
  }

  // 3. Fetch Existing Bookings for this doctor on this day
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
  });

  // 4. Fetch Active Slot Holds
  const activeHolds = await prisma.slotHold.findMany({
    where: {
      doctorId,
      startTime: { gte: startOfDay, lte: endOfDay },
      expiresAt: { gt: new Date() },
    },
  });

  // 5. Generate slots across working hours
  const slots: TimeSlot[] = [];
  const [startHour, startMin] = workingHour.startTime.split(":").map(Number);
  const [endHour, endMin] = workingHour.endTime.split(":").map(Number);

  let currentSlotStart = new Date(targetDate);
  currentSlotStart.setUTCHours(startHour, startMin, 0, 0);

  const dayShiftEnd = new Date(targetDate);
  dayShiftEnd.setUTCHours(endHour, endMin, 0, 0);

  // Optional break time
  let breakStart: Date | null = null;
  let breakEnd: Date | null = null;
  if (workingHour.breakStartTime && workingHour.breakEndTime) {
    const [bStartH, bStartM] = workingHour.breakStartTime.split(":").map(Number);
    const [bEndH, bEndM] = workingHour.breakEndTime.split(":").map(Number);
    breakStart = new Date(targetDate);
    breakStart.setUTCHours(bStartH, bStartM, 0, 0);
    breakEnd = new Date(targetDate);
    breakEnd.setUTCHours(bEndH, bEndM, 0, 0);
  }

  while (currentSlotStart.getTime() + slotDuration * 60000 <= dayShiftEnd.getTime()) {
    const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDuration * 60000);

    // Skip if in break window
    const isInBreak =
      breakStart &&
      breakEnd &&
      areIntervalsOverlapping(
        { start: currentSlotStart, end: currentSlotEnd },
        { start: breakStart, end: breakEnd }
      );

    if (!isInBreak) {
      // Check if slot overlaps an existing appointment
      const isBooked = existingAppointments.some((apt) =>
        areIntervalsOverlapping(
          { start: currentSlotStart, end: currentSlotEnd },
          { start: apt.startTime, end: apt.endTime }
        )
      );

      // Check if slot is held
      const activeHold = activeHolds.find(
        (hold) =>
          areIntervalsOverlapping(
            { start: currentSlotStart, end: currentSlotEnd },
            { start: hold.startTime, end: hold.endTime }
          )
      );

      const isAvailable = !isBooked && (!activeHold || activeHold.patientId === currentPatientId);

      slots.push({
        startTime: currentSlotStart.toISOString(),
        endTime: currentSlotEnd.toISOString(),
        timeDisplay: `${formatTime(currentSlotStart)} - ${formatTime(currentSlotEnd)}`,
        isAvailable,
        holdExpiresAt: activeHold?.expiresAt.toISOString(),
        heldByCurrentPatient: activeHold?.patientId === currentPatientId,
      });
    }

    currentSlotStart = currentSlotEnd;
  }

  return slots;
}

/**
 * Atomically acquires a 10-minute hold on a slot
 */
export async function acquireSlotHold({
  doctorId,
  patientProfileId,
  startTimeIso,
  endTimeIso,
}: {
  doctorId: string;
  patientProfileId: string;
  startTimeIso: string;
  endTimeIso: string;
}): Promise<{ success: boolean; message?: string; expiresAt?: Date }> {
  const startTime = new Date(startTimeIso);
  const endTime = new Date(endTimeIso);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  try {
    return await prisma.$transaction(async (tx) => {
      // Check for overlapping confirmed booking
      const existing = await tx.appointment.findFirst({
        where: {
          doctorId,
          status: "CONFIRMED",
          startTime: { lte: endTime },
          endTime: { gte: startTime },
        },
      });

      if (existing) {
        return { success: false, message: "This slot was just booked by another patient." };
      }

      // Check active hold by someone else
      const existingHold = await tx.slotHold.findFirst({
        where: {
          doctorId,
          startTime: { lte: endTime },
          endTime: { gte: startTime },
          expiresAt: { gt: new Date() },
          patientId: { not: patientProfileId },
        },
      });

      if (existingHold) {
        return { success: false, message: "Another patient is currently completing their booking for this slot. Please choose another time or wait a few minutes." };
      }

      // Clean old holds for this patient
      await tx.slotHold.deleteMany({
        where: { patientId: patientProfileId },
      });

      // Insert new hold
      await tx.slotHold.create({
        data: {
          doctorId,
          patientId: patientProfileId,
          startTime,
          endTime,
          expiresAt,
        },
      });

      return { success: true, expiresAt };
    });
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to secure slot hold." };
  }
}

/**
 * Atomically confirms booking inside an isolated database transaction
 */
export async function bookAppointmentAtomic({
  patientProfileId,
  doctorId,
  startTimeIso,
  endTimeIso,
  rawSymptoms,
  duration,
  painScale,
}: {
  patientProfileId: string;
  doctorId: string;
  startTimeIso: string;
  endTimeIso: string;
  rawSymptoms: string;
  duration?: string;
  painScale?: number;
}) {
  const startTime = new Date(startTimeIso);
  const endTime = new Date(endTimeIso);

  // 1. Execute LLM symptom triage (runs resiliently with fallback)
  const aiTriage = await analyzeSymptoms(rawSymptoms, duration, painScale);

  // 2. Atomic Database Transaction with Strict Concurrency Check
  const appointment = await prisma.$transaction(async (tx) => {
    // A. Check for double booking
    const conflict = await tx.appointment.findFirst({
      where: {
        doctorId,
        status: "CONFIRMED",
        startTime: { lte: endTime },
        endTime: { gte: startTime },
      },
    });

    if (conflict) {
      throw new Error("This slot has already been booked. Please select another slot.");
    }

    // B. Check if doctor is on leave
    const leaveConflict = await tx.doctorLeave.findFirst({
      where: {
        doctorId,
        status: "APPROVED",
        startDate: { lte: endTime },
        endDate: { gte: startTime },
      },
    });

    if (leaveConflict) {
      throw new Error("The doctor is scheduled on leave during this timeframe. Please choose a different date.");
    }

    // C. Release any holds
    await tx.slotHold.deleteMany({
      where: {
        doctorId,
        startTime,
      },
    });

    // D. Generate sequential appointment number
    const count = await tx.appointment.count();
    const aptNumber = `APT-2026-${String(count + 1).padStart(4, "0")}`;

    // E. Create Appointment
    const apt = await tx.appointment.create({
      data: {
        appointmentNumber: aptNumber,
        patientId: patientProfileId,
        doctorId,
        startTime,
        endTime,
        status: "CONFIRMED",
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, specialization: true } },
      },
    });

    // F. Store AI Symptom Assessment
    await tx.symptomAssessment.create({
      data: {
        appointmentId: apt.id,
        rawSymptoms,
        duration: duration || null,
        painScale: painScale !== undefined ? painScale : null,
        urgencyLevel: aiTriage.urgencyLevel,
        chiefComplaint: aiTriage.chiefComplaint,
        suggestedQuestions: JSON.stringify(aiTriage.suggestedQuestions),
        llmModelUsed: aiTriage.llmModelUsed,
        isFallback: aiTriage.isFallback,
      },
    });

    return apt;
  });

  // 3. Dispatch Confirmation Email asynchronously
  if (appointment.patient?.user?.email) {
    const dateTimeStr = formatDateTime(appointment.startTime);
    const formattedDocName = formatDoctorName(appointment.doctor.user.name);
    const html = bookingConfirmationTemplate({
      patientName: appointment.patient.user.name,
      doctorName: formattedDocName,
      specialization: appointment.doctor.specialization.name,
      appointmentNumber: appointment.appointmentNumber,
      dateTimeStr,
      urgencyLevel: aiTriage.urgencyLevel,
    });

    sendEmail({
      to: appointment.patient.user.email,
      subject: `Appointment Confirmed: ${formattedDocName} (${appointment.appointmentNumber})`,
      html,
      recipientRole: "PATIENT",
      type: "BOOKING_CONFIRMATION",
      appointmentId: appointment.id,
      userId: appointment.patient.userId,
    }).catch((e) => console.error("[Background Email Error]", e));
  }

  return {
    appointment,
    aiTriage,
  };
}

/**
 * Marks a doctor on leave and automatically notifies all affected patients
 */
export async function markDoctorOnLeave({
  doctorId,
  startDate,
  endDate,
  reason,
}: {
  doctorId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}) {
  // 1. Atomic Transaction: create leave + reschedule conflicting appointments
  const { leave, affectedAppointments } = await prisma.$transaction(async (tx) => {
    const createdLeave = await tx.doctorLeave.create({
      data: {
        doctorId,
        startDate,
        endDate,
        reason,
        status: "APPROVED",
      },
    });

    // Find conflicting confirmed appointments
    const conflicts = await tx.appointment.findMany({
      where: {
        doctorId,
        status: "CONFIRMED",
        startTime: { lte: endDate },
        endTime: { gte: startDate },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, specialization: true } },
      },
    });

    // Mark them as RESCHEDULED with cancellation reason
    for (const apt of conflicts) {
      await tx.appointment.update({
        where: { id: apt.id },
        data: {
          status: "RESCHEDULED",
          cancellationReason: `Physician scheduled on clinical leave: ${reason}`,
        },
      });
    }

    return { leave: createdLeave, affectedAppointments: conflicts };
  });

  // 2. Dispatch automated high-priority alerts to affected patients
  for (const apt of affectedAppointments) {
    if (apt.patient?.user?.email) {
      const originalDateStr = formatDateTime(apt.startTime);
      const rescheduleUrl = `http://localhost:3000/patient/book/${apt.doctorId}?rescheduleFor=${apt.id}`;

      const html = doctorLeaveAlertTemplate({
        patientName: apt.patient.user.name,
        doctorName: apt.doctor.user.name,
        originalDateStr,
        rescheduleUrl,
      });

      sendEmail({
        to: apt.patient.user.email,
        subject: `URGENT: Doctor Leave Notice - Reschedule Appointment ${apt.appointmentNumber}`,
        html,
        recipientRole: "PATIENT",
        type: "DOCTOR_LEAVE_RESCHEDULE",
        appointmentId: apt.id,
        userId: apt.patient.userId,
      }).catch((e) => console.error("[Leave Alert Email Error]", e));
    }
  }

  return { leave, affectedAppointmentsCount: affectedAppointments.length, affectedAppointments };
}
