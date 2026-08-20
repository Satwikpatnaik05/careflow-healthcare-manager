import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/calendar/google-cal";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tokenRecord = await prisma.googleOAuthToken.findUnique({
      where: { userId: session.id },
    });

    const authUrl = getGoogleAuthUrl(session.id);

    return NextResponse.json({
      isConnected: !!tokenRecord,
      authUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to check Google Calendar status." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await prisma.googleOAuthToken.findUnique({
      where: { userId: session.id },
    });

    if (existing) {
      await prisma.googleOAuthToken.delete({
        where: { userId: session.id },
      });
      return NextResponse.json({ isConnected: false, message: "Google Calendar disconnected." });
    } else {
      await prisma.googleOAuthToken.create({
        data: {
          userId: session.id,
          accessToken: "mock-google-token-" + Date.now(),
          refreshToken: "mock-refresh-token-" + Date.now(),
          scope: "https://www.googleapis.com/auth/calendar.events",
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      return NextResponse.json({ isConnected: true, message: "Google Calendar connected successfully!" });
    }
  } catch (err: any) {
    console.error("[Google Calendar Connect Error]", err);
    return NextResponse.json({ error: "Failed to update Google Calendar connection." }, { status: 500 });
  }
}
