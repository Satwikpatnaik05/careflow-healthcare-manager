import { NextRequest, NextResponse } from "next/server";
import { getDoctorAvailableSlots } from "@/lib/server/slot-manager";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!doctorId || !date) {
      return NextResponse.json({ error: "doctorId and date (YYYY-MM-DD) are required." }, { status: 400 });
    }

    const session = await getSessionFromRequest(req);
    const slots = await getDoctorAvailableSlots({
      doctorId,
      dateStr: date,
      currentPatientId: session?.patientProfileId,
    });

    return NextResponse.json({ slots });
  } catch (err: any) {
    console.error("[Slots GET Error]", err);
    return NextResponse.json({ error: "Failed to fetch time slots." }, { status: 500 });
  }
}
