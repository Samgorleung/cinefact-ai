# Changelog 

All notable changes to the CineFact AI platform are documented in this file.

## [2.8.6] - 2026-09-07

### Removed & Cleaned
- **Sample Demo Video & Asset Cleanup**:
  - Deleted `/public/sample_demo.mp4` default asset and all code references to `sample_demo.mp4` across client and server.
  - Removed "LOAD SAMPLE VIDEO (INSTANT DEMO)" button from the upload zone and the secondary sample button in the Subtitles tab.
  - Initialized application and video player with an empty state on launch, waiting cleanly for user drag-and-drop or file selection.
  - Cleared out demo placeholder titles and presets.
  - Added clean idle placeholder in player viewport: "Upload a video file to begin analysis".
  - Ensured "Analyze & Extract Highlight" master action button remains disabled until a valid video file is loaded.

## [2.8.5] - 2026-09-07

### Fixed
- **UI Screen Vanishing on Secret/Environment Variable Update**:
  - **Refined `isProduction` Environment Detection in `server.ts`**:
    - Replaced generic container environment checks (`process.env.K_SERVICE !== undefined`) with a strict condition requiring both `process.env.NODE_ENV === "production"` and the presence of `dist/index.html`.
    - Prevented development sandboxes hosted on Cloud Run from misidentifying container restarts (such as when secrets like `GEMINI_API_KEY` are updated in the Settings panel) as production environments.
    - Guaranteed that the Vite development middleware is properly mounted in dev mode to compile JSX and TypeScript on the fly, eliminating the issue where raw `.tsx` files were served as `application/octet-stream` and blocked by browser module loaders.
    - Verified hot server restart and confirmed that `/src/main.tsx` is served with `Content-Type: text/javascript`, completely restoring the preview UI.

## [2.8.4] - 2026-09-05

### Fixed
- **Cloud Run Deployment Failure & Container Lifecycle**:
  - **Standardized Start Command**: Updated `"start"` in `package.json` to `"node dist/server.cjs"` (removing the inline `NODE_ENV=production` shell prefix that caused executable-lookup failures on Cloud Run container entrypoint launchers).
  - **Autonomous Production Detection in Bundled Server**: Updated `isProduction` detection in `server.ts` to inspect execution context (`__filename.endsWith(".cjs")`, `process.argv[1]` referencing `server.cjs` or `dist`), ensuring the bundled server always serves production assets even when `NODE_ENV` is unset.
  - **Robust Multi-Candidate Static Directory Resolution**: Added fallback candidate search (`process.cwd()/dist`, `process.cwd()`, `__dirname`) to locate `index.html` regardless of the container execution working directory.
  - **Container Health Probes**: Added dedicated `/healthz` and `/_health` HTTP GET endpoints alongside `/api/health` to satisfy Cloud Run startup and liveness checks instantly.
- **Dev Server Startup (`ReferenceError: __dirname is not defined`)**:
  - Resolved fatal server startup crash in development mode under ES Module runtime (`"type": "module"` in `package.json` with `tsx`).
  - Removed CommonJS `__dirname` references in `server.ts` in favor of portable `process.cwd()` path resolution and standard environment detection (`K_SERVICE`, `GOOGLE_CLOUD_PROJECT`, `NODE_ENV`).
  - Verified local dev server boots cleanly on port 3000 and responds to `/api/health` with `{"status":"ok"}`.
- **Cloud Run Production Deployment & Service Stability**:
  - **Dependency Scoping for Container Build**: Ensured `esbuild` and `vite` are present in `dependencies` in `package.json` so container buildpacks enforcing `NODE_ENV=production` can execute `npm run build` without missing-binary errors.
  - **Dynamic Vite Middleware Import**: Converted top-level `vite` imports in `server.ts` to scoped dynamic imports (`await import("vite")`) executed only when running in development mode, stripping runtime Vite dependencies from the production bundle.
  - **Filesystem Fallback for Container Safety**: Wrapped temporary working directory initialization (`tmp_exports`, `tmp_grounding`, `tmp_uploads`) with automatic `/tmp` fallback to prevent startup failures on read-only or restricted container filesystems.

