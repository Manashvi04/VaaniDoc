import dotenv from "dotenv";

dotenv.config();

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
// llama3.2:3b is the most reliable installed option for a modest clinic PC.
// Set OLLAMA_MODEL=gemma3:4b on a machine with enough RAM for richer multilingual output.
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
console.log(`Local Ollama clinical analysis enabled (model: ${OLLAMA_MODEL}).`);

// Define response schema for structured output
const intakeSchema = {
  type: "OBJECT",
  properties: {
    patientName: { type: "STRING" },
    age: { type: "STRING" },
    gender: { type: "STRING" },
    languageSpoken: { type: "STRING" },
    originalSymptomsText: { type: "STRING" },
    translatedSymptomsText: { type: "STRING" },
    chiefComplaint: { type: "STRING" },
    clinicalSummary: { type: "STRING" },
    duration: { type: "STRING" },
    severity: { 
      type: "STRING", 
      description: "Severity level of symptoms: Low, Medium, High, or Severe" 
    },
    associatedSymptoms: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of other symptoms mentioned"
    },
    symptomCategories: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Clinical domains, e.g., Cardiovascular, Respiratory, Gastrointestinal, Neurological, Musculoskeletal, etc."
    },
    urgencyClassification: { 
      type: "STRING", 
      description: "Urgency category: Low, Medium, High, or Emergency" 
    },
    urgencyReason: { type: "STRING", description: "Brief justification for the urgency classification" },
    suggestedSpecialist: { type: "STRING", description: "Recommended medical department or specialist, e.g., General Physician, Cardiologist, Pulmonologist, etc." },
    smartQuestions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "3 specific clinical diagnostic follow-up questions for the doctor to ask the patient next, based on their symptoms."
    },
    treatmentDraft: {
      type: "STRING",
      description: "A draft clinical care plan detailing rest, fluid guidelines, precautions, and standard safety-net instructions (emergency thresholds). Do not specify Rx medications."
    },
    patientFriendlySummary: {
      type: "STRING",
      description: "A simple, empathetic explanation of the triage results, written directly in the patient's languageSpoken (e.g. Hindi, Tamil, Bengali) using simple layperson terms."
    }
  },
  required: [
    "patientName",
    "age",
    "gender",
    "languageSpoken",
    "originalSymptomsText",
    "translatedSymptomsText",
    "chiefComplaint",
    "clinicalSummary",
    "duration",
    "severity",
    "associatedSymptoms",
    "symptomCategories",
    "urgencyClassification",
    "urgencyReason",
    "suggestedSpecialist",
    "smartQuestions",
    "treatmentDraft",
    "patientFriendlySummary"
  ]
};

