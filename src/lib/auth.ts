import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "med-manager-ultra-secure-jwt-key-2026-production";
const COOKIE_NAME = "careflow_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  patientProfileId?: string;
  doctorProfileId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      patientProfileId: user.patientProfileId,
      doctorProfileId: user.doctorProfileId,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  // Check cookie first
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    const user = verifyToken(cookieToken);
    if (user) return user;
  }

  // Check Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const headerToken = authHeader.substring(7);
    return verifyToken(headerToken);
  }

  return null;
}

export async function getUserWithProfiles(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      patientProfile: true,
      doctorProfile: {
        include: {
          specialization: true,
          workingHours: true,
        },
      },
    },
  });
}
