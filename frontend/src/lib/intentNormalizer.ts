export type NormalizedIntent = {
  trigger: 'course_menu' | 'department_overview' | 'hod_info' | 'admissions' | 'placements' | 'fees' | 'college_overview' | 'trustees' | 'documents' | null;
  departmentLabel?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — LANGUAGE DETECTION (Unicode range testing)
// ─────────────────────────────────────────────────────────────────────────────

type DetectedLanguage = 'English' | 'Kannada' | 'Hindi' | 'Tamil' | 'Telugu' | 'Malayalam';

/**
 * Detects the primary language of the input using Unicode script ranges.
 * Returns the language with the highest script-character density.
 */
function detectLanguage(input: string): DetectedLanguage {
  const ranges: { lang: DetectedLanguage; regex: RegExp }[] = [
    { lang: 'Kannada',   regex: /[\u0C80-\u0CFF]/g },
    { lang: 'Hindi',     regex: /[\u0900-\u097F]/g },
    { lang: 'Tamil',     regex: /[\u0B80-\u0BFF]/g },
    { lang: 'Telugu',    regex: /[\u0C00-\u0C7F]/g },
    { lang: 'Malayalam', regex: /[\u0D00-\u0D7F]/g },
  ];

  let best: DetectedLanguage = 'English';
  let bestCount = 0;

  for (const { lang, regex } of ranges) {
    const matches = input.match(regex);
    const count = matches ? matches.length : 0;
    if (count > bestCount) {
      bestCount = count;
      best = lang;
    }
  }

  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 & 5 — COMPREHENSIVE MULTILINGUAL KEYWORD MAP
// Phrase → English canonical. Sorted by descending length at runtime so
// multi-word phrases like "ಡೇಟಾ ಸೈನ್ಸ್" match before the single-word "ಡೇಟಾ".
// ─────────────────────────────────────────────────────────────────────────────

const MULTILINGUAL_PHRASE_MAP: Record<string, string> = {
  // ── Kannada ──────────────────────────────────────────────────────────────
  // Department names (phrases first)
  'ಡೇಟಾ ಸೈನ್ಸ್': 'data science',
  'ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್': 'computer science',
  'ಮಾಹಿತಿ ವಿಜ್ಞಾನ': 'information science',
  'ಸೈಬರ್ ಭದ್ರತೆ': 'cyber security',
  'ಸೈಬರ್ ಸೆಕ್ಯುರಿಟಿ': 'cyber security',
  'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ': 'artificial intelligence',
  'ಎಐ ಎಂಎಲ್': 'ai ml',
  'ಎಐಎಂಎಲ್': 'aiml',
  'ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್': 'electronics',
  'ಮೆಕ್ಯಾನಿಕಲ್': 'mechanical',
  'ಸಿವಿಲ್': 'civil',
  'ಎಂಬಿಎ': 'mba',
  'ಡೇಟಾ': 'data',
  'ಸಿಎಸ್ಇ': 'cse',
  'ಐಎಸ್ಇ': 'ise',
  'ಇಸಿಇ': 'ece',
  'ಸೈಬರ್': 'cyber',
  'ಯಾಂತ್ರಿಕ': 'mechanical',
  // Intent keywords
  'ವಿಭಾಗದ ಮುಖ್ಯಸ್ಥ': 'head of department',
  'ಕಾಲೇಜು ಕೋರ್ಸುಗಳು': 'college courses',
  'ಯಾವ ಕೋರ್ಸ್': 'which course',
  'ಪ್ಲೇಸ್‌ಮೆಂಟ್': 'placement',
  'ಅಡ್ಮಿಷನ್': 'admission',
  'ಶುಲ್ಕಗಳು': 'fees',
  'ಕೋರ್ಸ್': 'course',
  'ಪಠ್ಯಕ್ರಮ': 'courses',
  'ವಿಭಾಗ': 'department',
  'ಬಗ್ಗೆ': 'about',
  'ಯಾರು': 'who',
  'ಮಾಹಿತಿ': 'information',
  'ಪ್ರವೇಶ': 'admission',
  'ಶುಲ್ಕ': 'fee',
  'ಉದ್ಯೋಗ': 'placement',
  'ಮುಖ್ಯಸ್ಥ': 'head',
  'ಹೆಚ್ಒಡಿ': 'hod',
  'ಕೆಲಸ': 'job',
  'ಕಂಪನಿಗಳು': 'companies',
  'ಫೀಸ್ ಸ್ಟ್ರಕ್ಚರ್': 'fee structure',
  'ಫೀಸ್': 'fees',
  'ಹೇಳಿ': 'tell me',
  'ಹೇಳು': 'tell',
  'ಎಷ್ಟು': 'how much',
  'ವ್ಯಾಪಾರ': 'business',
  'ಸೇರುವುದು ಹೇಗೆ': 'how to join',
  'ಪ್ರಿನ್ಸಿಪಾಲ್': 'principal',
  'ಪ್ರಾಂಶುಪಾಲ': 'principal',
  'ಟ್ರಸ್ಟಿ': 'trustee',
  'ಟ್ರಸ್ಟಿಗಳು': 'trustees',
  'ಕಾಲೇಜು': 'college',
  'ಸಂಸ್ಥೆ': 'institute',
  'ಕ್ಯಾಂಪಸ್': 'campus',
  'ಕಟ್‌ಆಫ್': 'cutoff',
  'ಕೆಸಿಇಟಿ': 'kcet',
  'ಎಸ್‌ವಿಐಟಿ': 'svit',
  'ಏನು': 'what',
  'ಹೇಗೆ': 'how',

  // ── Hindi ────────────────────────────────────────────────────────────────
  // Department names (phrases first)
  'डेटा साइंस': 'data science',
  'डाटा साइंस': 'data science',
  'डेटा विज्ञान': 'data science',
  'कंप्यूटर साइंस': 'computer science',
  'कम्प्यूटर साइंस': 'computer science',
  'कम्प्यूटर विज्ञान': 'computer science',
  'कंप्यूटर विज्ञान': 'computer science',
  'कंप्यूटर सायंस': 'computer science',
  'कम्प्यूटर सायंस': 'computer science',
  'कंप्यूटर इंजीनियरिंग': 'computer science',
  'इन्फॉर्मेशन साइंस': 'information science',
  'इन्फोर्मेशन साइंस': 'information science',
  'साइबर सिक्योरिटी': 'cyber security',
  'साइबर सुरक्षा': 'cyber security',
  'आर्टिफिशियल इंटेलिजेंस': 'artificial intelligence',
  'कृत्रिम बुद्धिमत्ता': 'artificial intelligence',
  'एआई एमएल': 'ai ml',
  'एआई और एमएल': 'ai ml',
  'मैकेनिकल इंजीनियरिंग': 'mechanical engineering',
  'मैकेनिकल इंजिनियरिंग': 'mechanical engineering',
  'सिविल इंजीनियरिंग': 'civil engineering',
  'इलेक्ट्रॉनिक्स': 'electronics',
  'मैकेनिकल': 'mechanical',
  'सिविल': 'civil',
  'एआईएमएल': 'aiml',
  'एआई': 'ai',
  'एमबीए': 'mba',
  'सीएसई': 'cse',
  'आईएसई': 'ise',
  'ई सी ई': 'ece',
  'ईसीई': 'ece',
  'डेटा': 'data',
  'डाटा': 'data',
  'साइबर': 'cyber',
  'आर्टिफिशियल': 'artificial',
  // Department variations
  'कंप्यूटरसाइंस': 'computer science',
  'कम्प्यूटरसाइंस': 'computer science',
  'डेटासाइंस': 'data science',
  'डाटासाइंस': 'data science',
  'साइबरसिक्योरिटी': 'cyber security',
  'साइबरसुरक्षा': 'cyber security',
  'मैकेनिकलइंजीनियरिंग': 'mechanical engineering',
  'सिविलइंजीनियरिंग': 'civil engineering',
  'इलेक्ट्रॉनिक्सइंजीनियरिंग': 'electronics engineering',
  // Intent keywords
  'विभागाध्यक्ष': 'head of department',
  'फीस स्ट्रक्चर': 'fee structure',
  'बारे में': 'about',
  'विभाग': 'department',
  'कोर्स': 'course',
  'पाठ्यक्रम': 'courses',
  'कोर्सेस': 'courses',
  'विषय': 'subject',
  'शिक्षा': 'education',
  'डिग्री': 'degree',
  'कौन है': 'who is',
  'कौन हैं': 'who is',
  'कौन': 'who',
  'जानकारी': 'information',
  'प्रवेश': 'admission',
  'फीस': 'fees',
  'शुल्क': 'fee',
  'नौकरी': 'job',
  'प्लेसमेंट': 'placement',
  'एचओडी': 'hod',
  'प्रमुख': 'head',
  'अध्यक्ष': 'head',
  'हेड': 'head',
  'वेतन': 'salary',
  'बताओ': 'tell me',
  'बताये': 'tell me',
  'बताइए': 'tell me',
  'बोलो': 'tell',
  'कितना': 'how much',
  'दाखिला': 'admission',
  'नामांकन': 'enrollment',
  'मैकेनिकल विभाग': 'mechanical department',
  'सिविल विभाग': 'civil department',
  'कोर्स पूरा होने के बाद': 'after course completion',
  'प्रिंसिपल': 'principal',
  'प्राचार्य': 'principal',
  'ट्रस्टी': 'trustee',
  'ट्रस्टियों': 'trustees',
  'संस्थापक': 'founder',
  'अध्यापक': 'faculty',
  'कॉलेज': 'college',
  'संस्थान': 'institute',
  'कैंपस': 'campus',
  'कटऑफ': 'cutoff',
  'केसीईಟಿ': 'kcet',
  'कितनी': 'how much',
  'क्या': 'what',
  // Specific fixes
  'डिएस': 'data science',
  'डीएस': 'data science',
  'डिजिटल साइंस': 'data science',
  'डिजिटल': 'digital',
  'आईटी': 'information science',
  'आई एस ई': 'ise',
  'मैಕ್': 'mechanical',
  'ಮೆಕ್': 'mechanical',
  'ಎಬಿಎ': 'mba',
  'ಐಎಎಸ್ಇ': 'ise',
  'ಯಂತ್ರ ವಿಜ್ಞಾನ': 'mechanical',

  // ── Tamil ────────────────────────────────────────────────────────────────
  'டேட்டா சயின்ஸ்': 'data science',
  'கணினி அறிவியல்': 'computer science',
  'தகவல் அறிவியல்': 'information science',
  'சைபர் செக்யூரிட்டி': 'cyber security',
  'சைபர் பாதுகாப்பு': 'cyber security',
  'மெக்கானிக்கல் இன்ஜினியரிங்': 'mechanical engineering',
  'மெக்கானிக்கல்': 'mechanical',
  'சிவில் இன்ஜினியரிங்': 'civil engineering',
  'சிவில்': 'civil',
  'எலெக்ட்ரானிக்ஸ்': 'electronics',
  'இயந்திரவியல்': 'mechanical',
  'எம்.பி.ஏ': 'mba',
  'ஐஎஸ்இ': 'ise',
  'ஈசிஇ': 'ece',
  'ஹெಚ್ஓடி': 'hod',
  'துறைத் தலைவர்': 'head of department',
  'தலைவர்': 'head',
  'தலைமை': 'head',
  'பாடநெறி': 'course',
  'படிப்புகள்': 'courses',
  'கல்வி': 'education',
  'துறை': 'department',
  'பற்றி': 'about',
  'யார்': 'who',
  'தகவல்': 'information',
  'சேர்க்கை': 'admission',
  'கட்டணங்கள்': 'fees',
  'கட்டணம்': 'fee',
  'வேலைவாய்ப்பு': 'placement',
  'பணி': 'job',
  'வணிகம்': 'business',
  'சொல்லுங்க': 'tell me',
  'சொல்லு': 'tell',
  'எவ்வளவு': 'how much',
  'முதல்வர்': 'principal',
  'அறங்காவலர்': 'trustee',
  'கல்லூரி': 'college',
  'வளாகம்': 'campus',

  // ── Telugu ───────────────────────────────────────────────────────────────
  'డేటా సైన్స్': 'data science',
  'కంప్యూటర్ సైన్స్': 'computer science',
  'ఇన్ఫర్మేషన్ సైన్స్': 'information science',
  'సైబర్ సెక్యూరిటీ': 'cyber security',
  'సైబర్ భద్రత': 'cyber security',
  'మెకానికల్ ఇంజనీరింగ్': 'mechanical engineering',
  'మెకానికల్': 'mechanical',
  'సివిల్ ఇంజనీరింగ్': 'civil engineering',
  'సివిల్': 'civil',
  'ఎలక్ట్రానిక్స్': 'electronics',
  'యంత్రశాస్త్రం': 'mechanical',
  'ఎంబీఏ': 'mba',
  'ఐఎస్ఈ': 'ise',
  'ఇసిఇ': 'ece',
  'హెచ్ఓడి': 'hod',
  'విభాగం': 'department',
  'గురించి': 'about',
  'ఎవరు': 'who',
  'ప్రవేశం': 'admission',
  'ఫీజులు': 'fees',
  'ఫీజు': 'fee',
  'ప్లేస్‌మెంట్': 'placement',
  'ఉద్యోగ': 'placement',
  'వ్యాపారం': 'business',
  'సైబర్': 'cyber',
  'చెప్పండి': 'tell me',
  'చెప్పు': 'tell',
  'ఎంత': 'how much',
  'వివరాలు': 'details',
  'అధ్యాపకులు': 'faculty',
  'ముఖ్యాధికారి': 'head',
  'ప్రధానాచార్యులు': 'principal',
  'ప్రిన్సిపాల్': 'principal',
  'కోర్సు': 'course',
  'కోర్సులు': 'courses',
  'చదువు': 'education',
  'కళాశాల': 'college',
  'క్యాంపస్': 'campus',

  // ── Malayalam ────────────────────────────────────────────────────────────
  'ഡാറ്റ സയൻസ്': 'data science',
  'ഡാറ്റാ സയൻസ്': 'data science',
  'കമ്പ്യൂട്ടർ സയൻസ്': 'computer science',
  'ഇൻഫർമേഷൻ സയൻസ്': 'information science',
  'സൈബർ സെക്യൂരിറ്റി': 'cyber security',
  'മെക്കാനിക്കൽ എഞ്ചിനീയറിംഗ്': 'mechanical engineering',
  'മെക്കാനിക്കൽ': 'mechanical',
  'സിവിൽ എഞ്ചിനീയറിംഗ്': 'civil engineering',
  'സിവിൽ': 'civil',
  'ഇലക്ട്രോണിക്സ്': 'electronics',
  'യന്ത്രവിദ്യ': 'mechanical',
  'എംബിഎ': 'mba',
  'എബീഎ': 'mba',
  'ഐഎസ്ഈ': 'ise',
  'ഇസിഈ': 'ece',
  'എച്ച്ഒഡി': 'hod',
  'വിഭാഗം മേധാവി': 'head of department',
  'തലവൻ': 'head',
  'വിഭാഗം': 'department',
  'കുറിച്ച്': 'about',
  'ആരാണ്': 'who',
  'വിവരങ്ങൾ': 'information',
  'പ്രവേശനം': 'admission',
  'ഫീസ്': 'fees',
  'ജോലി': 'job',
  'പ്ലേസ്‌മെന്റ്': 'placement',
  'ബിസിനസ്': 'business',
  'സൈബർ': 'cyber',
  'കോഴ്സുകൾ': 'courses',
  'കോഴ്സ്': 'course',
  'പഠനം': 'course',
  'പറയൂ': 'tell me',
  'പറയുക': 'tell',
  'എത്ര': 'how much',
  'സുരക്ഷ': 'security',
  'പ്രിൻസിപ്പൽ': 'principal',
  'ട്രസ്റ്റി': 'trustee',
  'കോളേജ്': 'college',
  'ക്യാമ്പസ്': 'campus',
};

// Pre-sorted keys: longest first so multi-word phrases are replaced before single words.
const _SORTED_PHRASE_KEYS: string[] = Object.keys(MULTILINGUAL_PHRASE_MAP).sort(
  (a, b) => b.length - a.length
);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — NORMALIZATION PIPELINE
// Converts ALL input into a standard English intent string.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes multilingual input by replacing localized phrases/words with
 * their English equivalents. Longer phrases are replaced first to avoid
 * partial matches (e.g., "ಡೇಟಾ ಸೈನ್ಸ್" before "ಡೇಟಾ").
 */
function normalizeToEnglish(input: string): string {
  let normalized = input.toLowerCase();
  for (const key of _SORTED_PHRASE_KEYS) {
    if (normalized.includes(key)) {
      normalized = normalized.split(key).join(MULTILINGUAL_PHRASE_MAP[key]);
    }
  }
  // Collapse extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}


// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — INTENT MATCHING (runs on normalized English text ONLY)
// ─────────────────────────────────────────────────────────────────────────────

// Intent keyword lists — ENGLISH ONLY (multilingual tokens already normalized above)
const INTENT_MAP = {
  documents: [
    'document', 'documents', 'documents required', 'admission documents',
    'document bagge', 'documents beku', 'dakhalegalu',
    'document kya chahiye', 'documents kaunse', 'admission ke documents',
    'documents enna venum', 'documents enti', 'documents entha', 'documents kurich'
  ],
  course_menu: [
    'courses', 'programs', 'degrees', 'what do you offer', 'academic options',
    'college courses', 'which course', 'course', 'which departments', 'department list'
  ],
  fees: [
    'fee', 'fees', 'tuition', 'management quota', 'how much', 'cost', 'price',
    'fee structure',
  ],
  hod: [
    'hod', 'head of department', 'department head', 'who is leading',
  ],
  admissions: [
    'admission', 'how to join', 'joining', 'enrollment', 'eligibility',
    'entrance', 'kcet', 'comedk', 'counseling', 'quota', 'scholarship',
  ],
  placements: [
    'placement', 'job', 'salary', 'recruitment', 'training', 'companies',
    'after course completion', 'internship', 'package',
  ],
  principal: [
    'principal', 'who is principal', 'principal name',
  ],
  trustees: [
    'trustee', 'trustees', 'founder', 'founders', 'chairman', 'president',
    'board of trustees', 'management board',
  ],
  college_overview: [
    'college overview', 'about college', 'about svit', 'college information',
    'about the college', 'tell me about the college', 'about this college',
    'institute overview', 'college details', 'about the institute',
    'about your college', 'college profile', 'college summary',
    'overview of the college', 'overview of college',
  ],
  cutoff: [
    'cutoff', 'cut off', 'kcet cutoff', 'comedk cutoff', 'rank',
    'closing rank', 'opening rank',
  ],
};

// Department entity map — ENGLISH ONLY
const DEPT_MAP: Record<string, string[]> = {
  'Data Science': [
    'data science', 'datascience', 'cse data science',
  ],
  'CSE': [
    'computer science', 'cse',
  ],
  'ECE': [
    'electronics', 'ece', 'communication',
  ],
  'ISE': [
    'information science', 'ise',
  ],
  'Mechanical': [
    'mechanical', 'mechanical engineering', 'mech',
  ],
  'Civil': [
    'civil', 'civil engineering',
  ],
  'AIML': [
    'aiml', 'artificial intelligence', 'ai and ml', 'ai ml', 'ai',
  ],
  'Cyber Security': [
    'cyber security', 'cyber', 'cybersecurity',
  ],
  'MBA': [
    'mba', 'business', 'management', 'masters in business',
  ],
};

/**
 * Priority override rules.
 * If a SPECIFIC department is matched, these GENERIC departments are removed.
 * This prevents "aiml" from also triggering "cse" via substring overlap.
 */
const PRIORITY_OVERRIDES: Record<string, string[]> = {
  'AIML': ['CSE'],
  'Data Science': ['CSE'],
  'Cyber Security': ['CSE'],
  'ISE': ['CSE'],
};

export type InternalIntent =
  | 'COURSE_LIST'
  | 'DEPARTMENT_INFO'
  | 'DEPARTMENT_COMPARE'
  | 'HOD_INFO'
  | 'ADMISSIONS_GOTO'
  | 'PLACEMENTS_GOTO'
  | 'PRINCIPAL_INFO'
  | 'TRUSTEES_INFO'
  | 'COLLEGE_OVERVIEW'
  | 'FEES_QUERY'
  | 'CUTOFF_QUERY'
  | 'DOCUMENTS_QUERY'
  | 'UNKNOWN';

/**
 * Detects abstract user intents (deterministic UI triggers).
 * Runs on NORMALIZED ENGLISH text only.
 */
function detectIntent(normalized: string, entityCount: number): InternalIntent {
  // ── Check all intent categories ──────────────────────────────────────────
  const check = (phrases: string[]) => phrases.some(p => normalized.includes(p));

  const isDocumentsTriggered = check(INTENT_MAP.documents);
  const isFeesTriggered = check(INTENT_MAP.fees);
  const isCourseListTriggered = check(INTENT_MAP.course_menu);
  const isHodTriggered = check(INTENT_MAP.hod);
  const isAdmissionsTriggered = check(INTENT_MAP.admissions);
  const isPlacementsTriggered = check(INTENT_MAP.placements);
  const isPrincipalTriggered = check(INTENT_MAP.principal);
  const isTrusteesTriggered = check(INTENT_MAP.trustees);
  const isCollegeOverviewTriggered = check(INTENT_MAP.college_overview);
  const isCutoffTriggered = check(INTENT_MAP.cutoff);

  // ── Priority-based routing (highest → lowest) ───────────────────────────

  // Comparison detected -> TEXT-ONLY, no card
  if (entityCount > 1 || normalized.includes('compare') || normalized.includes('difference') || normalized.includes(' vs ')) {
    return 'DEPARTMENT_COMPARE';
  }

  // Documents
  if (isDocumentsTriggered) return 'DOCUMENTS_QUERY';

  // Principal has highest priority (specific person query)
  if (isPrincipalTriggered) return 'PRINCIPAL_INFO';

  // Trustees query
  if (isTrusteesTriggered) return 'TRUSTEES_INFO';

  // Cutoff: route to admissions flow (text-based answer)
  if (isCutoffTriggered) return 'CUTOFF_QUERY';

  // HOD + specific department
  if (isHodTriggered && entityCount === 1) return 'HOD_INFO';

  // Fees + department entity
  if (isFeesTriggered && entityCount >= 1) return 'FEES_QUERY';

  // Fees without department (general fee query)
  if (isFeesTriggered && entityCount === 0) return 'FEES_QUERY';

  // Admissions
  if (isAdmissionsTriggered) return 'ADMISSIONS_GOTO';

  // Placements
  if (isPlacementsTriggered) return 'PLACEMENTS_GOTO';

  // Department entity present (department overview)
  if (entityCount === 1) return 'DEPARTMENT_INFO';

  // College overview
  if (isCollegeOverviewTriggered) return 'COLLEGE_OVERVIEW';

  // Course menu
  if (isCourseListTriggered) return 'COURSE_LIST';

  return 'UNKNOWN';
}

/**
 * Detects specific department entities from normalized English text.
 * Applies priority overrides so specialized departments beat generic ones.
 */
function detectEntities(normalized: string): string[] {
  const matched: string[] = [];
  for (const [deptLabel, keywords] of Object.entries(DEPT_MAP)) {
    for (const phrase of keywords) {
      if (normalized.includes(phrase)) {
        matched.push(deptLabel);
        break;
      }
    }
  }

  // Apply priority overrides.
  const toRemove = new Set<string>();
  for (const [specific, generics] of Object.entries(PRIORITY_OVERRIDES)) {
    if (matched.includes(specific)) {
      for (const generic of generics) {
        toRemove.add(generic);
      }
    }
  }

  return matched.filter(d => !toRemove.has(d));
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — normalizeIntent()
// Enforces the strict pipeline: Detect → Normalize → Match → Log → Return
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sweeps a raw string transcript against the multilingual dictionary
 * using Intent + Entity architecture.
 *
 * Pipeline: Language Detection → Normalization to English → Intent Match → Debug Log
 */
export function normalizeIntent(input: string): NormalizedIntent {
  // ── STEP 1: Language Detection ─────────────────────────────────────────
  const detectedLanguage = detectLanguage(input);

  // ── STEP 2: Normalization to English ───────────────────────────────────
  const normalized = normalizeToEnglish(input);

  // ── STEP 3: Entity & Intent Extraction (on normalized English ONLY) ────
  const entities = detectEntities(normalized);
  const hasFeeKeyword = INTENT_MAP.fees.some(p => normalized.includes(p));
  const intent = detectIntent(normalized, entities.length);

  // ── STEP 4: Map internal intent → UI trigger ──────────────────────────
  let result: NormalizedIntent;

  switch (intent) {
    case 'DOCUMENTS_QUERY':
      result = { trigger: 'documents' };
      break;

    case 'DEPARTMENT_COMPARE':
      result = { trigger: null };
      break;

    case 'PRINCIPAL_INFO':
      // Principal is a trustees/leadership card — let backend handle as text
      result = { trigger: 'trustees' };
      break;

    case 'TRUSTEES_INFO':
      result = { trigger: 'trustees' };
      break;

    case 'HOD_INFO':
      if (entities.length === 1) {
        result = { trigger: 'hod_info', departmentLabel: entities[0] };
      } else {
        result = { trigger: null }; // No department specified, let backend handle
      }
      break;

    case 'FEES_QUERY':
      if (entities.length >= 1) {
        result = { trigger: 'fees', departmentLabel: entities[0] };
      } else {
        // General fees query without department — still trigger fees intent
        result = { trigger: 'fees' };
      }
      break;

    case 'DEPARTMENT_INFO':
      if (entities.length === 1) {
        if (hasFeeKeyword) {
          result = { trigger: 'fees', departmentLabel: entities[0] };
        } else {
          result = { trigger: 'department_overview', departmentLabel: entities[0] };
        }
      } else {
        result = { trigger: null };
      }
      break;

    case 'COLLEGE_OVERVIEW':
      result = { trigger: 'college_overview' };
      break;

    case 'COURSE_LIST':
      result = { trigger: 'course_menu' };
      break;

    case 'ADMISSIONS_GOTO':
      result = { trigger: 'admissions' };
      break;

    case 'PLACEMENTS_GOTO':
      result = { trigger: 'placements' };
      break;

    case 'CUTOFF_QUERY':
      // Cutoff is answered by admissions flow
      result = { trigger: 'admissions' };
      break;

    default:
      result = { trigger: null };
      break;
  }

  // ── STEP 6: MANDATORY DEBUG LOGGING ──────────────────────────────────────
  const isFallback = result.trigger === null;
  console.log(
    `%c[CLARA_INTENT] ` +
    `Language: ${detectedLanguage} | ` +
    `Normalized: "${normalized}" | ` +
    `Entities: [${entities.join(', ')}] | ` +
    `Intent: ${intent} | ` +
    `Trigger: ${result.trigger ?? 'NONE'} | ` +
    `Dept: ${result.departmentLabel ?? 'NONE'} | ` +
    `Fallback: ${isFallback}`,
    isFallback
      ? 'color: #ff6b6b; font-weight: bold;'
      : 'color: #51cf66; font-weight: bold;'
  );

  return result;
}
