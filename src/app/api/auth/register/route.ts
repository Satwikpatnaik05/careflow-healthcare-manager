import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      password,
      name,
      phone,
      role = "PATIENT",
      dateOfBirth,
      gender,
      bloodGroup,
      medicalHistory,
      specializationId,
      licenseNumber,
      bio,
      experienceYears = 1,
      consultationFee = 75.0,
      slotDurationMinutes = 30,
    } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const isDoctor = role.toUpperCase() === "DOCTOR";

    // If doctor, resolve or fallback specialization
    let finalSpecId = specializationId;
    if (isDoctor && !finalSpecId) {
      const defaultSpec = await prisma.specialization.findFirst();
      if (defaultSpec) {
        finalSpecId = defaultSpec.id;
      }
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: isDoctor && !name.toLowerCase().startsWith("dr.") ? `Dr. ${name}` : name,
        passwordHash,
        phone: phone || null,
        role: isDoctor ? "DOCTOR" : "PATIENT",
        avatarUrl: isDoctor
          ? "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"
          : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
        ...(isDoctor
          ? {
              doctorProfile: {
                create: {
                  specializationId: finalSpecId,
                  licenseNumber: licenseNumber || `MD-${Math.floor(10000 + Math.random() * 90000)}`,
                  bio: bio || "Board-certified clinical specialist dedicated to patient care.",
                  experienceYears: Number(experienceYears) || 1,
                  consultationFee: Number(consultationFee) || 75.0,
                  slotDurationMinutes: Number(slotDurationMinutes) || 30,
                  isAvailable: true,
                  rating: 5.0,
                },
              },
            }
          : {
              patientProfile: {
                create: {
                  dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                  gender: gender || null,
                  bloodGroup: bloodGroup || null,
                  medicalHistory: medicalHistory || null,
                },
              },
            }),
      },
      include: {
        patientProfile: true,
        doctorProfile: true,
      },
    });

    // If registered as doctor, create standard working hours: Mon - Fri 09:00 - 17:00
    if (isDoctor && user.doctorProfile) {
      for (let day = 1; day <= 5; day++) {
        await prisma.doctorWorkingHours.create({
          data: {
            doctorId: user.doctorProfile.id,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "17:00",
            breakStartTime: "13:00",
            breakEndTime: "14:00",
            isActive: true,
          },
        });
      }
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
    console.error("[Register API Error]", err);
    return NextResponse.json({ error: "Failed to create account: " + (err.message || String(err)) }, { status: 500 });
  }
}