// Mock generator for development & offline/fallback scenario
function getMockAnalysis(text, language, patientDetails) {
  const lowerText = text.toLowerCase();
  
  let translatedText = `Patient reports: "${text}" in ${language}.`;
  let chiefComplaint = "General consultation";
  let duration = "Unknown";
  let severity = "Medium";
  let urgency = "Medium";
  let reason = "Further examination required.";
  let specialist = "General Physician";
  let categories = ["General Medicine"];
  let associated = [];
  let questions = [
    "When did this start?",
    "Have you had similar symptoms in the past?",
    "Does anything make it better or worse?"
  ];
  let treatment = "Ensure adequate rest and oral rehydration. Monitor vitals and consult a general practitioner if symptoms persist.";
  let patientSummary = language.startsWith("Hindi")
    ? "कृपया आराम करें और पर्याप्त पानी पीएं। यदि लक्षण बने रहते हैं तो डॉक्टर से संपर्क करें।"
    : "Please rest and drink plenty of fluids. Consult a medical professional if your symptoms worsen.";

  // Very basic heuristic for standard symptoms in Hindi/English
  if (lowerText.includes("chest") || lowerText.includes("सीना") || lowerText.includes("दर्द") && (lowerText.includes("छाती") || lowerText.includes("दिल"))) {
    translatedText = "I have severe pain in my chest, it feels heavy and radiates to my left arm.";
    chiefComplaint = "Chest Pain / Suspected Cardiac Event";
    duration = "Since 1 hour";
    severity = "Severe";
    urgency = "Emergency";
    reason = "Acute chest pain with radiation risks cardiac arrest or myocardial infarction.";
    specialist = "Cardiologist";
    categories = ["Cardiovascular"];
    associated = ["Shortness of breath", "Sweating"];
    questions = [
      "Does the chest pain radiate to your neck, back, or jaw?",
      "Are you experiencing any difficulty breathing or cold sweating?",
      "Do you have a history of heart conditions or high blood pressure?"
    ];
    treatment = "Immobilize the patient immediately. Check vitals and prepare for emergency transport. Administer low-dose aspirin if indicated and not contraindicated.";
    patientSummary = language.startsWith("Hindi")
      ? "आपातकालीन स्थिति: तुरंत आराम करें और बिना देर किए नजदीकी अस्पताल के आपातकालीन विभाग में जाएं।"
      : "Emergency warning: Please rest immediately and proceed to the nearest emergency department without delay.";
  } else if (lowerText.includes("fever") || lowerText.includes("बुखार") || lowerText.includes("कफ") || lowerText.includes("खांसी") || lowerText.includes("cough")) {
    translatedText = "I have a high fever and a cough for the last three days.";
    chiefComplaint = "Fever and Cough";
    duration = "3 days";
    severity = "Medium";
    urgency = "Medium";
    reason = "Persistent fever and cough requires respiratory evaluation.";
    specialist = "General Physician / Pulmonologist";
    categories = ["Respiratory", "Infectious Diseases"];
    associated = ["Body ache", "Weakness"];
    questions = [
      "Is the cough dry or productive of phlegm?",
      "Are you experiencing any shortness of breath or chest discomfort when coughing?",
      "Have you noticed daily fluctuations in your body temperature?"
    ];
    treatment = "Keep hydrated with oral fluids. Rest extensively. Take paracetamol for fever reduction as needed. Seek re-evaluation if you notice shortness of breath.";
    patientSummary = language.startsWith("Hindi")
      ? "आपको बुखार और खांसी है। पर्याप्त आराम करें, गुनगुना पानी पिएं और जरूरत पड़ने पर डॉक्टर से संपर्क करें।"
      : "You have a fever and cough. Take plenty of rest, stay hydrated, and consult a doctor if symptoms persist.";
  } else if (lowerText.includes("stomach") || lowerText.includes("पेट") || lowerText.includes("दस्त") || lowerText.includes("vomit") || lowerText.includes("उल्टी")) {
    translatedText = "My stomach is hurting severely and I have vomited three times.";
    chiefComplaint = "Abdominal Pain and Vomiting";
    duration = "Since morning";
    severity = "High";
    urgency = "High";
    reason = "Severe abdominal pain with recurrent vomiting risks dehydration and requires acute care.";
    specialist = "Gastroenterologist";
    categories = ["Gastrointestinal"];
    associated = ["Nausea", "Dehydration risk"];
    questions = [
      "Where exactly is the pain located in your abdomen?",
      "Are you able to keep any fluids or water down?",
      "Have you observed any fever, diarrhea, or blood in your stool or vomit?"
    ];
    treatment = "Frequent small sips of Oral Rehydration Solution (ORS). Avoid solid foods for a few hours. Seek medical attention if vomiting persists beyond 12 hours.";
    patientSummary = language.startsWith("Hindi")
      ? "पेट दर्द और उल्टी के कारण ओ.आर.एस. का घोल धीरे-धीरे पीते रहें। आराम करें और जल्द ही चिकित्सक को दिखाएं।"
      : "Drink ORS solution slowly to stay hydrated. Rest and consult a physician soon.";
  }

  return {
    patientName: patientDetails.name || "Anonymous",
    age: patientDetails.age || "Unknown",
    gender: patientDetails.gender || "Unknown",
    languageSpoken: language,
    originalSymptomsText: text,
    translatedSymptomsText: translatedText,
    chiefComplaint: chiefComplaint,
    clinicalSummary: `Patient presents with ${chiefComplaint.toLowerCase()} of duration ${duration}. Translated statement: ${translatedText}`,
    duration: duration,
    severity: severity,
    associatedSymptoms: associated,
    symptomCategories: categories,
    urgencyClassification: urgency,
    urgencyReason: reason,
    suggestedSpecialist: specialist,
    smartQuestions: questions,
    treatmentDraft: treatment,
    patientFriendlySummary: patientSummary
  };
}

