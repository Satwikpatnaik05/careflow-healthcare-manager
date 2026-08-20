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

  const defaultPassword = await hashPass("Password123!");

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

  // 2. Admin User
  const admin = await prisma.user.create({
    data: {
      email: "admin@careflow.health",
      name: "Dr. Eleanor Vance",
      passwordHash: defaultPassword,
      role: "ADMIN",
      phone: "+1 (555) 019-2834",
      avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    },
  });

  // 3. Doctor Users & Profiles
  const doctorData = [
    {
      email: "dr.marcus@careflow.health",
      name: "Dr. Marcus Chen, MD",
      phone: "+1 (555) 012-3401",
      avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
      specId: cardio.id,
      license: "MD-CA-98124",
      bio: "Board-certified Cardiologist with 12+ years of experience in preventive cardiology, echocardiography, and hypertension management. Harvard Medical School alumnus.",
      exp: 12,
      fee: 120.0,
    },
    {
      email: "dr.sarah@careflow.health",
      name: "Dr. Sarah Jenkins, MD",
      phone: "+1 (555) 012-3402",
      avatarUrl: "https://images.unsplash.com/photo-1594824813589-32219747970d?auto=format&fit=crop&q=80&w=300",
      specId: derm.id,
      license: "MD-NY-77219",
      bio: "Dermatologist focusing on clinical dermatology, autoimmune skin conditions, allergy management, and acne therapies. Johns Hopkins trained.",
      exp: 9,
      fee: 95.0,
    },
    {
      email: "dr.aravind@careflow.health",
      name: "Dr. Aravind Patel, MD",
      phone: "+1 (555) 012-3403",
      avatarUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300",
      specId: genMed.id,
      license: "MD-TX-44190",
      bio: "Compassionate primary care physician with 15+ years managing acute illnesses, metabolic health, diabetes, and preventive wellness checks.",
      exp: 15,
      fee: 75.0,
    },
    {
      email: "dr.elena@careflow.health",
      name: "Dr. Elena Rostova, MD",
      phone: "+1 (555) 012-3404",
      avatarUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=300",
      specId: neuro.id,
      license: "MD-IL-55823",
      bio: "Neurologist specializing in chronic migraine treatment, neuropathies, and cognitive wellness. Stanford Medical graduate.",
      exp: 11,
      fee: 140.0,
    },
    {
      email: "dr.james@careflow.health",
      name: "Dr. James Wilson, MD",
      phone: "+1 (555) 012-3405",
      avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
      specId: peds.id,
      license: "MD-WA-66312",
      bio: "Pediatric specialist focused on newborn development, childhood asthma, nutritional guidance, and preventive pediatric immunizations.",
      exp: 8,
      fee: 85.0,
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

  // 4. Patient Users & Profiles
  const patientData = [
    {
      email: "alice@patient.careflow.health",
      name: "Alice Johnson",
      phone: "+1 (555) 044-8891",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
      dob: new Date("1992-04-12"),
      gender: "Female",
      blood: "O+",
      emergency: "Mark Johnson (+1 555-044-8890)",
      history: "Mild seasonal asthma, allergic to Penicillin. Non-smoker.",
    },
    {
      email: "robert@patient.careflow.health",
      name: "Robert Davis",
      phone: "+1 (555) 077-1234",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
      dob: new Date("1980-11-23"),
      gender: "Male",
      blood: "A+",
      emergency: "Linda Davis (+1 555-077-1235)",
      history: "Primary hypertension (diagnosed 2021), no known drug allergies.",
    },
    {
      email: "clara@patient.careflow.health",
      name: "Clara Morales",
      phone: "+1 (555) 088-9900",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
      dob: new Date("1998-07-09"),
      gender: "Female",
      blood: "B+",
      emergency: "Sofia Morales (+1 555-088-9901)",
      history: "Frequent tension headaches, otherwise healthy.",
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

  // 5. Seed Past Completed Appointments with Consultation Records & Prescriptions
  const doctorMarcus = createdDoctors[0].doctorProfile!;
  const doctorSarah = createdDoctors[1].doctorProfile!;
  const patientAlice = createdPatients[0].patientProfile!;
  const patientRobert = createdPatients[1].patientProfile!;

  // Past Consultation for Robert with Dr. Marcus (Cardiology)
  const pastAptDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  pastAptDate.setUTCHours(10, 0, 0, 0);
  const pastAptEnd = new Date(pastAptDate.getTime() + 30 * 60000);

  const pastApt = await prisma.appointment.create({
    data: {
      appointmentNumber: "APT-2026-0001",
      patientId: patientRobert.id,
      doctorId: doctorMarcus.id,
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
          doctorId: doctorMarcus.id,
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

  // Seed Prescription & Reminders for Robert
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
        patientId: patientRobert.id,
        scheduledTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        status: "PENDING",
      },
    });
  }

  // 6. Upcoming Confirmed Appointment for Alice with Dr. Sarah (Dermatology)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setUTCHours(11, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime() + 30 * 60000);

  await prisma.appointment.create({
    data: {
      appointmentNumber: "APT-2026-0002",
      patientId: patientAlice.id,
      doctorId: doctorSarah.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      status: "CONFIRMED",
      symptomAssessment: {
        create: {
          rawSymptoms: "Red itchy rash on both forearms that flared up after gardening 3 days ago. Mild burning sensation, no open blisters.",
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
  console.log("Demo Accounts Available:");
  console.log("👑 Admin:   admin@careflow.health   / Password123!");
  console.log("🩺 Doctor:  dr.marcus@careflow.health / Password123!");
  console.log("🩺 Doctor:  dr.sarah@careflow.health  / Password123!");
  console.log("🩺 Doctor:  dr.aravind@careflow.health / Password123!");
  console.log("👤 Patient: alice@patient.careflow.health / Password123!");
  console.log("👤 Patient: robert@patient.careflow.health / Password123!");
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
