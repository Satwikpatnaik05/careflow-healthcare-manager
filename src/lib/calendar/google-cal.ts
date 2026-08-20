import { google } from "googleapis";
import { prisma } from "../prisma";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/calendar/google/callback";

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl(state?: string): string | null {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/userinfo.email"],
    state: state || "",
  });
}

export async function exchangeCodeForTokens(code: string, userId: string) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) throw new Error("Google OAuth credentials not configured in environment.");

  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token) throw new Error("Failed to retrieve access token from Google.");

  // Upsert token in DB
  return prisma.googleOAuthToken.upsert({
    where: { userId },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      scope: tokens.scope || undefined,
    },
    create: {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      scope: tokens.scope || undefined,
    },
  });
}

async function getAuthenticatedCalendar(userId: string) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  const tokenRecord = await prisma.googleOAuthToken.findUnique({
    where: { userId },
  });

  if (!tokenRecord || !tokenRecord.accessToken) return null;

  oauth2Client.setCredentials({
    access_token: tokenRecord.accessToken,
    refresh_token: tokenRecord.refreshToken || undefined,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function createGoogleCalendarEvent({
  userId,
  title,
  description,
  location,
  startTime,
  endTime,
  attendeeEmail,
}: {
  userId: string;
  title: string;
  description: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail?: string;
}): Promise<string | null> {
  try {
    const calendar = await getAuthenticatedCalendar(userId);
    if (!calendar) {
      // OAuth not linked for this user; return null gracefully
      return null;
    }

    const event = {
      summary: title,
      description,
      location: location || "CareFlow Clinic Consultation Room",
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    };

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return res.data.id || null;
  } catch (err) {
    console.error("[Google Calendar Error] Failed to create event:", err);
    return null;
  }
}

export async function updateGoogleCalendarEvent({
  userId,
  eventId,
  startTime,
  endTime,
  title,
}: {
  userId: string;
  eventId: string;
  startTime: Date;
  endTime: Date;
  title?: string;
}): Promise<boolean> {
  try {
    const calendar = await getAuthenticatedCalendar(userId);
    if (!calendar || !eventId) return false;

    await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: {
        ...(title ? { summary: title } : {}),
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
      },
    });

    return true;
  } catch (err) {
    console.error("[Google Calendar Error] Failed to update event:", err);
    return false;
  }
}

export async function deleteGoogleCalendarEvent({
  userId,
  eventId,
}: {
  userId: string;
  eventId: string;
}): Promise<boolean> {
  try {
    const calendar = await getAuthenticatedCalendar(userId);
    if (!calendar || !eventId) return false;

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    return true;
  } catch (err) {
    console.error("[Google Calendar Error] Failed to delete event:", err);
    return false;
  }
}
