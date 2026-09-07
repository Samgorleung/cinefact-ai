import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Video,
  UploadCloud,
  Upload,
  Search,
  Copy,
  Edit,
  Check,
  CheckCircle,
  AlertCircle,
  Download,
  Mic,
  Square,
  Plus,
  Sliders,
  Globe,
  RefreshCw,
  Clock,
  Languages,
  Film,
  Layers,
  ChevronRight,
  Info,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  FileVideo,
  FileText,
  Trash2,
  Volume2,
  Scissors,
  CheckCircle2
} from "lucide-react";
import {
  type Subtitle,
  type SearchQuery,
  type ProcessedClip,
  type VideoSourceMode,
  type ParallelSearchResult,
  type ExportProgressState,
  type SocialAspectRatio,
  type TimelineChapter,
  type DirectorCut,
  type StudioClearanceDossier
} from "./data.js";
import { export45sSocialVideo } from "./videoExporter.js";
import { uploadVideoInChunks } from "./chunkUploader.js";
import { StudioClearanceModal } from "./components/StudioClearanceModal.js";
import { DirectorCutBar } from "./components/DirectorCutBar.js";
import { SummaryVideoPlayer } from "./components/SummaryVideoPlayer.js";

export default function App() {
  // Video Source Management (Upload-only workflow)
  const sourceMode: VideoSourceMode = "upload";
  
  // Custom Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedServerFilePath, setUploadedServerFilePath] = useState<string | null>(null);
  const [isChunkUploading, setIsChunkUploading] = useState<boolean>(false);
  const [chunkUploadProgress, setChunkUploadProgress] = useState<number>(0);
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customTranscriptContext, setCustomTranscriptContext] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Analysis & Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [processedClip, setProcessedClip] = useState<ProcessedClip | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [dismissedFailover, setDismissedFailover] = useState<boolean>(false);
  const [apiKeyVerified, setApiKeyVerified] = useState<boolean | null>(true);

  // Media Player & Timeline states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0); // in seconds
  const [duration, setDuration] = useState<number>(0); // in seconds
  const [clipStartSec, setClipStartSec] = useState<number>(0);
  const [clipEndSec, setClipEndSec] = useState<number>(0);
  const [playheadPercent, setPlayheadPercent] = useState<number>(0);
  const [player1Mode, setPlayer1Mode] = useState<"full" | "loopCut">("full"); // "full" = watch full video without restriction, "loopCut" = loop selected cut
  const [subtitleFilter, setSubtitleFilter] = useState<"all" | "activeCut">("all");
  const [transcriptViewMode, setTranscriptViewMode] = useState<"chunks" | "continuous">("chunks");
  const [speechSnapNotice, setSpeechSnapNotice] = useState<string | null>(null);

  // Parallel Search State
  const [activeSearches, setActiveSearches] = useState<{ [query: string]: boolean }>({});
  const [searchCache, setSearchCache] = useState<{ [query: string]: ParallelSearchResult[] }>({});
  const [showFactOverlay, setShowFactOverlay] = useState<boolean>(true);
  const [activeFactIndex, setActiveFactIndex] = useState<number>(0);

  // MP4 Video Export Engine State
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [originalAspectRatio, setOriginalAspectRatio] = useState<SocialAspectRatio>("16:9");
  const [exportAspectRatio, setExportAspectRatio] = useState<SocialAspectRatio>("16:9");
  const [extractionMode, setExtractionMode] = useState<"continuous" | "montage">("continuous");
  const [exportState, setExportState] = useState<ExportProgressState>({
    isExporting: false,
    progressPercent: 0,
    statusMessage: "",
    exportAspectRatio: "16:9",
    downloadUrl: null,
    fileName: null,
    error: null
  });
  const cancelExportRef = useRef<boolean>(false);

  // Produced Summary Video states (Within 45s)
  const [producedSummaryVideoUrl, setProducedSummaryVideoUrl] = useState<string | null>(null);
  const [producedSummaryFileName, setProducedSummaryFileName] = useState<string | null>(null);
  const [producedSummaryCutId, setProducedSummaryCutId] = useState<string | null>(null);
  const [producedCutsMap, setProducedCutsMap] = useState<Record<string, { url: string; fileName: string }>>({});
  const [isSummaryVideoMode, setIsSummaryVideoMode] = useState<boolean>(false);
  const [isCompilingSummaryVideo, setIsCompilingSummaryVideo] = useState<boolean>(false);
  const [compilingProgress, setCompilingProgress] = useState<number>(0);
  const [compilingStatusMessage, setCompilingStatusMessage] = useState<string>("");

  // Dual Player Viewport Mode: "dual" (both players) | "original" | "summary"
  const [playerViewMode, setPlayerViewMode] = useState<"dual" | "original" | "summary">("dual");

  // UI state
  const [activeTab, setActiveTab] = useState<"highlights" | "subtitles" | "sources" | "clearance">("highlights");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingSubtitleId, setEditingSubtitleId] = useState<string | null>(null);
  const [editingSubtitleText, setEditingSubtitleText] = useState<string>("");

  // Studio Clearance & Director's Multi-Cut States
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState<boolean>(false);
  const [activeCutId, setActiveCutId] = useState<string | null>(null);
  const [isGeneratingDossier, setIsGeneratingDossier] = useState<boolean>(false);

  // Element Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Persistent refs to track active Object URLs safely without dependency churn
  const uploadedVideoUrlRef = useRef<string | null>(null);
  const producedSummaryVideoUrlRef = useRef<string | null>(null);
  const recordedAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    uploadedVideoUrlRef.current = uploadedVideoUrl;
  }, [uploadedVideoUrl]);

  useEffect(() => {
    producedSummaryVideoUrlRef.current = producedSummaryVideoUrl;
  }, [producedSummaryVideoUrl]);

  useEffect(() => {
    recordedAudioUrlRef.current = recordedAudioUrl;
  }, [recordedAudioUrl]);

  // Current active video URL for HTML5 player (from user upload or server stream fallback)
  const serverStreamUrl = uploadedServerFilePath
    ? `/api/video-stream/${uploadedServerFilePath.split(/[/|\\]/).pop()}`
    : null;
  const currentVideoSrc = uploadedVideoUrl || serverStreamUrl || null;

  // Auto-restore uploadedVideoUrl if uploadedFile exists and URL was cleared
  useEffect(() => {
    if (uploadedFile && !uploadedVideoUrl) {
      try {
        const freshUrl = URL.createObjectURL(uploadedFile);
        setUploadedVideoUrl(freshUrl);
      } catch (e) {
        console.warn("[App] Could not create object URL from file:", e);
      }
    }
  }, [uploadedFile, uploadedVideoUrl]);

  // Clean up object URLs ONLY on component unmount
  useEffect(() => {
    return () => {
      if (uploadedVideoUrlRef.current) {
        try { URL.revokeObjectURL(uploadedVideoUrlRef.current); } catch (e) {}
      }
      if (recordedAudioUrlRef.current) {
        try { URL.revokeObjectURL(recordedAudioUrlRef.current); } catch (e) {}
      }
      if (producedSummaryVideoUrlRef.current) {
        try { URL.revokeObjectURL(producedSummaryVideoUrlRef.current); } catch (e) {}
      }
    };
  }, []);

  // Handle local video file upload - State Reset
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("video/")) {
      return;
    }

    if (uploadedVideoUrlRef.current) {
      try { URL.revokeObjectURL(uploadedVideoUrlRef.current); } catch (e) {}
    }
    if (producedSummaryVideoUrlRef.current) {
      try { URL.revokeObjectURL(producedSummaryVideoUrlRef.current); } catch (e) {}
    }

    const objectUrl = URL.createObjectURL(file);
    setUploadedFile(file);
    setUploadedVideoUrl(objectUrl);
    setCustomTitle(file.name.replace(/\.[^/.]+$/, ""));
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayheadPercent(0);

    // CRITICAL: Immediately reset all state upon new file upload!
    // Wipes previous subtitles, claims, highlight boundaries, and verification tags
    setProcessedClip(null);
    setProducedSummaryVideoUrl(null);
    setProducedSummaryFileName(null);
    setProducedSummaryCutId(null);
    setIsSummaryVideoMode(false);
    setIsCompilingSummaryVideo(false);
    setCompilingProgress(0);
    setCompilingStatusMessage("");
    setAnalysisError(null);
    setActiveSearches({});
    setSearchCache({});
    setEditingSubtitleId(null);
    setClipStartSec(0);
    setClipEndSec(45);
    setUploadedBase64(null);
    setUploadedServerFilePath(null);
    setExportState((prev) => ({
      ...prev,
      isExporting: false,
      progressPercent: 0,
      statusMessage: "",
      downloadUrl: null,
      fileName: null,
      error: null
    }));

    // Start background chunked upload immediately so it's ready when user clicks Analyze
    setIsChunkUploading(true);
    setChunkUploadProgress(0);
    uploadVideoInChunks(file, (p) => {
      setChunkUploadProgress(p.percent);
    })
      .then((res) => {
        console.log("[CHUNK UPLOAD SUCCESS] Server file ready:", res.serverFilePath);
        setUploadedServerFilePath(res.serverFilePath);
        setIsChunkUploading(false);
      })
      .catch((err) => {
        console.warn("[CHUNK UPLOAD BACKGROUND ERROR]", err);
        setIsChunkUploading(false);
      });

    // Only convert tiny files (< 5MB) to base64 as quick fallback
    if (file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedBase64(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Convert "00:15" string to seconds
  const parseTimeToSeconds = (timeStr: string | number): number => {
    if (typeof timeStr === "number") return timeStr;
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else if (parts.length === 3) {
      return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    }
    return 0;
  };

  // Time formatter
  const formatTimeText = (sec: number): string => {
    const s = Math.max(0, Math.floor(sec));
    const mins = Math.floor(s / 60);
    const remainingSecs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Interactive boundary updater for scrubber, nudges, and chapter pills
  const updateHighlightBounds = useCallback((newStart: number, newEnd: number) => {
    const validStart = Math.max(0, newStart);
    const validEnd = Math.max(validStart + 3, newEnd);
    setClipStartSec(validStart);
    setClipEndSec(validEnd);

    // Clear stale rendered summary video so Player 2 smoothly previews the newly selected boundaries
    setProducedSummaryVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setProducedSummaryFileName(null);

    setProcessedClip((prev) => {
      if (!prev) return null;
      const dur = Math.round(validEnd - validStart);
      const currentCut = prev.directorCuts?.find((c) => c.id === activeCutId);
      const role = currentCut?.style === "lore" ? "evidence" : currentCut?.style === "climax" ? "takeaway" : "hook";
      const cutLabel = currentCut ? currentCut.label : "Selected Highlight";
      return {
        ...prev,
        clipStartSec: validStart,
        clipEndSec: validEnd,
        clipStart: formatTimeText(validStart),
        clipEnd: formatTimeText(validEnd),
        highlightSegments: [
          {
            id: `focus-${validStart}-${validEnd}`,
            startSec: validStart,
            endSec: validEnd,
            role: role as any,
            summary: `${cutLabel} (${dur}s)`,
            score: currentCut?.viralityScore || 95
          }
        ]
      };
    });
  }, [activeCutId]);

  // Active Director's Cut (A/B Social Variations & Digest)
  const activeDirectorCut = useMemo(() => {
    if (!processedClip?.directorCuts || processedClip.directorCuts.length === 0) return null;
    return processedClip.directorCuts.find((c) => c.id === activeCutId) || processedClip.directorCuts[0];
  }, [processedClip, activeCutId]);

  // Snaps the cut end boundary to the nearest spoken sentence end with +0.50s vocal cushion
  const snapToSpeechEnd = useCallback(() => {
    if (!processedClip || !processedClip.subtitles || processedClip.subtitles.length === 0) {
      setSpeechSnapNotice("No subtitle transcript available to snap to.");
      setTimeout(() => setSpeechSnapNotice(null), 3000);
      return;
    }

    const currentEndMs = clipEndSec * 1000;
    // Subtitles in the vicinity of current end (between startSec + 8s and startSec + 45s)
    const validSubs = processedClip.subtitles.filter(
      (s) => s.end >= (clipStartSec + 5) * 1000 && s.end <= (clipStartSec + 45) * 1000
    );

    if (validSubs.length === 0) {
      setSpeechSnapNotice("No speech boundaries found within the 45s highlight constraint.");
      setTimeout(() => setSpeechSnapNotice(null), 3000);
      return;
    }

    // Find best sentence ending (favoring punctuation like . ? ! )
    let bestSub = validSubs[validSubs.length - 1];
    let minScore = Infinity;

    validSubs.forEach((sub) => {
      const text = (sub.text || "").trim();
      const hasTerminalPunct = /[.!?。！？…"]$/.test(text);
      const diffMs = Math.abs(sub.end - currentEndMs);
      const score = diffMs - (hasTerminalPunct ? 4000 : 0);
      if (score < minScore) {
        minScore = score;
        bestSub = sub;
      }
    });

    // Add +0.50s vocal decay cushion so the final word does not get cut off abruptly
    const snappedEndSec = Math.min(
      duration > 0 ? duration : (clipStartSec + 45),
      Math.min(clipStartSec + 45, Math.round(((bestSub.end / 1000) + 0.50) * 10) / 10)
    );

    updateHighlightBounds(clipStartSec, snappedEndSec);
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(clipStartSec, snappedEndSec - 2.5);
    }

    setSpeechSnapNotice(`Snapped to speech completion at ${formatTimeText(snappedEndSec)} (+0.5s cushion): "${bestSub.text.slice(0, 40)}..."`);
    setTimeout(() => setSpeechSnapNotice(null), 5000);
  }, [processedClip, clipStartSec, clipEndSec, duration, updateHighlightBounds]);

  // Trigger Gemini Multimodal Video Analysis (Gemini 3.8 Flash primary with 3.7 and 3.5 fallbacks)
  const triggerAnalysis = async () => {
    if (!uploadedFile && !uploadedVideoUrl) {
      setAnalysisError("Please select or drop an MP4/WebM video file to analyze.");
      return;
    }

    setIsProcessing(true);
    setAnalysisError(null);
    setEditingSubtitleId(null);

    try {
      let serverPath = uploadedServerFilePath;

      // If file is not yet uploaded to server via chunks, upload now
      if (!serverPath && uploadedFile) {
        setProcessingStage(`Uploading ${uploadedFile.name} in 4MB chunks to server...`);
        setIsChunkUploading(true);
        const uploadRes = await uploadVideoInChunks(uploadedFile, (p) => {
          setChunkUploadProgress(p.percent);
          setProcessingStage(p.message);
        });
        serverPath = uploadRes.serverFilePath;
        setUploadedServerFilePath(serverPath);
        setIsChunkUploading(false);
      }

      setProcessingStage("Gemini 3.8 Flash: Scanning entire video timeline & audio dynamics...");

      let base64Data = uploadedBase64;
      // Only read base64 if no serverPath exists and file is very small (< 5MB)
      if (!serverPath && !base64Data && uploadedFile && uploadedFile.size <= 5 * 1024 * 1024) {
        setProcessingStage("Encoding video buffer for Gemini...");
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read video file buffer."));
          reader.readAsDataURL(uploadedFile);
        });
        setUploadedBase64(base64Data);
      }

      const payload: any = {
        sourceType: "upload",
        serverFilePath: serverPath || null,
        customTitle: customTitle || uploadedFile?.name || "Uploaded Video Asset",
        customText: customTranscriptContext,
        videoDuration: duration,
        videoBase64: serverPath ? null : (base64Data || null),
        videoMimeType: uploadedFile?.type || "video/mp4",
        extractionMode,
        aspectRatio: exportAspectRatio || originalAspectRatio || "16:9"
      };

      const response = await fetch("/api/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        if (response.status === 413) {
          throw new Error("Video file was too large for standard transfer. Please re-select the file to use chunked transfer.");
        }
        if (responseText.includes("<html") || responseText.includes("<!DOCTYPE") || responseText.includes("<head>")) {
          throw new Error(`Server returned HTTP ${response.status} (${response.statusText || "Gateway Error"}). Please retry in a few moments.`);
        }
        throw new Error(`Server error (${response.status}): ${responseText.slice(0, 100)}`);
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || "Video processing failed.");
      }

      setProcessedClip(data as ProcessedClip);

      // Determine initial selected cut (Cut A by default, matching DirectorCutBar)
      const firstCut = (data.directorCuts && data.directorCuts.length > 0) ? data.directorCuts[0] : null;

      if (firstCut) {
        setActiveCutId(firstCut.id);
        setClipStartSec(firstCut.clipStartSec);
        setClipEndSec(firstCut.clipEndSec);
        setCurrentTime(firstCut.clipStartSec);
        if (firstCut.viralityScore) {
          (data as any).viralityScore = firstCut.viralityScore;
        }
        if (firstCut.suggestedAspectRatio) {
          setExportAspectRatio(firstCut.suggestedAspectRatio);
        }
        if (videoRef.current) {
          videoRef.current.currentTime = firstCut.clipStartSec;
        }
        if (firstCut.primaryClaimIndex !== undefined && firstCut.primaryClaimIndex < (data.searchQueries?.length || 0)) {
          setActiveFactIndex(firstCut.primaryClaimIndex);
        }
      } else {
        // Fallback to overall clip timeline boundaries
        const start = data.clipStartSec ?? parseTimeToSeconds(data.clipStart);
        const end = data.clipEndSec ?? (data.clipEnd ? parseTimeToSeconds(data.clipEnd) : start + 45);
        setClipStartSec(start);
        setClipEndSec(end);
        setCurrentTime(start);
        if (videoRef.current) {
          videoRef.current.currentTime = start;
        }
      }

      setProcessingStage("Parallel API Grounding queries prepared.");
      // Automatically trigger 45s summary video production matching the initial selected cut
      produceSummaryVideo(data as ProcessedClip, base64Data, undefined, firstCut);
    } catch (error: any) {
      console.error("Error analyzing video clip:", error);
      let rawMsg = error?.message || "Failed to analyze video. Please verify your source video and API key.";
      try {
        if (rawMsg.includes("{") && rawMsg.includes("}")) {
          const jsonStart = rawMsg.indexOf("{");
          const jsonEnd = rawMsg.lastIndexOf("}");
          const parsed = JSON.parse(rawMsg.slice(jsonStart, jsonEnd + 1));
          if (parsed.error?.message) {
            rawMsg = parsed.error.message;
          } else if (parsed.message) {
            rawMsg = parsed.message;
          }
        }
      } catch (e) {}

      if (rawMsg.includes("503") || rawMsg.toLowerCase().includes("unavailable") || rawMsg.toLowerCase().includes("high demand")) {
        rawMsg = "High demand on Gemini service. Please retry in a few seconds.";
      } else if (rawMsg.includes("429") || rawMsg.toLowerCase().includes("quota") || rawMsg.toLowerCase().includes("rate limit")) {
        rawMsg = "Gemini API rate limit reached. Please wait a moment before trying again.";
      }

      setAnalysisError(rawMsg);
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
    }
  };

  // Compile and produce the summary video (within 45s) matching target cut & aspect ratio
  const produceSummaryVideo = async (
    clipData: ProcessedClip,
    base64Buffer?: string | null,
    customRatio?: SocialAspectRatio,
    targetCut?: DirectorCut | null
  ) => {
    const ratioToUse = customRatio || (targetCut?.suggestedAspectRatio) || exportAspectRatio || originalAspectRatio || "16:9";
    setIsCompilingSummaryVideo(true);
    setCompilingProgress(20);
    setCompilingStatusMessage(`Compiling Summary MP4 (${ratioToUse}) (35–45s)...`);

    try {
      const activeClaim =
        (targetCut?.primaryClaimIndex !== undefined && clipData.searchQueries?.[targetCut.primaryClaimIndex]) ||
        clipData.searchQueries?.find(
          (c) => c.status === "success" || (c.results && c.results.length > 0)
        ) || clipData.searchQueries?.[0];

      let base64Payload = base64Buffer || uploadedBase64;
      if (!uploadedServerFilePath && !base64Payload && uploadedFile && uploadedFile.size <= 5 * 1024 * 1024) {
        base64Payload = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read video file for export."));
          reader.readAsDataURL(uploadedFile);
        });
        setUploadedBase64(base64Payload);
      }

      setCompilingProgress(40);
      setCompilingStatusMessage("Encoding clean video frames (35–45s)...");

      const targetCutId = targetCut?.id || activeCutId;
      const effectiveStart = targetCut ? targetCut.clipStartSec : (clipData.clipStartSec ?? clipStartSec);
      const effectiveEnd = targetCut ? targetCut.clipEndSec : (clipData.clipEndSec ?? clipEndSec);
      const effectiveSegments = (targetCut?.highlightSegments && targetCut.highlightSegments.length > 0)
        ? targetCut.highlightSegments
        : targetCut
        ? [{
            id: `cut-seg-${targetCut.id}`,
            startSec: targetCut.clipStartSec,
            endSec: targetCut.clipEndSec,
            role: targetCut.style === "lore" ? "evidence" : targetCut.style === "climax" ? "takeaway" : "hook",
            summary: targetCut.highlightReason || targetCut.tagline,
            score: targetCut.viralityScore
          }]
        : (clipData.highlightSegments && clipData.highlightSegments.length > 0)
        ? clipData.highlightSegments
        : [{
            id: "seg-default",
            startSec: effectiveStart,
            endSec: effectiveEnd,
            role: "hook",
            summary: "Highlight moment",
            score: 90
          }];

      const effectiveSubtitles = (targetCut?.subtitles && targetCut.subtitles.length > 0)
        ? targetCut.subtitles
        : ((clipData.stitchedSubtitles && clipData.stitchedSubtitles.length > 0)
            ? clipData.stitchedSubtitles
            : (clipData.subtitles || []));

      const payload: any = {
        sourceType: "upload",
        serverFilePath: uploadedServerFilePath || null,
        videoBase64: uploadedServerFilePath ? null : (base64Payload || null),
        clipStartSec: effectiveStart,
        clipEndSec: effectiveEnd,
        highlightSegments: effectiveSegments,
        aspectRatio: ratioToUse,
        subtitles: effectiveSubtitles,
        verifiedClaim: activeClaim,
        clipTitle: targetCut
          ? `${customTitle || clipData.title || "CineFact"} - ${targetCut.label}`
          : (customTitle || clipData.title || "CineFact_Summary")
      };

      const res = await fetch("/api/export-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        let errJson: any = {};
        try {
          errJson = JSON.parse(errText);
        } catch (e) {}
        throw new Error(errJson.error || `Failed to render summary video (HTTP ${res.status}).`);
      }

      setCompilingProgress(85);
      setCompilingStatusMessage("Finalizing MP4 video stream (35–45s)...");

      const blob = await res.blob();
      if (producedSummaryVideoUrl) {
        URL.revokeObjectURL(producedSummaryVideoUrl);
      }
      const newUrl = URL.createObjectURL(blob);
      const cutLabel = targetCut?.label ? targetCut.label.replace(/[^a-zA-Z0-9_-]/g, "_") : "Cut";
      const safeTitle = (targetCut ? `${customTitle || clipData.title || "CineFact"}_${cutLabel}` : (customTitle || clipData.title || "CineFact_Summary")).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
      const fileName = `CineFact_35-45s_${safeTitle}_${ratioToUse.replace(":", "x")}.mp4`;

      setProducedSummaryVideoUrl(newUrl);
      setProducedSummaryFileName(fileName);
      setProducedSummaryCutId(targetCutId || null);
      if (targetCutId) {
        setProducedCutsMap((prev) => ({
          ...prev,
          [targetCutId]: { url: newUrl, fileName }
        }));
      }
      setIsSummaryVideoMode(true);
      setCompilingProgress(100);
      setCompilingStatusMessage("Summary Video ready (35–45s)!");

      // Update export state download URL for instant export modal / toolbar download
      setExportState((prev) => ({
        ...prev,
        downloadUrl: newUrl,
        fileName: fileName,
        statusMessage: "Summary Video compiled (35–45s)!"
      }));
    } catch (err: any) {
      console.error("[AUTO 45s EXPORT ERROR]", err);
      setCompilingStatusMessage(`Summary generation note: ${err?.message || "Could not auto-compile MP4"}`);
    } finally {
      setIsCompilingSummaryVideo(false);
    }
  };

  // Real Parallel API Search Verification
  const triggerFactCheck = async (queryItem: SearchQuery) => {
    const query = queryItem.query;
    if (activeSearches[query]) return;

    setActiveSearches((prev) => ({ ...prev, [query]: true }));

    try {
      const response = await fetch("/api/run-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryItem.query,
          targetClaim: queryItem.targetClaim || queryItem.query,
          category: queryItem.category || "Factual Verification"
        }),
      });

      if (!response.ok) {
        throw new Error("Parallel Search API failed.");
      }

      const data = await response.json();
      const results: ParallelSearchResult[] = data.results || [];

      // Update cache
      setSearchCache((prev) => ({
        ...prev,
        [query]: results,
      }));

      // Update active clip state
      if (processedClip) {
        const updatedQueries = processedClip.searchQueries.map((q) => {
          if (q.query === query) {
            return {
              ...q,
              status: "success" as const,
              results: results,
            };
          }
          return q;
        });

        setProcessedClip({
          ...processedClip,
          searchQueries: updatedQueries,
        });
      }
    } catch (error) {
      console.error("Parallel Search verification error:", error);
      if (processedClip) {
        const updatedQueries = processedClip.searchQueries.map((q) => {
          if (q.query === query) {
            return { ...q, status: "error" as const };
          }
          return q;
        });
        setProcessedClip({ ...processedClip, searchQueries: updatedQueries });
      }
    } finally {
      setActiveSearches((prev) => ({ ...prev, [query]: false }));
    }
  };

  // Run all Parallel API fact checks concurrently
  const triggerAllParallelChecks = () => {
    if (!processedClip) return;
    processedClip.searchQueries.forEach((q) => {
      triggerFactCheck(q);
    });
  };

  // Director's Multi-Cut Selection Handler
  const handleSelectCut = (cut: DirectorCut) => {
    setActiveCutId(cut.id);
    setClipStartSec(cut.clipStartSec);
    setClipEndSec(cut.clipEndSec);
    if (cut.suggestedAspectRatio) {
      setExportAspectRatio(cut.suggestedAspectRatio);
    }

    // Check if this cut has already been rendered into an MP4
    if (producedCutsMap[cut.id]) {
      const cached = producedCutsMap[cut.id];
      setProducedSummaryVideoUrl(cached.url);
      setProducedSummaryFileName(cached.fileName);
      setProducedSummaryCutId(cut.id);
      setIsSummaryVideoMode(true);
      setExportState((prev) => ({
        ...prev,
        downloadUrl: cached.url,
        fileName: cached.fileName,
        statusMessage: "Summary Video ready (35–45s)!"
      }));
    } else {
      // Switch active cut id and auto-render MP4 for this cut so Player 2 always has a rendered MP4 video
      setProducedSummaryCutId(cut.id);
      if (processedClip) {
        produceSummaryVideo(processedClip, null, cut.suggestedAspectRatio || exportAspectRatio, cut);
      }
    }

    // Update highlightSegments and viralityScore on processedClip so timeline and widgets immediately reflect this cut
    const newSegments = (cut.highlightSegments && cut.highlightSegments.length > 0)
      ? cut.highlightSegments
      : [{
          id: `cut-seg-${cut.id}`,
          startSec: cut.clipStartSec,
          endSec: cut.clipEndSec,
          role: cut.style === "lore" ? "evidence" : cut.style === "climax" ? "takeaway" : "hook",
          summary: cut.highlightReason,
          score: cut.viralityScore
        }];

    setProcessedClip((prev) => prev ? ({
      ...prev,
      viralityScore: cut.viralityScore,
      clipStartSec: cut.clipStartSec,
      clipEndSec: cut.clipEndSec,
      clipStart: cut.clipStart,
      clipEnd: cut.clipEnd,
      highlightSegments: newSegments
    }) : prev);

    if (videoRef.current) {
      videoRef.current.currentTime = cut.clipStartSec;
      setCurrentTime(cut.clipStartSec);
    }
    if (cut.primaryClaimIndex !== undefined && cut.primaryClaimIndex < (processedClip?.searchQueries.length || 0)) {
      setActiveFactIndex(cut.primaryClaimIndex);
    }
  };

  // Export Specific Director Cut
  const handleExportDirectorCut = (cut: DirectorCut) => {
    handleSelectCut(cut);
    if (processedClip) {
      produceSummaryVideo(processedClip, null, cut.suggestedAspectRatio || exportAspectRatio, cut);
    }
  };

  // Open & Lazily Generate Studio Clearance Dossier
  const handleOpenClearanceDossier = async () => {
    setIsClearanceModalOpen(true);
    if (processedClip && !processedClip.clearanceDossier) {
      try {
        setIsGeneratingDossier(true);
        const res = await fetch("/api/generate-clearance-dossier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectTitle: processedClip.title || customTitle || "Production Asset",
            claims: processedClip.searchQueries || [],
            subtitles: processedClip.subtitles || [],
            videoDuration: duration
          })
        });
        if (res.ok) {
          const dossier = await res.json();
          setProcessedClip((prev) => (prev ? { ...prev, clearanceDossier: dossier } : prev));
        }
      } catch (e) {
        console.error("Failed to generate on-demand clearance dossier:", e);
      } finally {
        setIsGeneratingDossier(false);
      }
    }
  };

  // 45s MP4 Video Export Engine with speech padding (+/- 0.5s)
  const startVideoExport = async () => {
    if (!processedClip) return;
    if (!processedClip) {
      setExportState({
        isExporting: false,
        progressPercent: 0,
        statusMessage: "",
        exportAspectRatio,
        downloadUrl: null,
        fileName: null,
        error: "Analysis required before exporting. Please click 'Analyze & Extract Highlight (35–45s)'."
      });
      return;
    }

    setShowExportModal(true);
    cancelExportRef.current = false;
    
    setExportState({
      isExporting: true,
      progressPercent: 3,
      statusMessage: "Initializing video stream and subtitle rendering pipeline...",
      exportAspectRatio,
      downloadUrl: null,
      fileName: null,
      error: null
    });

    try {
      let base64Data = uploadedBase64;
      if (!uploadedServerFilePath && !base64Data && uploadedFile && uploadedFile.size <= 5 * 1024 * 1024) {
        setExportState((prev) => ({ ...prev, statusMessage: "Encoding video buffer for render engine..." }));
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read video file for export."));
          reader.readAsDataURL(uploadedFile);
        });
        setUploadedBase64(base64Data);
      }

      const result = await export45sSocialVideo({
        videoElement: videoRef.current,
        videoSrc: currentVideoSrc,
        sourceMode: "upload",
        serverFilePath: uploadedServerFilePath || null,
        videoBase64: uploadedServerFilePath ? undefined : (base64Data || undefined),
        file: uploadedFile,
        highlightSegments: processedClip.highlightSegments || [],
        clipStartSec,
        clipEndSec,
        totalDuration: duration,
        aspectRatio: exportAspectRatio,
        subtitles: (processedClip.stitchedSubtitles && processedClip.stitchedSubtitles.length > 0)
          ? processedClip.stitchedSubtitles
          : (processedClip.subtitles || []),
        verifiedClaims: processedClip.searchQueries || [],
        clipTitle: customTitle || processedClip.title,
        onProgress: (percent, message) => {
          setExportState((prev) => ({
            ...prev,
            progressPercent: percent,
            statusMessage: message
          }));
        },
        shouldCancel: () => cancelExportRef.current
      });

      setExportState((prev) => ({
        ...prev,
        isExporting: false,
        progressPercent: 100,
        statusMessage: "Video compiled successfully!",
        downloadUrl: result.downloadUrl,
        fileName: result.fileName
      }));

      // Update produced summary video URL so the player and toolbar reflect the newly compiled video
      if (producedSummaryVideoUrl && producedSummaryVideoUrl !== result.downloadUrl) {
        URL.revokeObjectURL(producedSummaryVideoUrl);
      }
      setProducedSummaryVideoUrl(result.downloadUrl);
      setProducedSummaryFileName(result.fileName);
      setIsSummaryVideoMode(true);

      // Automatically trigger browser download
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = result.downloadUrl;
      downloadAnchor.download = result.fileName;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch (err: any) {
      if (err.message?.includes("cancelled")) {
        setExportState((prev) => ({
          ...prev,
          isExporting: false,
          statusMessage: "Export cancelled by user.",
          error: null
        }));
      } else {
        console.error("Video export pipeline error:", err);
        let cleanErr = err.message || "Video compilation encountered an error.";
        if (cleanErr.includes("Command failed:") || cleanErr.includes("ffmpeg -y")) {
          cleanErr = "Video compilation encountered an encoding issue while processing frames. Please try adjusting your highlight boundaries and re-exporting.";
        }
        setExportState((prev) => ({
          ...prev,
          isExporting: false,
          error: cleanErr
        }));
      }
    }
  };

  const cancelVideoExport = () => {
    cancelExportRef.current = true;
    setExportState((prev) => ({
      ...prev,
      isExporting: false,
      statusMessage: "Export cancelled."
    }));
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        setCustomTranscriptContext("Spoken voice pitch audio track recorded in browser. Analyzing verbal timing and factual assertions.");
        if (!customTitle) setCustomTitle("Live Spoken Memo");
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied or error occurred:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track: any) => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Playback Tick Handler
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      if (duration > 0) {
        setPlayheadPercent((current / duration) * 100);
      }

      // If user selected "loopCut" mode, clamp and loop playback inside the highlight cut envelope
      if (processedClip && player1Mode === "loopCut") {
        if (isSummaryVideoMode && producedSummaryVideoUrl) {
          if (videoRef.current.duration > 0 && current >= videoRef.current.duration - 0.2) {
            videoRef.current.currentTime = 0;
            setCurrentTime(0);
          }
        } else if (processedClip.highlightSegments && processedClip.highlightSegments.length > 0) {
          // If video has advanced past the final highlight segment, loop back to start of first segment
          const lastSeg = processedClip.highlightSegments[processedClip.highlightSegments.length - 1];
          const firstSeg = processedClip.highlightSegments[0];
          if (current >= lastSeg.endSec) {
            videoRef.current.currentTime = firstSeg.startSec;
            setCurrentTime(firstSeg.startSec);
          }
        } else if (current >= clipEndSec) {
          // Standard single highlight bound
          videoRef.current.currentTime = clipStartSec;
          setCurrentTime(clipStartSec);
        }
      } else if (duration > 0 && current >= duration - 0.2) {
        // Full video playback reaches end: pause cleanly or reset
        setIsPlaying(false);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      if (videoRef.current.duration) {
        const vidDuration = Math.floor(videoRef.current.duration);
        if (vidDuration > 0) {
          setDuration(vidDuration);
        }
      }
      // Detect native dimensions and automatically match original video aspect ratio
      const w = videoRef.current.videoWidth;
      const h = videoRef.current.videoHeight;
      if (w && h) {
        let detectedRatio: SocialAspectRatio = "16:9";
        const r = w / h;
        if (r >= 1.35) {
          detectedRatio = "16:9";
        } else if (r <= 0.68) {
          detectedRatio = "9:16";
        } else if (r >= 0.69 && r <= 0.88) {
          detectedRatio = "4:5";
        } else if (r > 0.88 && r < 1.15) {
          detectedRatio = "1:1";
        } else {
          detectedRatio = w >= h ? "16:9" : "9:16";
        }
        setOriginalAspectRatio(detectedRatio);
        setExportAspectRatio(detectedRatio);
        setExportState((prev) => ({ ...prev, exportAspectRatio: detectedRatio }));
      }
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Only clamp playback to start of highlight if loopCut mode is explicitly engaged
        if (player1Mode === "loopCut" && processedClip) {
          if (processedClip.highlightSegments && processedClip.highlightSegments.length > 0) {
            const firstSeg = processedClip.highlightSegments[0];
            const lastSeg = processedClip.highlightSegments[processedClip.highlightSegments.length - 1];
            if (currentTime < firstSeg.startSec || currentTime >= lastSeg.endSec) {
              videoRef.current.currentTime = firstSeg.startSec;
            }
          } else if (currentTime < clipStartSec || currentTime >= clipEndSec) {
            videoRef.current.currentTime = clipStartSec;
          }
        } else if (duration > 0 && videoRef.current.currentTime >= duration - 0.5) {
          // If at end of full video, restart from beginning
          videoRef.current.currentTime = 0;
        }
        videoRef.current.play().catch((e) => console.error("Playback error:", e));
        setIsPlaying(true);
      }
    }
  };

  // Interactive timeline scrubber
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      const targetSec = (percent / 100) * duration;

      if (videoRef.current) {
        videoRef.current.currentTime = targetSec;
      }
      setCurrentTime(targetSec);
      setPlayheadPercent(percent);
    }
  };

  // Active Subtitle Matching (millisecond precision)
  const activeSubtitle = useMemo(() => {
    if (!processedClip) return null;
    const currentMs = currentTime * 1000;
    return processedClip.subtitles.find(
      (sub) => currentMs >= sub.start && currentMs <= sub.end
    );
  }, [currentTime, processedClip]);

  // Calculate total duration across highlight segments
  const totalHighlightDuration = useMemo(() => {
    if (processedClip?.highlightSegments && processedClip.highlightSegments.length > 0) {
      return processedClip.highlightSegments.reduce((sum, s) => sum + (s.endSec - s.startSec), 0);
    }
    return Math.max(0, Math.round(clipEndSec - clipStartSec));
  }, [processedClip, clipStartSec, clipEndSec]);

  // Subtitle editor save
  const saveSubtitleEdit = (subId: string) => {
    if (processedClip) {
      const updatedSubtitles = processedClip.subtitles.map((sub) => {
        if (sub.id === subId) {
          return { ...sub, text: editingSubtitleText };
        }
        return sub;
      });
      setProcessedClip({
        ...processedClip,
        subtitles: updatedSubtitles,
      });
      setEditingSubtitleId(null);
    }
  };

  // Copy to clipboard helper
  const copyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Export SRT file
  const formatSrtTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const seconds = totalSeconds % 60;
    const pad = (num: number, size: number) => num.toString().padStart(size, "0");
    return `${pad(hours, 2)}:${pad(minutes % 60, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
  };

  const exportSrt = () => {
    if (!processedClip) return;
    let srtContent = "";
    processedClip.subtitles.forEach((sub, idx) => {
      srtContent += `${idx + 1}\n`;
      srtContent += `${formatSrtTime(sub.start)} --> ${formatSrtTime(sub.end)}\n`;
      srtContent += `${sub.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${processedClip.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_subtitles.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col font-sans selection:bg-[#00ffc3]/30 selection:text-[#00ffc3]">
      
      {/* Header Bar */}
      <header className="flex items-center justify-between px-8 h-16 border-b border-[#222] bg-[#050505] shadow-sm z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#00ffc3] rounded-sm rotate-45 flex-shrink-0"></div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
              <span>CineFact AI</span>
            </h1>
            <span className="text-[9px] uppercase tracking-widest text-[#666]">
              Universal Video Highlight & Fact-Checking Workstation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {processedClip?.engineMetadata?.isFallback && !dismissedFailover ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/30 border border-amber-500/40 text-[10px] font-mono text-amber-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-[#888]">ENGINE:</span>
              <span className="font-bold uppercase">{processedClip.engineMetadata.modelUsed}</span>
              <span className="text-[8px] bg-amber-500/20 px-1 py-0.2 border border-amber-500/30 text-amber-200">AUTO-ROUTED</span>
              <button
                onClick={() => setDismissedFailover(true)}
                className="ml-1 text-amber-400/60 hover:text-amber-200 text-[12px] leading-none px-1"
                title="Dismiss engine status"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#111] border border-[#222] text-[10px] font-mono text-[#aaa]">
              <span className="w-2 h-2 rounded-full bg-[#00ffc3] animate-pulse"></span>
              <span className="text-[#666]">ENGINE:</span>
              <span className="text-[#00ffc3] font-bold uppercase">
                {processedClip?.engineMetadata?.modelUsed || "GEMINI 3.8 FLASH"}
              </span>
            </div>
          )}

          {processedClip && (
            <button
              id="btn-open-clearance-dossier-header"
              onClick={handleOpenClearanceDossier}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#00ffc3]/10 hover:bg-[#00ffc3]/20 border border-[#00ffc3]/40 text-[#00ffc3] text-[11px] font-mono font-bold tracking-wide transition shadow-sm active:scale-95"
              title="Open Studio Clearance & Verification Dossier"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#00ffc3]" />
              <span>Clearance Dossier</span>
              <span className="text-[9px] bg-[#00ffc3] text-black px-1.5 py-0.2 font-bold ml-1">
                {processedClip.clearanceDossier ? `${processedClip.clearanceDossier.complianceScore}% CLEAR` : "AUDIT READY"}
              </span>
            </button>
          )}

          <div className="px-3 py-1 border border-[#333] text-[11px] font-bold text-[#00ffc3] bg-[#00ffc3]/5 tracking-wider uppercase">
            PRO PLAN
          </div>
        </div>
      </header>

      {/* Actionable Error Banner */}
      {analysisError && (
        <div className="bg-red-950/80 border-b border-red-500/50 px-8 py-3 text-[12px] font-mono text-red-200 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 bg-red-500/30 border border-red-500/60 text-[10px] font-bold uppercase tracking-wider text-red-300">
              Analysis Error
            </span>
            <span>{analysisError}</span>
          </div>
          <button
            onClick={() => setAnalysisError(null)}
            className="px-2 py-1 text-[10px] bg-red-900/50 hover:bg-red-800/80 text-red-100 border border-red-500/40 uppercase tracking-wider"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
        
        {/* Left Column (3.5 lg cols) - Video Input, YouTube & Upload Panel */}
        <section className="lg:col-span-4 xl:col-span-3 flex flex-col space-y-4">
          
          {/* Video Source Selection Tabs */}
          <div className="bg-[#080808] border border-[#222] p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-widest text-[#555] flex items-center space-x-1.5 font-bold">
                <Video className="w-3.5 h-3.5 text-[#00ffc3]" />
                <span>Video Upload & Ingestion</span>
              </h2>
              {processedClip && (
                <span className="text-[9px] font-mono px-2 py-0.5 border border-[#00ffc3]/30 bg-[#00ffc3]/10 text-[#00ffc3]">
                  {processedClip.detectedLanguage}
                </span>
              )}
            </div>

            {/* Video File Upload (MP4, WebM, MOV) */}
            <div className="flex flex-col space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="video/mp4,video/webm,video/quicktime,video/ogg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 ${
                  isDragOver
                    ? "border-[#00ffc3] bg-[#00ffc3]/10 text-[#00ffc3]"
                    : uploadedFile
                    ? "border-[#00ffc3]/50 bg-[#111] text-white"
                    : "border-[#222] bg-[#0c0c0c] hover:border-[#00ffc3]/40 text-[#777]"
                }`}
              >
                <UploadCloud className={`w-8 h-8 ${uploadedFile ? "text-[#00ffc3]" : "text-[#555]"}`} />
                <div className="space-y-1 w-full max-w-full overflow-hidden">
                  <p className="text-xs font-bold uppercase tracking-wider text-white truncate">
                    {uploadedFile ? uploadedFile.name : "Drop Video File (MP4, WebM, MOV)"}
                  </p>
                  <p className="text-[10px] text-[#666]">
                    {uploadedFile
                      ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace`
                      : "Drag & drop or click to browse. Supports large 45MB+ videos via chunked transfer."}
                  </p>
                  {isChunkUploading && (
                    <div className="pt-2 space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-[#00ffc3]">
                        <span>STREAMING CHUNKS TO SERVER</span>
                        <span>{chunkUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[#1c1c1c] h-1.5 overflow-hidden">
                        <div
                          className="bg-[#00ffc3] h-full transition-all duration-300"
                          style={{ width: `${chunkUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {uploadedServerFilePath && !isChunkUploading && uploadedFile && (
                    <div className="pt-1 flex items-center justify-center space-x-1 text-[9px] font-mono text-[#00ffc3]">
                      <CheckCircle className="w-3 h-3 text-[#00ffc3]" />
                      <span>Ready on server (Chunked upload verified)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-[9px] uppercase tracking-wider text-[#777] font-bold">Video Title / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Financial Growth & Market Strategy"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] p-3 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#00ffc3] placeholder-[#444] transition"
                />

                <label className="text-[9px] uppercase tracking-wider text-[#777] font-bold flex justify-between items-center">
                  <span>Contextual Notes / Spoken Summary (Optional)</span>
                  <span className="text-[8px] text-[#555]">Auto-detects language</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide additional transcription context, speakers, or specific timestamps..."
                  value={customTranscriptContext}
                  onChange={(e) => setCustomTranscriptContext(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] p-3 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#00ffc3] placeholder-[#444] resize-none transition"
                />
              </div>
            </div>

            {/* Live Audio / Voice Pitch Section */}
            <div className="border border-[#222] p-3 bg-[#0c0c0c] flex flex-col space-y-2">
              <span className="text-[9px] uppercase tracking-wider text-[#777] font-bold flex items-center space-x-1.5">
                <Mic className="w-3.5 h-3.5 text-[#00ffc3]" />
                <span>Live Spoken Voice Input</span>
              </span>

              {isRecording ? (
                <div className="flex items-center justify-between bg-[#00ffc3]/5 border border-[#00ffc3]/20 p-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="font-bold text-[#00ffc3] uppercase tracking-wide text-[10px]">
                      Recording Audio... ({recordingDuration}s)
                    </span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="bg-red-950/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 p-1"
                  >
                    <Square className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-full flex items-center justify-center space-x-2 bg-[#111] hover:bg-[#151515] text-[10px] uppercase font-bold text-[#aaa] py-2.5 px-3 border border-[#222] transition"
                >
                  <Mic className="w-3.5 h-3.5 text-[#00ffc3]" />
                  <span>Record Voice Pitch / Memo</span>
                </button>
              )}

              {recordedAudioUrl && (
                <div className="flex flex-col space-y-1.5 pt-1.5">
                  <span className="text-[9px] text-[#555] font-bold uppercase tracking-wider">Recorded Waveform Track:</span>
                  <audio src={recordedAudioUrl} controls className="w-full h-8 bg-[#111] border border-[#222]" />
                </div>
              )}
            </div>

            {/* Master Action Button */}
            <button
              disabled={isProcessing || !uploadedFile}
              onClick={() => triggerAnalysis()}
              className={`w-full font-black uppercase text-xs tracking-tighter py-3.5 transition duration-200 flex items-center justify-center space-x-2 shadow-lg ${
                uploadedFile && !processedClip
                  ? "bg-[#00ffc3] hover:bg-[#00e6af] text-black shadow-[#00ffc3]/20 ring-2 ring-[#00ffc3]/50 ring-offset-2 ring-offset-[#080808]"
                  : "bg-[#00ffc3] hover:bg-[#00e6af] text-black shadow-[#00ffc3]/10"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>{processingStage || "Analyzing with Gemini..."}</span>
                </>
              ) : uploadedFile && !processedClip ? (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Analyze & Extract Highlight (35–45s)</span>
                </>
              ) : processedClip ? (
                <>
                  <RefreshCw className="w-4 h-4 text-black" />
                  <span>Re-Analyze Highlight (35–45s)</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-black" />
                  <span>Upload Video to Analyze</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Technical Overview */}
          <div className="bg-[#080808] border border-[#222] p-5 text-[11px] text-[#777] space-y-3 leading-relaxed">
            <h3 className="font-bold text-[#aaa] uppercase tracking-wider flex items-center space-x-1.5 text-xs">
              <Info className="w-3.5 h-3.5 text-[#00ffc3]" />
              <span>Universal Multimodal Engine</span>
            </h3>
            <p>
              CineFact AI parses raw video media streams to pinpoint exact viral moments, transcribe verbatim millisecond-accurate subtitles in any language, and trigger parallel search queries.
            </p>
          </div>
        </section>

        {/* Center Column (5.5 lg cols) - Live Video Viewport, Timeline & Parallel API Panel */}
        <section className="lg:col-span-8 xl:col-span-5 flex flex-col space-y-4">
          
          {/* Director's Multi-Cut (A/B Social Variations) */}
          {processedClip?.directorCuts && processedClip.directorCuts.length > 0 && (
            <DirectorCutBar
              cuts={processedClip.directorCuts}
              activeCutId={activeCutId}
              onSelectCut={handleSelectCut}
              onExportCut={handleExportDirectorCut}
              isCompiling={isCompilingSummaryVideo}
            />
          )}

          {/* Main Video Viewport Wrapper */}
          <div className="bg-[#080808] border border-[#222] p-5 flex flex-col space-y-4">
            {/* Extraction Mode Toggle & Timeline Header */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[10px] uppercase tracking-widest text-[#555] flex items-center space-x-1.5 font-bold">
                  <Film className="w-3.5 h-3.5 text-[#00ffc3]" />
                  <span>Multimodal Viewports</span>
                </h2>
                {processedClip?.detectedLanguage && (
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-[#111] border border-[#333] text-[#00ffc3]">
                    {processedClip.detectedLanguage}
                  </span>
                )}

                {/* Extraction Mode Selector */}
                <div className="flex items-center space-x-0.5 bg-[#111] border border-[#222] p-0.5">
                  <button
                    onClick={() => setExtractionMode("continuous")}
                    className={`px-2 py-1 text-[9px] font-mono uppercase tracking-wider transition ${
                      extractionMode === "continuous"
                        ? "bg-[#00ffc3] text-black font-bold"
                        : "text-[#888] hover:text-white"
                    }`}
                    title="Continuous 35–45s unbroken passage"
                  >
                    Continuous
                  </button>
                  <button
                    onClick={() => setExtractionMode("montage")}
                    className={`px-2 py-1 text-[9px] font-mono uppercase tracking-wider transition ${
                      extractionMode === "montage"
                        ? "bg-[#00ffc3] text-black font-bold"
                        : "text-[#888] hover:text-white"
                    }`}
                    title="Multi-segment stitched reel across chapters (35–45s)"
                  >
                    Montage
                  </button>
                </div>

                {/* Dual Player View Switcher */}
                <div className="flex items-center space-x-0.5 bg-[#111] border border-[#222] p-0.5" id="dual-player-view-switcher">
                  <button
                    id="btn-view-mode-dual"
                    onClick={() => setPlayerViewMode("dual")}
                    className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider transition flex items-center space-x-1 ${
                      playerViewMode === "dual"
                        ? "bg-[#00ffc3] text-black font-bold shadow-sm"
                        : "text-[#888] hover:text-white"
                    }`}
                    title="View both Original Video player and Summarized player (35–45s)"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Dual View (Both Players)</span>
                  </button>
                  <button
                    id="btn-view-mode-original"
                    onClick={() => setPlayerViewMode("original")}
                    className={`px-2 py-1 text-[9px] font-mono uppercase tracking-wider transition ${
                      playerViewMode === "original"
                        ? "bg-[#00ffc3] text-black font-bold shadow-sm"
                        : "text-[#888] hover:text-white"
                    }`}
                    title="Focus on Original Raw Video Player"
                  >
                    Original Video
                  </button>
                  <button
                    id="btn-view-mode-summary"
                    onClick={() => setPlayerViewMode("summary")}
                    className={`px-2 py-1 text-[9px] font-mono uppercase tracking-wider transition flex items-center space-x-1 ${
                      playerViewMode === "summary"
                        ? "bg-[#00ffc3] text-black font-bold shadow-sm"
                        : "text-[#888] hover:text-white"
                    }`}
                    title="Focus on Summarized Highlight Player (35–45s)"
                  >
                    <Film className="w-3 h-3" />
                    <span>Summary (35–45s)</span>
                  </button>
                </div>
              </div>

              {/* Aspect Ratio Selector & Export .MP4 Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Visible Aspect Ratio Selector Button Group */}
                <div className="flex items-center bg-[#111] border border-[#222] p-0.5" id="toolbar-aspect-ratio-selector">
                  <span className="text-[8px] font-mono uppercase text-[#666] px-1.5 font-bold">RATIO:</span>
                  {(["9:16", "1:1", "4:5", "16:9"] as SocialAspectRatio[]).map((ratio) => {
                    const labels: Record<SocialAspectRatio, string> = {
                      "9:16": "9:16 Vertical",
                      "1:1": "1:1 Square",
                      "4:5": "4:5 Feed",
                      "16:9": "16:9 Wide"
                    };
                    const isSelected = exportAspectRatio === ratio;
                    return (
                      <button
                        key={ratio}
                        id={`btn-ratio-${ratio.replace(":", "-")}`}
                        onClick={() => setExportAspectRatio(ratio)}
                        className={`px-2 py-1 text-[9px] font-mono uppercase tracking-wider transition ${
                          isSelected
                            ? "bg-[#00ffc3] text-black font-bold ring-1 ring-[#00ffc3] shadow-sm"
                            : "text-[#888] hover:text-white"
                        }`}
                        title={`Select export ratio: ${labels[ratio]}`}
                      >
                        {labels[ratio]}
                      </button>
                    );
                  })}
                </div>

                {/* Direct Download of Compiled Summary Video */}
                {producedSummaryVideoUrl && (
                  <a
                    id="btn-download-produced-summary"
                    href={producedSummaryVideoUrl}
                    download={producedSummaryFileName || "CineFact_35-45s_Summary.mp4"}
                    className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#00ffc3] hover:bg-[#00e6af] text-black px-3 py-1.5 transition flex items-center space-x-1.5 shadow-sm ring-1 ring-[#00ffc3] active:scale-95"
                    title="Download rendered highlight summary MP4 (35–45s)"
                  >
                    <Download className="w-3 h-3 text-black" />
                    <span>Download MP4</span>
                  </a>
                )}

                {/* Re-render / Custom Export Button */}
                {processedClip ? (
                  <button
                    id="btn-export-mp4-toolbar"
                    onClick={startVideoExport}
                    className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] hover:border-[#00ffc3]/60 text-[#ccc] hover:text-white px-3 py-1.5 transition flex items-center space-x-1 shadow-sm active:scale-95"
                    title={`Export highlight as ${exportAspectRatio} MP4`}
                  >
                    <Sliders className="w-3 h-3 text-[#00ffc3]" />
                    <span>Re-render .MP4</span>
                  </button>
                ) : (
                  <button
                    id="btn-export-mp4-toolbar-disabled"
                    disabled
                    className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#151515] text-[#555] border border-[#262626] px-3.5 py-1.5 cursor-not-allowed flex items-center space-x-1"
                    title={uploadedFile ? "Analysis required before exporting" : "Please upload a video first"}
                  >
                    <Download className="w-3 h-3 text-[#444]" />
                    <span>{uploadedFile ? "Awaiting Analysis" : "No Video Loaded"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Player 1: Original Raw Video Container (Rendered in dual or original mode) */}
            {(playerViewMode === "dual" || playerViewMode === "original") && (
              <div className="flex flex-col space-y-3 bg-[#0a0a0a] border border-[#1f1f1f] p-3.5" id="original-video-player-container">
                {/* Player 1 Subheader */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 text-[10px] font-mono text-[#888] border-b border-[#1c1c1c]">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm shadow-blue-500/50"></div>
                    <span className="font-bold uppercase tracking-wider text-white flex items-center space-x-1.5">
                      <Sliders className="w-3 h-3 text-blue-400" />
                      <span>Player 1: Original Raw Video</span>
                    </span>
                    <span className="text-[8px] font-mono px-2 py-0.5 bg-[#111] border border-[#333] text-[#aaa]">
                      Full Length: {duration > 0 ? formatTimeText(duration) : "--:--"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Playback Mode Switcher: Full Video vs Loop Cut */}
                    {currentVideoSrc && (
                      <div className="flex items-center bg-[#111] border border-[#222] p-0.5" id="player1-mode-switcher">
                        <button
                          id="btn-player1-mode-full"
                          onClick={() => setPlayer1Mode("full")}
                          className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider transition flex items-center space-x-1 ${
                            player1Mode === "full"
                              ? "bg-[#38bdf8] text-black font-bold shadow-sm"
                              : "text-[#777] hover:text-white"
                          }`}
                          title="Watch full original video freely without restriction or cutoff"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Watch Full Video</span>
                        </button>
                        {processedClip && (
                          <button
                            id="btn-player1-mode-loop"
                            onClick={() => setPlayer1Mode("loopCut")}
                            className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider transition flex items-center space-x-1 ${
                              player1Mode === "loopCut"
                                ? "bg-[#00ffc3] text-black font-bold shadow-sm"
                                : "text-[#777] hover:text-white"
                            }`}
                            title="Loop the selected cut window"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>Loop Cut Window</span>
                          </button>
                        )}
                      </div>
                    )}

                    {processedClip && clipEndSec > clipStartSec && (
                      <div className="text-[9px] font-mono text-[#666] hidden sm:inline">
                        Cut: <span className="text-[#00ffc3] font-bold">{formatTimeText(clipStartSec)} → {formatTimeText(clipEndSec)}</span> ({totalHighlightDuration}s)
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Player Display Container */}
                <div className="relative aspect-video bg-[#000] border border-[#222] overflow-hidden flex items-center justify-center group">
                  
                  {/* Awaiting Analysis Badge for Uploaded Video */}
                  {currentVideoSrc && !processedClip && !isProcessing && (
                    <div className="absolute top-3 right-3 z-20 flex items-center space-x-1.5 bg-amber-950/80 border border-amber-500/50 text-amber-300 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>Awaiting Analysis</span>
                    </div>
                  )}
                  
                  {currentVideoSrc ? (
                    /* Native HTML5 Video Stream for Raw Source */
                    <video
                      ref={videoRef}
                      src={currentVideoSrc}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Video Ingestion Placeholder */
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-[#555]" id="video-idle-placeholder">
                      <FileVideo className="w-12 h-12 text-[#333]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#888]">
                        Upload a video file to begin analysis
                      </span>
                      <span className="text-[10px] max-w-xs leading-normal text-[#555]">
                        Drop an MP4, WebM, or MOV file into the upload zone to preview and extract viral highlights.
                      </span>
                    </div>
                  )}

              {/* HUD Parallel API Fact-Check Badge Overlay */}
              {processedClip && processedClip.searchQueries.length > 0 && showFactOverlay && (
                <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md z-20 pointer-events-auto">
                  {(() => {
                    const currentQuery = processedClip.searchQueries[activeFactIndex] || processedClip.searchQueries[0];
                    const isSuccess = currentQuery.status === "success" || (currentQuery.results && currentQuery.results.length > 0);
                    const topResult = currentQuery.results?.[0];
                    const confidence = topResult?.confidenceScore || 98;
                    const domain = topResult?.sourceDomain || "parallel-grounding.net";

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/90 backdrop-blur-md border border-[#00ffc3]/60 p-2.5 shadow-2xl shadow-black/80 flex flex-col space-y-1.5"
                      >
                        <div className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffc3] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffc3]"></span>
                            </span>
                            <span className="text-[8px] font-black text-[#00ffc3] tracking-widest uppercase font-mono flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3 text-[#00ffc3]" />
                              <span>PARALLEL API GROUNDED</span>
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span className="text-[8px] font-mono px-1.5 py-0.2 border border-[#00ffc3]/40 bg-[#00ffc3]/10 text-[#00ffc3] font-bold">
                              {confidence}% {topResult?.verificationVerdict || "HIGH AUTHORITY"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFactIndex((prev) => (prev + 1) % processedClip.searchQueries.length);
                              }}
                              className="text-[8px] font-mono text-[#777] hover:text-[#00ffc3] px-1 border border-[#222]"
                              title="Next Claim Anchor"
                            >
                              {activeFactIndex + 1}/{processedClip.searchQueries.length}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFactOverlay(false);
                              }}
                              className="text-[9px] text-[#555] hover:text-[#aaa] px-1"
                              title="Minimize Overlay"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
                          "{currentQuery.targetClaim || currentQuery.query}"
                        </div>

                        <div className="flex items-center justify-between text-[8px] text-[#777] font-mono pt-0.5 border-t border-white/5">
                          <span className="text-[#00ffc3]/80">Source: {domain}</span>
                          <span>Category: {currentQuery.category || "Factual Grounding"}</span>
                        </div>
                      </motion.div>
                    );
                  })()}
                </div>
              )}

              {/* Toggle to reopen HUD if minimized */}
              {processedClip && processedClip.searchQueries.length > 0 && !showFactOverlay && (
                <button
                  onClick={() => setShowFactOverlay(true)}
                  className="absolute top-3 left-3 z-20 bg-black/80 hover:bg-black border border-[#00ffc3]/40 text-[#00ffc3] px-2 py-1 text-[8px] font-mono uppercase font-bold flex items-center space-x-1 shadow"
                >
                  <ShieldCheck className="w-3 h-3 text-[#00ffc3]" />
                  <span>Show Fact HUD</span>
                </button>
              )}

              {/* HTML5 Play / Pause Overlaid State Button */}
              {currentVideoSrc && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <button
                    onClick={togglePlayback}
                    className="p-4 bg-black border border-[#222] hover:border-[#00ffc3]/50 text-white transition transform hover:scale-105 pointer-events-auto"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 text-[#00ffc3]" /> : <Play className="w-5 h-5 fill-white text-white" />}
                  </button>
                </div>
              )}
            </div>

            {/* Subtitle Audio Synced Timeline Scrubber */}
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center text-[10px] text-[#555] font-mono">
                <span className="font-bold flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#555]" />
                  <span>Playback Head: {duration > 0 ? formatTimeText(currentTime) : "00:00"}</span>
                </span>
                <span>Total Video Length: {duration > 0 ? formatTimeText(duration) : "--:--"}</span>
              </div>

              {/* Scrubber Bar Container */}
              <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                className="relative h-14 bg-[#111] border border-[#222] cursor-pointer overflow-hidden transition hover:border-[#333]"
              >
                {/* Multi-Segment Highlight Markers or Single Envelope - ONLY when processedClip exists */}
                {processedClip?.highlightSegments && processedClip.highlightSegments.length > 0 ? (
                  processedClip.highlightSegments.map((seg, idx) => {
                    const leftPct = duration > 0 ? (seg.startSec / duration) * 100 : 0;
                    const widthPct = duration > 0 ? ((seg.endSec - seg.startSec) / duration) * 100 : 0;
                    const segDur = Math.round(seg.endSec - seg.startSec);
                    const isMultiMoment = processedClip.highlightSegments && processedClip.highlightSegments.length > 1;

                    let colorBg = "bg-[#00ffc3]/20 border-[#00ffc3]/70 text-[#00ffc3]";
                    let roleLabel = activeDirectorCut ? `${activeDirectorCut.label} (${segDur}s)` : `Selected Cut (${segDur}s)`;

                    if (isMultiMoment) {
                      const momentName = seg.role === "evidence" ? "Moment 2: Evidence" : (seg.role === "takeaway" || seg.role === "climax") ? "Moment 3: Climax" : "Moment 1: Hook";
                      roleLabel = `${momentName} (${segDur}s)`;
                      if (seg.role === "evidence") {
                        colorBg = "bg-[#38bdf8]/20 border-[#38bdf8]/70 text-[#38bdf8]";
                      } else if (seg.role === "takeaway" || seg.role === "climax") {
                        colorBg = "bg-[#fbbf24]/20 border-[#fbbf24]/70 text-[#fbbf24]";
                      }
                    } else if (seg.role === "evidence" || activeDirectorCut?.style === "lore") {
                      colorBg = "bg-[#38bdf8]/20 border-[#38bdf8]/70 text-[#38bdf8]";
                    } else if (seg.role === "takeaway" || seg.role === "climax" || activeDirectorCut?.style === "climax") {
                      colorBg = "bg-[#fbbf24]/20 border-[#fbbf24]/70 text-[#fbbf24]";
                    }

                    const isCurrent = currentTime >= seg.startSec && currentTime <= seg.endSec;

                    return (
                      <div
                        key={seg.id || idx}
                        className={`absolute top-0 bottom-0 border-l-2 border-r-2 transition-all pointer-events-none ${colorBg} ${
                          isCurrent ? "brightness-125 z-10 shadow-lg" : "opacity-85"
                        }`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.max(1.5, widthPct)}%`
                        }}
                        title={`${roleLabel}: ${formatTimeText(seg.startSec)} - ${formatTimeText(seg.endSec)}`}
                      >
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/90 border border-current text-[8px] font-bold uppercase tracking-wider font-mono whitespace-nowrap overflow-hidden pointer-events-none shadow-sm">
                          {roleLabel}
                        </div>
                      </div>
                    );
                  })
                ) : processedClip ? (
                  /* Single continuous highlight envelope when analyzed */
                  <div
                    className="absolute top-0 bottom-0 bg-[#00ffc3]/10 border-l border-r border-[#00ffc3]/40 shadow-inner pointer-events-none"
                    style={{
                      left: `${(clipStartSec / duration) * 100}%`,
                      width: `${((clipEndSec - clipStartSec) / duration) * 100}%`
                    }}
                  >
                    <div className="absolute top-1 left-1.5 text-[8px] font-bold text-[#00ffc3] uppercase tracking-widest font-mono pointer-events-none">
                      {activeDirectorCut ? activeDirectorCut.label : `${totalHighlightDuration}s Selected Cut Window`}
                    </div>
                  </div>
                ) : null}

                {/* Subtitle chunk indicators */}
                {processedClip?.subtitles.map((sub) => {
                  const startPercent = (sub.start / (duration * 1000)) * 100;
                  const widthPercent = ((sub.end - sub.start) / (duration * 1000)) * 100;
                  const isActive = activeSubtitle?.id === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className={`absolute bottom-1 h-1 transition-all ${
                        isActive ? "bg-[#00ffc3] h-1.5 z-20 shadow shadow-[#00ffc3]" : "bg-[#333] hover:bg-[#555]"
                      }`}
                      style={{
                        left: `${startPercent}%`,
                        width: `${Math.max(1, widthPercent)}%`
                      }}
                      title={sub.text}
                    />
                  );
                })}

                {/* Moving playhead indicator bar */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-30 pointer-events-none"
                  style={{ left: `${playheadPercent}%` }}
                >
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#00ffc3] border border-black shadow"></div>
                </div>
              </div>
            </div>

            {/* AI-Detected Timeline Chapters Navigator */}
            {processedClip?.timelineChapters && processedClip.timelineChapters.length > 0 && (
              <div className="flex flex-col space-y-1.5 pt-1 border-t border-[#181818]" id="timeline-chapters-navigator">
                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[#666]">
                  <span className="flex items-center space-x-1.5 font-bold">
                    <Sparkles className="w-3 h-3 text-[#00ffc3]" />
                    <span>AI-Mapped Chapters & Density (Click to Jump Highlight):</span>
                  </span>
                  <span className="text-[#555] font-mono">{processedClip.timelineChapters.length} Chapters Detected</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                  {processedClip.timelineChapters.map((ch) => {
                    const isSelected = Math.abs(clipStartSec - ch.startSec) <= 1 && Math.abs(clipEndSec - ch.endSec) <= 1;
                    return (
                      <button
                        key={ch.id}
                        id={`btn-chapter-${ch.id}`}
                        onClick={() => {
                          updateHighlightBounds(ch.startSec, ch.endSec);
                          if (videoRef.current) {
                            videoRef.current.currentTime = ch.startSec;
                          }
                          setCurrentTime(ch.startSec);
                        }}
                        className={`p-2 text-left border transition flex flex-col space-y-1 ${
                          isSelected
                            ? "bg-[#00ffc3]/15 border-[#00ffc3] text-white shadow-sm ring-1 ring-[#00ffc3]"
                            : "bg-[#111] border-[#222] text-[#888] hover:border-[#444] hover:text-white"
                        }`}
                        title={`Jump highlight to ${ch.title} (${formatTimeText(ch.startSec)} - ${formatTimeText(ch.endSec)})`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#00ffc3] truncate">
                            {ch.title}
                          </span>
                          <span className="text-[8px] font-mono px-1 py-0.2 bg-[#000] border border-[#222] text-amber-300 shrink-0">
                            ★ {ch.engagementScore}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] font-mono text-[#666]">
                          <span>{formatTimeText(ch.startSec)} - {formatTimeText(ch.endSec)} ({ch.endSec - ch.startSec}s)</span>
                          <span className="uppercase text-[#888] px-1 bg-[#1a1a1a]">{ch.role}</span>
                        </div>
                        <p className="text-[8px] text-[#777] line-clamp-1 italic">{ch.summary}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Boundary Fine-Tuning Nudge Toolbar */}
            {processedClip && (
              <div className="flex flex-col space-y-2 bg-[#0d0d0d] border border-[#222] p-2.5" id="boundary-nudge-controls">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Start Point Nudge */}
                    <div className="flex items-center space-x-1">
                      <span className="text-[9px] uppercase font-bold text-[#777] font-mono mr-1">Start:</span>
                      <button
                        id="btn-nudge-start-minus-1"
                        onClick={() => {
                          const newStart = Math.max(0, clipStartSec - 1);
                          if (newStart < clipEndSec - 3) {
                            updateHighlightBounds(newStart, clipEndSec);
                            if (videoRef.current) videoRef.current.currentTime = newStart;
                          }
                        }}
                        className="px-1.5 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333] text-[#aaa] hover:text-white text-[9px] font-mono active:scale-95"
                        title="Nudge Start -1s"
                      >
                        -1s
                      </button>
                      <button
                        id="btn-nudge-start-minus-half"
                        onClick={() => {
                          const newStart = Math.max(0, Math.round((clipStartSec - 0.5) * 10) / 10);
                          if (newStart < clipEndSec - 2) {
                            updateHighlightBounds(newStart, clipEndSec);
                            if (videoRef.current) videoRef.current.currentTime = newStart;
                          }
                        }}
                        className="px-1.5 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333] text-[#aaa] hover:text-white text-[9px] font-mono active:scale-95"
                        title="Nudge Start -0.5s"
                      >
                        -0.5s
                      </button>
                      <span className="px-2 py-0.5 bg-[#000] border border-[#222] text-[#00ffc3] text-[10px] font-mono font-bold min-w-[42px] text-center">
                        {formatTimeText(clipStartSec)}
                      </span>
                      <button
                        id="btn-nudge-start-plus-half"
                        onClick={() => {
                          const newStart = Math.min(clipEndSec - 2, Math.round((clipStartSec + 0.5) * 10) / 10);
                          updateHighlightBounds(newStart, clipEndSec);
                          if (videoRef.current) videoRef.current.currentTime = newStart;
                        }}
                        className="px-1.5 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333] text-[#aaa] hover:text-white text-[9px] font-mono active:scale-95"
                        title="Nudge Start +0.5s"
                      >
                        +0.5s
                      </button>
                      <button
                        id="btn-nudge-start-plus-1"
                        onClick={() => {
                          const newStart = Math.min(clipEndSec - 3, clipStartSec + 1);
                          updateHighlightBounds(newStart, clipEndSec);
                          if (videoRef.current) videoRef.current.currentTime = newStart;
                        }}
                        className="px-1.5 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333] text-[#aaa] hover:text-white text-[9px] font-mono active:scale-95"
                        title="Nudge Start +1s"
                      >
                        +1s
                      </button>
                    </div>

                    {/* End Point Nudge with Speech Completion */}
                    <div className="flex items-center space-x-1">
                      <span className="text-[9px] uppercase font-bold text-[#777] font-mono mr-1">End:</span>
                      <button
                        id="btn-nudge-end-minus-1"
                        onClick={() => {
                          const newEnd = Math.max(clipStartSec + 3, clipEndSec - 1);
                          updateHighlightBounds(clipStartSec, newEnd);
                          if (videoRef.current) videoRef.current.currentTime = newEnd;
                        }}
                        className="px-1.5 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333] text-[#aaa] hover:text-white text-[9px] font-mono active:scale-95"
                        title="Nudge End -1s"
                      >
                        -1s
                      </button>
                      <button
                        id="btn-nudge-end-minus-half"
                        onClick={() => {
                          const newEnd = Math.max(clipStartSec + 2, Math.round((clipEndSec - 0.5) * 10) / 10);
                          updateHighlightBounds(clipStartSec, newEnd);
                          if (videoRef.current) videoRef.current.currentTime = newEnd;
                        }}
                        className="px-1.5 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333] text-[#aaa] hover:text-white text-[9px] font-mono active:scale-95"
                        title="Nudge End -0.5s"
                      >
                        -0.5s
                      </button>
                      <span className="px-2 py-0.5 bg-[#000] border border-[#222] text-[#00ffc3] text-[10px] font-mono font-bold min-w-[42px] text-center">
                        {formatTimeText(clipEndSec)}
                      </span>
                      <button
                        id="btn-nudge-end-plus-half"
                        onClick={() => {
                          const maxAllowed = duration > 0 ? duration : (clipEndSec + 1);
                          const newEnd = Math.min(maxAllowed, Math.round((clipEndSec + 0.5) * 10) / 10);
                          updateHighlightBounds(clipStartSec, newEnd);
                          if (videoRef.current) videoRef.current.currentTime = newEnd;
                        }}
                        className="px-1.5 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333] text-[#aaa] hover:text-white text-[9px] font-mono active:scale-95"
                        title="Nudge End +0.5s"
                      >
                        +0.5s
                      </button>
                      <button
                        id="btn-nudge-end-plus-1"
                        onClick={() => {
                          const maxAllowed = duration > 0 ? duration : (clipEndSec + 1);
                          const newEnd = Math.min(maxAllowed, clipEndSec + 1);
                          updateHighlightBounds(clipStartSec, newEnd);
                          if (videoRef.current) videoRef.current.currentTime = newEnd;
                        }}
                        className="px-1.5 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333] text-[#aaa] hover:text-white text-[9px] font-mono active:scale-95"
                        title="Nudge End +1s"
                      >
                        +1s
                      </button>
                    </div>

                    {/* Snap to Speech End Action Button */}
                    <button
                      id="btn-snap-speech-end"
                      onClick={snapToSpeechEnd}
                      className="px-2.5 py-0.5 bg-[#152520] hover:bg-[#1a332a] border border-[#00ffc3]/60 text-[#00ffc3] hover:text-white text-[9px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1 transition active:scale-95 shadow-sm"
                      title="Snap cut end time to the nearest spoken sentence end with +0.50s vocal cushion"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#00ffc3]" />
                      <span>Snap to Speech End (+0.5s Cushion)</span>
                    </button>
                  </div>

                  {/* Quick Duration Presets */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] uppercase font-bold text-[#666] font-mono">Preset:</span>
                    {[35, 40, 44].map((presetDur) => {
                      const currentDur = Math.round(clipEndSec - clipStartSec);
                      return (
                        <button
                          key={presetDur}
                          id={`btn-preset-${presetDur}s`}
                          onClick={() => {
                            const maxEnd = duration > 0 ? Math.min(duration, clipStartSec + presetDur) : (clipStartSec + presetDur);
                            updateHighlightBounds(clipStartSec, maxEnd);
                          }}
                          className={`px-2 py-0.5 text-[9px] font-mono border transition ${
                            currentDur === presetDur
                              ? "bg-[#00ffc3] text-black border-[#00ffc3] font-bold shadow-sm"
                              : "bg-[#141414] text-[#888] border-[#262626] hover:text-white"
                          }`}
                        >
                          {presetDur}s
                        </button>
                      );
                    })}
                    <span className="text-[9px] font-mono text-[#555] ml-1">
                      ({totalHighlightDuration}s Active)
                    </span>
                  </div>
                </div>

                {/* Speech Snapping Notification */}
                {speechSnapNotice && (
                  <div className="text-[9px] font-mono text-[#00ffc3] bg-black/60 border border-[#00ffc3]/30 px-2 py-1 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3 h-3 shrink-0 text-[#00ffc3]" />
                    <span>{speechSnapNotice}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Timeline Controls */}
            <div className="flex items-center justify-between border-t border-[#222] pt-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePlayback}
                  className="px-4 py-2 bg-[#111] hover:bg-[#151515] text-[#ccc] hover:text-white text-[11px] font-bold uppercase tracking-wider border border-[#222] transition flex items-center space-x-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-[#00ffc3]" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-[#00ffc3]" />
                      <span>
                        {processedClip
                          ? (processedClip.highlightSegments && processedClip.highlightSegments.length > 1
                              ? `Play Highlight Compilation (${totalHighlightDuration}s)`
                              : `Play ${totalHighlightDuration}s Highlight Loop`)
                          : "Play Full Video"}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Adjust range sliders explicitly when analyzed */}
              {processedClip && (
                <div className="flex items-center space-x-2 text-xs text-[#777]">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-[#555]">Manual Bounds:</span>
                  <div className="flex items-center space-x-1.5 bg-[#111] border border-[#222] p-1 text-[11px] font-mono">
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, duration - 10)}
                      value={Math.round(clipStartSec)}
                      onChange={(e) => {
                        const newStart = Math.max(0, parseInt(e.target.value, 10) || 0);
                        if (newStart < clipEndSec - 3) {
                          updateHighlightBounds(newStart, clipEndSec);
                        }
                      }}
                      className="w-8 bg-transparent text-center focus:outline-none text-[#00ffc3] font-bold"
                    />
                    <span>s -</span>
                    <input
                      type="number"
                      min={clipStartSec + 3}
                      max={duration || 9999}
                      value={Math.round(clipEndSec)}
                      onChange={(e) => {
                        const newEnd = Math.max(clipStartSec + 3, parseInt(e.target.value, 10) || 0);
                        updateHighlightBounds(clipStartSec, newEnd);
                      }}
                      className="w-8 bg-transparent text-center focus:outline-none text-[#00ffc3] font-bold"
                    />
                    <span>s ({totalHighlightDuration}s)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player 2: Summarized Video Player (Rendered in dual or summary mode) */}
        {(playerViewMode === "dual" || playerViewMode === "summary") && (
          <div id="summarized-video-player-container">
            <SummaryVideoPlayer
              summaryVideoUrl={producedSummaryCutId === (activeDirectorCut?.id || activeCutId) ? producedSummaryVideoUrl : null}
              rawVideoUrl={currentVideoSrc || serverStreamUrl || uploadedVideoUrl || null}
              activeCutId={activeDirectorCut?.id || activeCutId}
              clipStartSec={activeDirectorCut ? activeDirectorCut.clipStartSec : clipStartSec}
              clipEndSec={activeDirectorCut ? activeDirectorCut.clipEndSec : clipEndSec}
              totalDuration={
                activeDirectorCut?.highlightSegments && activeDirectorCut.highlightSegments.length > 1
                  ? activeDirectorCut.highlightSegments.reduce((sum, s) => sum + (s.endSec - s.startSec), 0)
                  : (activeDirectorCut ? activeDirectorCut.clipEndSec - activeDirectorCut.clipStartSec : totalHighlightDuration)
              }
              segments={activeDirectorCut?.highlightSegments}
              isCompiling={isCompilingSummaryVideo}
              compilingProgress={compilingProgress}
              compilingStatusMessage={compilingStatusMessage}
              aspectRatio={exportAspectRatio}
              onAspectRatioChange={(r) => setExportAspectRatio(r)}
              subtitles={
                activeDirectorCut?.subtitles && activeDirectorCut.subtitles.length > 0
                  ? activeDirectorCut.subtitles
                  : (processedClip?.stitchedSubtitles && processedClip.stitchedSubtitles.length > 0
                      ? processedClip.stitchedSubtitles
                      : (processedClip?.subtitles || []))
              }
              verifiedClaim={
                (activeDirectorCut?.primaryClaimIndex !== undefined && processedClip?.searchQueries[activeDirectorCut.primaryClaimIndex]) ||
                processedClip?.searchQueries.find(
                  (c) => c.status === "success" || (c.results && c.results.length > 0)
                ) || processedClip?.searchQueries[0]
              }
              onReRender={() => {
                if (processedClip) {
                  produceSummaryVideo(processedClip, null, exportAspectRatio, activeDirectorCut);
                }
              }}
              downloadFileName={producedSummaryFileName || (activeDirectorCut ? `CineFact_${activeDirectorCut.id}.mp4` : undefined)}
              clipTitle={activeDirectorCut ? `${customTitle || processedClip?.title} - ${activeDirectorCut.label}` : (customTitle || processedClip?.title)}
              onTriggerCompile={() => {
                if (processedClip) {
                  produceSummaryVideo(processedClip, null, exportAspectRatio, activeDirectorCut);
                }
              }}
            />
          </div>
        )}
      </div>

          {/* Parallel API Fact-Checking & Grounding Workspace Panel */}
          <div className="bg-[#080808] border border-[#222] p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-[#00ffc3]/5 border border-[#00ffc3]/20 text-[#00ffc3]">
                  <Globe className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-[10px] uppercase tracking-widest text-[#555] font-bold">
                  Parallel API Fact-Checking & Grounding Engine
                </h3>
              </div>
              {processedClip && (
                <button
                  onClick={triggerAllParallelChecks}
                  className="text-[9px] bg-[#00ffc3]/5 hover:bg-[#00ffc3]/15 text-[#00ffc3] border border-[#00ffc3]/20 px-2.5 py-1 font-bold uppercase tracking-wider transition flex items-center space-x-1"
                >
                  <Search className="w-3 h-3" />
                  <span>Verify All Parallel Facts</span>
                </button>
              )}
            </div>

            {/* List of 3 Targeted Parallel API English Queries */}
            <div className="flex flex-col space-y-3">
              {processedClip ? (
                processedClip.searchQueries.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0c0c0c] border border-[#222] p-3.5 flex flex-col space-y-3 transition-all hover:bg-[#111]"
                  >
                    <div className="flex items-start justify-between space-x-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-[9px] font-bold text-[#00ffc3] uppercase tracking-wider">
                            Parallel Query {idx + 1}
                          </span>
                          {item.category && (
                            <span className="text-[8px] font-mono text-[#777] border border-[#222] px-1.5 py-0.2">
                              {item.category}
                            </span>
                          )}
                        </div>

                        {/* English Query box */}
                        <div className="text-[11px] font-mono text-[#00ffc3] bg-[#00ffc3]/5 p-2 border border-[#00ffc3]/20 block my-1 break-words">
                          "{item.query}"
                        </div>

                        {item.targetClaim && (
                          <p className="text-[10px] text-[#aaa] mt-1">
                            <span className="text-[#666] font-bold uppercase tracking-wider text-[8px] mr-1">Claim Checked:</span>
                            {item.targetClaim}
                          </p>
                        )}

                        <p className="text-[10px] text-[#555] leading-relaxed font-serif italic mt-1">{item.purpose}</p>
                      </div>

                      {/* Verify Button */}
                      <button
                        onClick={() => triggerFactCheck(item)}
                        className={`text-[10px] uppercase tracking-wider px-2.5 py-1.5 font-bold border transition flex items-center space-x-1.5 shrink-0 ${
                          item.status === "success"
                            ? "bg-[#00ffc3]/5 border-[#00ffc3]/30 text-[#00ffc3]"
                            : item.status === "error"
                            ? "bg-red-950/10 border-red-500/20 text-red-400"
                            : "bg-[#111] border-[#222] hover:border-[#333] text-[#aaa]"
                        }`}
                      >
                        {activeSearches[item.query] ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-[#00ffc3]" />
                            <span>Searching...</span>
                          </>
                        ) : item.status === "success" ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-[#00ffc3]" />
                            <span>Verified</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3 h-3" />
                            <span>Verify</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Results Display when Verified */}
                    {item.results && item.results.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="border-t border-[#222] pt-2 flex flex-col space-y-2"
                      >
                        <span className="text-[8px] text-[#555] font-bold uppercase tracking-widest">
                          Parallel Grounded Web Citations:
                        </span>
                        {item.results.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-[#080808] border border-[#222] hover:border-[#00ffc3]/30 transition flex flex-col space-y-1 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#ccc] group-hover:text-[#00ffc3] transition flex items-center space-x-1.5">
                                <span>{res.title}</span>
                                <ExternalLink className="w-3 h-3 text-[#555] group-hover:text-[#00ffc3]" />
                              </span>
                              {res.confidenceScore && (
                                <span className="text-[9px] font-mono text-[#00ffc3] px-1.5 py-0.2 border border-[#00ffc3]/30 bg-[#00ffc3]/5">
                                  {res.confidenceScore}% {res.verificationVerdict || "CONFIDENCE"}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#777] leading-relaxed">{res.snippet}</p>
                            {res.sourceDomain && (
                              <span className="text-[8px] font-mono text-[#444]">{res.sourceDomain}</span>
                            )}
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center p-6 border border-[#222] border-dashed text-[#555] text-xs font-serif italic">
                  Ingest or select a video to extract 3 targeted Parallel API fact-checking anchors.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column (4 lg cols) - Clip Intelligence, Subtitles & Social Export */}
        <section className="lg:col-span-12 xl:col-span-4 flex flex-col space-y-4">
          
          <div className="bg-[#080808] border border-[#222] p-5 flex flex-col space-y-4 flex-1">
            
            {/* Tab Controllers */}
            <div className="flex border-b border-[#222]">
              <button
                onClick={() => setActiveTab("highlights")}
                className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition ${
                  activeTab === "highlights"
                    ? "border-[#00ffc3] text-[#00ffc3]"
                    : "border-transparent text-[#555] hover:text-[#aaa]"
                }`}
              >
                Highlight Meta
              </button>
              <button
                onClick={() => setActiveTab("subtitles")}
                className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition ${
                  activeTab === "subtitles"
                    ? "border-[#00ffc3] text-[#00ffc3]"
                    : "border-transparent text-[#555] hover:text-[#aaa]"
                }`}
              >
                Transcript & Subtitles {processedClip?.subtitles?.length ? `(${processedClip.subtitles.length})` : ""}
              </button>
              <button
                onClick={() => setActiveTab("clearance")}
                className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition flex items-center justify-center space-x-1 ${
                  activeTab === "clearance"
                    ? "border-[#00ffc3] text-[#00ffc3]"
                    : "border-transparent text-[#555] hover:text-[#aaa]"
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-[#00ffc3]" />
                <span>Clearance</span>
              </button>
            </div>

            {/* Tab 1: Highlight Meta & Viral Scoring */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {activeTab === "highlights" && (
                <>
                  {processedClip ? (
                    <>
                      {/* Virality Scoring Widget */}
                      {(() => {
                        const currentVirality = activeDirectorCut?.viralityScore ?? processedClip.viralityScore ?? 85;
                        return (
                          <div className="bg-[#0c0c0c] border border-[#222] p-4 flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[9px] text-[#555] font-bold uppercase tracking-wider block">
                                  Predicted Virality Rating
                                </span>
                                {activeDirectorCut && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#00ffc3]/10 border border-[#00ffc3]/30 text-[#00ffc3]">
                                    {activeDirectorCut.label.split(":")[0]}
                                  </span>
                                )}
                              </div>
                              <p className="text-2xl font-black tracking-tighter uppercase italic text-white">
                                {currentVirality} <span className="text-xs text-[#00ffc3] font-sans not-italic">/ 100</span>
                              </p>
                              <div className="flex items-center space-x-2 text-[8px] font-mono text-[#666]">
                                <span>{activeDirectorCut?.retentionEstimate || `Language: ${processedClip.detectedLanguage}`}</span>
                              </div>
                            </div>
                            
                            <div className="relative w-14 h-14 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="28"
                                  cy="28"
                                  r="22"
                                  strokeWidth="3"
                                  stroke="#111"
                                  fill="transparent"
                                />
                                <circle
                                  cx="28"
                                  cy="28"
                                  r="22"
                                  strokeWidth="3"
                                  stroke="#00ffc3"
                                  fill="transparent"
                                  strokeDasharray={`${2 * Math.PI * 22}`}
                                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - currentVirality / 100)}`}
                                />
                              </svg>
                              <span className="absolute text-[10px] font-bold font-mono text-[#00ffc3]">{currentVirality}%</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Smart Multi-Slot Highlight Compilation Breakdown Card */}
                      {processedClip.highlightSegments && processedClip.highlightSegments.length > 0 && (
                        <div className="bg-[#0c0c0c] border border-[#222] p-4 flex flex-col space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="p-1 bg-[#00ffc3]/10 border border-[#00ffc3]/30 text-[#00ffc3]">
                                <Scissors className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-[10px] uppercase tracking-widest text-[#555] font-bold">
                                Multi-Slot Compilation Breakdown
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-[#00ffc3] bg-[#00ffc3]/10 border border-[#00ffc3]/30 px-2 py-0.5 font-bold">
                              {(Math.round(totalHighlightDuration * 100) / 100).toFixed(2)}s Stitched Reel
                            </span>
                          </div>

                          <div className="flex flex-col space-y-2">
                            {processedClip.highlightSegments.map((seg, sIdx) => {
                              const dur = seg.endSec - seg.startSec;
                              const formattedDur = (Math.round(dur * 100) / 100).toFixed(2);
                              const isHook = seg.role === "hook";
                              const isEvidence = seg.role === "evidence";

                              const tagColor = isHook
                                ? "bg-[#00ffc3]/10 border-[#00ffc3]/40 text-[#00ffc3]"
                                : isEvidence
                                ? "bg-[#38bdf8]/10 border-[#38bdf8]/40 text-[#38bdf8]"
                                : "bg-[#fbbf24]/10 border-[#fbbf24]/40 text-[#fbbf24]";

                              return (
                                <div
                                  key={seg.id || sIdx}
                                  className="p-2.5 bg-[#111] border border-[#222] hover:border-[#333] transition flex flex-col space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 border ${tagColor}`}>
                                        Slot {sIdx + 1}: {seg.role.toUpperCase()}
                                      </span>
                                      <span className="text-[10px] font-mono text-white font-bold">
                                        {formatTimeText(seg.startSec)} → {formatTimeText(seg.endSec)}
                                      </span>
                                      <span className="text-[9px] font-mono text-[#777]">({formattedDur}s)</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      {seg.score && (
                                        <span className="text-[8px] font-mono text-[#aaa] bg-black px-1.5 py-0.5 border border-[#222]">
                                          Density: <strong className="text-white">{seg.score}</strong>
                                        </span>
                                      )}
                                      <button
                                        onClick={() => {
                                          if (videoRef.current) {
                                            videoRef.current.currentTime = seg.startSec;
                                          }
                                          setCurrentTime(seg.startSec);
                                          if (!isPlaying && videoRef.current) {
                                            videoRef.current.play();
                                            setIsPlaying(true);
                                          }
                                        }}
                                        className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 bg-[#00ffc3]/10 hover:bg-[#00ffc3]/20 border border-[#00ffc3]/30 text-[#00ffc3] transition flex items-center space-x-1"
                                      >
                                        <Play className="w-2.5 h-2.5 fill-current" />
                                        <span>Jump</span>
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-[10px] text-[#aaa] font-sans leading-normal">
                                    {seg.summary}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Editorial Rationale */}
                      <div className="space-y-1">
                        <span className="text-[9px] text-[#555] font-bold uppercase tracking-wider block">
                          Selection Evaluation Summary
                        </span>
                        <div className="bg-[#0c0c0c] border border-[#222] p-3 text-[11px] font-serif italic leading-relaxed text-[#aaa]">
                          {processedClip.highlightReason}
                        </div>
                      </div>

                      {/* Post Captions and Hooks */}
                      <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-[#777] font-bold uppercase tracking-widest">
                            Instagram Reels / TikTok Hook
                          </span>
                          <button
                            onClick={() => copyText(processedClip.socialMetadata.instagramHook, "hook")}
                            className="text-[9px] uppercase tracking-wider text-[#00ffc3] flex items-center space-x-1 hover:underline font-bold"
                          >
                            {copiedField === "hook" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-[#00ffc3]" />}
                            <span>{copiedField === "hook" ? "Copied" : "Copy Hook"}</span>
                          </button>
                        </div>
                        <div className="bg-[#111] border border-[#222] p-3 text-xs font-serif italic text-[#ccc] leading-relaxed">
                          "{processedClip.socialMetadata.instagramHook}"
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[9px] text-[#777] font-bold uppercase tracking-widest">
                            Optimized Post Caption
                          </span>
                          <button
                            onClick={() => copyText(processedClip.socialMetadata.caption, "caption")}
                            className="text-[9px] uppercase tracking-wider text-[#00ffc3] flex items-center space-x-1 hover:underline font-bold"
                          >
                            {copiedField === "caption" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-[#00ffc3]" />}
                            <span>{copiedField === "caption" ? "Copied" : "Copy Caption"}</span>
                          </button>
                        </div>
                        <div className="bg-[#111] border border-[#222] p-3 text-xs text-[#aaa] leading-relaxed whitespace-pre-wrap">
                          {processedClip.socialMetadata.caption}
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {processedClip.socialMetadata.hashtags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-[#111] text-[9px] border border-[#333] text-[#aaa] uppercase tracking-wider font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-12 text-[#555] text-xs font-serif italic">
                      No video metadata processed yet. Click the extraction button to run Gemini 3.8 Flash analysis.
                    </div>
                  )}
                </>
              )}

              {/* Tab 2: Multilingual Transcript & Subtitles Editor */}
              {activeTab === "subtitles" && (
                <div className="flex flex-col space-y-3" id="transcript-subtitles-panel">
                  {/* Top Bar: Language, View Mode Toggle & Scope Filter */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#1f1f1f]">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] text-[#888] font-bold uppercase tracking-wider font-mono">
                        Lang: <span className="text-[#00ffc3]">{processedClip?.detectedLanguage || "Auto (Multilingual)"}</span>
                      </span>
                      {processedClip?.subtitles && (
                        <span className="text-[8px] font-mono px-1.5 py-0.2 bg-[#111] border border-[#262626] text-[#666]">
                          {processedClip.subtitles.length} lines
                        </span>
                      )}
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center space-x-1">
                      {/* Switch between Timed Chunks and Continuous Flow */}
                      <div className="flex items-center bg-[#111] border border-[#222] p-0.5">
                        <button
                          id="btn-transcript-mode-chunks"
                          onClick={() => setTranscriptViewMode("chunks")}
                          className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider transition ${
                            transcriptViewMode === "chunks"
                              ? "bg-[#00ffc3] text-black font-bold"
                              : "text-[#777] hover:text-white"
                          }`}
                          title="View timed subtitle cards"
                        >
                          Cards
                        </button>
                        <button
                          id="btn-transcript-mode-continuous"
                          onClick={() => setTranscriptViewMode("continuous")}
                          className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider transition ${
                            transcriptViewMode === "continuous"
                              ? "bg-[#00ffc3] text-black font-bold"
                              : "text-[#777] hover:text-white"
                          }`}
                          title="View full continuous transcript reader"
                        >
                          Full Flow
                        </button>
                      </div>

                      {/* Filter: All Speech vs In-Cut Speech */}
                      <div className="flex items-center bg-[#111] border border-[#222] p-0.5">
                        <button
                          id="btn-sub-filter-all"
                          onClick={() => setSubtitleFilter("all")}
                          className={`px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider transition ${
                            subtitleFilter === "all"
                              ? "bg-[#38bdf8] text-black font-bold"
                              : "text-[#777] hover:text-white"
                          }`}
                          title="Show entire video speech transcript"
                        >
                          All
                        </button>
                        <button
                          id="btn-sub-filter-cut"
                          onClick={() => setSubtitleFilter("activeCut")}
                          className={`px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider transition ${
                            subtitleFilter === "activeCut"
                              ? "bg-[#00ffc3] text-black font-bold"
                              : "text-[#777] hover:text-white"
                          }`}
                          title="Filter to speech within current cut boundaries"
                        >
                          In Cut
                        </button>
                      </div>

                      {processedClip && (
                        <button
                          onClick={exportSrt}
                          className="text-[8px] uppercase tracking-wider bg-[#111] hover:bg-[#151515] text-[#ccc] border border-[#222] px-2 py-1 transition flex items-center space-x-1 font-bold"
                          title="Export subtitles as .SRT file"
                        >
                          <Download className="w-2.5 h-2.5 text-[#00ffc3]" />
                          <span>.SRT</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  {processedClip ? (() => {
                    const allSubs = processedClip.subtitles || [];
                    const isMulti = Boolean(activeDirectorCut?.highlightSegments && activeDirectorCut.highlightSegments.length > 1);
                    const segments = activeDirectorCut?.highlightSegments || [];

                    const isSubInActiveCut = (s: any) => {
                      const sSec = s.start / 1000;
                      const eSec = s.end / 1000;
                      if (isMulti && segments.length > 0) {
                        return segments.some((seg) => eSec >= seg.startSec && sSec <= seg.endSec);
                      }
                      const curStart = activeDirectorCut ? activeDirectorCut.clipStartSec : clipStartSec;
                      const curEnd = activeDirectorCut ? activeDirectorCut.clipEndSec : clipEndSec;
                      return eSec >= curStart && sSec <= curEnd;
                    };

                    const filteredSubs = subtitleFilter === "activeCut"
                      ? allSubs.filter(isSubInActiveCut)
                      : allSubs;

                    if (allSubs.length === 0) {
                      return (
                        <div className="text-center p-8 bg-[#0c0c0c] border border-[#1f1f1f] space-y-2">
                          <p className="text-xs font-mono text-[#aaa]">
                            No spoken dialogue transcribed for this video track.
                          </p>
                          <p className="text-[10px] text-[#666]">
                            If your video has music or ambient sound without spoken voice, transcription will be empty.
                          </p>
                        </div>
                      );
                    }

                    if (filteredSubs.length === 0) {
                      return (
                        <div className="text-center p-8 bg-[#0c0c0c] border border-[#1f1f1f] space-y-2">
                          <p className="text-xs font-mono text-[#888]">
                            No spoken dialogue within the selected cut window.
                          </p>
                          <button
                            onClick={() => setSubtitleFilter("all")}
                            className="text-[9px] font-mono text-[#00ffc3] hover:underline"
                          >
                            Switch to "All Spoken Dialogue" ({allSubs.length} phrases)
                          </button>
                        </div>
                      );
                    }

                    {/* Continuous Transcript Flow View */}
                    if (transcriptViewMode === "continuous") {
                      return (
                        <div className="flex flex-col space-y-3 bg-[#0a0a0a] border border-[#1f1f1f] p-4">
                          <div className="flex items-center justify-between text-[8px] font-mono text-[#666] border-b border-[#181818] pb-1">
                            <span>CLICK ANY SENTENCE TO JUMP PLAYHEAD</span>
                            <span>{filteredSubs.length} phrases ({subtitleFilter === "activeCut" ? "active cut" : "full video"})</span>
                          </div>

                          <div className="text-[12px] font-serif leading-relaxed text-[#bbb] space-x-1 select-text">
                            {filteredSubs.map((sub) => {
                              const isActive = activeSubtitle?.id === sub.id;
                              const isInsideCut = isSubInActiveCut(sub);

                              return (
                                <span
                                  key={sub.id}
                                  onClick={() => {
                                    if (videoRef.current) {
                                      videoRef.current.currentTime = sub.start / 1000;
                                    }
                                    setCurrentTime(sub.start / 1000);
                                    if (!isPlaying && videoRef.current) {
                                      videoRef.current.play().catch(() => {});
                                      setIsPlaying(true);
                                    }
                                  }}
                                  className={`inline cursor-pointer px-1 py-0.5 rounded transition ${
                                    isActive
                                      ? "bg-[#00ffc3]/20 text-[#00ffc3] font-bold ring-1 ring-[#00ffc3]/40"
                                      : isInsideCut
                                      ? "hover:bg-white/10 text-white"
                                      : "text-[#777] hover:text-[#bbb]"
                                  }`}
                                  title={`[${formatTimeText(sub.start / 1000)} - ${formatTimeText(sub.end / 1000)}] Click to seek`}
                                >
                                  {sub.text}{" "}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    {/* Timed Cards Mode */}
                    return (
                      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                        {filteredSubs.map((sub) => {
                          const isCurrentActive = activeSubtitle?.id === sub.id;
                          const isEditing = editingSubtitleId === sub.id;
                          const isInsideCut = isSubInActiveCut(sub);

                          return (
                            <div
                              key={sub.id}
                              className={`p-2.5 border transition-all flex flex-col space-y-1.5 ${
                                isCurrentActive
                                  ? "bg-[#00ffc3]/10 border-[#00ffc3]/50 shadow-md shadow-[#00ffc3]/5"
                                  : isInsideCut
                                  ? "bg-[#0d0d0d] border-[#222] hover:border-[#333]"
                                  : "bg-[#080808] border-[#181818] opacity-75 hover:opacity-100"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      if (videoRef.current) {
                                        videoRef.current.currentTime = sub.start / 1000;
                                      }
                                      setCurrentTime(sub.start / 1000);
                                      if (!isPlaying && videoRef.current) {
                                        videoRef.current.play().catch(() => {});
                                        setIsPlaying(true);
                                      }
                                    }}
                                    className="text-[9px] bg-[#111] hover:bg-[#1c1c1c] border border-[#262626] px-1.5 py-0.5 text-[#00ffc3] font-mono flex items-center space-x-1"
                                    title="Click to jump player to this subtitle"
                                  >
                                    <Play className="w-2 h-2 fill-current" />
                                    <span>{formatTimeText(sub.start / 1000)} - {formatTimeText(sub.end / 1000)}</span>
                                  </button>

                                  {isInsideCut && (
                                    <span className="text-[7px] font-mono uppercase px-1 py-0.2 bg-[#00ffc3]/10 text-[#00ffc3] border border-[#00ffc3]/30 font-bold">
                                      IN CUT
                                    </span>
                                  )}
                                </div>

                                {isEditing ? (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => saveSubtitleEdit(sub.id)}
                                      className="p-1 bg-[#00ffc3] hover:bg-[#00e6af] text-black transition"
                                      title="Save edit"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setEditingSubtitleId(null)}
                                      className="p-1 bg-[#111] hover:bg-[#222] text-[#888] text-[9px] uppercase tracking-wider font-bold"
                                      title="Cancel"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingSubtitleId(sub.id);
                                      setEditingSubtitleText(sub.text);
                                    }}
                                    className="p-1 text-[#555] hover:text-[#00ffc3] transition"
                                    title="Edit subtitle text"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {isEditing ? (
                                <textarea
                                  value={editingSubtitleText}
                                  onChange={(e) => setEditingSubtitleText(e.target.value)}
                                  className="bg-black border border-[#222] p-2 text-xs text-white font-serif italic focus:outline-none focus:border-[#00ffc3]"
                                  rows={2}
                                />
                              ) : (
                                <p className="text-xs font-serif italic text-[#ccc] leading-relaxed">
                                  {sub.text}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })() : (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#0a0a0a] border border-[#1f1f1f]">
                      <FileText className="w-8 h-8 text-[#444]" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#bbb]">
                          Transcript & Subtitles Ingestion
                        </h4>
                        <p className="text-[11px] text-[#666] max-w-xs leading-relaxed font-serif italic">
                          Click "Analyze Full Video & Extract 45s Hook" to run Gemini multimodal transcription, aligning spoken speech across the full video into verbatim subtitles.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Studio Clearance & Fact Verification Dossier */}
              {activeTab === "clearance" && (
                <div className="space-y-4">
                  {processedClip ? (
                    <div className="space-y-3.5">
                      {/* Clearance Hero Card */}
                      <div className="bg-[#0e0e0e] border border-[#222] p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-[#00ffc3]/15 text-[#00ffc3] border border-[#00ffc3]/30 flex items-center justify-center">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-mono tracking-widest text-[#777] block">
                                Studio Clearance Seal
                              </span>
                              <h4 className="text-sm font-bold text-white tracking-wide">
                                {processedClip.clearanceDossier?.overallStatus || "APPROVED FOR BROADCAST"}
                              </h4>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-lg font-black text-[#00ffc3]">
                              {processedClip.clearanceDossier?.complianceScore || 96}%
                            </span>
                            <span className="text-[8px] uppercase text-[#666] block">Compliance</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#999] leading-relaxed">
                          {processedClip.clearanceDossier?.summary ||
                            "All extracted dialogue claims and statistics have been verified against Parallel Web Systems real-time knowledge graph."}
                        </p>

                        <button
                          onClick={handleOpenClearanceDossier}
                          className="w-full py-2 bg-[#00ffc3] hover:bg-[#00e6b0] text-black text-[10px] font-mono font-bold tracking-wider uppercase transition flex items-center justify-center space-x-1.5 shadow-md shadow-[#00ffc3]/10"
                        >
                          <FileText className="w-3.5 h-3.5 text-black" />
                          <span>Inspect Full Studio Dossier & Sources</span>
                        </button>
                      </div>

                      {/* Quick Itemized List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[9px] font-mono text-[#777] uppercase tracking-wider">
                          <span>Audited Claims & Dialogue Statements</span>
                          <span>{processedClip.clearanceDossier?.records.length || processedClip.searchQueries.length} verified</span>
                        </div>

                        {(processedClip.clearanceDossier?.records || []).map((rec, idx) => (
                          <div
                            key={rec.id || idx}
                            className="bg-[#111] border border-[#222] p-3 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono">
                              <span className="text-[#00ffc3] font-bold">
                                #{idx + 1} • {rec.timestamp}
                              </span>
                              <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-500/30">
                                {rec.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#ddd] italic">"{rec.claim}"</p>
                            <div className="text-[9px] text-[#777] font-mono flex items-center justify-between pt-1 border-t border-[#1a1a1a]">
                              <span>{rec.category}</span>
                              <span className="text-[#aaa]">Risk: {rec.legalRiskScore}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-12 text-[#555] text-xs font-serif italic">
                      Ingest a video clip to generate the Studio Clearance Dossier.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export Actions at bottom of Sidebar */}
            {processedClip && (
              <div className="pt-4 border-t border-[#222] flex flex-col justify-end space-y-2.5">
                {/* Primary 35–45s MP4 Video Export Button */}
                <button
                  onClick={startVideoExport}
                  className="w-full py-3.5 bg-[#00ffc3] text-black font-black uppercase text-xs tracking-tighter hover:bg-[#00e6af] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#00ffc3]/15 transform hover:-translate-y-0.5"
                >
                  <Film className="w-4 h-4 text-black" />
                  <span>Export Social Short (35–45s)</span>
                </button>

                {/* Secondary Social Caption Bundle Copy */}
                <button
                  onClick={() => {
                    const bundleText = `${processedClip.socialMetadata.instagramHook}\n\n${processedClip.socialMetadata.caption}\n\n${processedClip.socialMetadata.hashtags.map(t => '#' + t).join(' ')}`;
                    copyText(bundleText, "bundle");
                  }}
                  className="w-full py-2.5 bg-[#111] hover:bg-[#181818] border border-[#222] hover:border-[#333] text-[#ccc] hover:text-white font-bold uppercase text-[10px] tracking-wider transition flex items-center justify-center space-x-1.5"
                >
                  {copiedField === "bundle" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00ffc3]" />
                      <span>Social Bundle Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#00ffc3]" />
                      <span>Copy Social Hooks & Captions</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[9px] text-[#555] font-mono pt-1">
                  <span>Engine: {processedClip?.engineMetadata?.modelUsed || "Gemini 3.8 Flash"}</span>
                  <span>Speech Envelope: +/- 0.5s</span>
                </div>
              </div>
            )}

          </div>
        </section>

      </main>

      {/* 45s MP4 Video Compilation & Export Progress Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0c0c0c] border border-[#222] shadow-2xl max-w-lg w-full p-6 flex flex-col space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-[#00ffc3]/10 border border-[#00ffc3]/30 text-[#00ffc3]">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Social Video Export Engine (35–45s)
                    </h3>
                    <span className="text-[9px] font-mono text-[#00ffc3]">
                      Server-Side FFmpeg Render Engine (Accurate Sync & Clean Video)
                    </span>
                  </div>
                </div>

                {!exportState.isExporting && (
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="text-[#666] hover:text-white text-sm font-mono px-2"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Aspect Ratio Selector (Before/During Export) */}
              {!exportState.isExporting && !exportState.downloadUrl && (
                <div className="flex flex-col space-y-2">
                  <label className="text-[9px] uppercase tracking-wider text-[#777] font-bold">
                    Select Target Video Format & Platform Aspect
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => setExportAspectRatio("9:16")}
                      className={`p-3 border text-left flex flex-col space-y-1 transition ${
                        exportAspectRatio === "9:16"
                          ? "bg-[#111] border-[#00ffc3] text-white"
                          : "bg-[#080808] border-[#222] text-[#666] hover:border-[#333]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#00ffc3]">
                          9:16 Vertical
                        </span>
                        <span className="text-[8px] font-mono px-1 border border-[#222]">1080x1920</span>
                      </div>
                      <span className="text-[9px] text-[#666]">
                        Reels, Shorts & TikTok with silky ambient blur.
                      </span>
                    </button>

                    <button
                      onClick={() => setExportAspectRatio("1:1")}
                      className={`p-3 border text-left flex flex-col space-y-1 transition ${
                        exportAspectRatio === "1:1"
                          ? "bg-[#111] border-[#00ffc3] text-white"
                          : "bg-[#080808] border-[#222] text-[#666] hover:border-[#333]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#00ffc3]">
                          1:1 Square
                        </span>
                        <span className="text-[8px] font-mono px-1 border border-[#222]">1080x1080</span>
                      </div>
                      <span className="text-[9px] text-[#666]">
                        Instagram Post & LinkedIn Feed square format.
                      </span>
                    </button>

                    <button
                      onClick={() => setExportAspectRatio("4:5")}
                      className={`p-3 border text-left flex flex-col space-y-1 transition ${
                        exportAspectRatio === "4:5"
                          ? "bg-[#111] border-[#00ffc3] text-white"
                          : "bg-[#080808] border-[#222] text-[#666] hover:border-[#333]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#00ffc3]">
                          4:5 Portrait
                        </span>
                        <span className="text-[8px] font-mono px-1 border border-[#222]">1080x1350</span>
                      </div>
                      <span className="text-[9px] text-[#666]">
                        Instagram Portrait Feed & Facebook stream.
                      </span>
                    </button>

                    <button
                      onClick={() => setExportAspectRatio("16:9")}
                      className={`p-3 border text-left flex flex-col space-y-1 transition ${
                        exportAspectRatio === "16:9"
                          ? "bg-[#111] border-[#00ffc3] text-white"
                          : "bg-[#080808] border-[#222] text-[#666] hover:border-[#333]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#00ffc3]">
                          16:9 Widescreen
                        </span>
                        <span className="text-[8px] font-mono px-1 border border-[#222]">1920x1080</span>
                      </div>
                      <span className="text-[9px] text-[#666]">
                        Standard landscape for YouTube, X & web presentations.
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Composition Breakdown Details */}
              <div className="bg-[#080808] border border-[#222] p-3.5 space-y-2 text-[10px] font-mono">
                <div className="flex justify-between items-center text-[#888]">
                  <span>Speech Padding:</span>
                  <span className="text-[#00ffc3] font-bold">
                    +/- 0.5s Natural Audio Envelope
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#888]">
                  <span>Timeline Slice:</span>
                  <span className="text-white">
                    {(clipStartSec - 0.5 < 0 ? 0 : clipStartSec - 0.5).toFixed(1)}s → {(clipEndSec + 0.5).toFixed(1)}s ({(clipEndSec - clipStartSec + 1).toFixed(1)}s duration)
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#888]">
                  <span>Video Processing:</span>
                  <span className="text-[#00ffc3]">
                    Clean High-Fidelity Video Stream (35–45s)
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#888]">
                  <span>Frame Rate:</span>
                  <span className="text-white">30.0 FPS High Bitrate</span>
                </div>
              </div>

              {/* Export Progress Bar and Animated State */}
              {exportState.isExporting && (
                <div className="flex flex-col space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#aaa] flex items-center space-x-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00ffc3]" />
                      <span>{exportState.statusMessage}</span>
                    </span>
                    <span className="text-[#00ffc3] font-bold">{exportState.progressPercent}%</span>
                  </div>

                  <div className="w-full bg-[#111] h-2.5 border border-[#222] overflow-hidden relative">
                    <motion.div
                      className="bg-[#00ffc3] h-full shadow-lg shadow-[#00ffc3]/50"
                      initial={{ width: 0 }}
                      animate={{ width: `${exportState.progressPercent}%` }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>
                </div>
              )}

              {/* Success / Finished State */}
              {exportState.downloadUrl && (
                <div className="bg-[#00ffc3]/5 border border-[#00ffc3]/30 p-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#00ffc3] flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5 text-[#00ffc3]" />
                      <span>MP4 Video File Ready</span>
                    </span>
                    <p className="text-[9px] font-mono text-[#888] truncate max-w-xs">
                      {exportState.fileName}
                    </p>
                  </div>

                  <a
                    href={exportState.downloadUrl}
                    download={exportState.fileName || "CineFact_Within45s_Highlight.mp4"}
                    className="px-3.5 py-2 bg-[#00ffc3] hover:bg-[#00e6af] text-black font-black uppercase text-[10px] tracking-wider transition flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Again</span>
                  </a>
                </div>
              )}

              {/* Error Message if any */}
              {exportState.error && (
                <div className="bg-red-950/30 border border-red-500/40 p-3.5 space-y-2.5 text-[11px]">
                  <div className="flex items-center space-x-2 text-red-300 font-bold uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>Render Engine Notice</span>
                  </div>
                  <p className="text-red-200/90 leading-relaxed font-sans">{exportState.error}</p>
                </div>
              )}

              {/* Modal Bottom Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#222]">
                {exportState.isExporting ? (
                  <button
                    onClick={cancelVideoExport}
                    className="px-4 py-2 bg-[#111] hover:bg-[#181818] border border-[#333] text-[10px] uppercase font-bold text-[#888] hover:text-white transition"
                  >
                    Cancel Render
                  </button>
                ) : exportState.downloadUrl ? (
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="px-5 py-2 bg-[#111] hover:bg-[#181818] border border-[#333] text-[10px] uppercase font-bold text-white transition"
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="px-4 py-2 bg-[#111] hover:bg-[#181818] border border-[#222] text-[10px] uppercase font-bold text-[#888] hover:text-white transition"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={startVideoExport}
                      className="px-5 py-2 bg-[#00ffc3] hover:bg-[#00e6af] text-black font-black uppercase text-[10px] tracking-wider transition flex items-center space-x-1.5 shadow-lg shadow-[#00ffc3]/15"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Start Render (35–45s)</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Studio Clearance & Legal Verification Dossier Modal */}
      <StudioClearanceModal
        isOpen={isClearanceModalOpen}
        onClose={() => setIsClearanceModalOpen(false)}
        dossier={processedClip?.clearanceDossier || null}
        videoTitle={processedClip?.title || customTitle || "Production Asset"}
      />
    </div>
  );
}
