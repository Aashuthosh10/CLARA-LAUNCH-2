/**
 * Chat message and payload types for CLARA voice conversation screen.
 * State-driven; no business logic in UI.
 */

export type MessageRole = 'user' | 'clara';

export interface BaseMessage {
  id: string;
}

export interface TextMessage extends BaseMessage {
  role: MessageRole;
  text: string;
  timestamp?: string;
}

/** System messages: connection status, "I didn't catch that", etc. */
export interface SystemMessage extends BaseMessage {
  role: 'system';
  text: string;
}

export interface CardCta {
  label: string;
  action: string;
  href?: string;
}

export interface CardMessage extends BaseMessage {
  type: 'card';
  /** Optional image URL (high clarity, scaled for 13.3" 1080p) */
  image?: string;
  /** Pill tags above image, e.g. ["8K RENDER", "RAY TRACED"] */
  tags?: string[];
  title: string;
  description?: string;
  /** Primary and secondary CTAs; min 100px tap target */
  cta?: CardCta[];
  /** Show listening indicator inside card when true */
  showListening?: boolean;
  /** Optional timestamp label */
  timestamp?: string;
}

/** Diary-style college brief page (from college_info repo style) */
export interface CollegeBriefPage {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  image?: string;
}

export interface CollegeBriefMessage extends BaseMessage {
  type: 'college_brief';
  /** Diary-style pages/sections to render inside the card */
  pages: CollegeBriefPage[];
  timestamp?: string;
}

export interface ImageCardMessage extends BaseMessage {
  type: 'image_card';
  image: string;
  title?: string;
  description?: string;
  timestamp?: string;
}

export type ChatMessage = TextMessage | CardMessage | CollegeBriefMessage | ImageCardMessage | SystemMessage;

export function isCardMessage(m: ChatMessage): m is CardMessage {
  return 'type' in m && m.type === 'card';
}

export function isCollegeBriefMessage(m: ChatMessage): m is CollegeBriefMessage {
  return 'type' in m && m.type === 'college_brief';
}

export function isImageCardMessage(m: ChatMessage): m is ImageCardMessage {
  return 'type' in m && m.type === 'image_card';
}

export function isSystemMessage(m: ChatMessage): m is SystemMessage {
  return 'role' in m && m.role === 'system';
}

export function isTextMessage(m: ChatMessage): m is TextMessage {
  return !isCardMessage(m) && !isCollegeBriefMessage(m) && !isImageCardMessage(m) && !isSystemMessage(m);
}

/** Orb state: automatically manages UI feedback during conversations */
export type OrbState = 'idle' | 'ready' | 'listening' | 'processing' | 'speaking' | 'completed';
