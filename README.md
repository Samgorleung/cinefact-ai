# CineFact AI — Universal Video Highlight & Fact-Checking Workstation

> **Agentic Cinema Hackathon Submission**  
> Powered by **Gemini 3.8 Flash**, **Parallel Search API**, and **FFmpeg**.

CineFact AI ingests long-form video content (YouTube URLs or local MP4 uploads), identifies high-impact 45-second social highlights using Gemini 3.8 Flash, transcribes verbatim multilingual subtitles, and verifies factual claims in real-time using Parallel Search API. It renders and exports ready-to-publish highlight clips with clean video playback, Studio Clearance Dossiers, and live verification badges.

---

## ⚡ Key Features

* **Multimodal Video Ingestion:** Direct stream analysis via caption extraction and backend FFmpeg audio processing.
* **45s Highlight & Verbatim Subtitles:** Gemini 3.8 Flash isolates key 45-second clips, calculates virality scores, and produces millisecond-accurate transcripts across Cantonese, English, Spanish, and more.
* **Real-time Parallel Search Verification:** Sends targeted queries to Parallel API to retrieve domain authority tags, confidence ratings, and source citations.
* **Automated MP4 Video Export:** Server-side FFmpeg pipeline crops videos to selectable aspect ratios (16:9, 9:16, 1:1, 4:5) with pure video footage rendering.
* **Gemini 3.8 Multi-Cut Intelligence:** Director's Multi-Cut system generating 4 distinct narrative angles (Viral Hook, Deep Evidence, Punchy Takeaway, and 3-Moment Compilation).

---

## 🏗️ Architecture & Pipeline
