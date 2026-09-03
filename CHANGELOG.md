# Changelog

All notable changes to the CineFact AI platform are documented in this file.

## [2.4.0] - 2026-09-01

### Added
- **Native Gemini Files API & Direct YouTube Ingestion**:
  - Refactored backend video ingestion in `server.ts` to pass native YouTube URLs directly to Gemini 3.7 Flash using the `@google/genai` SDK `fileData.fileUri`.
  - Integrated the Gemini Files API (`ai.files.upload`) for local MP4/WebM uploads, transferring raw video buffers directly to Gemini without local container scraping hacks.
- **Agentic Video Understanding**:
  - Upgraded prompt orchestration to leverage Gemini's goal-directed video understanding loop across visual scenes, on-screen text/OCR, audio dynamics, and dialogue.
  - Sub-second temporal precision for 45-second highlight bounding (`clipStartSec`, `clipEndSec`), verbatim multilingual subtitles, and 3 targeted factual verification queries.
- **Clean Architecture & Streamlined Error Trapping**:
  - Removed deprecated scraping binaries and external shell dependencies.
  - Added clean, structured diagnostics and API key validation.

## [2.3.0] - 2026-08-23

### Added
- **Zero-Dependency YouTube TimedText Caption Fetcher**:
  - Implemented a pure Node.js caption crawler in `server.ts` that directly queries YouTube timedtext endpoints without relying on external system binaries.
  - Automatically fetches, cleans, and converts XML/JSON caption cues into timestamped transcripts for Gemini 3.7 Flash context grounding.
- **Strict Grounding Validation & Error Trapping**:
  - Enforced strict ground-truth pre-validation: rejects blind analysis requests if neither verbatim captions nor audio tracks can be parsed from a video stream.
  - Returns clear, actionable UI diagnostics prompting users to upload the raw MP4 file or supply transcript notes when bot verification prevents direct YouTube extraction.
- **Ground-Truth Preset Data Synchronization**:
  - Fully populated `src/data.ts` preset definitions with verbatim timestamped dialogue subtitles (`00:08 - 00:55`) and targeted Parallel API search queries.
  - Resolved preset subtitle/timeline desynchronization and eliminated browser iframe `postMessage` cross-origin errors.

### Fixed
- **Runtime Error Elimination**:
  - Resolved missing binary execution crashes (`/bin/sh: yt-dlp: not found`).
  - Fixed HTML5 video player race conditions during preset switching and local media upload initialization.

## [2.2.0] - 2026-08-23

### Added
- **YouTube Ground-Truth Extraction Engine via `yt-dlp`**:
  - Automatically fetches true timestamped subtitles (`--write-auto-subs`, `--write-subs`, WebVTT format) from YouTube before calling Gemini.
  - Automatically parses WebVTT cues into clean timestamped transcript segments and passes them as strict ground-truth context to Gemini 3.7 Flash.
  - Falls back to lightweight MP3 audio stream extraction (`yt-dlp -x`) if subtitles are unavailable, passing native audio bytes directly into Gemini's multimodal audio context.
- **Backend FFmpeg Audio Extraction for Local Uploads**:
  - Automatically converts uploaded MP4 video files into high-fidelity, lightweight MP3 audio tracks server-side.
  - Ingests true audio bytes into Gemini 3.7 Flash multimodal input to ensure 100% verbatim dialogue synchronization and accurate highlight detection.
- **Actionable Error Banners**:
  - Added dedicated UI error banners in `src/App.tsx` when an API key is missing or model processing fails, eliminating deceptive fallback behavior.

### Removed
- **Deceptive Hardcoded Fallbacks**:
  - Completely removed hardcoded simulation presets in `server.ts` that previously rendered artificial subtitles when analysis failed.
  - The workstation now strictly verifies ground-truth media context or returns clear, actionable error feedback.

## [2.1.0] - 2026-08-23

### Added
- **Server-Side FFmpeg & `yt-dlp` Video Rendering Endpoint (`/api/export-video`)**:
  - Implemented server-side direct CDN stream extraction via `yt-dlp` to capture raw 1080p video and AAC audio.
  - Eliminated browser iframe CORS canvas tainting and black-screen issues during YouTube and external stream exports.
  - Added **9:16 Vertical Short Reframing** with dynamic ambient background `boxblur` and letterboxing for TikTok, Instagram Reels, and YouTube Shorts.
  - Added **16:9 Landscape Mode** for standard widescreen video packaging.
  - Built on-the-fly Advanced Substation Alpha (`.ass`) script generation to burn verbatim multilingual subtitles and the **Parallel API Fact-Check Badge HUD** directly into video frames.
  - Enforced a strict **45-second duration window** with `+/- 0.5s` natural speech padding.

### Changed
- **Gemini 3.x Multimodal Fallback Chain in `server.ts`**:
  - Added structured failover priority: `gemini-3.7-flash` -> `gemini-3.6-flash` -> `gemini-3.5-flash` -> `gemini-3.1-pro-preview`.
  - Added automated handling for upstream `503 UNAVAILABLE` capacity spikes and `429 RATE_LIMIT` errors.
  - Applied the multi-model resilience loop to live Google Search Grounding for parallel claim verification.
- **Client-Side Video Export Architecture (`src/videoExporter.ts`)**:
  - Maintained HTML5 `<video>` element canvas capture with `AudioContext` and `MediaStreamAudioDestinationNode` for native local file uploads (Blob URLs).
  - Automatically routes YouTube and preset streams to `/api/export-video` and local uploads to the direct canvas pipeline.

### Diagnostics & UI
- Added granular server-side diagnostic logs (`[DIAGNOSTIC - KEY MISSING]`, `[DIAGNOSTIC - AUTH ERROR]`, `[DIAGNOSTIC - CAPACITY SPIKE / 503 / 429]`, `[DIAGNOSTIC - SUCCESS]`).
- Added active engine status badge in the header with auto-failover notification banner.
- Suppressed benign iframe WebSocket disconnect logs in `src/main.tsx` to maintain preview stability.
