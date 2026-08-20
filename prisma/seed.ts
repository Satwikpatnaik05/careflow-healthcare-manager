import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPass(p: string) {
  return bcrypt.hash(p, 10);
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing tables in correct relation order
  await prisma.notificationLog.deleteMany();
  await prisma.medicationReminder.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultationRecord.deleteMany();
  await prisma.symptomAssessment.deleteMany();
  await prisma.slotHold.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.doctorWorkingHours.deleteMany();
  await prisma.googleOAuthToken.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.specialization.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await hashPass("Online123");

  // 1. Specializations
  const specializations = await Promise.all([
    prisma.specialization.create({
      data: {
        name: "Cardiology",
        description: "Specialized in heart conditions, hypertension, and cardiovascular health.",
        icon: "HeartPulse",
      },
    }),
    prisma.specialization.create({
      data: {
        name: "Dermatology",
        description: "Expert diagnosis and care for skin conditions, rashes, and dermatology.",
        icon: "Sparkles",
      },
    }),
    prisma.specialization.create({
      data: {
        name: "General Medicine",
        description: "Comprehensive primary care, chronic disease management, and preventive health.",
        icon: "Stethoscope",
      },
    }),
    prisma.specialization.create({
      data: {
        name: "Neurology",
        description: "Advanced neurological assessments, migraines, nerve health, and sleep disorders.",
        icon: "Brain",
      },
    }),
    prisma.specialization.create({
      data: {
        name: "Pediatrics",
        description: "Dedicated compassionate healthcare for infants, children, and adolescents.",
        icon: "Baby",
      },
    }),
    prisma.specialization.create({
      data: {
        name: "Orthopedics",
        description: "Musculoskeletal injuries, joints, spinal care, and sports rehabilitation.",
        icon: "Activity",
      },
    }),
  ]);

  const [cardio, derm, genMed, neuro, peds, ortho] = specializations;

  // 2. Admin User: Patnaik
  const admin = await prisma.user.create({
    data: {
      email: "admin@careflow.health",
      name: "Patnaik",
      passwordHash: defaultPassword,
      role: "ADMIN",
      phone: "+1 (555) 019-2834",
      avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    },
  });

  // 3. Doctor Users & Profiles (Dr. Satwik, Dr. Vinith, Dr. Aravind Patel, Dr. Elena Rostova, Dr. James Wilson)
  const doctorData = [
    {
      email: "satwik@careflow.health",
      name: "Dr. Satwik, MD",
      phone: "+1 (555) 012-3401",
      avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
      specId: cardio.id,
      license: "MD-CA-98124",
      bio: "Board-certified Cardiologist specializing in cardiovascular health, preventative heart diagnostics, echocardiography, and hypertension management.",
      exp: 12,
      fee: 120.0,
    },
    {
      email: "vinith@careflow.health",
      name: "Dr. Vinith, MD",
      phone: "+1 (555) 012-3402",
      avatarUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300",
      specId: derm.id,
      license: "MD-NY-77219",
      bio: "Clinical Dermatologist focusing on autoimmune skin conditions, allergy management, acute dermatitis, and targeted skincare therapies.",
      exp: 9,
      fee: 95.0,
    },
    {
      email: "aravind@careflow.health",
      name: "Dr. Aravind, MD",
      phone: "+1 (555) 012-3403",
      avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
      specId: genMed.id,
      license: "MD-TX-44190",
      bio: "Compassionate primary care physician with extensive experience managing acute illnesses, metabolic wellness, and preventive family health.",
      exp: 15,
      fee: 75.0,
    },
    {
      email: "elena@careflow.health",
      name: "Dr. Elena, MD",
      phone: "+1 (555) 012-3404",
      avatarUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=300",
      specId: neuro.id,
      license: "MD-IL-55823",
      bio: "Neurology specialist in chronic migraine treatment, neuropathies, and cognitive wellness diagnostics.",
      exp: 11,
      fee: 140.0,
    },
  ];

  const createdDoctors = [];
  for (const doc of doctorData) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        name: doc.name,
        passwordHash: defaultPassword,
        role: "DOCTOR",
        phone: doc.phone,
        avatarUrl: doc.avatarUrl,
        doctorProfile: {
          create: {
            specializationId: doc.specId,
            licenseNumber: doc.license,
            bio: doc.bio,
            experienceYears: doc.exp,
            consultationFee: doc.fee,
            slotDurationMinutes: 30,
            isAvailable: true,
            rating: 4.9,
          },
        },
      },
      include: { doctorProfile: true },
    });

    createdDoctors.push(user);

    // Create standard working hours: Mon-Fri (1-5) 09:00 - 17:00 with lunch break 13:00 - 14:00
    if (user.doctorProfile) {
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
  }

  // 4. Patient Users & Profiles (Karthik, Praveen)
  const patientData = [
    {
      email: "karthik@patient.careflow.health",
      name: "Karthik",
      phone: "+1 (555) 044-8891",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
      dob: new Date("1994-06-15"),
      gender: "Male",
      blood: "O+",
      emergency: "Suresh (+1 555-044-8890)",
      history: "Mild seasonal allergies. Non-smoker.",
    },
    {
      email: "praveen@patient.careflow.health",
      name: "Praveen",
      phone: "+1 (555) 077-1234",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
      dob: new Date("1991-03-22"),
      gender: "Male",
      blood: "A+",
      emergency: "Ravi (+1 555-077-1235)",
      history: "Primary hypertension (diagnosed 2022), no known drug allergies.",
    },
  ];

  const createdPatients = [];
  for (const pat of patientData) {
    const user = await prisma.user.create({
      data: {
        email: pat.email,
        name: pat.name,
        passwordHash: defaultPassword,
        role: "PATIENT",
        phone: pat.phone,
        avatarUrl: pat.avatarUrl,
        patientProfile: {
          create: {
            dateOfBirth: pat.dob,
            gender: pat.gender,
            bloodGroup: pat.blood,
            emergencyContact: pat.emergency,
            medicalHistory: pat.history,
          },
        },
      },
      include: { patientProfile: true },
    });
    createdPatients.push(user);
  }

  // 5. Seed Past Completed Consultation for Praveen with Dr. Satwik (Cardiology)
  const doctorSatwik = createdDoctors[0].doctorProfile!;
  const doctorVinith = createdDoctors[1].doctorProfile!;
  const patientKarthik = createdPatients[0].patientProfile!;
  const patientPraveen = createdPatients[1].patientProfile!;

  const pastAptDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  pastAptDate.setUTCHours(10, 0, 0, 0);
  const pastAptEnd = new Date(pastAptDate.getTime() + 30 * 60000);

  const pastApt = await prisma.appointment.create({
    data: {
      appointmentNumber: "APT-2026-0001",
      patientId: patientPraveen.id,
      doctorId: doctorSatwik.id,
      startTime: pastAptDate,
      endTime: pastAptEnd,
      status: "COMPLETED",
      symptomAssessment: {
        create: {
          rawSymptoms: "Occasional heart palpitations in the evening and elevated resting blood pressure readings around 142/90 mmHg over the last 10 days.",
          duration: "10 days",
          painScale: 4,
          urgencyLevel: "MEDIUM",
          chiefComplaint: "Evening palpitations and stage-1 elevated blood pressure readings over 10 days.",
          suggestedQuestions: JSON.stringify([
            "Are the palpitations associated with caffeine intake, stress, or physical exertion?",
            "Have you noticed any shortness of breath, ankle swelling, or lightheadedness?",
            "How consistent have you been with your low-sodium dietary guidelines?",
          ]),
          llmModelUsed: "gpt-4o-mini",
        },
      },
      consultationRecord: {
        create: {
          doctorId: doctorSatwik.id,
          diagnosis: "Essential Hypertension (Stage 1) with mild anxiety-related palpitations",
          clinicalNotes: "Patient presents with borderline systolic elevation. Resting BP in clinic: 138/88 mmHg. Heart sounds S1/S2 normal without murmurs. ECG shows normal sinus rhythm. Advised lifestyle modifications, daily sodium restriction <2g, and initiated low-dose ACE inhibitor.",
          patientFriendlySummary: "Your clinical evaluation showed slightly elevated blood pressure and normal heart rhythms. We have started a gentle daily medication to protect your cardiovascular health. Continue keeping a home BP diary and aim for 30 minutes of light walking daily.",
          followUpSteps: "• Measure and record blood pressure every morning before coffee.\n• Reduce processed sodium foods.\n• Schedule a 4-week follow-up blood pressure check.",
          vitalSigns: JSON.stringify({ bp: "138/88", hr: 74, temp: "98.4°F", spo2: "99%" }),
        },
      },
    },
    include: { consultationRecord: true },
  });

  // Seed Prescription & Reminders for Praveen
  if (pastApt.consultationRecord) {
    const rx = await prisma.prescription.create({
      data: {
        appointmentId: pastApt.id,
        consultationRecordId: pastApt.consultationRecord.id,
        medicationName: "Lisinopril",
        dosage: "10mg",
        frequency: "ONCE_DAILY",
        timing: "Morning with water",
        durationDays: 30,
        instructions: "Take 1 tablet every morning at 8:00 AM with a full glass of water.",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Seed medication reminder
    await prisma.medicationReminder.create({
      data: {
        prescriptionId: rx.id,
        patientId: patientPraveen.id,
        scheduledTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        status: "PENDING",
      },
    });
  }

  // 6. Upcoming Confirmed Appointment for Karthik with Dr. Vinith (Dermatology)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setUTCHours(11, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime() + 30 * 60000);

  await prisma.appointment.create({
    data: {
      appointmentNumber: "APT-2026-0002",
      patientId: patientKarthik.id,
      doctorId: doctorVinith.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      status: "CONFIRMED",
      symptomAssessment: {
        create: {
          rawSymptoms: "Red itchy rash on both forearms that flared up after outdoor gardening 3 days ago. Mild burning sensation, no open blisters.",
          duration: "3 days",
          painScale: 3,
          urgencyLevel: "LOW",
          chiefComplaint: "Bilateral forearm erythematous pruritic rash post outdoor exposure.",
          suggestedQuestions: JSON.stringify([
            "Did you come into contact with specific plants like poison ivy or new fertilizers?",
            "Have over-the-counter antihistamines or hydrocortisone provided any relief?",
            "Are there any signs of bacterial superinfection, such as honey-colored crusting or fever?",
          ]),
          llmModelUsed: "gpt-4o-mini",
        },
      },
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("-----------------------------------------");
  console.log("Demo Accounts Available (Password: Online123):");
  console.log("👑 Admin:   admin@careflow.health   / Online123 (Patnaik)");
  console.log("🩺 Doctor:  satwik@careflow.health  / Online123 (Dr. Satwik, MD)");
  console.log("🩺 Doctor:  vinith@careflow.health  / Online123 (Dr. Vinith, MD)");
  console.log("👤 Patient: karthik@patient.careflow.health / Online123 (Karthik)");
  console.log("👤 Patient: praveen@patient.careflow.health / Online123 (Praveen)");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
