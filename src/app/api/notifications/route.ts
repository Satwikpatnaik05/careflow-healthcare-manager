import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/mailer";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 30;

    const whereClause: any = {};
    if (session.role === "PATIENT" || session.role === "DOCTOR") {
      whereClause.userId = session.id;
    }

    const notifications = await prisma.notificationLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ notifications });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 403 });
    }

    const { notificationId } = await req.json();

    const log = await prisma.notificationLog.findUnique({
      where: { id: notificationId },
    });

    if (!log) {
      return NextResponse.json({ error: "Notification log not found." }, { status: 404 });
    }

    const result = await sendEmail({
      to: log.recipientEmail,
      subject: log.subject,
      html: log.bodyHtml,
      recipientRole: log.recipientRole as any,
      type: log.type,
      appointmentId: log.appointmentId || undefined,
      userId: log.userId || undefined,
    });

    return NextResponse.json({ success: result.success, error: result.error });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to retry notification." }, { status: 500 });
  }
}
