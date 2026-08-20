import { buildPreVisitPrompt, buildPostVisitPrompt, PRE_VISIT_SYSTEM_INSTRUCTION, POST_VISIT_SYSTEM_INSTRUCTION } from "./prompts";

export interface PreVisitAnalysisResult {
  urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  chiefComplaint: string;
  suggestedQuestions: string[];
  llmModelUsed: string;
  isFallback: boolean;
}

export interface PostVisitSummaryResult {
  patientFriendlySummary: string;
  medicationSchedule: string;
  followUpSteps: string;
  llmModelUsed: string;
  isFallback: boolean;
}

// -------------------------------------------------------------
// Intelligent Clinical Fallback Engine (Offline Resilience)
// -------------------------------------------------------------

function generateHeuristicPreVisit(symptoms: string, duration?: string, painScale?: number): PreVisitAnalysisResult {
  const lower = symptoms.toLowerCase();

  let urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  const highRiskKeywords = ["chest pain", "shortness of breath", "difficulty breathing", "severe bleeding", "loss of consciousness", "sudden weakness", "vision loss", "anaphylaxis"];
  const mediumRiskKeywords = ["fever", "migraine", "severe pain", "vomiting", "infection", "palpitations", "dizziness", "fracture", "rash"];

  if (highRiskKeywords.some((k) => lower.includes(k)) || (painScale && painScale >= 8)) {
    urgency = "HIGH";
  } else if (mediumRiskKeywords.some((k) => lower.includes(k)) || (painScale && painScale >= 5)) {
    urgency = "MEDIUM";
  }

  // Chief complaint synthesis
  let chiefComplaint = symptoms.trim();
  if (chiefComplaint.length > 150) {
    chiefComplaint = chiefComplaint.substring(0, 147) + "...";
  }
  if (duration) {
    chiefComplaint += ` (Reported duration: ${duration})`;
  }

  // Contextual suggested questions
  const suggestedQuestions: string[] = [];
  if (urgency === "HIGH") {
    suggestedQuestions.push("Have you experienced any radiation of pain to your jaw, neck, or left arm?");
    suggestedQuestions.push("Did these severe symptoms begin suddenly or build up gradually?");
    suggestedQuestions.push("Are you currently taking any prescription medications for cardiovascular or respiratory conditions?");
  } else if (lower.includes("fever") || lower.includes("cough") || lower.includes("throat")) {
    suggestedQuestions.push("Have you recorded your temperature, and has it responded to antipyretics?");
    suggestedQuestions.push("Have you been in close contact with anyone exhibiting viral or bacterial infections?");
    suggestedQuestions.push("Are you experiencing any chills, body aches, or shortness of breath?");
  } else if (lower.includes("skin") || lower.includes("rash") || lower.includes("itch")) {
    suggestedQuestions.push("Have you started using any new soaps, cosmetics, or topical creams recently?");
    suggestedQuestions.push("Has the rash spread or changed in color and texture since it first appeared?");
    suggestedQuestions.push("Do you have a personal or family history of eczema, psoriasis, or allergies?");
  } else {
    suggestedQuestions.push("What specific activities or postures make the symptoms better or worse?");
    suggestedQuestions.push("Have you tried any home remedies or over-the-counter medications so far?");
    suggestedQuestions.push("How is this condition currently impacting your daily routine and sleep quality?");
  }

  return {
    urgencyLevel: urgency,
    chiefComplaint,
    suggestedQuestions,
    llmModelUsed: "CareFlow Clinical Heuristic Engine v2.0 (Resilience Fallback)",
    isFallback: true,
  };
}

function generateHeuristicPostVisit(clinicalNotes: string, diagnosis?: string): PostVisitSummaryResult {
  const diagText = diagnosis ? `for ${diagnosis}` : "for your health assessment";
  
  return {
    patientFriendlySummary: `During your consultation ${diagText}, your physician reviewed your current symptoms and health status. The doctor confirmed that your condition is manageable with the recommended treatment plan. Please make sure to get adequate rest, stay hydrated, and take all medications exactly as prescribed to support a smooth recovery.`,
    medicationSchedule: `• Morning: Take prescribed oral medications with breakfast and a full glass of water.\n• Evening / Night: Take secondary doses if prescribed with dinner or before bedtime.\n• Complete the entire duration of any antibiotic or anti-inflammatory courses even if you start feeling better sooner.`,
    followUpSteps: `• Monitor your symptoms daily and note any improvements or unexpected reactions.\n• Drink plenty of water and avoid strenuous physical exertion for the next 48 to 72 hours.\n• Seek immediate emergency medical care if you experience sudden chest tightness, severe shortness of breath, or high fever unresponsive to medication.\n• Schedule a follow-up consultation in 7-10 days if symptoms persist or as directed by your doctor.`,
    llmModelUsed: "CareFlow Clinical Translation Engine v2.0 (Resilience Fallback)",
    isFallback: true,
  };
}

// -------------------------------------------------------------
// Main LLM Invocation Handlers
// -------------------------------------------------------------

export async function analyzeSymptoms(symptoms: string, duration?: string, painScale?: number): Promise<PreVisitAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateHeuristicPreVisit(symptoms, duration, painScale);
  }

  try {
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: PRE_VISIT_SYSTEM_INSTRUCTION },
            { role: "user", content: buildPreVisitPrompt(symptoms, duration, painScale) },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        console.warn("[LLM] OpenAI request failed, using clinical fallback");
        return generateHeuristicPreVisit(symptoms, duration, painScale);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);

      let urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
      const uStr = String(parsed.urgencyLevel || "").toUpperCase();
      if (uStr.includes("CRIT")) urgency = "CRITICAL";
      else if (uStr.includes("HIGH")) urgency = "HIGH";
      else if (uStr.includes("MED")) urgency = "MEDIUM";

      return {
        urgencyLevel: urgency,
        chiefComplaint: parsed.chiefComplaint || symptoms,
        suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions.slice(0, 3) : [],
        llmModelUsed: "OpenAI gpt-4o-mini",
        isFallback: false,
      };
    }
  } catch (err) {
    console.error("[LLM] Error calling LLM provider:", err);
  }

  return generateHeuristicPreVisit(symptoms, duration, painScale);
}

export async function summarizeClinicalNotes(clinicalNotes: string, diagnosis?: string): Promise<PostVisitSummaryResult> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateHeuristicPostVisit(clinicalNotes, diagnosis);
  }

  try {
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: POST_VISIT_SYSTEM_INSTRUCTION },
            { role: "user", content: buildPostVisitPrompt(clinicalNotes, diagnosis) },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.warn("[LLM] OpenAI post-visit summary failed, using clinical fallback");
        return generateHeuristicPostVisit(clinicalNotes, diagnosis);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);

      return {
        patientFriendlySummary: parsed.patientFriendlySummary || clinicalNotes,
        medicationSchedule: parsed.medicationSchedule || "Take medications as directed by your physician.",
        followUpSteps: parsed.followUpSteps || "Follow up in 7 days if symptoms persist.",
        llmModelUsed: "OpenAI gpt-4o-mini",
        isFallback: false,
      };
    }
  } catch (err) {
    console.error("[LLM] Error summarizing clinical notes:", err);
  }

  return generateHeuristicPostVisit(clinicalNotes, diagnosis);
}