### Changed
- **Version Alignment**:
  - Bumped platform and clearance auditor agent version to `2.8.4` across `package.json`, `server.ts`, and `src/types.ts`.

## [2.8.3] - 2026-09-05

### Fixed
- **Player 2 Sudden Playback Interruption on Initial Play**:
  - Resolved an issue where Player 2 would abruptly pause at ~second 0:08 during initial playback when background FFmpeg compilation completed.
  - Stabilized the `<video>` element `key` property (`activeCutId || "summary-video-viewport"`) to prevent React from unmounting and remounting the video DOM node when `summaryVideoUrl` is received from the server.
  - Implemented seamless state preservation using `isPlayingRef` and `currentTimeRef` with a dedicated one-time `canplay` listener, ensuring uninterrupted playback when swapping from the live preview to the final rendered MP4 asset.

### Changed
- **Dynamic Verification Confidence Score in Player 2**:
  - Replaced the static `"98% VERIFIED"` fallback badge in the Player 2 HUD header with dynamic evaluation of the verified claim's confidence score (`verifiedClaim.results[0].confidenceScore`), rendering exact percentage confidence for each factual claim.
- **Auditor Version Alignment**:
  - Updated auditor agent identifier and documentation across `server.ts`, `src/types.ts`, and `package.json` to version `2.8.3`.

## [2.8.2] - 2026-09-05

### Changed
- **Removed Misleading "Burning Verbatim Subtitles" Status Messages**:
  - Corrected compiling status message in Player 2 (`src/App.tsx`) from `"Encoding video frames and burning verbatim subtitles..."` to `"Encoding clean video frames (within 45s)..."`.
  - Updated compilation initiation status from `"Compiling Summary MP4 (${ratioToUse}) within 45s with subtitles & fact overlay..."` to `"Compiling Summary MP4 (${ratioToUse}) within 45s..."`.
  - Updated export engine description and modal composition breakdown in `src/App.tsx` from "Overlays Burned: Verbatim Subtitles + Parallel Fact Badge HUD" to "Video Processing: Clean High-Fidelity Video Stream (Within 45s)".
  - Updated button tooltips in Player 2 (`SummaryVideoPlayer.tsx`) to remove "burn-in" and "and subtitles" references.
  - Aligned export engine progress messages in `src/videoExporter.ts` to "Encoding high-bitrate clean video stream (within 45s)...".

### Removed
- **Eliminated In-Video Transcript Overlays**:
  - Completely removed the on-screen synchronized subtitle/transcript overlay (`<AnimatePresence>{activeSubtitle && ...}</AnimatePresence>`) from inside Player 1's video viewport in `src/App.tsx`.
  - Guaranteed that video playback across all player viewports displays pristine, unobstructed video footage without any burned-in or overlaid transcript text inside the video frames.

## [2.8.1] - 2026-09-05

### Changed
- **Gemini Model Alignment to Gemini 3.8 Flash**:
  - Corrected the Highlight Meta empty state prompt from "Gemini 3.7 Flash" to "Gemini 3.8 Flash" (`src/App.tsx`).
  - Aligned social hook export metadata footer and engine indicators to display Gemini 3.8 Flash dynamically.
  - Aligned server console logs and citation benchmarks in `server.ts` to reference Gemini 3.8 Flash architectures.
  - Synchronized `README.md` and codebase documentation to align with Gemini 3.8 Flash.

- **Residue Information Removal in Player 1**:
  - Eliminated stale residue data (`Cut: 00:12 → 00:57 (45s)`) before any video is uploaded or analyzed.
  - Initialized default timeline states (`duration: 0`, `clipStartSec: 0`, `clipEndSec: 0`) to clean uninitialized values.
  - Conditioned cut bounds indicators strictly on `processedClip && clipEndSec > clipStartSec` so they only render when valid highlight bounds have been analyzed.
  - Formatted Player 1 length to `--:--` when no video is loaded.
  - Conditioned Player 1 playback mode switcher (`Watch Full Video` / `Loop Cut Window`) to only render when a video source has been ingested.

