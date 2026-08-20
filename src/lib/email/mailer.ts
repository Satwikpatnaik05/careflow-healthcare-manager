import nodemailer from "nodemailer";
import { prisma } from "../prisma";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  recipientRole?: "PATIENT" | "DOCTOR" | "ADMIN";
  type?: string;
  appointmentId?: string;
  userId?: string;
}

// Create reusable transporter
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.ethereal.email";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    // Return a mock / ethereal-compatible test transporter
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "ethereal.test@ethereal.email",
        pass: "ethereal_password",
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  recipientRole = "PATIENT",
  type = "NOTIFICATION",
  appointmentId,
  userId,
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const from = process.env.SMTP_FROM || '"CareFlow Health" <appointments@medmanager.health>';

  // 1. Log notification in DB as PENDING
  let logRecord;
  try {
    logRecord = await prisma.notificationLog.create({
      data: {
        recipientEmail: to,
        recipientRole,
        subject,
        bodyHtml: html,
        status: "PENDING",
        type,
        appointmentId,
        userId,
      },
    });
  } catch (dbErr) {
    console.error("[Email Log DB Error]", dbErr);
  }

  // 2. Attempt dispatch
  try {
    const transporter = getTransporter();

    // If using default / unconfigured SMTP, simulate successful dispatch in dev
    if (!process.env.SMTP_USER) {
      console.log(`[Email Simulator] To: ${to} | Subject: ${subject}`);
      if (logRecord) {
        await prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: { status: "SENT", sentAt: new Date() },
        });
      }
      return { success: true, messageId: `simulated-${Date.now()}` };
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    if (logRecord) {
      await prisma.notificationLog.update({
        where: { id: logRecord.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    }

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("[Email Dispatch Error]", err);
    if (logRecord) {
      await prisma.notificationLog.update({
        where: { id: logRecord.id },
        data: {
          status: "FAILED",
          lastError: err?.message || String(err),
          retryCount: { increment: 1 },
        },
      });
    }
    return { success: false, error: err?.message || String(err) };
  }
}

// -------------------------------------------------------------
// HTML Email Templates
// -------------------------------------------------------------

function emailShell(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    .header { background-color: #0d9488; color: #ffffff; padding: 24px 32px; text-align: left; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .body { padding: 32px; font-size: 15px; line-height: 1.6; color: #334155; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .card-row:last-child { margin-bottom: 0; }
    .card-label { font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; }
    .card-val { font-weight: 600; color: #0f172a; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .badge-teal { background-color: #ccfbf1; color: #115e59; }
    .badge-rose { background-color: #ffe4e6; color: #9f1239; }
    .badge-amber { background-color: #fef3c7; color: #92400e; }
    .btn { display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
    .footer { background-color: #f1f5f9; padding: 20px 32px; font-size: 13px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CareFlow Clinic</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0;">CareFlow Healthcare Network • 100 Medical Center Plaza</p>
      <p style="margin: 4px 0 0 0;">This is an automated clinical notification. If you have any questions, please contact our support team.</p>
    </div>
  </div>
</body>
</html>`;
}

export function bookingConfirmationTemplate({
  patientName,
  doctorName,
  specialization,
  appointmentNumber,
  dateTimeStr,
  urgencyLevel,
  portalUrl,
}: {
  patientName: string;
  doctorName: string;
  specialization: string;
  appointmentNumber: string;
  dateTimeStr: string;
  urgencyLevel: string;
  portalUrl?: string;
}): string {
  return emailShell(
    "Appointment Confirmed - CareFlow",
    `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Your Appointment is Confirmed</h2>
    <p>Dear <strong>${patientName}</strong>,</p>
    <p>Your upcoming clinical consultation with <strong>Dr. ${doctorName}</strong> has been successfully booked.</p>
    
    <div class="card">
      <div style="margin-bottom: 12px;">
        <span class="card-label">Appointment ID</span><br/>
        <strong style="font-size: 16px; color: #0d9488;">${appointmentNumber}</strong>
      </div>
      <div style="margin-bottom: 12px;">
        <span class="card-label">Doctor & Specialty</span><br/>
        <span class="card-val">Dr. ${doctorName} (${specialization})</span>
      </div>
      <div style="margin-bottom: 12px;">
        <span class="card-label">Date & Time</span><br/>
        <span class="card-val">${dateTimeStr}</span>
      </div>
      <div>
        <span class="card-label">Triage Urgency Status</span><br/>
        <span class="badge ${urgencyLevel === "HIGH" ? "badge-rose" : urgencyLevel === "MEDIUM" ? "badge-amber" : "badge-teal"}">${urgencyLevel} Urgency</span>
      </div>
    </div>

    <p style="font-size: 14px; color: #64748b;">
      A Google Calendar invite has been scheduled. Please arrive 10 minutes prior to your consultation.
    </p>

    <a href="${portalUrl || "http://localhost:3000/patient/appointments"}" class="btn" style="color: #ffffff;">View in Patient Portal</a>
  `
  );
}

export function doctorLeaveAlertTemplate({
  patientName,
  doctorName,
  originalDateStr,
  rescheduleUrl,
}: {
  patientName: string;
  doctorName: string;
  originalDateStr: string;
  rescheduleUrl: string;
}): string {
  return emailShell(
    "Urgent: Doctor Leave Schedule Notice",
    `
    <h2 style="margin-top: 0; color: #991b1b; font-size: 20px;">Important Schedule Notice</h2>
    <p>Dear <strong>${patientName}</strong>,</p>
    <p>
      We are writing to notify you that <strong>Dr. ${doctorName}</strong> has been scheduled on leave for your booked appointment date (<strong>${originalDateStr}</strong>).
    </p>
    
    <div class="card" style="border-left: 4px solid #ef4444;">
      <p style="margin: 0; font-size: 14px; color: #334155;">
        To ensure uninterrupted care, your appointment has been released for priority rescheduling. Please click the button below to pick an alternative slot or consult an available specialist in the same department.
      </p>
    </div>

    <a href="${rescheduleUrl}" class="btn" style="background-color: #0f766e; color: #ffffff;">Choose New Slot Now</a>

    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
      If you require immediate medical assistance, please contact our 24/7 clinic triage helpline or visit the nearest emergency room.
    </p>
  `
  );
}

export function medicationReminderTemplate({
  patientName,
  medicationName,
  dosage,
  timing,
  instructions,
}: {
  patientName: string;
  medicationName: string;
  dosage: string;
  timing?: string;
  instructions?: string;
}): string {
  return emailShell(
    "Medication Reminder - CareFlow",
    `
    <h2 style="margin-top: 0; color: #0d9488; font-size: 20px;">Time for Your Medication</h2>
    <p>Dear <strong>${patientName}</strong>,</p>
    <p>This is your scheduled clinical reminder to take your prescribed medication.</p>
    
    <div class="card">
      <div style="margin-bottom: 10px;">
        <span class="card-label">Medication</span><br/>
        <strong style="font-size: 17px; color: #0f172a;">${medicationName}</strong> (${dosage})
      </div>
      ${timing ? `<div style="margin-bottom: 10px;"><span class="card-label">Timing</span><br/><span class="card-val">${timing}</span></div>` : ""}
      ${instructions ? `<div><span class="card-label">Doctor's Instructions</span><br/><span class="card-val">${instructions}</span></div>` : ""}
    </div>

    <a href="http://localhost:3000/patient/medications" class="btn" style="color: #ffffff;">Mark as Taken in Portal</a>
  `
  );
}

export function postVisitSummaryTemplate({
  patientName,
  doctorName,
  diagnosis,
  summary,
  followUpSteps,
}: {
  patientName: string;
  doctorName: string;
  diagnosis: string;
  summary: string;
  followUpSteps?: string;
}): string {
  return emailShell(
    "Your Post-Visit Clinical Summary & Care Plan",
    `
    <h2 style="margin-top: 0; color: #0d9488; font-size: 20px;">Post-Consultation Care Summary</h2>
    <p>Dear <strong>${patientName}</strong>,</p>
    <p>Dr. <strong>${doctorName}</strong> has finalized your consultation record for <strong>${diagnosis}</strong>.</p>
    
    <div class="card">
      <span class="card-label">Physician Summary (Plain English)</span>
      <p style="margin: 8px 0 0 0; color: #0f172a; line-height: 1.6;">${summary}</p>
    </div>

    ${
      followUpSteps
        ? `
    <div class="card">
      <span class="card-label">Next Steps & Follow-up</span>
      <p style="margin: 8px 0 0 0; color: #0f172a; white-space: pre-line;">${followUpSteps}</p>
    </div>`
        : ""
    }

    <a href="http://localhost:3000/patient/appointments" class="btn" style="color: #ffffff;">View Prescriptions & Records</a>
  `
  );
}
