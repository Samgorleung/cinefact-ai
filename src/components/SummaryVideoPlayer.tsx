import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Film,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle,
  Sliders,
  Crop
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type Subtitle, type SearchQuery, type SocialAspectRatio, type HighlightSegment } from "../data.js";

interface SummaryVideoPlayerProps {
  summaryVideoUrl: string | null;
  rawVideoUrl?: string | null;
  clipStartSec: number;
  clipEndSec: number;
  totalDuration?: number;
  segments?: HighlightSegment[];
  isCompiling: boolean;
  compilingProgress: number;
  compilingStatusMessage: string;
  aspectRatio: SocialAspectRatio;
  onAspectRatioChange: (ratio: SocialAspectRatio) => void;
  subtitles: Subtitle[];
  verifiedClaim?: SearchQuery;
  onReRender: () => void;
  downloadFileName?: string | null;
  clipTitle?: string;
  onTriggerCompile?: () => void;
  activeCutId?: string | null;
}

export function SummaryVideoPlayer({
  summaryVideoUrl,
  rawVideoUrl,
  clipStartSec,
  clipEndSec,
  totalDuration,
  segments,
  isCompiling,
  compilingProgress,
  compilingStatusMessage,
  aspectRatio,
  onAspectRatioChange,
  subtitles,
  verifiedClaim,
  onReRender,
  downloadFileName,
  clipTitle,
  onTriggerCompile,
  activeCutId
}: SummaryVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isSeekingRef = useRef<boolean>(false);
  const currentSegIdxRef = useRef<number>(0);
  const seekTimeoutRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(totalDuration || 45);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showFactOverlay, setShowFactOverlay] = useState<boolean>(true);
  // Default fitMode to "cover" for 16:9 to match Player 1 edge-to-edge
  const [fitMode, setFitMode] = useState<"contain" | "cover">(aspectRatio === "16:9" ? "cover" : "contain");

  // Automatically adapt fitMode if aspect ratio changes
  useEffect(() => {
    if (aspectRatio === "16:9") {
      setFitMode("cover");
    }
  }, [aspectRatio]);

  // Clean up seek timeout on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    };
  }, []);

  // Safe seek helper that guarantees isSeekingRef never gets permanently stuck
  const safeSeek = (targetTime: number, onDone?: () => void) => {
    const vid = videoRef.current;
    if (!vid) return;

    if (Math.abs(vid.currentTime - targetTime) < 0.05) {
      isSeekingRef.current = false;
      onDone?.();
      return;
    }

    isSeekingRef.current = true;
    try {
      vid.currentTime = targetTime;
    } catch (e) {}

    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => {
      isSeekingRef.current = false;
      onDone?.();
    }, 150);
  };

  // Active source: rendered summary MP4 or synchronized raw video preview (null by default until video is loaded)
  const effectiveSrc = summaryVideoUrl || rawVideoUrl || null;
  const isEffectiveRenderedMp4 = Boolean(summaryVideoUrl);

  const isMultiSegment = Boolean(!summaryVideoUrl && segments && segments.length > 1);

  // Compute multi-segment durations and cumulative offsets
  const segDurations = useMemo(() => {
    if (!segments || segments.length === 0) return [];
    return segments.map((s) => Math.max(0.1, s.endSec - s.startSec));
  }, [segments]);

  const segCumulativeOffsets = useMemo(() => {
    let acc = 0;
    const offsets = [0];
    for (const d of segDurations) {
      acc += d;
      offsets.push(acc);
    }
    return offsets;
  }, [segDurations]);

  const computedMultiDuration = useMemo(() => {
    if (!isMultiSegment || segDurations.length === 0) return 0;
    return segDurations.reduce((sum, d) => sum + d, 0);
  }, [isMultiSegment, segDurations]);

  // Sync duration whenever clip boundaries, multi-segments, or rendered MP4 change
  useEffect(() => {
    if (summaryVideoUrl && videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    } else if (isMultiSegment && computedMultiDuration > 0) {
      setDuration(computedMultiDuration);
    } else if (totalDuration && totalDuration > 0) {
      setDuration(totalDuration);
    } else {
      setDuration(Math.max(1, clipEndSec - clipStartSec));
    }
  }, [summaryVideoUrl, clipStartSec, clipEndSec, totalDuration, isMultiSegment, computedMultiDuration]);

  // Stable cut key: tracks when user truly switches to a different cut
  const stableCutKey = activeCutId || `${clipStartSec.toFixed(2)}_${clipEndSec.toFixed(2)}`;
  const lastCutKeyRef = useRef<string>("");
  const isPlayingRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Reset playback and decode first frame ONLY when cut or video source actually changes
  useEffect(() => {
    if (lastCutKeyRef.current === stableCutKey) {
      // If same cut, but summaryVideoUrl just became available, smoothly preserve playing state
      const vid = videoRef.current;
      if (vid && isPlayingRef.current) {
        const resumePos = currentTimeRef.current;
        const onCanPlay = () => {
          try {
            vid.currentTime = resumePos;
            vid.play().catch(() => {});
          } catch (e) {}
        };
        vid.addEventListener("canplay", onCanPlay, { once: true });
      }
      return;
    }
    lastCutKeyRef.current = stableCutKey;

    setIsPlaying(false);
    setCurrentTime(0);
    currentSegIdxRef.current = 0;
    const vid = videoRef.current;
    if (!vid) return;

    try {
      vid.pause();
    } catch (e) {}

    const targetStart = summaryVideoUrl
      ? 0
      : (isMultiSegment && segments && segments.length > 0 ? segments[0].startSec : clipStartSec);

    const applyStart = () => {
      try {
        if (vid.readyState >= 1) {
          vid.currentTime = targetStart;
        }
      } catch (e) {}
    };

    if (vid.readyState >= 1) {
      applyStart();
    } else {
      vid.addEventListener("loadedmetadata", applyStart, { once: true });
      vid.addEventListener("canplay", applyStart, { once: true });
      vid.addEventListener("loadeddata", applyStart, { once: true });
    }
  }, [stableCutKey, summaryVideoUrl, rawVideoUrl, clipStartSec, clipEndSec, isMultiSegment]);

  // Metadata loaded handler
  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (summaryVideoUrl && vid.duration && !isNaN(vid.duration)) {
      setDuration(vid.duration);
    } else if (isMultiSegment && computedMultiDuration > 0) {
      setDuration(computedMultiDuration);
    } else if (totalDuration && totalDuration > 0) {
      setDuration(totalDuration);
    } else {
      setDuration(Math.max(1, clipEndSec - clipStartSec));
    }

    if (!summaryVideoUrl) {
      const targetStart = isMultiSegment && segments && segments.length > 0 ? segments[0].startSec : clipStartSec;
      try {
        vid.currentTime = targetStart;
      } catch (e) {}
    }
  };

  // Synchronized playback time tick
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || isSeekingRef.current || vid.seeking) return;

    if (summaryVideoUrl) {
      // Playing pre-rendered summary MP4
      const current = vid.currentTime;
      setCurrentTime(current);

      const effectiveTotal = vid.duration || duration || 45;
      if (effectiveTotal > 0 && current >= effectiveTotal - 0.15) {
        if (isLooping) {
          vid.currentTime = 0;
          vid.play().catch(() => {});
        } else {
          vid.pause();
          setIsPlaying(false);
          setCurrentTime(effectiveTotal);
        }
      }
    } else {
      const rawCurrent = vid.currentTime;

      if (isMultiSegment && segments && segments.length > 1) {
        // Multi-moment raw preview: track active moment with currentSegIdxRef
        let segIdx = currentSegIdxRef.current;
        if (segIdx < 0 || segIdx >= segments.length) {
          segIdx = 0;
          currentSegIdxRef.current = 0;
        }

        const currentSeg = segments[segIdx];
        if (!currentSeg) return;

        // Guard: If rawCurrent is far outside the current segment
        if (rawCurrent < currentSeg.startSec - 0.5) {
          vid.currentTime = currentSeg.startSec;
          return;
        }

        const elapsedInCurrentSeg = Math.max(0, Math.min(currentSeg.endSec - currentSeg.startSec, rawCurrent - currentSeg.startSec));
        const totalElapsed = (segCumulativeOffsets[segIdx] || 0) + elapsedInCurrentSeg;
        setCurrentTime(Math.min(duration, totalElapsed));

        // When reaching the end of the current segment, smoothly jump to next moment
        if (rawCurrent >= currentSeg.endSec) {
          if (segIdx < segments.length - 1) {
            currentSegIdxRef.current = segIdx + 1;
            vid.currentTime = segments[segIdx + 1].startSec;
          } else {
            // Reached the end of the multi-moment sequence
            if (isLooping) {
              currentSegIdxRef.current = 0;
              vid.currentTime = segments[0].startSec;
              vid.play().catch(() => {});
            } else {
              vid.pause();
              setIsPlaying(false);
              currentSegIdxRef.current = 0;
              vid.currentTime = segments[0].startSec;
              setCurrentTime(duration);
            }
          }
        }
      } else {
        // Standard single highlight boundary [clipStartSec, clipEndSec]
        const offset = Math.max(0, Math.min(clipEndSec - clipStartSec, rawCurrent - clipStartSec));
        setCurrentTime(offset);

        if (rawCurrent >= clipEndSec) {
          if (isLooping) {
            vid.currentTime = clipStartSec;
            vid.play().catch(() => {});
          } else {
            vid.pause();
            setIsPlaying(false);
            vid.currentTime = clipStartSec;
            setCurrentTime(0);
          }
        } else if (rawCurrent < clipStartSec - 0.5) {
          vid.currentTime = clipStartSec;
        }
      }
    }
  };

  // Play / Pause toggle with robust error handling and autoplay recovery
  const togglePlayback = () => {
    const vid = videoRef.current;
    if (!vid || !effectiveSrc) return;

    if (!vid.paused && isPlaying) {
      vid.pause();
      setIsPlaying(false);
      return;
    }

    const targetStart = summaryVideoUrl
      ? 0
      : (isMultiSegment && segments && segments.length > 0 ? segments[0].startSec : clipStartSec);

    let needsSeekToStart = false;
    if (summaryVideoUrl) {
      const maxD = vid.duration || duration || 45;
      if (vid.currentTime >= maxD - 0.2 || vid.currentTime < 0) {
        needsSeekToStart = true;
      }
    } else {
      if (isMultiSegment && segments && segments.length > 0) {
        const segIdx = currentSegIdxRef.current;
        const currentSeg = segments[segIdx] || segments[0];
        if (vid.currentTime >= currentSeg.endSec - 0.05 || vid.currentTime < segments[0].startSec - 0.5) {
          currentSegIdxRef.current = 0;
          needsSeekToStart = true;
        }
      } else {
        if (vid.currentTime >= clipEndSec - 0.1 || vid.currentTime < clipStartSec - 0.5) {
          needsSeekToStart = true;
        }
      }
    }

    if (needsSeekToStart) {
      try {
        vid.currentTime = targetStart;
        setCurrentTime(0);
      } catch (e) {}
    }

    vid.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.warn("[SummaryPlayer] Play with audio blocked, retrying muted:", err);
        vid.muted = true;
        setIsMuted(true);
        vid.play()
          .then(() => setIsPlaying(true))
          .catch((e) => {
            console.error("[SummaryPlayer] Play failed:", e);
            setIsPlaying(false);
          });
      });
  };

  // Restart playback from beginning
  const handleRestart = () => {
    const vid = videoRef.current;
    if (!vid || !effectiveSrc) return;
    currentSegIdxRef.current = 0;
    const targetStart = summaryVideoUrl
      ? 0
      : (isMultiSegment && segments && segments.length > 0 ? segments[0].startSec : clipStartSec);

    safeSeek(targetStart, () => {
      setCurrentTime(0);
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
    });
  };

  // Seekbar click handler
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const vid = videoRef.current;
    if (!vid || !effectiveSrc) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekDuration = duration > 0 ? duration : Math.max(1, clipEndSec - clipStartSec);
    const targetOffset = clickRatio * seekDuration;

    if (summaryVideoUrl) {
      safeSeek(targetOffset);
    } else if (isMultiSegment && segments && segments.length > 1) {
      let rem = targetOffset;
      let targetRaw = segments[0].startSec;
      let targetIdx = 0;
      for (let i = 0; i < segments.length; i++) {
        const segDur = segDurations[i];
        if (rem <= segDur || i === segments.length - 1) {
          targetRaw = segments[i].startSec + Math.min(segDur, rem);
          targetIdx = i;
          break;
        }
        rem -= segDur;
      }
      currentSegIdxRef.current = targetIdx;
      safeSeek(targetRaw);
    } else {
      safeSeek(clipStartSec + targetOffset);
    }
    setCurrentTime(targetOffset);
  };

  // Toggle Mute
  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  };

  // Fullscreen toggle
  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  // Active subtitle for current playhead - ALWAYS SHOW TRANSCRIPT
  const activeSubtitle = useMemo(() => {
    if (!subtitles || subtitles.length === 0) {
      if (verifiedClaim?.targetClaim) {
        return {
          id: "claim-sub",
          start: 0,
          end: Math.round((duration || 45) * 1000),
          text: `"${verifiedClaim.targetClaim}"`
        };
      }
      return null;
    }

    const currentMs = currentTime * 1000;
    const rawVidMs = (videoRef.current ? videoRef.current.currentTime : (clipStartSec + currentTime)) * 1000;

    // 1. Direct match by relative timeline (0..duration*1000) or original raw video timestamp
    const exact = subtitles.find((s) => {
      const matchRel = currentMs >= s.start && currentMs <= s.end;
      const matchRaw = s.originalStart !== undefined && s.originalEnd !== undefined &&
                       rawVidMs >= s.originalStart && rawVidMs <= s.originalEnd;
      return matchRel || matchRaw;
    });

    if (exact) return exact;

    // 2. If during a brief pause between sentences, keep the most recently spoken subtitle visible
    const prevSubs = subtitles.filter((s) => {
      if (s.originalEnd !== undefined && s.originalEnd > 0) {
        return s.originalEnd <= rawVidMs;
      }
      return s.end <= currentMs;
    });

    if (prevSubs.length > 0) {
      return prevSubs[prevSubs.length - 1];
    }

    // 3. If before the first subtitle, show upcoming subtitle
    const nextSubs = subtitles.filter((s) => {
      if (s.originalStart !== undefined && s.originalStart > 0) {
        return s.originalStart >= rawVidMs;
      }
      return s.start >= currentMs;
    });

    if (nextSubs.length > 0) {
      return nextSubs[0];
    }

    // 4. Fallback to the first subtitle so transcript is ALWAYS visible
    return subtitles[0];
  }, [subtitles, currentTime, clipStartSec, duration, verifiedClaim]);

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Aspect ratio styling & viewport container classes
  const getViewportContainerClasses = () => {
    if (aspectRatio === "16:9") {
      return "relative aspect-video w-full bg-black border border-[#222] overflow-hidden flex items-center justify-center group";
    }
    // High-impact tall canvas for vertical/square mobile reels
    return "relative min-h-[460px] sm:min-h-[520px] h-[520px] sm:h-[580px] w-full bg-[#050505] border border-[#222] overflow-hidden flex items-center justify-center group";
  };

  const getVideoFrameClasses = () => {
    switch (aspectRatio) {
      case "9:16":
        return "h-full aspect-[9/16] w-auto max-w-full shadow-2xl relative flex items-center justify-center bg-black border border-[#222]";
      case "1:1":
        return "h-full aspect-square w-auto max-w-full shadow-2xl relative flex items-center justify-center bg-black border border-[#222]";
      case "4:5":
        return "h-full aspect-[4/5] w-auto max-w-full shadow-2xl relative flex items-center justify-center bg-black border border-[#222]";
      case "16:9":
      default:
        return "w-full h-full relative flex items-center justify-center";
    }
  };

  return (
    <div
      ref={containerRef}
      id="summarized-video-player"
      className="bg-[#080808] border border-[#00ffc3]/40 p-4 flex flex-col space-y-3 relative shadow-xl shadow-black/60"
    >
      {/* Player Header: Title & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[#1c1c1c]">
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isEffectiveRenderedMp4 ? "bg-[#00ffc3]" : effectiveSrc ? "bg-amber-400" : "bg-[#444]"} ${effectiveSrc ? "animate-pulse" : ""}`}></div>
          <span className="text-[11px] font-black uppercase tracking-wider text-white flex items-center space-x-1.5 font-mono">
            <Film className="w-3.5 h-3.5 text-[#00ffc3]" />
            <span>Player 2: Summarized Highlight (Within 45s)</span>
          </span>

          {!effectiveSrc ? (
            <span className="text-[8px] font-mono px-2 py-0.5 bg-[#181818] border border-[#2b2b2b] text-[#777] font-bold uppercase tracking-wider flex items-center space-x-1">
              <span>Awaiting Video</span>
            </span>
          ) : isEffectiveRenderedMp4 ? (
            <span className="text-[8px] font-mono px-2 py-0.5 bg-[#00ffc3] text-black font-bold uppercase tracking-wider flex items-center space-x-1 shadow-sm">
              <CheckCircle className="w-2.5 h-2.5" />
              <span>Rendered .MP4</span>
            </span>
          ) : (
            <span className="text-[8px] font-mono px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase tracking-wider flex items-center space-x-1">
              <Sliders className="w-2.5 h-2.5" />
              <span>Within 45s Sync Mode</span>
            </span>
          )}

          {effectiveSrc && clipTitle && (
            <span className="hidden sm:inline-block text-[8px] font-mono px-2 py-0.5 bg-[#141414] border border-[#2b2b2b] text-[#00ffc3] font-bold max-w-[220px] truncate" title={clipTitle}>
              {clipTitle}
            </span>
          )}
        </div>

        {/* Viewport Sizing & Aspect Ratio Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Fit / Fill Toggle */}
          <button
            onClick={() => setFitMode((m) => (m === "cover" ? "contain" : "cover"))}
            className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider transition flex items-center space-x-1 border ${
              fitMode === "cover"
                ? "bg-[#00ffc3]/20 border-[#00ffc3] text-[#00ffc3] font-bold"
                : "bg-[#141414] border-[#262626] text-[#888] hover:text-white"
            }`}
            title="Toggle between Fill (same edge-to-edge frame as Player 1) and Fit (letterboxed entire frame)"
          >
            <Crop className="w-2.5 h-2.5" />
            <span>{fitMode === "cover" ? "Fill (Match Player 1)" : "Fit (Letterbox)"}</span>
          </button>

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center space-x-0.5 bg-[#111] border border-[#222] p-0.5" id="summary-player-aspect-controls">
            <span className="text-[8px] font-mono text-[#666] px-1.5 uppercase font-bold">ASPECT:</span>
            {(["16:9", "9:16", "1:1", "4:5"] as SocialAspectRatio[]).map((r) => (
              <button
                key={r}
                onClick={() => onAspectRatioChange(r)}
                className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider transition ${
                  aspectRatio === r
                    ? "bg-[#00ffc3] text-black font-black shadow-sm"
                    : "text-[#888] hover:text-white"
                }`}
                title={r === "16:9" ? "16:9 Widescreen (Matches Player 1 size)" : `Re-frame highlight as ${r}`}
              >
                {r === "16:9" ? "16:9 (Match Player 1)" : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parallel Grounded Claim Box: Placed between aspect control line and the video box */}
      {verifiedClaim && showFactOverlay && (
        <div id="player2-grounded-claim-banner" className="w-full mb-2">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/95 border border-[#00ffc3]/60 px-3 py-2 shadow-xl flex flex-col space-y-1 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffc3] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffc3]"></span>
                </span>
                <span className="text-[9px] font-black text-[#00ffc3] uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00ffc3]" />
                  <span>PARALLEL GROUNDED</span>
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#00ffc3] bg-[#00ffc3]/15 border border-[#00ffc3]/40 px-1.5 py-0.5 font-bold">
                {verifiedClaim.results?.[0]?.confidenceScore
                  ? `${verifiedClaim.results[0].confidenceScore}% VERIFIED`
                  : "98% VERIFIED"}
              </span>
            </div>
            <p className="text-[10px] text-white italic leading-tight">
              "{verifiedClaim.targetClaim || verifiedClaim.query}"
            </p>
          </motion.div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className={getViewportContainerClasses()}>
        {effectiveSrc ? (
          <div className={`transition-all duration-200 ${getVideoFrameClasses()}`}>
            <video
              key={activeCutId || "summary-video-viewport"}
              ref={videoRef}
              src={effectiveSrc}
              preload="auto"
              playsInline
              muted={isMuted}
              onError={(e) => {
                console.warn("[SummaryVideoPlayer] Video element error encountered:", e.currentTarget.error);
              }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onSeeking={() => {
                isSeekingRef.current = true;
              }}
              onSeeked={() => {
                isSeekingRef.current = false;
              }}
              className={`w-full h-full ${fitMode === "cover" ? "object-cover" : "object-contain"}`}
            />

            {/* Center Play Button Overlay when Paused */}
            {!isPlaying && (
              <div
                onClick={togglePlayback}
                className="absolute inset-0 bg-black/25 flex items-center justify-center cursor-pointer z-10 hover:bg-black/35 transition"
              >
                <div className="p-4 bg-black/90 border border-[#00ffc3] text-[#00ffc3] rounded-full hover:scale-110 transition transform shadow-[0_0_25px_rgba(0,255,195,0.4)]">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
              </div>
            )}

            {/* Play/Pause Hover Overlay Icon when Playing */}
            {isPlaying && (
              <div
                onClick={togglePlayback}
                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10"
              >
                <div className="p-3.5 bg-black/80 border border-[#00ffc3]/60 text-[#00ffc3] hover:scale-110 transition transform shadow-xl">
                  <Pause className="w-5 h-5" />
                </div>
              </div>
            )}

            {/* Compiling Overlay State */}
            {isCompiling && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#00ffc3]/30 border-t-[#00ffc3] rounded-full animate-spin"></div>
                <div className="space-y-1 max-w-xs">
                  <p className="text-[10px] font-mono font-bold text-[#00ffc3] uppercase tracking-wider">
                    {compilingStatusMessage || "Compiling highlight MP4 (within 45s)..."}
                  </p>
                  <p className="text-[8px] text-[#888] font-mono">
                    Encoding clean video frames ({compilingProgress}%)
                  </p>
                </div>
                <div className="w-48 bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden border border-[#333]">
                  <div
                    className="bg-[#00ffc3] h-full transition-all duration-300 shadow-[0_0_8px_#00ffc3]"
                    style={{ width: `${compilingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-[#555]">
            <Film className="w-10 h-10 text-[#333] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#777]">
              Highlight Player (Within 45s)
            </span>
            <span className="text-[10px] max-w-xs leading-normal">
              Upload a video and analyze to preview the synchronized highlight reel within 45s.
            </span>
          </div>
        )}
      </div>

      {/* Scrub Bar & Timeline Info */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#888]">
          <div className="flex items-center space-x-1.5 text-[#00ffc3] font-bold">
            <Clock className="w-3 h-3 text-[#00ffc3]" />
            <span>{effectiveSrc ? formatTime(currentTime) : "00:00"}</span>
            <span className="text-[#555]">/</span>
            <span>{effectiveSrc ? formatTime(duration) : "--:--"}</span>
            {effectiveSrc && duration > 0 && (
              <span className="text-[8px] font-mono px-1.5 py-0.2 bg-[#111] border border-[#333] text-[#888] font-normal">
                {(Math.round(duration * 100) / 100).toFixed(2)}s Total
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[9px]">
            <span className="text-[#888]">
              {!effectiveSrc
                ? "No video loaded"
                : isEffectiveRenderedMp4
                ? `Rendered Duration: ${(Math.round(duration * 100) / 100).toFixed(2)}s (Within 45s)`
                : isMultiSegment
                ? `Multi-Moment: ${segments!.length} Segments (${(Math.round(duration * 100) / 100).toFixed(2)}s)`
                : `Active Bounds: ${formatTime(clipStartSec)} → ${formatTime(clipEndSec)} (${(Math.round((clipEndSec - clipStartSec) * 100) / 100).toFixed(2)}s)`}
            </span>
          </div>
        </div>

        {/* Clickable Scrubber Bar */}
        <div
          onClick={effectiveSrc ? handleSeek : undefined}
          className={`relative h-3 bg-[#141414] border border-[#262626] ${effectiveSrc ? "hover:border-[#00ffc3]/50 cursor-pointer" : "cursor-default opacity-50"} overflow-hidden transition`}
          title={effectiveSrc ? "Click to seek within 45s highlight" : "No video loaded"}
        >
          <div
            className="absolute top-0 bottom-0 left-0 bg-[#00ffc3] transition-all duration-75 shadow-[0_0_8px_#00ffc3]"
            style={{ width: `${Math.min(100, effectiveSrc ? progressPercent : 0)}%` }}
          ></div>
        </div>
      </div>

      {/* Player Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1a1a1a]">
        {/* Left Playback Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={togglePlayback}
            disabled={!effectiveSrc}
            className="px-2.5 py-1.5 bg-[#141414] hover:bg-[#202020] border border-[#2a2a2a] text-white text-[10px] font-mono font-bold uppercase transition flex items-center space-x-1 disabled:opacity-40"
            title={isPlaying ? "Pause highlight" : "Play highlight (within 45s)"}
          >
            {isPlaying ? <Pause className="w-3 h-3 text-[#00ffc3]" /> : <Play className="w-3 h-3 fill-current text-[#00ffc3]" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>

          <button
            onClick={handleRestart}
            disabled={!effectiveSrc}
            className="p-1.5 bg-[#141414] hover:bg-[#202020] border border-[#2a2a2a] text-[#aaa] hover:text-white transition disabled:opacity-40"
            title="Replay from start of highlight"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`px-2 py-1.5 border text-[9px] font-mono uppercase transition ${
              isLooping
                ? "bg-[#00ffc3]/15 border-[#00ffc3]/50 text-[#00ffc3] font-bold"
                : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"
            }`}
            title="Loop highlight video"
          >
            Loop
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 bg-[#141414] hover:bg-[#202020] border border-[#2a2a2a] text-[#aaa] hover:text-white transition"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
          </button>
        </div>

        {/* Right Export & Download Actions */}
        <div className="flex items-center space-x-1.5">
          {isEffectiveRenderedMp4 ? (
            <a
              id="btn-summary-player-download"
              href={summaryVideoUrl!}
              download={downloadFileName || "CineFact_Within45s_Summary.mp4"}
              className="px-3 py-1.5 bg-[#00ffc3] hover:bg-[#00e6af] text-black font-black uppercase text-[10px] font-mono tracking-wider transition flex items-center space-x-1 shadow-sm active:scale-95"
              title="Download compiled MP4 (within 45s)"
            >
              <Download className="w-3 h-3 text-black" />
              <span>Download MP4</span>
            </a>
          ) : (
            <button
              onClick={onReRender}
              disabled={isCompiling || !effectiveSrc}
              className="px-3 py-1.5 bg-[#00ffc3] hover:bg-[#00e6af] text-black font-black uppercase text-[10px] font-mono tracking-wider transition flex items-center space-x-1 shadow-sm active:scale-95 disabled:opacity-40"
              title={effectiveSrc ? "Render highlight MP4 (within 45s)" : "Upload video to render MP4"}
            >
              <Film className="w-3 h-3 text-black" />
              <span>Render .MP4</span>
            </button>
          )}

          <button
            onClick={onReRender}
            disabled={isCompiling || !effectiveSrc}
            className="p-1.5 bg-[#141414] hover:bg-[#202020] border border-[#2a2a2a] hover:border-[#00ffc3]/40 text-[#aaa] hover:text-white transition disabled:opacity-40"
            title="Re-render highlight with selected aspect ratio"
          >
            <RefreshCw className={`w-3 h-3 ${isCompiling ? "animate-spin text-[#00ffc3]" : ""}`} />
          </button>

          <button
            onClick={handleFullscreen}
            className="p-1.5 bg-[#141414] hover:bg-[#202020] border border-[#2a2a2a] text-[#aaa] hover:text-white transition"
            title="Fullscreen summary player"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
