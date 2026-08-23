export interface Subtitle {
  id: string;
  start: number; // in milliseconds
  end: number; // in milliseconds
  text: string;
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
  searchQueries: SearchQuery[];
  engineMetadata?: {
    modelUsed: string;
    isFallback: boolean;
    fallbackReason?: string;
    attempts?: Array<{ model: string; status: "success" | "failed" | "skipped"; error?: string }>;
    latencyMs?: number;
  };
}

export type VideoSourceMode = "preset" | "upload" | "youtube";

export interface ExportProgressState {
  isExporting: boolean;
  progressPercent: number;
  statusMessage: string;
  exportAspectRatio: "9:16" | "16:9";
  downloadUrl: string | null;
  fileName: string | null;
  error: string | null;
}
