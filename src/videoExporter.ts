import { ProcessedClip, Subtitle, SearchQuery } from "./types.js";

export interface RenderOptions {
  videoElement: HTMLVideoElement | null;
  videoSrc: string | null;
  sourceMode?: "preset" | "upload" | "youtube";
  youtubeUrl?: string;
  videoBase64?: string | null;
  file?: File | null;
  clipStartSec: number;
  clipEndSec: number;
  totalDuration: number;
  aspectRatio: "9:16" | "16:9";
  subtitles: Subtitle[];
  verifiedClaims: SearchQuery[];
  clipTitle: string;
  onProgress: (percent: number, message: string) => void;
  shouldCancel: () => boolean;
}

export interface RenderResult {
  blob: Blob;
  downloadUrl: string;
  fileName: string;
  durationSec: number;
}

/**
 * Server-Side FFmpeg Render Exporter
 * Slices exact highlight with speech envelope padding (+/- 0.5s),
 * reframes to 9:16 with ambient background blur or 16:9 widescreen,
 * burns synchronized verbatim subtitles and the Parallel API Fact-Check HUD badge.
 */
export async function exportVideoViaServerFFmpeg(
  options: RenderOptions
): Promise<RenderResult> {
  const {
    sourceMode = "youtube",
    youtubeUrl,
    videoSrc,
    videoBase64,
    file,
    clipStartSec,
    clipEndSec,
    aspectRatio,
    subtitles,
    verifiedClaims,
    clipTitle,
    onProgress,
    shouldCancel
  } = options;

  if (shouldCancel()) {
    throw new Error("Export cancelled by user.");
  }

  onProgress(10, "Connecting to server-side FFmpeg rendering engine...");

  let base64Payload = videoBase64;
  if (sourceMode === "upload" && !base64Payload && file) {
    onProgress(15, "Reading uploaded MP4 file buffer for server rendering...");
    base64Payload = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read uploaded video file"));
      reader.readAsDataURL(file);
    });
  }

  if (sourceMode === "upload" && !base64Payload) {
    throw new Error("No video media buffer available. Please upload an MP4 file to render.");
  }

  const activeClaim =
    verifiedClaims.find(
      (c) => c.status === "success" || (c.results && c.results.length > 0)
    ) || verifiedClaims[0];

  const payload: any = {
    sourceType: sourceMode,
    youtubeUrl: youtubeUrl || videoSrc,
    presetSrc: videoSrc,
    videoBase64: base64Payload || null,
    clipStartSec,
    clipEndSec,
    aspectRatio,
    subtitles,
    verifiedClaim: activeClaim,
    clipTitle
  };

  if (shouldCancel()) {
    throw new Error("Export cancelled by user.");
  }

  onProgress(35, "Encoding high-bitrate video stream with verbatim subtitles & HUD badge...");

  const response = await fetch("/api/export-video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorDetail = "Server video export failed.";
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errorDetail;
    } catch (e) {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  if (shouldCancel()) {
    throw new Error("Export cancelled by user.");
  }

  onProgress(85, "Downloading finalized MP4 video container...");

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const cleanTitle = (clipTitle || "Highlight")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 30);
  const fileName = `CineFact_45s_${cleanTitle}_${aspectRatio.replace(":", "x")}.mp4`;

  onProgress(100, "Render complete! MP4 file downloaded successfully.");

  return {
    blob,
    downloadUrl,
    fileName,
    durationSec: Math.max(1, clipEndSec - clipStartSec + 1)
  };
}

/**
 * Main export function to compile 45s MP4 social short.
 * All sources (uploaded MP4s, presets, and YouTube streams) are processed
 * exclusively through server-side FFmpeg to guarantee frame accuracy, zero seek lag,
 * accurate audio-video synchronization, and burned subtitles.
 */
export async function export45sSocialVideo(
  options: RenderOptions
): Promise<RenderResult> {
  return await exportVideoViaServerFFmpeg(options);
}
