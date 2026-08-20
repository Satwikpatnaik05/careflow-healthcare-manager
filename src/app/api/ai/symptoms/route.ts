import { NextRequest, NextResponse } from "next/server";
import { analyzeSymptoms } from "@/lib/ai/llm-client";

export async function POST(req: NextRequest) {
  try {
    const { symptoms, duration, painScale } = await req.json();

    if (!symptoms || symptoms.trim().length < 5) {
      return NextResponse.json({ error: "Please enter your symptoms in more detail." }, { status: 400 });
    }

    const result = await analyzeSymptoms(symptoms, duration, painScale ? Number(painScale) : undefined);

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to analyze symptoms." }, { status: 500 });
  }
}
