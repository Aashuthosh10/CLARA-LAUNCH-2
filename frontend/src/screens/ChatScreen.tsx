import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion, LayoutGroup } from 'motion/react';
import { Sparkles, Volume2, Home } from 'lucide-react';
import { useLanguage, type Language } from '../context/LanguageContext';
import whatsappBgImage from '../assets/whatsapp_bg.png';
import {
  type ChatMessage,
  type OrbState,
  isTextMessage,
} from '../types/chat';
import { useVoiceFrequencyAnalyser } from '../hooks/useVoiceAnalyser';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import VoiceOrb from '../components/VoiceOrb';
import AnimatedAiMessage from '../components/chat/AnimatedAiMessage';
import CourseMenuComponent from '../components/chat/CourseMenuComponent';
import DepartmentCardStage from '../components/chat/DepartmentCardStage';
import DepartmentCardFactory from '../components/chat/cards/DepartmentCards/DepartmentCardFactory';
import LeadershipOverview from '../components/chat/LeadershipOverview';
import DepartmentFeesCard from '../components/chat/cards/DepartmentFeesCard';
import DocumentsBlock from '../components/chat/cards/DocumentsBlock';
import { getStaticCardsForTrigger, type CardDataItem } from '../lib/cardData';
import {
  buildAllDepartmentSummaryCardsFromLocale,
  buildAllHodCardsFromLocale,
  buildDepartmentSlidesFromRecord,
  buildPlacementCardsFromLocale,
  getDepartmentRecord,
  menuLabelToJsonKey,
} from '../lib/collegeLocaleUtils';
import { useCollegeData } from '../hooks/useCollegeData';
import { normalizeIntent, type NormalizedIntent } from '../lib/intentNormalizer';

const THINKING_TAGLINES: Record<Language, string[]> = {
  English: [
    'Reading your question and gathering the right details...',
    'Cross-checking campus info so the answer stays accurate...',
    'Brewing a clear response tailored for you...',
    'Connecting the dots from CLARA knowledge...',
    'Almost there... shaping the best possible answer...',
  ],
  Kannada: [
    'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಓದಿ ಸರಿಯಾದ ಮಾಹಿತಿಯನ್ನು ಸಂಗ್ರಹಿಸುತ್ತಿದ್ದೇನೆ...',
    'ಉತ್ತರ ನಿಖರವಾಗಿರಲು ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇನೆ...',
    'ನಿಮಗಾಗಿ ಸ್ಪಷ್ಟ ಉತ್ತರವನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತಿದ್ದೇನೆ...',
    'CLARA ಜ್ಞಾನದಿಂದ ಸರಿಯಾದ ಸಂಪರ್ಕಗಳನ್ನು ಕಟ್ಟುತ್ತಿದ್ದೇನೆ...',
    'ಇನ್ನೇನು ಸಿದ್ಧ... ಅತ್ಯುತ್ತಮ ಉತ್ತರ ಬರುತ್ತಿದೆ...',
  ],
  Hindi: [
    'आपके सवाल को पढ़कर सही जानकारी जुटा रही हूँ...',
    'उत्तर सटीक रहे, इसलिए जानकारी दोबारा जाँच रही हूँ...',
    'आपके लिए स्पष्ट और सरल उत्तर तैयार कर रही हूँ...',
    'CLARA ज्ञान से सही बिंदु जोड़ रही हूँ...',
    'बस अभी... सबसे बेहतर जवाब तैयार है...',
  ],
  Tamil: [
    'உங்கள் கேள்வியை வாசித்து சரியான தகவலை தொகுத்து வருகிறேன்...',
    'பதில் துல்லியமாக இருக்க தகவலை மறுபரிசீலனை செய்கிறேன்...',
    'உங்களுக்கான தெளிவான பதிலை தயார் செய்கிறேன்...',
    'CLARA அறிவில் இருந்து சரியான தகவல்களை இணைக்கிறேன்...',
    'இன்னும் சில நொடிகளில்... சிறந்த பதில் வருகிறது...',
  ],
  Telugu: [
    'మీ ప్రశ్నను చదివి సరైన వివరాలు సేకరిస్తున్నాను...',
    'సమాధానం ఖచ్చితంగా ఉండేందుకు సమాచారాన్ని తనిఖీ చేస్తున్నాను...',
    'మీకు సరళమైన స్పష్టమైన సమాధానం సిద్ధం చేస్తున్నాను...',
    'CLARA జ్ఞానం నుంచి సరైన అంశాలను కలుపుతున్నాను...',
    'ఇంకొంచెంలో... మంచి సమాధానం సిద్ధమవుతోంది...',
  ],
  Malayalam: [
    'നിങ്ങളുടെ ചോദ്യത്തിന് അനുയോജ്യമായ വിവരം ശേഖരിക്കുകയാണ്...',
    'ഉത്തരം കൃത്യമാകാൻ വിവരങ്ങൾ വീണ്ടും പരിശോധിക്കുകയാണ്...',
    'നിങ്ങൾക്കായി ലളിതവും വ്യക്തവുമായ മറുപടി തയ്യാറാക്കുന്നു...',
    'CLARA അറിവിൽ നിന്ന് ശരിയായ ഭാഗങ്ങൾ ചേർക്കുന്നു...',
    'ഇനി കുറച്ച് നിമിഷങ്ങൾ... മികച്ച മറുപടി വരുന്നു...',
  ],
};

const THINKING_TITLE: Record<Language, string> = {
  English: 'CLARA is thinking',
  Kannada: 'CLARA ಯೋಚಿಸುತ್ತಿದೆ',
  Hindi: 'CLARA सोच रही है',
  Tamil: 'CLARA யோசிக்கிறது',
  Telugu: 'CLARA ఆలోచిస్తోంది',
  Malayalam: 'CLARA ചിന്തിക്കുന്നു',
};

