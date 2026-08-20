import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        patientProfile: true,
        doctorProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Demo user not found." }, { status: 404 });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      patientProfileId: user.patientProfile?.id,
      doctorProfileId: user.doctorProfile?.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        patientProfileId: user.patientProfile?.id,
        doctorProfileId: user.doctorProfile?.id,
      },
    });

    response.cookies.set({
      name: "careflow_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to switch demo account." }, { status: 500 });
  }
}
