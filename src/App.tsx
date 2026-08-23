import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Video,
  UploadCloud,
  Youtube,
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
  Trash2,
  Volume2
} from "lucide-react";
import {
  UNIVERSAL_VIDEO_PRESETS,
  type VideoTemplate,
  type Subtitle,
  type SearchQuery,
  type ProcessedClip,
  type VideoSourceMode,
  type ParallelSearchResult,
  type ExportProgressState
} from "./data.js";
import { export45sSocialVideo } from "./videoExporter.js";

// Helper to extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export default function App() {
  // Video Source Management
  const [sourceMode, setSourceMode] = useState<VideoSourceMode>("preset");
  const [templates] = useState<VideoTemplate[]>(UNIVERSAL_VIDEO_PRESETS);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tech-gemini-ai");
  
  // Custom Upload & YouTube states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState<string>("");
  const [activeYoutubeId, setActiveYoutubeId] = useState<string | null>(null);
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
  const [apiKeyVerified, setApiKeyVerified] = useState<boolean | null>(true);

  // Media Player & Timeline states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0); // in seconds
  const [duration, setDuration] = useState<number>(180); // in seconds
  const [clipStartSec, setClipStartSec] = useState<number>(12);
  const [clipEndSec, setClipEndSec] = useState<number>(57);
  const [playheadPercent, setPlayheadPercent] = useState<number>(0);

  // Parallel Search State
  const [activeSearches, setActiveSearches] = useState<{ [query: string]: boolean }>({});
  const [searchCache, setSearchCache] = useState<{ [query: string]: ParallelSearchResult[] }>({});
  const [showFactOverlay, setShowFactOverlay] = useState<boolean>(true);
  const [activeFactIndex, setActiveFactIndex] = useState<number>(0);

  // 45s MP4 Video Export Engine State
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportAspectRatio, setExportAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [exportState, setExportState] = useState<ExportProgressState>({
    isExporting: false,
    progressPercent: 0,
    statusMessage: "",
    exportAspectRatio: "9:16",
    downloadUrl: null,
    fileName: null,
    error: null
  });
  const cancelExportRef = useRef<boolean>(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"highlights" | "subtitles" | "sources">("highlights");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingSubtitleId, setEditingSubtitleId] = useState<string | null>(null);
  const [editingSubtitleText, setEditingSubtitleText] = useState<string>("");

  // Element Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Active preset template
  const activePreset = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [selectedTemplateId, templates]);

  // Determine current active video URL for HTML5 player
  const currentVideoSrc = useMemo(() => {
    if (sourceMode === "upload" && uploadedVideoUrl) {
      return uploadedVideoUrl;
    }
    if (sourceMode === "preset") {
      return activePreset.videoUrl;
    }
    return null;
  }, [sourceMode, uploadedVideoUrl, activePreset]);

  // Initial load: trigger analysis for default preset
  useEffect(() => {
    if (sourceMode === "preset" && activePreset) {
      setDuration(activePreset.duration);
      setIsPlaying(false);
      setCurrentTime(0);
      setPlayheadPercent(0);
      setClipStartSec(12);
      setClipEndSec(57);
      triggerAnalysis("preset", activePreset.id);
    }
  }, [selectedTemplateId, sourceMode]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (uploadedVideoUrl) URL.revokeObjectURL(uploadedVideoUrl);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [uploadedVideoUrl, recordedAudioUrl]);

  // Handle local video file upload
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("video/")) {
      return;
    }

    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setUploadedFile(file);
    setUploadedVideoUrl(objectUrl);
    setSourceMode("upload");
    setCustomTitle(file.name.replace(/\.[^/.]+$/, ""));
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayheadPercent(0);

    // Convert file slice to base64 for multimodal analysis if < 25MB
    if (file.size <= 25 * 1024 * 1024) {
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

  // Handle YouTube URL submission
  const handleApplyYouTubeUrl = () => {
    const ytId = extractYouTubeId(youtubeUrlInput);
    if (ytId) {
      setActiveYoutubeId(ytId);
      setSourceMode("youtube");
      if (!customTitle) {
        setCustomTitle(`YouTube Stream [${ytId}]`);
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setPlayheadPercent(0);
      setDuration(180);
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

  // Trigger Gemini 3.7 Flash Video & Multimodal Analysis
  const triggerAnalysis = async (modeOverride?: VideoSourceMode, templateIdOverride?: string) => {
    setIsProcessing(true);
    setAnalysisError(null);
    setEditingSubtitleId(null);
    const activeMode = modeOverride || sourceMode;

    try {
      setProcessingStage("Grounding source media & extracting verbatim audio/subtitles...");
      
      const payload: any = {
        sourceType: activeMode,
        customTitle: customTitle || (activeMode === "preset" ? activePreset.title : "Custom Video Asset"),
        customText: customTranscriptContext || (activeMode === "preset" ? activePreset.transcript : ""),
        videoDuration: duration
      };

      if (activeMode === "preset") {
        payload.templateId = templateIdOverride || selectedTemplateId;
      } else if (activeMode === "youtube") {
        payload.youtubeUrl = youtubeUrlInput || (activeYoutubeId ? `https://www.youtube.com/watch?v=${activeYoutubeId}` : "");
      } else if (activeMode === "upload") {
        if (uploadedBase64) {
          payload.videoBase64 = uploadedBase64;
          payload.videoMimeType = uploadedFile?.type || "video/mp4";
        }
      }

      setProcessingStage("Extracting 45s Highlight & Synchronizing Ground-Truth Subtitles...");

      const response = await fetch("/api/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Video processing failed.");
      }

      setProcessedClip(data as ProcessedClip);

      // Set clip timeline boundaries
      const start = data.clipStartSec ?? parseTimeToSeconds(data.clipStart);
      const end = data.clipEndSec ?? (data.clipEnd ? parseTimeToSeconds(data.clipEnd) : start + 45);
      setClipStartSec(start);
      setClipEndSec(end);
      setCurrentTime(start);

      if (videoRef.current) {
        videoRef.current.currentTime = start;
      }

      setProcessingStage("Parallel API Grounding queries prepared.");
    } catch (error: any) {
      console.error("Error analyzing video clip with Gemini 3.7 Flash:", error);
      setAnalysisError(error?.message || "Failed to analyze video. Please verify your source video and API key.");
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
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

  // 45s MP4 Video Export Engine with speech padding (+/- 0.5s)
  const startVideoExport = async () => {
    if (!processedClip) return;
    setShowExportModal(true);
    cancelExportRef.current = false;
    
    setExportState({
      isExporting: true,
      progressPercent: 3,
      statusMessage: "Initializing Canvas & WebCodecs rendering pipeline...",
      exportAspectRatio,
      downloadUrl: null,
      fileName: null,
      error: null
    });

    try {
      const result = await export45sSocialVideo({
        videoElement: videoRef.current,
        videoSrc: currentVideoSrc,
        sourceMode,
        youtubeUrl: sourceMode === "youtube" ? (youtubeUrlInput || (activeYoutubeId ? `https://www.youtube.com/watch?v=${activeYoutubeId}` : "")) : undefined,
        videoBase64: sourceMode === "upload" ? uploadedBase64 : undefined,
        clipStartSec,
        clipEndSec,
        totalDuration: duration,
        aspectRatio: exportAspectRatio,
        subtitles: processedClip.subtitles || [],
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
        setExportState((prev) => ({
          ...prev,
          isExporting: false,
          error: err.message || "Video compilation encountered an error."
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

      // Loop inside selected 45-second highlight segment
      if (current >= clipEndSec) {
        videoRef.current.currentTime = clipStartSec;
        setCurrentTime(clipStartSec);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      const vidDuration = Math.floor(videoRef.current.duration);
      if (vidDuration > 0) {
        setDuration(vidDuration);
      }
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        if (currentTime < clipStartSec || currentTime >= clipEndSec) {
          videoRef.current.currentTime = clipStartSec;
        }
        videoRef.current.play();
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
          {processedClip?.engineMetadata?.isFallback ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/30 border border-amber-500/40 text-[10px] font-mono text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-[#888]">ENGINE:</span>
              <span className="font-bold uppercase">{processedClip.engineMetadata.modelUsed}</span>
              <span className="text-[8px] bg-amber-500/20 px-1 py-0.2 border border-amber-500/30 text-amber-200">AUTO-ROUTED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#111] border border-[#222] text-[10px] font-mono text-[#aaa]">
              <span className="w-2 h-2 rounded-full bg-[#00ffc3] animate-pulse"></span>
              <span className="text-[#666]">ENGINE:</span>
              <span className="text-[#00ffc3] font-bold uppercase">
                {processedClip?.engineMetadata?.modelUsed || "GEMINI 3.7 FLASH"}
              </span>
            </div>
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

      {/* Model Capacity Spike Fallback Banner */}
      {processedClip?.engineMetadata?.isFallback && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-8 py-2 text-[11px] font-mono text-amber-200 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold uppercase tracking-wider text-amber-300">
              Auto-Failover Active
            </span>
            <span>
              {processedClip.engineMetadata.fallbackReason || "Upstream Gemini 3.7 Flash high demand spike (503). Request was seamlessly fulfilled via fallback model."}
            </span>
          </div>
          <span className="text-[9px] text-amber-400/70">
            {processedClip.engineMetadata.latencyMs ? `Processed in ${(processedClip.engineMetadata.latencyMs / 1000).toFixed(2)}s` : "Instant Recovery"}
          </span>
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
                <span>Video Asset & Ingestion</span>
              </h2>
              {processedClip && (
                <span className="text-[9px] font-mono px-2 py-0.5 border border-[#00ffc3]/30 bg-[#00ffc3]/10 text-[#00ffc3]">
                  {processedClip.detectedLanguage}
                </span>
              )}
            </div>

            {/* Source Mode Selector Buttons */}
            <div className="grid grid-cols-3 gap-1 bg-[#111] p-1 border border-[#222]">
              <button
                onClick={() => setSourceMode("preset")}
                className={`py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                  sourceMode === "preset"
                    ? "bg-[#080808] text-[#00ffc3] border border-[#333]"
                    : "text-[#666] hover:text-[#aaa]"
                }`}
              >
                Presets
              </button>
              <button
                onClick={() => setSourceMode("upload")}
                className={`py-1.5 text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center space-x-1 ${
                  sourceMode === "upload"
                    ? "bg-[#080808] text-[#00ffc3] border border-[#333]"
                    : "text-[#666] hover:text-[#aaa]"
                }`}
              >
                <UploadCloud className="w-3 h-3" />
                <span>Upload</span>
              </button>
              <button
                onClick={() => setSourceMode("youtube")}
                className={`py-1.5 text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center space-x-1 ${
                  sourceMode === "youtube"
                    ? "bg-[#080808] text-[#00ffc3] border border-[#333]"
                    : "text-[#666] hover:text-[#aaa]"
                }`}
              >
                <Youtube className="w-3 h-3" />
                <span>YouTube</span>
              </button>
            </div>

            {/* Tab 1: Presets Catalog */}
            {sourceMode === "preset" && (
              <div className="flex flex-col space-y-2.5">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setSourceMode("preset");
                    }}
                    className={`w-full text-left p-3 transition border flex flex-col ${
                      selectedTemplateId === tpl.id
                        ? "bg-[#111] border-[#222] border-l-2 border-l-[#00ffc3] text-white"
                        : "bg-[#080808]/40 border-[#222] border-l-2 border-l-transparent text-[#777] hover:border-[#333] hover:text-[#ccc]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-[#00ffc3] uppercase tracking-wider">{tpl.category}</span>
                      <span className="text-[8px] font-mono text-[#555] px-1.5 py-0.2 border border-[#222]">{tpl.language}</span>
                    </div>
                    <span className="text-xs font-bold text-white truncate">{tpl.title}</span>
                    <span className="text-[10px] text-[#555] mt-1 line-clamp-2 leading-normal">{tpl.description}</span>
                    <div className="flex items-center space-x-3 mt-2 text-[9px] text-[#444] font-mono">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#00ffc3]" />
                        <span>{tpl.duration}s</span>
                      </span>
                      <span className="px-1.5 py-0.5 border border-[#222] text-[9px]">
                        {tpl.aspectRatio}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 2: Upload MP4 Video File */}
            {sourceMode === "upload" && (
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
                  className={`border-2 border-dashed p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                    isDragOver
                      ? "border-[#00ffc3] bg-[#00ffc3]/5 text-[#00ffc3]"
                      : uploadedFile
                      ? "border-[#333] bg-[#111] text-white"
                      : "border-[#222] bg-[#0c0c0c] hover:border-[#333] text-[#777]"
                  }`}
                >
                  <UploadCloud className="w-8 h-8 text-[#00ffc3]" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-white">
                      {uploadedFile ? uploadedFile.name : "Drop MP4 Video File Here"}
                    </p>
                    <p className="text-[10px] text-[#555]">
                      {uploadedFile
                        ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace`
                        : "Supports MP4, WebM, MOV (HTML5 Video Stream)"}
                    </p>
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
            )}

            {/* Tab 3: YouTube URL Input */}
            {sourceMode === "youtube" && (
              <div className="flex flex-col space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[#777] font-bold flex items-center space-x-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    <span>Paste YouTube URL</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrlInput}
                      onChange={(e) => setYoutubeUrlInput(e.target.value)}
                      className="flex-1 bg-[#111] border border-[#222] p-3 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#00ffc3] placeholder-[#444] font-mono transition"
                    />
                    <button
                      onClick={handleApplyYouTubeUrl}
                      className="px-3 bg-[#181818] hover:bg-[#222] border border-[#333] text-xs font-bold text-white uppercase tracking-wider transition"
                    >
                      Load
                    </button>
                  </div>
                  <p className="text-[9px] text-[#555]">Supports YouTube watch URLs, youtu.be shortlinks, and Shorts.</p>
                </div>

                {activeYoutubeId && (
                  <div className="border border-[#222] p-3 bg-[#0c0c0c] flex items-center space-x-3">
                    <img
                      src={`https://img.youtube.com/vi/${activeYoutubeId}/hqdefault.jpg`}
                      alt="YouTube Thumbnail"
                      referrerPolicy="no-referrer"
                      className="w-20 aspect-video object-cover border border-[#222]"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[9px] font-bold text-[#00ffc3] uppercase tracking-wider font-mono">
                        ID: {activeYoutubeId}
                      </span>
                      <p className="text-xs font-bold text-white truncate">{customTitle || "YouTube Video Stream"}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <label className="text-[9px] uppercase tracking-wider text-[#777] font-bold">Video Title / Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Autonomous Agents in Production"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-[#111] border border-[#222] p-3 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#00ffc3] placeholder-[#444] transition"
                  />

                  <label className="text-[9px] uppercase tracking-wider text-[#777] font-bold">Transcript / Topics</label>
                  <textarea
                    rows={3}
                    placeholder="Outline key topics or discussion points in the YouTube video..."
                    value={customTranscriptContext}
                    onChange={(e) => setCustomTranscriptContext(e.target.value)}
                    className="w-full bg-[#111] border border-[#222] p-3 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#00ffc3] placeholder-[#444] resize-none transition"
                  />
                </div>
              </div>
            )}

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
              disabled={isProcessing}
              onClick={() => triggerAnalysis()}
              className="w-full bg-[#00ffc3] hover:bg-[#00e6af] disabled:opacity-40 disabled:hover:bg-[#00ffc3] text-black font-black uppercase text-xs tracking-tighter py-3.5 transition duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-[#00ffc3]/10"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>{processingStage || "Analyzing with Gemini 3.7 Flash..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Extract 45s Highlight & Ground Facts</span>
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
              CineFact AI parses raw video media streams and YouTube audio tracks to pinpoint exact viral moments, transcribe verbatim millisecond-accurate subtitles in any language, and trigger parallel search queries.
            </p>
          </div>
        </section>

        {/* Center Column (5.5 lg cols) - Live Video Viewport, Timeline & Parallel API Panel */}
        <section className="lg:col-span-8 xl:col-span-5 flex flex-col space-y-4">
          
          {/* Main Video Viewport Wrapper */}
          <div className="bg-[#080808] border border-[#222] p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-[10px] uppercase tracking-widest text-[#555] flex items-center space-x-1.5 font-bold">
                  <Film className="w-3.5 h-3.5 text-[#00ffc3]" />
                  <span>Multimodal Live Viewport</span>
                </h2>
                {processedClip?.detectedLanguage && (
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-[#111] border border-[#333] text-[#00ffc3]">
                    {processedClip.detectedLanguage}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-[9px] font-mono bg-[#111] border border-[#222] px-2.5 py-1 text-[#aaa]">
                  Active Highlight: <span className="text-[#00ffc3] font-bold">{formatTimeText(clipStartSec)} - {formatTimeText(clipEndSec)}</span> (45s)
                </div>
                {processedClip && (
                  <button
                    onClick={startVideoExport}
                    className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#00ffc3]/10 hover:bg-[#00ffc3]/20 text-[#00ffc3] border border-[#00ffc3]/40 px-2.5 py-1 transition flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3 text-[#00ffc3]" />
                    <span>Export .MP4</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Player Display Container */}
            <div className="relative aspect-video bg-[#000] border border-[#222] overflow-hidden flex items-center justify-center group">
              
              {/* Scenario 1: YouTube Embedded Player */}
              {sourceMode === "youtube" && activeYoutubeId ? (
                <div className="w-full h-full relative">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeYoutubeId}?enablejsapi=1&autoplay=0&start=${Math.floor(clipStartSec)}&rel=0`}
                    title="YouTube Video Player"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : currentVideoSrc ? (
                /* Scenario 2: Native HTML5 Video Stream */
                <video
                  ref={videoRef}
                  src={currentVideoSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Scenario 3: Audio / Custom Placeholder */
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-[#555]">
                  <FileVideo className="w-12 h-12 text-[#222] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#777]">
                    {customTitle || "Video Stream Ingestion Active"}
                  </span>
                  <span className="text-[10px] max-w-xs leading-normal">
                    Interactive synchronized player tracks 45s coordinates and overlays dynamic subtitles.
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

              {/* Dynamic Synchronized Subtitle Overlay */}
              <AnimatePresence>
                {activeSubtitle && (
                  <motion.div
                    key={activeSubtitle.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-6 left-6 right-6 bg-black/85 backdrop-blur-md border border-white/10 px-4 py-2.5 text-center z-10 pointer-events-none shadow-2xl"
                  >
                    <p className="text-sm md:text-base font-serif italic text-white tracking-wide">
                      {activeSubtitle.text}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HTML5 Play / Pause Overlaid State Button */}
              {sourceMode !== "youtube" && currentVideoSrc && (
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
                  <span>Playback Head: {formatTimeText(currentTime)}</span>
                </span>
                <span>Total Video Length: {formatTimeText(duration)}</span>
              </div>

              {/* Scrubber Bar Container */}
              <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                className="relative h-12 bg-[#111] border border-[#222] cursor-pointer overflow-hidden transition hover:border-[#333]"
              >
                {/* Selected 45-second Highlight Clip highlighted bound area */}
                <div
                  className="absolute top-0 bottom-0 bg-[#00ffc3]/10 border-l border-r border-[#00ffc3]/40 shadow-inner"
                  style={{
                    left: `${(clipStartSec / duration) * 100}%`,
                    width: `${((clipEndSec - clipStartSec) / duration) * 100}%`
                  }}
                >
                  <div className="absolute top-1 left-1.5 text-[8px] font-bold text-[#00ffc3] uppercase tracking-widest font-mono">
                    45s Selected Highlight
                  </div>
                </div>

                {/* Subtitle chunk indicators */}
                {processedClip?.subtitles.map((sub) => {
                  const startPercent = (sub.start / (duration * 1000)) * 100;
                  const widthPercent = ((sub.end - sub.start) / (duration * 1000)) * 100;
                  const isActive = activeSubtitle?.id === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className={`absolute bottom-1 h-1 transition-all ${
                        isActive ? "bg-[#00ffc3] h-1.5 z-10 shadow shadow-[#00ffc3]" : "bg-[#222] hover:bg-[#444]"
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
                  className="absolute top-0 bottom-0 w-0.5 bg-[#00ffc3] shadow-lg z-10 pointer-events-none"
                  style={{ left: `${playheadPercent}%` }}
                >
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#00ffc3] border border-black shadow"></div>
                </div>
              </div>
            </div>

            {/* Bottom Timeline Controls */}
            <div className="flex items-center justify-between border-t border-[#222] pt-3">
              <div className="flex items-center space-x-2">
                {sourceMode !== "youtube" && (
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
                        <span>Play 45s Highlight Loop</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Adjust range sliders explicitly */}
              <div className="flex items-center space-x-2 text-xs text-[#777]">
                <span className="font-bold text-[9px] uppercase tracking-wider text-[#555]">Manual Bounds:</span>
                <div className="flex items-center space-x-1.5 bg-[#111] border border-[#222] p-1 text-[11px] font-mono">
                  <input
                    type="number"
                    min={0}
                    max={duration - 45}
                    value={Math.round(clipStartSec)}
                    onChange={(e) => {
                      const newStart = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setClipStartSec(newStart);
                      setClipEndSec(newStart + 45);
                    }}
                    className="w-8 bg-transparent text-center focus:outline-none text-[#00ffc3] font-bold"
                  />
                  <span>s -</span>
                  <input
                    type="number"
                    value={Math.round(clipEndSec)}
                    disabled
                    className="w-8 bg-transparent text-center focus:outline-none text-[#444] font-bold"
                  />
                  <span>s (45s)</span>
                </div>
              </div>
            </div>
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
                Highlight Clip Meta
              </button>
              <button
                onClick={() => setActiveTab("subtitles")}
                className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition ${
                  activeTab === "subtitles"
                    ? "border-[#00ffc3] text-[#00ffc3]"
                    : "border-transparent text-[#555] hover:text-[#aaa]"
                }`}
              >
                Subtitles Editor
              </button>
            </div>

            {/* Tab 1: Highlight Meta & Viral Scoring */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {activeTab === "highlights" && (
                <>
                  {processedClip ? (
                    <>
                      {/* Virality Scoring Widget */}
                      <div className="bg-[#0c0c0c] border border-[#222] p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] text-[#555] font-bold uppercase tracking-wider block">
                            Predicted Virality Rating
                          </span>
                          <p className="text-2xl font-black tracking-tighter uppercase italic text-white">
                            {processedClip.viralityScore} <span className="text-xs text-[#00ffc3] font-sans not-italic">/ 100</span>
                          </p>
                          <span className="text-[8px] font-mono text-[#666]">Language: {processedClip.detectedLanguage}</span>
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
                              strokeDashoffset={`${2 * Math.PI * 22 * (1 - processedClip.viralityScore / 100)}`}
                            />
                          </svg>
                          <span className="absolute text-[10px] font-bold font-mono text-[#00ffc3]">{processedClip.viralityScore}%</span>
                        </div>
                      </div>

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
                      No video metadata processed yet. Click the extraction button to run Gemini 3.7 Flash analysis.
                    </div>
                  )}
                </>
              )}

              {/* Tab 2: Multilingual Subtitles Editor */}
              {activeTab === "subtitles" && (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[9px] text-[#555] font-bold uppercase tracking-wider">
                      Verbatim Subtitles ({processedClip?.detectedLanguage || "Universal"})
                    </span>
                    {processedClip && (
                      <button
                        onClick={exportSrt}
                        className="text-[9px] uppercase tracking-wider bg-[#111] hover:bg-[#151515] text-[#ccc] border border-[#222] px-2 py-1 transition flex items-center space-x-1 font-bold"
                      >
                        <Download className="w-3 h-3 text-[#00ffc3]" />
                        <span>Export (.SRT)</span>
                      </button>
                    )}
                  </div>

                  {processedClip && processedClip.subtitles.length > 0 ? (
                    <div className="space-y-2">
                      {processedClip.subtitles.map((sub) => {
                        const isCurrentActive = activeSubtitle?.id === sub.id;
                        const isEditing = editingSubtitleId === sub.id;

                        return (
                          <div
                            key={sub.id}
                            className={`p-3 border transition-all flex flex-col space-y-2 ${
                              isCurrentActive
                                ? "bg-[#00ffc3]/5 border-[#00ffc3]/30"
                                : "bg-[#0c0c0c] border-[#222] hover:border-[#333]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] bg-[#111] border border-[#222] px-1.5 py-0.5 text-[#888] font-mono">
                                {formatTimeText(sub.start / 1000)} - {formatTimeText(sub.end / 1000)}
                              </span>
                              
                              {isEditing ? (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => saveSubtitleEdit(sub.id)}
                                    className="p-1 bg-[#00ffc3] hover:bg-[#00e6af] text-black transition"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingSubtitleId(null)}
                                    className="p-1 bg-[#111] hover:bg-[#222] text-[#888] text-[9px] uppercase tracking-wider font-bold"
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
                                >
                                  <Edit className="w-3.5 h-3.5" />
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
                  ) : (
                    <div className="text-center p-12 text-[#555] text-xs font-serif italic">
                      Ingest a video clip to load verbatim synchronized subtitles.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export Actions at bottom of Sidebar */}
            {processedClip && (
              <div className="pt-4 border-t border-[#222] flex flex-col justify-end space-y-2.5">
                {/* Primary 45s MP4 Video Export Button */}
                <button
                  onClick={startVideoExport}
                  className="w-full py-3.5 bg-[#00ffc3] text-black font-black uppercase text-xs tracking-tighter hover:bg-[#00e6af] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#00ffc3]/15 transform hover:-translate-y-0.5"
                >
                  <Film className="w-4 h-4 text-black" />
                  <span>Export 45s Social Short (.mp4)</span>
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
                  <span>Engine: Gemini 3.7 Flash</span>
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
                      45s Social Short Video Export Engine
                    </h3>
                    <span className="text-[9px] font-mono text-[#00ffc3]">
                      {sourceMode === "youtube" ? "Server-Side FFmpeg + yt-dlp Video Compositor" : "Client Canvas & Server FFmpeg Pipeline"}
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
                    Select Target Video Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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
                          9:16 Vertical Short
                        </span>
                        <span className="text-[8px] font-mono px-1 border border-[#222]">1080x1920</span>
                      </div>
                      <span className="text-[9px] text-[#666]">
                        Optimized for TikTok, Instagram Reels & YouTube Shorts with ambient backdrop blur.
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
                        Standard landscape format for YouTube, X (Twitter), and web presentations.
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
                  <span>Overlays Burned:</span>
                  <span className="text-[#00ffc3]">
                    Verbatim Subtitles + Parallel Fact Badge HUD
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
                    download={exportState.fileName || "CineFact_45s_Highlight.mp4"}
                    className="px-3.5 py-2 bg-[#00ffc3] hover:bg-[#00e6af] text-black font-black uppercase text-[10px] tracking-wider transition flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Again</span>
                  </a>
                </div>
              )}

              {/* Error Message if any */}
              {exportState.error && (
                <div className="bg-red-950/20 border border-red-500/30 p-3 text-[10px] text-red-400 font-mono">
                  {exportState.error}
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
                      <span>Start 45s Render</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