const THINKING_EMOJIS = ['🤔', '🧠', '✨', '⚡', '💡'];
const SPLIT_IDLE_TIMEOUT_MS = 30_000;
const CARD_AUDIO_START_DELAY_MS = 450;
const FULL_TEXT_AUDIO_START_DELAY_MS = 140;
const DEFAULT_COURSE_MENU_OPTIONS = [
  'CSE',
  'ISE',
  'CSE (AI & ML)',
  'CSE (Data Science)',
  'CSE (Cyber Security)',
  'CSE (Business Systems)',
  'ECE',
  'Civil',
  'Mechanical',
  'MBA',
  'Basic Sciences',
];

const INFO_STAGE_CHIPS: Record<Language, { placements: string }> = {
  English: { placements: 'Placements & training' },
  Kannada: { placements: 'ಪ್ಲೇಸ್‌ಮೆಂಟ್ ಮತ್ತು ತರಬೇತಿ' },
  Hindi: { placements: 'प्लेसमेंट और प्रशिक्षण' },
  Tamil: { placements: 'பிளேஸ்மென்ட் மற்றும் பயிற்சி' },
  Telugu: { placements: 'ప్లేస్‌మెంట్ మరియు శిక్షణ' },
  Malayalam: { placements: 'പ്ലേസ്മെന്റും പരിശീലനവും' },
};

type PendingAudio = {
  audioBase64: string;
  segmentKey: string;
  isOverview: boolean;
  cardsToSync: any[] | null;
  targetLayout: 'FULL_TEXT' | 'SPLIT_CARDS';
};

const normalizeDepartmentMenuKey = (departmentId: string): string | null => {
  const raw = (departmentId || '').trim();
  const value = raw.toLowerCase();
  if (!value) return null;
  if (value.includes('basic')) return 'Basic Sciences';
  if (value.includes('mba') || value.includes('management')) return 'MBA';
  if (value.includes('mechanical') || value === 'mech') return 'Mechanical';
  if (value.includes('civil')) return 'Civil';
  if (value.includes('ece') || value.includes('electronics')) return 'ECE';
  if (value.includes('ise') || value.includes('information science')) return 'ISE';
  if (value.includes('cyber security') || value.includes('cybersecurity')) return 'CSE (Cyber Security)';
  if (value.includes('business system')) return 'CSE (Business Systems)';
  if (value.includes('data science')) return 'CSE (Data Science)';
  if ((value.includes('ai') && value.includes('ml')) || value.includes('aiml') || value.includes('ai & ml')) {
    return 'CSE (AI & ML)';
  }
  if (value.includes('cse') || value.includes('computer')) return 'CSE';
  return raw;
};

const normalizeCardTrigger = (trigger: unknown): string | null => {
  if (typeof trigger !== 'string') return null;
  const n = trigger.trim().toLowerCase();
  if (!n) return null;
  if (n === 'hod_info' || n === 'head_of_department' || n === 'hod_profile') return 'hod';
  if (n === 'dept' || n === 'department') return 'department_overview';
  if (n === 'fees') return 'department_fees';
  return n;
};

interface ChatScreenProps {
  messages: ChatMessage[];
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  isConnected?: boolean;
  voiceInputMode?: 'browser' | 'backend';
  payload?: any | null;
  onBack: () => void;
  onHome?: () => void;
  onOrbTap: () => void;
  sendMessage: (msg: object) => void;
}