- **Default Demo Video Prevention in Player 2**:
  - Removed hardcoded `"/sample_demo.mp4"` fallbacks from Player 2 in `src/App.tsx` and `src/components/SummaryVideoPlayer.tsx`.
  - Player 2 now initializes with a clean `Awaiting Video` placeholder state and explanatory guidance until a video is uploaded or selected.
  - Disabled scrub bar seeking and playback actions when no video source is loaded to prevent invalid interactions.
  - Preserved instant demo capabilities via the "LOAD SAMPLE VIDEO (INSTANT DEMO)" button.

- **Version Synchronization**:
  - Bumped version to `2.8.1` across `package.json`, `src/types.ts`, and `server.ts` (`StudioClearanceDossier` auditor agent: `CineFact Studio Clearance Agent v2.8.1 (Parallel Grounded)`).

## [2.8.0] - 2026-09-05

### Added
- **Clean Video Box & Pure Footage Playback**:
  - Completely removed on-screen subtitle overlays and transcript boxes from inside the Player 2 video container (`SummaryVideoPlayer.tsx`), providing an unobstructed, cinematic viewing canvas.
  - Eliminated server-side ASS subtitle burning in `/api/export-video` (`server.ts`) so that rendered and downloaded highlight MP4s contain pure, pristine video footage without burned-in dialogue or transcript text.
  - Removed burned-in `[PARALLEL API GROUNDED]` badges and claim quote strings from inside the video frame.
- **HUD Grounded Badge Repositioning**:
  - Repositioned the external `PARALLEL GROUNDED` claim verification badge cleanly outside the video frame, placed directly between the `FILL (MATCH PLAYER 1)` / Aspect ratio controls toolbar and the Player 2 video container.
  - Ensured all fact-checking metadata and high-authority confidence scores remain prominent while keeping the inside of the video box 100% clean.
- **Vertical Director's Cut Card Hierarchy (Zero Hover Truncation)**:
  - Redesigned each Director Cut card in `DirectorCutBar.tsx` into a strict, scannable vertical typographic stack:
    1. **Top line**: Narrative role badge (`Hook`, `Lore`, `Climax`, `Summary (3 Moments)`).
    2. **Second line**: Virality score (`82% viral`, `95% viral`, etc.).
    3. **Third line**: Cut identifier and timing (`Cut A: Viral Hook`, `Cut B: Deep Evidence`, etc.).
    4. **Fourth line**: Duration guarantee (`Within 45s`).
    5. **Fifth line**: Predicted retention sentence (`94% completion rate predicted on mobile feeds`).
  - Rendered complete retention estimates and narrative reasons with `break-words` and `line-clamp-none`, ensuring full sentences are immediately readable without requiring mouse-over or tooltip interaction.
- **Player 2 Video Playback for All Cut Options**:
  - Fixed an issue where switching between Director's Cut options (Cut A, Cut B, Cut C, Cut D) could display no video or fail to start playback in Player 2.
  - Implemented multi-cut video caching (`producedCutsMap`) in `App.tsx` to instantly serve already-compiled MP4s when switching between cuts.
  - Added an automatic background compilation trigger and multi-layer fallback (`currentVideoSrc || serverStreamUrl || uploadedVideoUrl || "/sample_demo.mp4"`) so Player 2 always has active video and audio for any cut option.
  - Guarded playback state using `stableCutKey` in `SummaryVideoPlayer.tsx`, eliminating unexpected pauses and re-render interruptions during cut switching.
- **Sentence Integrity & Vocal Boundary Alignment in Multi-Moment Cuts (Cut D)**:
  - Overhauled `alignCutToSpeechBoundary` in `server.ts` to guarantee sentence completeness.
  - Implemented bidirectional boundary scanning across terminal punctuation (`.`, `?`, `!`, `。`, `！`, `？`) and natural vocal pauses (>= 350ms) to ensure speech never cuts off mid-sentence or mid-word across multi-moment transitions.
  - Added a 0.5s speech decay cushion to prevent abrupt cuts at moment junctions.
