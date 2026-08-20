import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/calendar/google-cal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId passed in state

    if (!code || !state) {
      return NextResponse.redirect(new URL("/patient?calendar=error", req.url));
    }

    await exchangeCodeForTokens(code, state);

    return NextResponse.redirect(new URL("/patient?calendar=connected", req.url));
  } catch (err: any) {
    console.error("[Google OAuth Callback Error]", err);
    return NextResponse.redirect(new URL("/patient?calendar=error", req.url));
  }
}
