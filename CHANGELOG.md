# Changelog

All notable changes to the CineFact AI platform are documented in this file.

## [2.5.2] - 2026-09-04

### Added
- **Primary Player Bar Aspect Ratio Selector**:
  - Exposed a dedicated social aspect ratio button group directly on the primary player toolbar next to "Export .MP4":
    `[ 9:16 Vertical | 1:1 Square | 4:5 Feed | 16:9 Wide ]`.
  - Added active emerald highlight rings, title tooltips, and seamless propagation of chosen aspect ratio into `/api/export-video` and the client-side canvas exporter.
- **Global Timeline Chaptering & Density Analysis**:
  - Upgraded the multimodal extraction prompt in `server.ts` to enforce a mandatory full-timeline scan from second 0 to the final second.
  - The model breaks the entire video into 3 to 5 narrative chapters (`timelineChapters`) with objective `engagementScore` metrics (0-100) and narrative roles (`hook`, `setup`, `evidence`, `climax`, `takeaway`).
  - Added the **AI-Mapped Chapters & Density Navigator** directly beneath the timeline scrubber. Clicking any chapter card automatically jumps the highlight window and video playhead to that moment.
- **Interactive Timeline Boundary Nudge Controls**:
  - Implemented `[-1s]` and `[+1s]` nudge buttons for both Start and End highlight boundaries in `App.tsx`.
  - Added quick one-click duration presets (`30s`, `40s`, `45s`) to fine-tune highlight durations without re-running AI extraction.
  - Allowed direct numeric entry for both Start and End boundary seconds.

### Changed
- **Clean Error Handling & Status Feedback**:
  - Wrapped upstream Gemini model attempts in sanitized handlers, eliminating false-positive console error counters when benign failovers succeed.
  - Replaced the large, intrusive amber warning banner with a compact, dismissible engine status badge in the header bar (`ENGINE: GEMINI 3.6 FLASH [AUTO-ROUTED] [×]`).

## [2.5.1] - 2026-09-04

### Fixed
- **Gemini 3.x Model Ingestion Cascade & 90s Ingestion Timeout**:
  - Configured model cascade to `["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"]`.
  - Increased ingestion timeout limit to 90 seconds per model so multi-minute and larger video uploads have ample time to process.
  - Enhanced Gemini Files API (`ai.files.upload`) processing loop to poll until `uploadResult.state === "ACTIVE"` (up to 45 seconds) before triggering multimodal reasoning.
- **Unrestricted Playback & Scrubber Unclamping**:
  - Removed artificial 45-second timeline bounding boxes and disabled premature playback looping when a video is unanalyzed or on error (`processedClip === null`).
  - Allowed full unrestricted scrubbing and playback across the full video duration (e.g., 00:00 to 01:38).
  - Dynamically updated timeline buttons and bounds controls: displays "Play Full Video" when awaiting analysis, and seamlessly transitions to stitched reel or highlight loop playback once analysis completes.

## [2.5.0] - 2026-09-04

### Added
- **Smart Multi-Slot Highlight Compilation Engine**:
  - Upgraded video understanding in `server.ts` with global timeline chaptering and density scoring to intelligently identify and compile 2 to 3 complementary high-impact moments (Hook, Evidence, Takeaway) totaling 40-45 seconds.
  - Implemented structured `highlightSegments` output with narrative roles (`hook`, `evidence`, `takeaway`), density scores (0-100), and selection summaries.
  - Added timestamp remapping for verbatim subtitles (`stitchedSubtitles`) to seamlessly align dialogue with the concatenated 40-45s output timeline.
- **FFmpeg Multi-Cut Concatenation Pipeline**:
  - Replaced single-slice export with an advanced FFmpeg `filter_complex` concatenation graph using PTS resets (`trim`/`setpts`, `atrim`/`asetpts`, `concat=n=N:v=1:a=1`).
  - Added dynamic audio detection via `ffprobe` to gracefully handle video streams with or without audio tracks.
  - Burned remapped subtitles and the Parallel API fact-checking HUD badge across the entire concatenated multi-slot video.
- **Frontend Multi-Segment Scrubber & Compilation Breakdown**:
  - Enhanced the timeline scrubber in `App.tsx` with color-coded markers for each highlight slot (Emerald for Hook, Sky Blue for Evidence, Amber for Takeaway) with duration tags and click-to-seek support.
  - Added the **Multi-Slot Compilation Breakdown Card** in the Highlight Meta tab with slot badges, timestamps, density metrics, selection rationales, and instant preview buttons.
- **Upload-Only Dedicated Architecture**:
  - Streamlined the entire platform to focus purely on the custom video upload workflow (MP4, WebM, MOV, OGG).
  - Directly rendered the drag-and-drop dropzone, file selection, custom title, and contextual summary controls in the primary left ingestion panel.
- **Immediate State Reset on New Uploads**:
  - Added an instant state reset in `handleFileUpload` that wipes previous subtitles, claims, highlight boundaries, verification tags, and export states as soon as a new file is dropped or selected.
  - Eliminated "ghost" subtitle leakage and prevented cross-contamination between consecutive video uploads.
- **Awaiting Analysis Status & Export Guard**:
  - Introduced an "Awaiting Analysis" badge in the video viewport HUD and active highlight banner whenever an unanalyzed video is loaded.
  - Strictly disabled the "Export .MP4" button until Gemini multimodal analysis successfully completes for the currently loaded video asset.
  - Added an "Analyze & Extract 45s Highlight" action button with visual focus ring and active stage progress indicators.
- **Robust Gemini Processing with 25-Second Timeout & Fallback**:
  - Uploaded video buffers are ingested via the Gemini Files API (`ai.files.upload`) with automated state polling until reaching the `ACTIVE` state.
  - Enforced a 25-second execution timeout on primary calls to `gemini-3.8-flash`, automatically falling back to `gemini-3.7-flash` and `gemini-3.5-flash` if processing stalls on large or multi-minute videos.
  - Extracted verbatim synchronized subtitles and 3 targeted factual verification queries strictly grounded in the analyzed upload media.

### Removed
- **Static Presets & Demo Data**:
  - Completely stripped out sample presets, template catalog selectors, and hardcoded demo data from `server.ts`, `src/data.ts`, `src/types.ts`, `src/videoExporter.ts`, and `src/App.tsx`.
  - Removed obsolete tab switchers and preset fallback logic across all endpoints.

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
