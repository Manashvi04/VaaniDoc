export interface OfflineIntakeResult {
  patientName: string;
  age: string;
  gender: string;
  languageSpoken: string;
  originalSymptomsText: string;
  translatedSymptomsText: string;
  chiefComplaint: string;
  clinicalSummary: string;
  duration: string;
  severity: string;
  associatedSymptoms: string[];
  symptomCategories: string[];
  urgencyClassification: string;
  urgencyReason: string;
  suggestedSpecialist: string;
}

interface SymptomRule {
  keywords: string[];
  englishName: string;
  category: string;
  specialist: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  severity: 'Low' | 'Medium' | 'High' | 'Severe';
  reason: string;
}

const SYMPTOM_RULES: SymptomRule[] = [
  {
    keywords: [
      'chest pain', 'heart pain', 'सीना दर्द', 'छाती दर्द', 'दिल में दर्द',
      'நெஞ்சு வலி', 'நெஞ்சடைப்பு', 'ఛాతీ నొప్పి', 'గుండె నొప్పి',
      'বুকে ব্যথা', 'বুকে চাপ', 'छाती दुखणे', 'हृदय दुखणे', 'chest', 'heaviness'
    ],
    englishName: 'Chest Pain / Suspected Cardiac Event',
    category: 'Cardiovascular',
    specialist: 'Cardiologist',
    urgency: 'Emergency',
    severity: 'Severe',
    reason: 'Acute chest pain has a high risk of life-threatening cardiac event (e.g., myocardial infarction) and needs immediate emergency assessment.'
  },
  {
    keywords: [
      'stroke', 'paralysis', 'paralyse', 'लकवा', 'पक्षघात',
      'பக்கவாதம்', 'முகம் கோணல்', 'పక్షవాతం', 'వాతం',
      'পক্ষাঘাত', 'মুখ বেঁকে যাওয়া', 'लकवा मारणे', 'numbness', 'speech difficulty'
    ],
    englishName: 'Sudden Weakness / Suspected Stroke',
    category: 'Neurological',
    specialist: 'Neurologist',
    urgency: 'Emergency',
    severity: 'Severe',
    reason: 'Sudden onset facial asymmetry, difficulty speaking, or unilateral limb weakness indicates a high probability of acute stroke. Immediate emergency intervention is required.'
  },
  {
    keywords: [
      'difficulty breathing', 'breathless', 'asthma', 'सांस लेने में तकलीफ', 'सांस फूलना',
      'மூச்சு திணறல்', 'மூச்சு வாங்குதல்', 'శ్వాస తీసుకోవడంలో ఇబ్బంది', 'దమ్ము',
      'শ্বাসকষ্ট', 'হাঁপানি', 'दम लागणे', 'श्वास घेण्यास त्रास', 'suffocation'
    ],
    englishName: 'Dyspnea / Breathing Difficulty',
    category: 'Respiratory',
    specialist: 'Pulmonologist / General Physician',
    urgency: 'High',
    severity: 'High',
    reason: 'Active respiratory distress indicates potential hypoxemia or severe pulmonary/bronchial constriction and requires urgent evaluation.'
  },
  {
    keywords: [
      'stomach pain', 'belly pain', 'abdominal', 'पेट दर्द', 'पेट में दर्द',
      'வயிற்று வலி', 'வயிறு வலி', 'కడుపు నొప్పి',
      'পেটে ব্যথা', 'পেট ব্যথা', 'पोट दुखणे', 'stomach ache'
    ],
    englishName: 'Acute Abdominal Pain',
    category: 'Gastrointestinal',
    specialist: 'Gastroenterologist / General Surgeon',
    urgency: 'High',
    severity: 'High',
    reason: 'Severe abdominal pain may indicate acute appendicitis, bowel obstruction, or pancreatitis and requires urgent surgical or medical evaluation.'
  },
  {
    keywords: [
      'vomiting', 'vomit', 'उल्टी', 'வந்தி', 'வாந்தி', 'వాంతులు', 'వాంతి',
      'বমি', 'उलटी', 'vomited'
    ],
    englishName: 'Vomiting / Emesis',
    category: 'Gastrointestinal',
    specialist: 'Gastroenterologist',
    urgency: 'Medium',
    severity: 'Medium',
    reason: 'Repetitive vomiting risks fluid depletion, electrolyte imbalance, and metabolic alkalosis.'
  },
  {
    keywords: [
      'diarrhea', 'loose motion', 'दस्त', 'पतला दस्त', 'பேதி', 'வயிற்றுப்போக்கு',
      'విరేచనాలు', 'మోషన్స్', 'পাতলা পায়খানা', 'ডায়রিয়া', 'जुलाब', 'पातळ संडास'
    ],
    englishName: 'Diarrhea / Gastrointestinal Infection',
    category: 'Gastrointestinal',
    specialist: 'General Physician',
    urgency: 'Medium',
    severity: 'Medium',
    reason: 'Frequent loose stools present a risk of severe dehydration, particularly in pediatric and geriatric cases.'
  },
  {
    keywords: [
      'fever', 'temperature', 'body hot', 'बुखार', 'ताप', 'காய்ச்சل',
      'ஜுரம்', 'జ్వరం', 'ఒళ్ళు వేడి', 'জ্বর', 'तापमान', 'feverish'
    ],
    englishName: 'Fever / Pyrexia',
    category: 'Infectious Diseases',
    specialist: 'General Physician',
    urgency: 'Medium',
    severity: 'Medium',
    reason: 'Persistent fever indicates an active inflammatory or infectious response that needs diagnostic workup.'
  },
  {
    keywords: [
      'cough', 'cold', 'flu', 'खांसी', 'जुकाम', 'सर्दी', 'இருமல்', 'சளி',
      'దగ్గు', 'జలుబు', 'কাশি', 'সর্দি', 'खोकला', 'सर्दी-खोकला'
    ],
    englishName: 'Cough and Cold Symptoms',
    category: 'Respiratory',
    specialist: 'General Physician',
    urgency: 'Low',
    severity: 'Low',
    reason: 'Mild upper respiratory symptoms without breathlessness are typically self-limiting viral infections.'
  },
  {
    keywords: [
      'fracture', 'broken bone', 'fall', 'हड्डी टूटना', 'चोट लगना', 'अस्थिभंग',
      'எலும்பு முறிவு', 'கை கால் உடைவு', 'ఎముక విరగడం', 'దెబ్బ తగలడం',
      'হাড় ভাঙা', 'পড়ে যাওয়া', 'हाड मोडणे', 'पडलो', 'injury'
    ],
    englishName: 'Trauma / Suspected Bone Fracture',
    category: 'Musculoskeletal',
    specialist: 'Orthopedician',
    urgency: 'Medium',
    severity: 'High',
    reason: 'Suspected bone fracture or joint dislocation following physical trauma requires splinting, X-ray imaging, and pain management.'
  },
  {
    keywords: [
      'pregnant', 'pregnancy', 'baby in belly', 'गर्भावस्था', 'गर्भवती', 'प्रेगनेंसी',
      'கர்ப்பம்', 'கர்ப்பிணி', 'గర్భం', 'ప్రెగ్నెన్సీ',
      'গর্ভবতী', 'গর্ভাবস্থা', 'गरोदरपण', 'गरोदर'
    ],
    englishName: 'Pregnancy-Related Query',
    category: 'Obstetrics & Gynecology',
    specialist: 'Gynecologist',
    urgency: 'High',
    severity: 'Medium',
    reason: 'Maternal health symptoms require prompt specialist attention to rule out preeclampsia, gestational diabetes, or fetal distress.'
  },
  {
    keywords: [
      'headache', 'head pain', 'सिर दर्द', 'सर दर्द', 'தலைவலி',
      'తల నొప్పి', 'মাথা ব্যথা', 'डोकेदुखी', 'migraine'
    ],
    englishName: 'Headache / Cephalgia',
    category: 'Neurological',
    specialist: 'General Physician / Neurologist',
    urgency: 'Low',
    severity: 'Low',
    reason: 'Isolated tension headache or migraine without neurological deficits is low urgency, but requires pain control.'
  },
  {
    keywords: [
      'ear pain', 'ear discharge', 'hearing loss', 'कान में दर्द', 'कान बहना',
      'காதடைப்பு', 'காது வலி', 'செவி வலி', 'చెవి నొప్పి', 'చెవి పోటు',
      'কান ব্যথা', 'কান দিয়ে পুঁজ', 'कान दुखणे', 'कान वाहणे'
    ],
    englishName: 'Otalgia / Ear Pathogen',
    category: 'ENT',
    specialist: 'ENT Specialist',
    urgency: 'Low',
    severity: 'Medium',
    reason: 'Ear canal pain or mild middle ear discharge requires localized otic evaluation to prevent hearing complications.'
  },
  {
    keywords: [
      'rash', 'itching', 'skin red', 'खुजली', 'त्वचा लाल होना', 'दाद',
      'அரிப்பு', 'தடிப்பு', 'சொறி', 'దురద', 'దద్దుర్లు', 'దామరు',
      'চুলকানি', 'র‍্যাশ', 'खाज', 'खाज सुटणे', 'skin allergy'
    ],
    englishName: 'Dermatological Rash / Pruritus',
    category: 'Dermatological',
    specialist: 'Dermatologist',
    urgency: 'Low',
    severity: 'Low',
    reason: 'Localized skin rashes, hives, or pruritus without systemic anaphylactic features are non-emergent.'
  },
  {
    keywords: [
      'eye pain', 'red eye', 'blurry vision', 'आँख लाल', 'आँखों में जलन',
      'கண் சிவப்பு', 'கண் வலி', 'కంటి నొప్పి', 'కళ్ళు ఎర్రబడటం',
      'চোখ লাল', 'চোখে পিচুটি', 'डोळे येणे', 'डोळे लाल होणे'
    ],
    englishName: 'Ophthalmic Infection / Red Eye',
    category: 'Ophthalmological',
    specialist: 'Ophthalmologist',
    urgency: 'Low',
    severity: 'Low',
    reason: 'Eye redness, tearing, or burning warrants direct slit-lamp visualization to treat conjunctivitis or foreign body.'
  }
];

