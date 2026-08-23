# CineFact AI — Universal Video Highlight & Fact-Checking Workstation

> **Agentic Cinema Hackathon Submission**  
> Powered by **Gemini 3.7 Flash**, **Parallel Search API**, and **FFmpeg**.

CineFact AI ingests long-form video content (YouTube URLs or local MP4 uploads), identifies high-impact 45-second social highlights using Gemini 3.7 Flash, transcribes verbatim multilingual subtitles, and verifies factual claims in real-time using Parallel Search API. It renders and exports a ready-to-publish 9:16 vertical short video with burned-in subtitles and live verification badges.

---

## ⚡ Key Features

* **Multimodal Video Ingestion:** Direct stream analysis via `yt-dlp` caption extraction and backend FFmpeg audio processing.
* **45s Highlight & Verbatim Subtitles:** Gemini 3.7 Flash isolates key 45-second clips, calculates virality scores, and produces millisecond-accurate transcripts across Cantonese, English, Spanish, and more.
* **Real-time Parallel Search Verification:** Sends targeted queries to Parallel API (`https://api.parallel.ai/v1/search`) to retrieve domain authority tags, confidence ratings, and source citations.
* **Automated MP4 Video Export:** Server-side FFmpeg pipeline crops videos to 9:16 vertical format, burns hard subtitles, and overlays dynamic Parallel API fact-check badges.
* **Gemini 3.x Fallback Resilience:** Automatic fallback chain (`gemini-3.7-flash` -> `gemini-3.6-flash` -> `gemini-3.5-flash`) with exponential backoff against 503 capacity limits.

---

## 🏗️ Architecture & Pipeline
