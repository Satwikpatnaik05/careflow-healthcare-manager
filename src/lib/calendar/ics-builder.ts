/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string
 * for universal calendar compatibility (Apple Calendar, Google, Outlook).
 */
export function generateIcsCalendarEvent({
  title,
  description,
  location,
  startTime,
  endTime,
  organizerName,
  organizerEmail,
}: {
  title: string;
  description: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  organizerName?: string;
  organizerEmail?: string;
}): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const uid = `careflow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@medmanager.health`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CareFlow Clinic//Healthcare Manager v1.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:${title.replace(/\n/g, "\\n")}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    location ? `LOCATION:${location.replace(/\n/g, "\\n")}` : "LOCATION:CareFlow Clinic Suite 400",
    organizerName && organizerEmail ? `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}` : "ORGANIZER;CN=CareFlow Clinic:mailto:appointments@medmanager.health",
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Upcoming Healthcare Appointment",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