- **Narrative & Temporal Distinctness Between Cut B and Cut C**:
  - Guaranteed that Cut B and Cut C are strictly distinct in content and timing:
    - **Cut B (Deep Evidence & Lore)**: Anchored in the middle narrative third of the video, centering on technical proof, methodology, and core factual dialogue.
    - **Cut C (Punchy Takeaway & Climax)**: Anchored exclusively at the final narrative climax and concluding breakthrough statements.
    - Added fallback temporal differentiation ensuring distinct start/end timestamps even on short videos.

### Changed
- **Version Alignment & Metadata Synchronization**:
  - Upgraded platform version to `2.8.0` in `package.json`.
  - Updated `StudioClearanceDossier` auditor agent signatures to `CineFact Studio Clearance Agent v2.8 (Parallel Grounded)` across `server.ts` and `src/types.ts`.
  - Verified `metadata.json` and `index.html` descriptions to align with latest multi-cut, studio clearance, and Gemini 3.8 Flash capabilities.

## [2.7.0] - 2026-09-05

### Added
- **Unrestricted Original Video Playback (`player1Mode: "full" | "loopCut"`)**:
  - Implemented a dedicated playback mode switcher in Player 1's header bar:
    - **`Full Video (Unrestricted)`**: Allows viewers to scrub and watch the entire original video from beginning to end without artificial 45-second boundary limits or premature looping.
    - **`Loop Active Cut`**: Focuses playback strictly within the selected highlight cut window.
  - Fixed the issue where selecting a new cut restricted playback to only "Part 1: Hook (34%)", enabling full video viewing past the hook segment.
- **Speech Completion & Sentence Boundary Alignment ("Snap to Speech End")**:
  - Added an intelligent **"Snap to Speech End"** button in the timeline boundary toolbar.
  - Automatically calculates sentence-ending punctuation (`.`, `!`, `?`, `。`, `！`, `？`, `…`) and natural conversational pauses (>= 350ms) to ensure speech completes naturally with a 0.5s vocal decay cushion.
  - Added sub-second precision nudge controls (`[-0.5s]`, `[+0.5s]`, `[-1s]`, `[+1s]`) for frame-accurate start and end boundary tuning.
- **Continuous Transcript Flow & Subtitle Suite (`Tab 2: Transcript & Subtitles`)**:
  - Renamed and transformed the subtitle editor into a full **Transcript & Subtitles** suite with live subtitle count badge.
  - Added **`Full Flow` (Continuous Reading Transcript)**: Displays spoken speech in a clean, legible narrative flow where clicking any phrase immediately seeks the video playhead to that sentence.
  - Added **`Cards` (Timed Subtitles)**: Subtitle cards with start/end millisecond chips, one-click seek (`Play` icon), and in-place subtitle editing.
  - Added **Scope Filter (`All` vs `In Cut`)**: Toggle between viewing the full video's verbatim transcript or focusing only on speech inside the active cut envelope.
  - Added backend fallback synthesis in `server.ts` to ensure transcripts and subtitles are guaranteed even if model output omits verbatim chunks.

### Changed
- **Timeline Marker Refinement**:
  - Replaced rigid "Part 1 / Part 2" timeline labels with context-aware labels ("Moment 1: Hook", "Moment 2: Evidence").
  - Made timeline markers non-blocking (`pointer-events-none`), allowing scrubber clicks to seek freely to any exact millisecond without marker interference.

