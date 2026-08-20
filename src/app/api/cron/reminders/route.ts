import { NextRequest, NextResponse } from "next/server";
import { runSchedulerCycle } from "@/lib/jobs/scheduler";

export async function GET(req: NextRequest) {
  try {
    const stats = await runSchedulerCycle();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Scheduler cycle failed." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
