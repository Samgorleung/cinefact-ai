export interface Subtitle {
  id: string;
  start: number; // in milliseconds
  end: number; // in milliseconds
  text: string;
  originalStart?: number; // original video start time in ms
  originalEnd?: number; // original video end time in ms
}

export interface TimelineChapter {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  role: "hook" | "setup" | "evidence" | "climax" | "takeaway";
  summary: string;
  engagementScore: number; // 0 - 100
}

export interface HighlightSegment {
  id?: string;
  startSec: number;
  endSec: number;
  role: "hook" | "setup" | "evidence" | "climax" | "takeaway" | string;
  summary: string;
  score?: number;
}

export interface ParallelSearchResult {
  title: string;
  snippet: string;
  url: string;
  sourceDomain?: string;
  confidenceScore?: number; // 0 - 100%
  verificationVerdict?: "VERIFIED" | "CONTEXT ADDED" | "DISPUTED" | "HIGH AUTHORITY";
  claimAddressed?: string;
}

export interface SearchQuery {
  query: string; // English search query for Parallel API
  purpose: string;
  category?: "Statistical Claim" | "Historical & Factual" | "Entity & Location" | "Regulatory & Policy" | "General Context";
  targetClaim?: string;
  status?: "pending" | "success" | "error";
  results?: ParallelSearchResult[];
}

export interface VideoTemplate {
  id: string;
  title: string;
  language: string; // e.g. "English (US)", "Cantonese (廣東話)", "Spanish", etc.
  category: string;
  duration: number; // in seconds
  description: string;
  transcript: string;
  videoUrl: string; // Direct mp4 or YouTube link
  youtubeId?: string;
  aspectRatio: "16:9" | "9:16";
  audienceType: string;
  clipStart?: string;
  clipEnd?: string;
  highlightReason?: string;
  viralityScore?: number;
  subtitles?: Subtitle[];
  searchQueries?: SearchQuery[];
}

export interface ProcessedClip {
  title: string;
  detectedLanguage: string; // e.g. "English", "Cantonese (繁體中文)", "Spanish", etc.
  clipStart: string; // e.g., "00:15"
  clipEnd: string; // e.g., "01:00"
  clipStartSec: number;
  clipEndSec: number;
  highlightReason: string;
  viralityScore: number;
  socialMetadata: {
    instagramHook: string;
    caption: string;
    hashtags: string[];
  };
  subtitles: Subtitle[];
  stitchedSubtitles?: Subtitle[];
  highlightSegments?: HighlightSegment[];
  timelineChapters?: TimelineChapter[];
  searchQueries: SearchQuery[];
  directorCuts?: DirectorCut[];
  clearanceDossier?: StudioClearanceDossier;
  engineMetadata?: {
    modelUsed: string;
    isFallback: boolean;
    fallbackReason?: string;
    attempts?: Array<{ model: string; status: "success" | "failed" | "skipped"; error?: string }>;
    latencyMs?: number;
  };
}

export interface DirectorCut {
  id: "cut-hook" | "cut-lore" | "cut-climax" | "cut-summary" | string;
  label: string; // e.g. "Cut A: Viral Hook" or "Cut D: Key Moments Digest"
  style: "hook" | "lore" | "climax" | "summary" | string;
  tagline: string;
  clipStartSec: number;
  clipEndSec: number;
  clipStart: string;
  clipEnd: string;
  viralityScore: number;
  retentionEstimate: string; // e.g. "92% completion rate"
  highlightReason: string;
  suggestedAspectRatio: SocialAspectRatio;
  primaryClaimIndex?: number;
  highlightSegments?: HighlightSegment[];
  subtitles?: Subtitle[];
}

export interface StudioClearanceRecord {
  id: string;
  timestamp: string;
  timestampSec: number;
  claim: string;
  speaker?: string;
  category: "Legal & Copyright" | "Fact & Statistics" | "Historical & Biography" | "Corporate & IP" | "Health & Policy";
  status: "CLEAR" | "AUDIT NEEDED" | "VERIFIED WITH SOURCES" | "CAUTION";
  confidence: number; // 0 - 100
  corroborationSources: Array<{
    title: string;
    domain: string;
    url: string;
    authorityScore: number; // e.g. 96
    snippet: string;
  }>;
  legalRiskScore: "LOW" | "MEDIUM" | "HIGH";
  complianceNote: string;
}

export interface StudioClearanceDossier {
  dossierId: string;
  projectTitle: string;
  generatedAt: string;
  overallStatus: "APPROVED FOR BROADCAST" | "CONDITIONAL CLEARANCE" | "REQUIRES EDITORIAL AUDIT";
  complianceScore: number; // e.g. 94%
  auditorAgent: string; // "CineFact Studio Clearance Agent v2.8.4 (Parallel Grounded)"
  records: StudioClearanceRecord[];
  summary: string;
  recommendedDisclaimers?: string[];
  auditHash: string;
}

export type VideoSourceMode = "upload";

export type SocialAspectRatio = "9:16" | "1:1" | "4:5" | "16:9";

export interface ExportProgressState {
  isExporting: boolean;
  progressPercent: number;
  statusMessage: string;
  exportAspectRatio: SocialAspectRatio;
  downloadUrl: string | null;
  fileName: string | null;
  error: string | null;
}