### Added
- **Multi-Cut Director's Studio & A/B Social Variations (`DirectorCutBar`)**:
  - Automatically extracts 4 distinct, purpose-driven highlight variations powered by multimodal Gemini reasoning:
    - **Cut A: Viral Hook (0-30s)**: High-retention opening optimized for rapid engagement on mobile feeds.
    - **Cut B: Deep Evidence (30-45s)**: In-depth highlight focusing on the core factual claim, evidence, and primary corroboration source.
    - **Cut C: Punchy Takeaway (15-30s)**: Dynamic climax and punchline cut tailored for maximum shares and re-posts.
    - **Cut D: Key Moments Digest (Within 45s)**: Stitched 3-slot non-contiguous summary condensing the overarching story arc (Hook + Evidence + Climax) into an under-45-second reel.
  - Interactive Director's Cut selector bar displaying retention estimates, virality scores, recommended social aspect ratios, and instant one-click cut switching.
  - One-click cut export buttons to render and download specific variations directly as `.mp4`.
- **Studio Broadcast Clearance & Fact-Check Dossier (`StudioClearanceModal`)**:
  - Full-screen broadcast compliance dossier auditing extracted dialogue and claims across 5 legal/editorial categories (*Legal & Copyright*, *Fact & Statistics*, *Historical & Biography*, *Corporate & IP*, *Health & Policy*).
  - Corroboration sources with domain authority scoring (0-100), legal risk assessment (`LOW`, `MEDIUM`, `HIGH`), compliance notes, and cryptographic audit hash.
  - Broadcast compliance status badge (`APPROVED FOR BROADCAST`, `CONDITIONAL CLEARANCE`, `REQUIRES EDITORIAL AUDIT`) and one-click JSON / printable compliance export.
- **Equal Viewport Sizing & Adaptive Display Controls for Player 2 (`SummaryVideoPlayer`)**:
  - Aligned Player 2's widescreen viewport with Player 1 (`aspect-video w-full`), allowing side-by-side or stacked comparisons with identical width and frame proportions.
  - Added a dedicated **Fill (Match Player 1)** vs. **Fit (Letterbox)** toggle directly in Player 2's header toolbar (`object-cover` vs `object-contain`).
  - Implemented high-impact tall viewport canvas (`min-h-[460px] h-[520px] sm:h-[580px]`) for `9:16` vertical reels, `1:1` square, and `4:5` feed formats.
  - Added a direct `"16:9 (Match Player 1)"` quick-switch button in the aspect ratio selector.
- **Non-Contiguous Multi-Segment Timeline Playback Engine**:
  - Seamless jump logic in Player 2 to preview stitched narrative digests (Cut D) across multiple time slices in real time without audio glitches or desync.
  - Verbatim subtitle cue shifting and live boundary clamping for discontinuous highlight segments.

### Changed
- **Initial Cut Playback & Timeline Synchronization**:
  - Video analysis results now automatically bind the first Director's Cut (Cut A) directly to Player 2, the timeline playhead, scrubber bounds, and active claim indicator from the first frame.
  - Summary video compiler defaults to the active cut's specific boundaries, aspect ratio, and subtitles for consistent one-click `.mp4` downloads.
- **Enhanced Export Pipeline for Director's Cuts**:
  - Updated `/api/export-video` and client rendering workflows to accept cut-specific parameters, titles, and stitched multi-segment descriptors.

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

### Fixed
- **FFmpeg Multi-Segment Concatenation Stream Interleaving**:
  - Fixed the FFmpeg `filter_complex` multi-segment concatenation filter in `server.ts`.
  - Enforced strict video and audio pad interleaving (`[v0][a0][v1][a1]...[vn][an]concat=n=N:v=1:a=1[cutv][cuta];`), resolving the `Media type mismatch` between video pads and audio inputs.
  - Ensured each segment trim statement is properly terminated with a semicolon before the concat junction.
  - Automatically falls back to `[v0][v1]...[vn]concat=n=N:v=1:a=0[cutv];` if the source media contains no audio stream.
- **Sanitized UI Error Alerts**:
  - Sanitized export error handling across `server.ts`, `src/videoExporter.ts`, and `src/App.tsx`.
  - Replaced raw CLI traces and stderr dumps with human-readable, actionable guidance in the Render Engine Notice modal.

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