export default function ChatScreen({
  messages: payloadMessages,
  isListening: propIsListening = false,
  isProcessing = false,
  isConnected = true,
  voiceInputMode = 'browser',
  payload,
  onBack,
  onHome,
  onOrbTap,
  sendMessage,
}: ChatScreenProps) {
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>(payloadMessages);
  
  // Layout Management State
  const [layoutMode, setLayoutMode] = useState<'FULL_TEXT' | 'SPLIT_CARDS'>('FULL_TEXT');
  const [activeCards, setActiveCards] = useState<any[] | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [suppressedTurnId, setSuppressedTurnId] = useState<string | null>(null);
  const [currentAudioDuration, setCurrentAudioDuration] = useState<number>(0);
  const [courseMenuOptions, setCourseMenuOptions] = useState<string[]>([]);
  const [activeDepartmentId, setActiveDepartmentId] = useState<string | null>(null);
  const [isDepartmentOverviewStage, setIsDepartmentOverviewStage] = useState(false);
  const [isInfoSlideStage, setIsInfoSlideStage] = useState(false);
  const [infoSlideChip, setInfoSlideChip] = useState('');
  const [infoSlides, setInfoSlides] = useState<{ title: string; content: string }[]>([]);
  const [isHodStage, setIsHodStage] = useState(false);
  const [isFeesStage, setIsFeesStage] = useState(false);
  const [activeFeesDepartmentId, setActiveFeesDepartmentId] = useState<string | null>(null);
  const [isDocumentsStage, setIsDocumentsStage] = useState(false);
  
  // Multilingual Intent Map overriding
  const [pendingLocalIntent, setPendingLocalIntent] = useState<NormalizedIntent | null>(null);

  // Response Priority Lock (CARD > UI > TEXT)
  const currentUiLockRef = useRef<'CARD' | 'TEXT' | 'IDLE'>('IDLE');

  // Wraps original sendMessage to sniff for intents dynamically on dispatch
  const interceptAndSendMessage = useCallback((msg: any, source: 'VOICE' | 'UI' = 'VOICE') => {
    if (msg?.action === 'user_message' && typeof msg.text === 'string') {
      // 1. Reset UI completely on NEW VOICE queries
      // Rule 5: Navigation clicks (UI source) should NOT wipe the layout mode.
      if (source === 'VOICE') {
        setLayoutMode('FULL_TEXT');
        setActiveCards(null);
        setIsDepartmentOverviewStage(false);
        setActiveDepartmentId(null);
        setIsInfoSlideStage(false);
        setInfoSlides([]);
        setInfoSlideChip('');
        setIsHodStage(false);
        setIsFeesStage(false);
        setActiveFeesDepartmentId(null);
        setIsDocumentsStage(false);
        setCourseMenuOptions([]);
        currentUiLockRef.current = 'IDLE'; // Release the lock
      }
      
      const intent = normalizeIntent(msg.text);

      // ── TASK 1: FULL PIPELINE TRACE (MANDATORY) ──────────────────────────
      console.log(
        `%c[CLARA_PIPELINE] User Input: "${msg.text}" | ` +
        `Trigger: ${intent.trigger ?? 'NONE'} | ` +
        `Department: ${intent.departmentLabel ?? 'NONE'} | ` +
        `Source: ${source} | ` +
        `Fallback: ${intent.trigger === null}`,
        intent.trigger ? 'color: #51cf66; font-weight: bold;' : 'color: #ff6b6b; font-weight: bold;'
      );

      if (intent.trigger) {
        setPendingLocalIntent(intent);
        msg.localIntent = intent;
      }
    }
    sendMessage(msg);
  }, [sendMessage]);

  const [activeTargetDepartment, setActiveTargetDepartment] = useState<string | null>(null);


  const collegeData = useCollegeData();
  
  // Interaction State
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isPlayingBackendAudio, setIsPlayingBackendAudio] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [pendingAudio, setPendingAudio] = useState<PendingAudio | null>(null);
  const [visuallyFocusedMessage, setVisuallyFocusedMessage] = useState<ChatMessage | null>(null);
  const hasStartedRef = useRef(false);
  const prevLayoutModeRef = useRef<'FULL_TEXT' | 'SPLIT_CARDS'>('FULL_TEXT');
  const hasAutoStartedRef = useRef(false);
  const wasPlayingAudioRef = useRef(false);
  const isPendingListeningRef = useRef(false);

  // Audio Playback Ref
  const playedSegmentKeysRef = useRef<Set<string>>(new Set());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const cardProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Intent Classifier & Speech Hooks
  const voiceAnalyser = useVoiceFrequencyAnalyser(orbState === 'listening');
  // Browser Speech Rec fallback (used if not relying on backend voice activity detection)
  const handleEmptyTranscript = useCallback(() => {
     setShowUnmuteHint(false);
     setIsDepartmentOverviewStage(false);
     setActiveDepartmentId(null);
     interceptAndSendMessage({
        action: "user_message",
        text: "**BACKGROUND_NOISE** No words detected, returning to idle state."
     });
  }, [interceptAndSendMessage]);

  const { startListening: startSpeechRecognition, stopListening } = useSpeechRecognition(
    interceptAndSendMessage,
    language,
    () => {},
    () => {}
  );

  // Keep chat history stable when backend emits partial payloads without `messages`.
  useEffect(() => {
    if (Array.isArray(payload?.messages)) {
      const incomingMessages = payload.messages as ChatMessage[];
      setDisplayMessages(incomingMessages);
      const isCardTurn = Boolean(payload?.showCard);
      if (isCardTurn) {
        setVisuallyFocusedMessage(null);
      } else if (payload?.isProcessing !== true) {
        const latestAssistant = [...incomingMessages]
          .reverse()
          .find((m: any) => m?.role === 'clara' && typeof m?.text === 'string' && !(m as any)?.isHidden && !(m as any)?.isCardData);
        setVisuallyFocusedMessage((latestAssistant as ChatMessage) ?? null);
      }
    }
  }, [payload]);

  useEffect(() => {
    if (!isProcessing) {
      setThinkingIndex(0);
      return;
    }
    const ticker = setInterval(() => {
      setThinkingIndex(prev => prev + 1);
    }, 2200);
    return () => clearInterval(ticker);
  }, [isProcessing]);

  const resolveCardsFromTrigger = useCallback((trigger: unknown): CardDataItem[] | null => {
    const mapSingleTrigger = (key: string): CardDataItem[] | null => {
      const n = key.toLowerCase();
      if (n === 'hod' || n === 'hod_profile' || n === 'head_of_department') {
        const c = buildAllHodCardsFromLocale(collegeData, language);
        return c.length ? c : null;
      }
      if (n === 'dept' || n === 'department' || n === 'department_overview') {
        const c = buildAllDepartmentSummaryCardsFromLocale(collegeData, language);
        return c.length ? c : null;
      }
      return getStaticCardsForTrigger(language, key);
    };

    const triggerList = Array.isArray(trigger) ? trigger : [trigger];
    const merged: CardDataItem[] = [];
    for (const item of triggerList) {
      if (typeof item !== 'string') continue;
      const cards = mapSingleTrigger(item);
      if (cards && cards.length) {
        merged.push(...cards);
      }
    }
    if (!merged.length) return null;

    return merged.filter((card, idx) => {
      const signature = `${card?.title ?? ''}|${card?.type ?? ''}`;
      return (
        idx ===
        merged.findIndex(
          (x) => `${x?.title ?? ''}|${x?.type ?? ''}` === signature
        )
      );
    });
  }, [language, collegeData]);

  const handleHomeClick = useCallback(() => {
    stopListening();
    if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
    }
    setIsPlayingBackendAudio(false);
    if (onHome) onHome();
  }, [stopListening, onHome]);

  // Sync Card Progression with Backend Audio Duration
  const handleAudioPlayback = useCallback(
    (audioBase64: string, segmentKey: string, isOverview: boolean, cardsToSync: any[] | null) => {
    // Dedupe by a per-segment key (not just per-turn), because the backend can stream
    // multiple TTS segments for the same `turn_id` (ack + first sentence + remainder).
    if (playedSegmentKeysRef.current.has(segmentKey)) return;
    playedSegmentKeysRef.current.add(segmentKey);

    if (cardProgressTimerRef.current) {
        clearInterval(cardProgressTimerRef.current);
        cardProgressTimerRef.current = null;
    }
    if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
    }

    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
    currentAudioRef.current = audio;
    setIsPlayingBackendAudio(true);

    const startSync = (duration: number) => {
        if (!isOverview || !cardsToSync) return;
        const totalDurationMs = duration * 1000;
        const intervalTime = totalDurationMs / cardsToSync.length;
        let idx = 0;
        setCurrentCardIdx(0);
        if (cardProgressTimerRef.current) {
            clearInterval(cardProgressTimerRef.current);
            cardProgressTimerRef.current = null;
        }
        const interval = setInterval(() => {
            idx++;
            if (idx < cardsToSync.length) {
                setCurrentCardIdx(idx);
            } else {
                clearInterval(interval);
                cardProgressTimerRef.current = null;
            }
        }, intervalTime);
        cardProgressTimerRef.current = interval;
    };

    audio.onloadedmetadata = () => {
        setCurrentAudioDuration(audio.duration);
        startSync(audio.duration);
    };
    setTimeout(() => { 
        if (isOverview && audio.duration) {
            setCurrentAudioDuration(audio.duration);
            startSync(audio.duration); 
        }
    }, 1000);

    audio.onended = () => {
        if (cardProgressTimerRef.current) {
            clearInterval(cardProgressTimerRef.current);
            cardProgressTimerRef.current = null;
        }
        setIsPlayingBackendAudio(false);
        setHasGreeted(true); // Session is active after any Clara audio completes
        if (isOverview && cardsToSync && cardsToSync.length > 0) {
            setCurrentCardIdx(cardsToSync.length - 1);
        }
    };

    audio.play().catch(err => {
        // Helps debug when the browser blocks autoplay or decoding fails.
        if (import.meta.env.DEV) {
          console.error('[CLARA_TTS] audio.play() failed', {
            segmentKey,
            error: err instanceof Error ? err.message : String(err),
          });
        }
        if (cardProgressTimerRef.current) {
            clearInterval(cardProgressTimerRef.current);
            cardProgressTimerRef.current = null;
        }
        setIsPlayingBackendAudio(false);
        setHasGreeted(true); // Fallback so they can progress
        setShowUnmuteHint(true);
    });
  }, []);

  // Sync from payload
  useEffect(() => {
    if (!payload) return;

    // Helper to detect if the backend is sending us a fallback message ("Go to admissions block")
    const isFallbackMessage = (text: string) => {
      const t = text.toLowerCase();
      return t.includes('admission block') || 
             t.includes('admissions block') || 
             t.includes('एडमिशन ब्लॉक') || 
             t.includes('अडमिशन ब्लॉक') ||
             t.includes('सबसे सटीक जानकारी');
    };
    
    // Fall back to client-side interpreted intent if the backend missed it due to NLP multi-lingual blindspots
    const nativeTrigger = payload?.showCard;
    const cardTrigger = normalizeCardTrigger(nativeTrigger || pendingLocalIntent?.trigger);
    const payloadMessageList = Array.isArray(payload?.messages) ? payload.messages : [];
    const isResponseReady = payload?.isProcessing !== true && payloadMessageList.length > 0;
    
    const departmentIdFromPayload = typeof payload?.departmentId === 'string' ? payload.departmentId : null;
    const rawTargetDept = payload?.targetDepartment ?? payload?.target_department ?? departmentIdFromPayload;
    const localDeptLabel = pendingLocalIntent?.departmentLabel ?? null;
    // Click-driven department flows must always trust the locally clicked department.
    const shouldPreferLocalDepartment =
      Boolean(localDeptLabel) &&
      (cardTrigger === 'department_overview' || cardTrigger === 'department_fees' || cardTrigger === 'hod');
    const targetDepartment = shouldPreferLocalDepartment
      ? localDeptLabel
      : (rawTargetDept || localDeptLabel || null);

    
    // STICKY STATE: Only update if we have a fresh target, otherwise preserve existing for this turn
    if (targetDepartment && targetDepartment !== '') {
      setActiveTargetDepartment(targetDepartment);
      // Also sync back to activeDepartmentId if we are in an overview stage
      if (isDepartmentOverviewStage) {
        setActiveDepartmentId(targetDepartment);
      }
    }

    // Ensure we clear the pending intent so subsequent replies don't loop the previous card
    if (pendingLocalIntent && (!nativeTrigger || isResponseReady)) {
      setPendingLocalIntent(null);
    }


    const menuOptionsFromPayload = Array.isArray(payload?.options)
      ? payload.options.filter((x: unknown) => typeof x === 'string')
      : [];
    const audioBase64 = payload?.audioBase64;
    const turnId = payload?.turn_id ?? 'greeting';
    const type = payload?.type ?? '';
    const utteranceKind = payload?.utterance_kind ?? '';
    const segmentIndex = payload?.segment_index ?? 0;
    const isFinalSegment = payload?.is_final_segment ?? true;
    // Small signature so missing metadata cannot cause false collisions.
    const audioSig = `${audioBase64?.length ?? 0}:${audioBase64?.slice(0, 24) ?? ''}`;
    const segmentKey = [turnId, type, utteranceKind, segmentIndex, isFinalSegment, audioSig].join('|');

    // Defer all split-card transitions until the turn has finalized messages.
    if (cardTrigger && cardTrigger !== 'documents' && !isResponseReady) {
      if (audioBase64) {
        setPendingAudio({
          audioBase64,
          segmentKey,
          isOverview: false,
          cardsToSync: null,
          targetLayout: 'FULL_TEXT',
        });
      }
      return;
    }

    // Keep Fees card sticky for the active response stream.
    // Some backend chunks can arrive without `showCard: "fees"` (or with a generic fallback trigger),
    // which previously caused a temporary switch back to FULL_TEXT while TTS was still speaking.
    if (isFeesStage && currentUiLockRef.current === 'CARD' && cardTrigger !== 'department_fees') {
      setLayoutMode('SPLIT_CARDS');
      if (audioBase64) {
        setPendingAudio({
          audioBase64,
          segmentKey,
          isOverview: false,
          cardsToSync: null,
          targetLayout: 'SPLIT_CARDS',
        });
      }
      return;
    }

    if (cardTrigger === 'course_menu') {
      currentUiLockRef.current = 'CARD';
      setLayoutMode('SPLIT_CARDS');
      setActiveCards(null);
      setCurrentCardIdx(0);
      setSuppressedTurnId(null);
      setActiveDepartmentId(null);
      setIsDepartmentOverviewStage(false);
      setIsInfoSlideStage(false);
      setInfoSlides([]);
      setInfoSlideChip('');
      setIsFeesStage(false);
      setActiveFeesDepartmentId(null);
      setIsDocumentsStage(false);
      setCourseMenuOptions(menuOptionsFromPayload.length ? menuOptionsFromPayload : DEFAULT_COURSE_MENU_OPTIONS);
      if (audioBase64) {
        setPendingAudio({
          audioBase64,
          segmentKey,
          isOverview: false,
          cardsToSync: null,
          targetLayout: 'SPLIT_CARDS',
        });
      }
      return;
    }

    if (cardTrigger === 'admissions' || cardTrigger === 'college_overview' || cardTrigger === 'trustees') {
      // These intents are answered by the backend LLM as text; no card UI.
      setCourseMenuOptions([]);
      setIsDepartmentOverviewStage(false);
      setActiveDepartmentId(null);
      setIsInfoSlideStage(false);
      setInfoSlides([]);
      setInfoSlideChip('');
      setIsHodStage(false);
      setIsFeesStage(false);
      setActiveFeesDepartmentId(null);
      setIsDocumentsStage(false);
      currentUiLockRef.current = 'TEXT';
      setLayoutMode('FULL_TEXT');
      if (audioBase64) {
        setPendingAudio({
          audioBase64,
          segmentKey,
          isOverview: false,
          cardsToSync: null,
          targetLayout: 'FULL_TEXT',
        });
      }
      return;
    }

    if (cardTrigger === 'placements') {
      currentUiLockRef.current = 'CARD';
      setIsHodStage(false);
      setIsDepartmentOverviewStage(false);
      setActiveDepartmentId(null);
      setCourseMenuOptions([]);
      setIsFeesStage(false);
      setActiveFeesDepartmentId(null);
      setIsDocumentsStage(false);
      setIsInfoSlideStage(true);
      const chips = INFO_STAGE_CHIPS[language] ?? INFO_STAGE_CHIPS.English;
      setInfoSlideChip(chips.placements);
      const slides = buildPlacementCardsFromLocale(collegeData, language);
      setInfoSlides(slides);
      
      setLayoutMode('SPLIT_CARDS');
      setActiveCards(null);
      if (audioBase64) {
        setPendingAudio({
          audioBase64,
          segmentKey,
          isOverview: true,
          cardsToSync: slides.map(s => ({ title: s.title, content: s.content, type: 'dept' })),
          targetLayout: 'SPLIT_CARDS',
        });
      }
      return;
    }

    if (cardTrigger === 'hod') {
      setIsFeesStage(false);
      setActiveFeesDepartmentId(null);
      setIsDocumentsStage(false);
      const targetDept = String(targetDepartment || '').trim();
      if (targetDept) {
        // Any department with a valid label — lock onto the HOD card stage.
        // LeadershipOverview will pick the correct component from its COMPONENT_MAP.
        setIsInfoSlideStage(false);
        setInfoSlides([]);
        setInfoSlideChip('');
        setIsDepartmentOverviewStage(false);
        setActiveDepartmentId(null);
        setCourseMenuOptions([]);

        currentUiLockRef.current = 'CARD';
        setIsHodStage(true);
        setLayoutMode('SPLIT_CARDS');
      } else if (currentUiLockRef.current !== 'CARD') {
        // No department resolved — only go to text if we haven't already locked a card
        setLayoutMode('FULL_TEXT');
      }
      return;
    }

    if (cardTrigger === 'placements') {
      setIsFeesStage(false);
      setActiveFeesDepartmentId(null);
      setIsDocumentsStage(false);
      setCourseMenuOptions([]);
      setIsDepartmentOverviewStage(false);
      setActiveDepartmentId(null);
      setIsInfoSlideStage(true);
      const chips = INFO_STAGE_CHIPS[language] ?? INFO_STAGE_CHIPS.English;
      setInfoSlideChip(chips.placements);
      const slides = buildPlacementCardsFromLocale(collegeData, language);
      setInfoSlides(slides);
      const lastAssistantInPayload = [...payloadMessageList]
        .reverse()
        .find((m: any) => m?.role === 'clara' && typeof m?.id === 'string');
      const assistantMessageId = lastAssistantInPayload?.id ?? null;
      setLayoutMode('SPLIT_CARDS');
      setActiveCards(null);
      setSuppressedTurnId(assistantMessageId ?? turnId);
      if (audioBase64) {
        const syncCards: CardDataItem[] = slides.map((s) => ({
          title: s.title,
          content: s.content,
          type: 'dept',
        }));
        setPendingAudio({
          audioBase64,
          segmentKey,
          isOverview: true,
          cardsToSync: syncCards,
          targetLayout: 'SPLIT_CARDS',
        });
      }
      return;
    }

    if (cardTrigger === 'department_overview') {
      currentUiLockRef.current = 'CARD';
      setIsInfoSlideStage(false);
      setInfoSlides([]);
      setInfoSlideChip('');
      setIsHodStage(false); // Protect against HOD stage bleed-over
      setIsFeesStage(false);
      setActiveFeesDepartmentId(null);
      setIsDocumentsStage(false);
      
      const targetRaw = targetDepartment;
      const targetAll = targetRaw.toLowerCase() === 'all';

      const lastAssistantInPayload = [...payloadMessageList]
        .reverse()
        .find((m: any) => m?.role === 'clara' && typeof m?.id === 'string');
      const assistantMessageId = lastAssistantInPayload?.id ?? null;
      setCourseMenuOptions([]);

      if (targetAll) {
        setIsDepartmentOverviewStage(false);
        setActiveDepartmentId(null);
        const allDeptCards = buildAllDepartmentSummaryCardsFromLocale(collegeData, language);
        setLayoutMode('SPLIT_CARDS');
        setActiveCards(allDeptCards);
        setSuppressedTurnId(assistantMessageId ?? turnId);
        if (audioBase64) {
          setPendingAudio({
            audioBase64,
            segmentKey,
            isOverview: true,
            cardsToSync: allDeptCards,
            targetLayout: 'SPLIT_CARDS',
          });
        }
        return;
      }

      const resolvedDept = normalizeDepartmentMenuKey(departmentIdFromPayload ?? (targetDepartment || ''));

      if (!resolvedDept) {
          // If no department is resolved, and it's not 'all', do not switch layouts.
          // This prevents accidental CSE defaulting for "the department" queries.
          return;
      }

      const jsonKey = menuLabelToJsonKey(resolvedDept);
      if (!jsonKey) {
        // Never force a default department when backend/local resolution is ambiguous.
        return;
      }
      const deptRecord = getDepartmentRecord(collegeData, jsonKey);
      const slides = buildDepartmentSlidesFromRecord(deptRecord, jsonKey, language);
      const syncCards: CardDataItem[] = slides.map((s) => ({
        title: s.title,
        content: s.content,
        type: 'dept',
      }));

      setIsDepartmentOverviewStage(true);
      setActiveDepartmentId(resolvedDept);
      setLayoutMode('SPLIT_CARDS');
      setActiveCards(null);
      setSuppressedTurnId(assistantMessageId ?? turnId);
      if (audioBase64) {
        setPendingAudio({
          audioBase64,
          segmentKey,
          isOverview: true,
          cardsToSync: syncCards,
          targetLayout: 'SPLIT_CARDS',
        });
      }
      return;
    }

    if (cardTrigger === 'department_fees') {
      currentUiLockRef.current = 'CARD';
      setCourseMenuOptions([]);
      setIsDepartmentOverviewStage(false);
      setActiveDepartmentId(null);
      setIsInfoSlideStage(false);
      setInfoSlides([]);
      setInfoSlideChip('');
      setIsHodStage(false);
      setIsDocumentsStage(false);
      setActiveCards(null);
      setSuppressedTurnId(null);
      const resolvedDept = normalizeDepartmentMenuKey(
        String(departmentIdFromPayload || targetDepartment || pendingLocalIntent?.departmentLabel || ''),
      );
      const feeDeptKey =
        menuLabelToJsonKey(resolvedDept ?? '') ??
        menuLabelToJsonKey(String(targetDepartment || '')) ??
        menuLabelToJsonKey(String(departmentIdFromPayload || '')) ??
        menuLabelToJsonKey(String(pendingLocalIntent?.departmentLabel || '')) ??
        null;
      setIsFeesStage(true);
      setActiveFeesDepartmentId(feeDeptKey);
      setLayoutMode('SPLIT_CARDS');

      if (audioBase64) {
        setPendingAudio({
          audioBase64,
          segmentKey,
          isOverview: false,
          cardsToSync: null,
          targetLayout: 'SPLIT_CARDS',
        });
      }
      return;
    }

    if (cardTrigger === 'documents') {
      currentUiLockRef.current = 'CARD';
      setCourseMenuOptions([]);
      setIsDepartmentOverviewStage(false);
      setActiveDepartmentId(null);
      setIsInfoSlideStage(false);
      setInfoSlides([]);
      setInfoSlideChip('');
      setIsHodStage(false);
      setIsFeesStage(false);
      setActiveFeesDepartmentId(null);
      setIsDocumentsStage(true);
      setLayoutMode('SPLIT_CARDS');
      setActiveCards(null);
      setSuppressedTurnId(turnId);
      if (audioBase64) {
        setPendingAudio({
          audioBase64,
          segmentKey,
          isOverview: false,
          cardsToSync: null,
          targetLayout: 'SPLIT_CARDS',
        });
      }
      return;
    }

    const cardsForTrigger = resolveCardsFromTrigger(cardTrigger);

    if (cardsForTrigger) {
        currentUiLockRef.current = 'CARD';
        setCourseMenuOptions([]);
        setActiveDepartmentId(null);
        setIsDepartmentOverviewStage(false);
        setIsInfoSlideStage(false);
        setInfoSlides([]);
        setInfoSlideChip('');
        setIsFeesStage(false);
        setActiveFeesDepartmentId(null);
        setIsDocumentsStage(false);
        const lastAssistantInPayload = [...payloadMessageList]
          .reverse()
          .find((m: any) => m?.role === 'clara' && typeof m?.id === 'string');
        const assistantMessageId = lastAssistantInPayload?.id ?? null;
        setLayoutMode('SPLIT_CARDS');
        setActiveCards(cardsForTrigger);
        setSuppressedTurnId(assistantMessageId ?? turnId);
        if (audioBase64) {
          setPendingAudio({
            audioBase64,
            segmentKey,
            isOverview: true,
            cardsToSync: cardsForTrigger,
            targetLayout: 'SPLIT_CARDS',
          });
        }
        return;
    }

    // FALLBACK / TEXT-ONLY RESPONSE
    // If a higher priority UI layout (CARD) is already locked, DO NOT override it with text.
    // TEXT-ONLY FALLBACK (NO CARD METADATA)
    // Check if we should block the 'FULL_TEXT' transition because this is a backend failure message
    const combinedContent = payloadMessageList.map((m: any) => m.content).join(' ');
    const isFallback = isFallbackMessage(combinedContent);

    if (currentUiLockRef.current === 'CARD' || (isFallback && activeTargetDepartment)) {
        if (isFallback && activeTargetDepartment) {
            // Backend failed, but we have a department. Stay in SPLIT_CARDS.
            setLayoutMode('SPLIT_CARDS'); 
        }
        if (audioBase64) {
          setPendingAudio({
            audioBase64,
            segmentKey,
            isOverview: false,
            cardsToSync: null,
            targetLayout: 'SPLIT_CARDS', // Play audio gracefully in background alongside locked card
          });
        }
        return; 
    }

    // Valid text progression since no higher priority rules are locked
    currentUiLockRef.current = 'TEXT';
    
    // Resetting behavior completely removed from backend completion chunk parsing (Rule 5)
    // We strictly use `interceptAndSendMessage` to reset on explicitly new inquiries!
    if (audioBase64) {
      setPendingAudio({
        audioBase64,
        segmentKey,
        isOverview: false,
        cardsToSync: null,
        targetLayout: 'FULL_TEXT',
      });
    }

  }, [payload, resolveCardsFromTrigger, collegeData, language, interceptAndSendMessage]);

  // Start queued audio only after its target layout is visible.
  useEffect(() => {
    if (!pendingAudio) return;
    if (layoutMode !== pendingAudio.targetLayout) return;
    const delayMs =
      pendingAudio.targetLayout === 'SPLIT_CARDS'
        ? CARD_AUDIO_START_DELAY_MS
        : FULL_TEXT_AUDIO_START_DELAY_MS;
    const timer = setTimeout(() => {
      handleAudioPlayback(
        pendingAudio.audioBase64,
        pendingAudio.segmentKey,
        pendingAudio.isOverview,
        pendingAudio.cardsToSync
      );
      setPendingAudio(current =>
        current?.segmentKey === pendingAudio.segmentKey ? null : current
      );
    }, delayMs);
    return () => clearTimeout(timer);
  }, [pendingAudio, layoutMode, handleAudioPlayback]);

  // Time-based reset UI behavior removed to enforce persistent screen state.

  // Orb State — with persistent 'completed' state for post-response guidance
  // "Tap to Speak" stays visible FOREVER until user taps orb or listening starts.
  useEffect(() => {
    // Detect speaking → finished transition
    const wasSpeaking = wasPlayingAudioRef.current;
    wasPlayingAudioRef.current = isPlayingBackendAudio;

    if (isPlayingBackendAudio) {
      setOrbState('speaking');
    } else if (isProcessing) {
      setOrbState('processing');
    } else if (propIsListening || isPendingListeningRef.current) {
      // User started speaking or explicitly tapped the orb (optimistic listening)
      setOrbState('listening');
    } else if (wasSpeaking && !isPlayingBackendAudio) {
      // CLARA just finished speaking → show 'completed' with "Tap to Speak"
      // This state persists indefinitely — NO auto-timeout.
      // Only cleared when: user taps orb OR listening begins.
      setOrbState('completed');
    } else if (orbState !== 'completed') {
      // Normal idle/ready — never override a persistent completed state
      if (hasGreeted && !showUnmuteHint) setOrbState('ready');
      else setOrbState('idle');
    }
  }, [propIsListening, isProcessing, isPlayingBackendAudio, hasGreeted, showUnmuteHint]);

  // Auto-Start Listening Loop (ONLY ONCE)
  useEffect(() => {
    if (orbState === 'ready' && !propIsListening && voiceInputMode !== 'backend' && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      const timer = setTimeout(() => {
        startSpeechRecognition();
      }, 600); // Sustain the 'ready' visual feedback briefly before engaging mic
      return () => clearTimeout(timer);
    }
  }, [orbState, propIsListening, voiceInputMode, startSpeechRecognition]);

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      sendMessage({ action: 'conversation_started' });
    }
  }, [sendMessage]);

  // Clear optimistic listening state once real listening engages
  useEffect(() => {
    if (propIsListening) {
      isPendingListeningRef.current = false;
    }
  }, [propIsListening]);

  const handleOrbTap = () => {
    setShowUnmuteHint(false);
    setHasGreeted(true);
    setVisuallyFocusedMessage(null);
    
    // IMMEDIATE VISUAL FEEDBACK: Optimistically set listening state
    // so the UI feels instantly responsive. The effect above will clear
    // this when real listening engages or we timeout.
    isPendingListeningRef.current = true;
    setOrbState('listening');
    
    // Safety fallback: if mic fails to engage, drop optimistic state
    setTimeout(() => {
      isPendingListeningRef.current = false;
      // Force a re-render to evaluating state
      setOrbState(prev => prev === 'listening' && !propIsListening ? 'idle' : prev);
    }, 3000);

    if (orbState === 'idle' || orbState === 'ready' || orbState === 'completed') {
      if (voiceInputMode === 'backend') onOrbTap();
      else startSpeechRecognition();
    }
  };

  const handleCardSelect = useCallback((idx: number) => {
    if (cardProgressTimerRef.current) {
      clearInterval(cardProgressTimerRef.current);
      cardProgressTimerRef.current = null;
    }
    setCurrentCardIdx(idx);
  }, []);

  const handleCourseMenuSelect = useCallback(
    (departmentName: string) => {
      setCourseMenuOptions([]);
      
      // DIRECT ACTION MAPPING (UI_CLICK = Deterministic Command)
      // Completely bypass language pipeline by setting state IMMEDIATELY
      currentUiLockRef.current = 'CARD';
      setActiveDepartmentId(departmentName);
      setIsDepartmentOverviewStage(true);
      setLayoutMode('SPLIT_CARDS');
      
      // Notify backend for audio response in current language
      interceptAndSendMessage({
        action: 'user_message',
        text: departmentName,
        localIntent: {
          type: 'department_click',
          departmentLabel: departmentName,
        },
      }, 'UI');
    },
    [interceptAndSendMessage]
  );

  const filteredMessages = useMemo(() => {
    if (isDocumentsStage) {
      return [];
    }
    return displayMessages.filter(m => {
       const isHidden = (m as any).isHidden || (m as any).isCardData;
       return !isHidden && (m.id !== suppressedTurnId);
    });
  }, [displayMessages, suppressedTurnId, isDocumentsStage]);

  const lastAssistantMsg = visuallyFocusedMessage && isTextMessage(visuallyFocusedMessage) && visuallyFocusedMessage.role === 'clara'
    ? visuallyFocusedMessage
    : null;
  const fullTextMessageClassName = 'word-by-word-text full-text-readable';
  const languageTaglines = THINKING_TAGLINES[language] ?? THINKING_TAGLINES.English;
  const thinkingTagline = languageTaglines[thinkingIndex % languageTaglines.length];
  const thinkingTitle = THINKING_TITLE[language] ?? THINKING_TITLE.English;
  const thinkingEmoji = THINKING_EMOJIS[thinkingIndex % THINKING_EMOJIS.length];

  const departmentSlides = useMemo(() => {
    if (!isDepartmentOverviewStage || !activeDepartmentId) return [];
    const jk = menuLabelToJsonKey(activeDepartmentId);
    if (!jk) return [];
    const rec = getDepartmentRecord(collegeData, jk);
    return buildDepartmentSlidesFromRecord(rec, jk, language);
  }, [isDepartmentOverviewStage, activeDepartmentId, collegeData, language]);

  useEffect(() => {
    const prev = prevLayoutModeRef.current;
    if (prev === 'SPLIT_CARDS' && layoutMode === 'FULL_TEXT') {
      setVisuallyFocusedMessage(null);
    }
    prevLayoutModeRef.current = layoutMode;
  }, [layoutMode]);

  useEffect(() => {
    if (layoutMode !== 'SPLIT_CARDS') return;
    const panel = scrollRef.current;
    if (!panel) return;
    const raf = requestAnimationFrame(() => {
      panel.scrollTo({ top: panel.scrollHeight, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [layoutMode, filteredMessages, isProcessing, thinkingIndex]);

  return (
    <div className="light-chat-container" data-testid="chat-screen">
      <div className="cinematic-overlay" />
      {/* Global Home Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        onClick={handleHomeClick}
        className="premium-home-button"
        title="Go Home"
      >
        <Home className="w-6 h-6" />
      </motion.button>

      <LayoutGroup>
        <AnimatePresence mode="wait">
          {/* ─── FULL TEXT MODE ─── */}
          {layoutMode === 'FULL_TEXT' ? (
            <motion.div key="full-text" layoutId="main" className="full-text-layout">
              {/* Clean top — no debug labels */}
              <div className="full-text-message-stage">
                {isProcessing ? (
                  <div className="clara-thinking-stage">
                    <div className="clara-thinking-emoji" aria-hidden>{thinkingEmoji}</div>
                    <div className="clara-thinking-title">{thinkingTitle}</div>
                    <div className="clara-thinking-tagline">{thinkingTagline}</div>
                    <div className="clara-thinking-dots" aria-hidden>...</div>
                    <motion.div layoutId="orb" className="orb-thinking-container">
                      <VoiceOrb state={orbState} amplitude={voiceAnalyser.amplitude} onTap={handleOrbTap} label="THINKING..." />
                    </motion.div>
                  </div>
                ) : (
                  lastAssistantMsg && isTextMessage(lastAssistantMsg) && (
                    <div className="full-text-message-wrapper full-text-safe-zone">
                      <AnimatedAiMessage 
                        text={lastAssistantMsg.text} 
                        animate={true}
                        audioDuration={currentAudioDuration}
                        className={fullTextMessageClassName}
                      />
                    </div>
                  )
                )}
              </div>
              
              {!isProcessing && (
                <motion.div layoutId="orb" className="orb-float-bottom relative">
                  {showUnmuteHint && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white px-4 py-2 rounded-full text-xs flex items-center gap-2 shadow-lg">
                      <Volume2 size={14} /> Tap to Unmute
                    </div>
                  )}
                  <VoiceOrb state={orbState} amplitude={voiceAnalyser.amplitude} onTap={handleOrbTap} />
                </motion.div>
              )}
            </motion.div>

          /* ─── SPLIT CARDS MODE (college/dept/hod/trustees) ─── */
          ) : (
            <motion.div key="split" layoutId="main" className="split-cards-layout">
              <div className="visual-stage-70 flex flex-col items-center">
                {/* Custom WhatsApp Watermark Overlay */}
                <div 
                  className="absolute inset-0 z-0 opacity-100 pointer-events-none"
                  style={{
                    backgroundImage: `url(${whatsappBgImage})`,
                    backgroundSize: '250px 250px',
                    backgroundRepeat: 'repeat',
                  }}
                />

                {/* Content Layer */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">

                {isHodStage ? (
                  <LeadershipOverview
                    cards={[]}
                    currentCardIdx={0}
                    targetDepartment={activeTargetDepartment}
                  />
                ) : isFeesStage ? (
                  <DepartmentFeesCard departmentId={activeFeesDepartmentId} />
                ) : isDepartmentOverviewStage && activeDepartmentId ? (
                  <DepartmentCardFactory 
                    departmentId={activeDepartmentId}
                    slides={departmentSlides}
                    currentIdx={currentCardIdx}
                    onNext={() => handleCardSelect(Math.min(departmentSlides.length - 1, currentCardIdx + 1))}
                    onPrev={() => handleCardSelect(Math.max(0, currentCardIdx - 1))}
                    onSelectSlide={handleCardSelect}
                    language={language}
                    onClose={() => {
                      setIsDepartmentOverviewStage(false);
                      setActiveDepartmentId(null);
                      currentUiLockRef.current = 'IDLE';
                    }}
                  />
                ) : courseMenuOptions.length > 0 ? (
                  <CourseMenuComponent options={courseMenuOptions} onSelect={handleCourseMenuSelect} />
                ) : isDocumentsStage ? (
                  <DocumentsBlock />
                ) : isInfoSlideStage && infoSlides.length > 0 ? (
                  <DepartmentCardStage
                    departmentLabel=""
                    chipText={infoSlideChip}
                    slides={infoSlides}
                    currentCardIdx={currentCardIdx}
                    onCardClick={handleCardSelect}
                  />
                ) : activeCards && activeCards.length > 0 ? (
                  <LeadershipOverview 
                    cards={activeCards} 
                    currentCardIdx={currentCardIdx} 
                    targetDepartment={activeTargetDepartment}
                    onCardClick={handleCardSelect}
                  />
                ) : null}
                </div>
              </div>
              <motion.aside className="interaction-panel-30">

                <header className="panel-header"><div className="panel-title flex items-center gap-2"><Sparkles size={18} /> CLARA</div></header>
                <div ref={scrollRef} className="panel-messages no-scrollbar">
                  {filteredMessages.map((m, i) => isTextMessage(m) && (
                    m.role === 'user' 
                      ? <div key={m.id || i} className="bubble-user">{m.text}</div>
                      : <AnimatedAiMessage 
                          key={m.id || i} 
                          text={m.text} 
                          animate={i === filteredMessages.length - 1}
                          audioDuration={i === filteredMessages.length - 1 ? currentAudioDuration : 0}
                          className="bubble-clara" 
                        />
                  ))}
                  {isProcessing && !isDocumentsStage && (
                    <div className="bubble-clara bubble-thinking">
                      <span aria-hidden>{thinkingEmoji}</span> {thinkingTagline}
                    </div>
                  )}
                </div>
                <div className="orb-float-panel">
                  <VoiceOrb state={orbState} amplitude={voiceAnalyser.amplitude} onTap={handleOrbTap} />
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