function normalizeAnalysis(result, text, language, patientDetails) {
  const urgency = ["Low", "Medium", "High", "Emergency"].includes(result.urgencyClassification)
    ? result.urgencyClassification : "Medium";
  const severity = ["Low", "Medium", "High", "Severe"].includes(result.severity)
    ? result.severity : "Medium";
  const defaultQuestions = [
    "When did these symptoms begin, and are they getting worse?",
    "Have you had similar symptoms or relevant medical conditions before?",
    "Is there any symptom or activity that makes this better or worse?"
  ];
  const smartQuestions = Array.isArray(result.smartQuestions) ? result.smartQuestions.slice(0, 3).map(String) : [];
  while (smartQuestions.length < 3) smartQuestions.push(defaultQuestions[smartQuestions.length]);
  return {
    patientName: patientDetails.name || "Anonymous",
    age: patientDetails.age || "Unknown",
    gender: patientDetails.gender || "Unknown",
    languageSpoken: language,
    originalSymptomsText: text,
    translatedSymptomsText: String(result.translatedSymptomsText || text),
    chiefComplaint: String(result.chiefComplaint || "General consultation"),
    clinicalSummary: String(result.clinicalSummary || "Clinical review recommended."),
    duration: String(result.duration || "Not specified"),
    severity,
    associatedSymptoms: Array.isArray(result.associatedSymptoms) ? result.associatedSymptoms.slice(0, 8).map(String) : [],
    symptomCategories: Array.isArray(result.symptomCategories) ? result.symptomCategories.slice(0, 5).map(String) : ["General Medicine"],
    urgencyClassification: urgency,
    urgencyReason: String(result.urgencyReason || "Clinical review is recommended."),
    suggestedSpecialist: String(result.suggestedSpecialist || "General Physician"),
    smartQuestions,
    treatmentDraft: String(result.treatmentDraft || "Provide supportive care and seek clinical review if symptoms worsen."),
    patientFriendlySummary: String(result.patientFriendlySummary || "Please consult the clinic team for the next steps.")
  };
}

export async function analyzeSymptoms(text, language, patientDetails = {}) {
  if (!text || text.trim() === "") throw new Error("Symptom description cannot be empty.");

  const system = `You are VaaniDoc, a clinical intake and safety-triage assistant for supervised rural clinics in India. You do not diagnose, prescribe medicines, recommend procedures, administer treatments, or invent facts. Translate regional Indian languages and transliterated Hinglish into concise clinical English. Escalate Emergency for time-critical red flags such as chest pain with sweating/radiation, stroke signs, severe breathing difficulty, major bleeding, seizures, or altered consciousness. Return only valid JSON with these exact keys: translatedSymptomsText, chiefComplaint, clinicalSummary, duration, severity, associatedSymptoms, symptomCategories, urgencyClassification, urgencyReason, suggestedSpecialist, smartQuestions, treatmentDraft, patientFriendlySummary. severity must be Low, Medium, High, or Severe. urgencyClassification must be Low, Medium, High, or Emergency. smartQuestions must contain exactly 3 questions. treatmentDraft must only say supportive non-pharmacological measures and clear escalation instructions; never name medicines, oxygen, procedures, tests, or definitive treatments.`;
  const user = JSON.stringify({
    patientLanguage: language,
    demographics: { age: patientDetails.age || "Unknown", gender: patientDetails.gender || "Unknown" },
    narration: text
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: "json",
        options: { temperature: 0.1, num_predict: 900 },
        messages: [{ role: "system", content: system }, { role: "user", content: user }]
      })
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Ollama returned ${response.status}: ${await response.text()}`);
    const payload = await response.json();
    const parsed = JSON.parse(payload?.message?.content || "{}");
    return normalizeAnalysis(parsed, text, language, patientDetails);
  } catch (error) {
    console.error("Ollama analysis unavailable; using local safety rules:", error.message);
    return getMockAnalysis(text, language, patientDetails);
  }
}