export function runOfflineSymptomAnalysis(
  text: string,
  language: string,
  patientName = 'Anonymous',
  age = 'Unknown',
  gender = 'Unknown'
): OfflineIntakeResult {
  const cleanText = text.toLowerCase();
  
  const matchedSymptoms: string[] = [];
  const categories: string[] = [];
  const specialists: string[] = [];
  
  let maxUrgency: 'Low' | 'Medium' | 'High' | 'Emergency' = 'Low';
  let maxSeverity: 'Low' | 'Medium' | 'High' | 'Severe' = 'Low';
  let urgencyReason = 'General review recommended. No emergency flags found in offline database.';

  // Urgency weights for comparison
  const urgencyWeight = { 'Low': 1, 'Medium': 2, 'High': 3, 'Emergency': 4 };
  const severityWeight = { 'Low': 1, 'Medium': 2, 'High': 3, 'Severe': 4 };

  SYMPTOM_RULES.forEach(rule => {
    const isMatched = rule.keywords.some(keyword => cleanText.includes(keyword));
    if (isMatched) {
      matchedSymptoms.push(rule.englishName);
      if (!categories.includes(rule.category)) categories.push(rule.category);
      if (!specialists.includes(rule.specialist)) specialists.push(rule.specialist);

      // Take highest urgency & severity
      if (urgencyWeight[rule.urgency] > urgencyWeight[maxUrgency]) {
        maxUrgency = rule.urgency;
        urgencyReason = rule.reason;
      }
      if (severityWeight[rule.severity] > severityWeight[maxSeverity]) {
        maxSeverity = rule.severity;
      }
    }
  });

  const durationMatch = cleanText.match(/(\d+)\s*(days?|weeks?|months?|hours?|दिन|हफ्ते|महीने|घंटे|நாட்கள்|வாரம்|రోజులు)/i);
  const extractedDuration = durationMatch ? durationMatch[0] : 'Not specified';

  // If no keywords matched, default to standard general medicine values
  const finalChiefComplaint = matchedSymptoms.length > 0 ? matchedSymptoms.join(', ') : 'General malaise / Unclassified symptoms';
  const finalCategory = categories.length > 0 ? categories : ['General Medicine'];
  const finalSpecialist = specialists.length > 0 ? specialists.join(' / ') : 'General Physician';

  const translatedSymptomsText = matchedSymptoms.length > 0 
    ? `Patient reported symptoms indicative of: ${matchedSymptoms.join(' and ')}. Narrative: "${text}"`
    : `Patient reported: "${text}"`;

  return {
    patientName,
    age,
    gender,
    languageSpoken: language,
    originalSymptomsText: text,
    translatedSymptomsText,
    chiefComplaint: finalChiefComplaint,
    clinicalSummary: `Offline clinical triage generated. Patient complains of ${finalChiefComplaint.toLowerCase()}. Duration: ${extractedDuration}. Note: Form generated locally on client device without network.`,
    duration: extractedDuration,
    severity: maxSeverity,
    associatedSymptoms: matchedSymptoms.slice(1),
    symptomCategories: finalCategory,
    urgencyClassification: maxUrgency,
    urgencyReason,
    suggestedSpecialist: finalSpecialist
  };
}
