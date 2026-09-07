import React from "react";
import { Zap, Sparkles, BookOpen, Flame, Video, ArrowRight, Play, Check } from "lucide-react";
import { DirectorCut, SocialAspectRatio } from "../types.js";

interface DirectorCutBarProps {
  cuts: DirectorCut[];
  activeCutId: string | null;
  onSelectCut: (cut: DirectorCut) => void;
  onExportCut: (cut: DirectorCut) => void;
  isCompiling: boolean;
}

export function DirectorCutBar({
  cuts,
  activeCutId,
  onSelectCut,
  onExportCut,
  isCompiling
}: DirectorCutBarProps) {
  if (!cuts || cuts.length === 0) return null;

  return (
    <div className="bg-[#0b0b0b] border border-[#222] p-3 space-y-2.5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[#1c1c1c]">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-[#00ffc3]/15 text-[#00ffc3] flex items-center justify-center font-bold text-[10px]">
            🎬
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
              Director's Multi-Cut (4 Editorial Variations)
            </span>
            <span className="text-[9px] text-[#777] ml-2 hidden sm:inline font-mono">
              4 autonomous variations within 45s — Single highlights & multi-moment digest
            </span>
          </div>
        </div>

        <div className="text-[9px] font-mono text-[#888] flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffc3]"></span>
          <span>AUTONOMOUS NARRATIVE RE-INDEXING</span>
        </div>
      </div>

      {/* 4 Cut Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {cuts.map((cut, idx) => {
          const isActive = activeCutId ? activeCutId === cut.id : idx === 0;
          const isMultiMoment = Boolean(cut.highlightSegments && cut.highlightSegments.length > 1);
          const totalDurationSec = isMultiMoment
            ? cut.highlightSegments!.reduce((sum, seg) => sum + (seg.endSec - seg.startSec), 0)
            : (cut.clipEndSec - cut.clipStartSec);
          const formattedDuration = (Math.round(totalDurationSec * 100) / 100).toFixed(2);

          const icon =
            cut.style === "hook" ? (
              <Zap className="w-3.5 h-3.5 text-[#00ffc3]" />
            ) : cut.style === "lore" ? (
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            ) : cut.style === "summary" ? (
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            );

          return (
            <div
              key={cut.id}
              onClick={() => onSelectCut(cut)}
              className={`p-3 border transition cursor-pointer flex flex-col justify-between relative group ${
                isActive
                  ? "bg-[#141414] border-[#00ffc3] shadow-[0_0_15px_rgba(0,255,195,0.1)]"
                  : "bg-[#0e0e0e] border-[#222] hover:border-[#444] hover:bg-[#121212]"
              }`}
            >
              {/* Active Indicator Top Border Bar */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00ffc3]" />
              )}

              <div className="space-y-2">
                {/* 1. Top Line: "Hook" / Style Badge */}
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 border font-bold shadow-sm ${
                      cut.style === "hook"
                        ? "bg-[#00ffc3]/15 text-[#00ffc3] border-[#00ffc3]/40"
                        : cut.style === "lore"
                        ? "bg-cyan-950/40 text-cyan-300 border-cyan-500/40"
                        : cut.style === "summary"
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
                        : "bg-amber-950/40 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {cut.style === "hook"
                      ? "Hook"
                      : cut.style === "lore"
                      ? "Lore"
                      : cut.style === "climax"
                      ? "Climax"
                      : "Summary (3 Moments)"}
                  </span>
                  {isMultiMoment && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 font-bold">
                      3 MOMENTS
                    </span>
                  )}
                </div>

                {/* 2. Next Line: "82% viral" Virality Score */}
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 border flex items-center space-x-1.5 shadow-sm ${
                      cut.style === "hook"
                        ? "bg-[#00ffc3]/15 text-[#00ffc3] border-[#00ffc3]/40"
                        : cut.style === "lore"
                        ? "bg-cyan-950/40 text-cyan-300 border-cyan-500/40"
                        : cut.style === "summary"
                        ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/50"
                        : "bg-amber-950/40 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    <Flame className="w-3 h-3 text-[#00ffc3]" />
                    <span>{cut.viralityScore ?? 95}% viral</span>
                  </span>
                </div>

                {/* 3. Next Line: "Cut A..." Title & Timestamps */}
                <div className="space-y-0.5 pt-0.5">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    {icon}
                    <span className="text-xs font-bold text-white tracking-wide leading-tight">
                      {cut.label}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-[#888]">
                    {isMultiMoment
                      ? `~${formattedDuration}s (${cut.highlightSegments!.length} Moments)`
                      : `${cut.clipStart} - ${cut.clipEnd} (${formattedDuration}s)`}
                  </div>
                </div>

                {/* 4. Next Line: "Within 45s" Duration Guarantee */}
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#00ffc3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ffc3] animate-pulse"></span>
                  <span className="font-semibold">Within 45s</span>
                </div>

                {/* 5. Next Line: "94% completion..." Full sentence visible, no truncate, no need to mouse over */}
                <div className="text-[10px] font-mono text-[#ddd] bg-[#111] border border-[#222] px-2 py-1.5 leading-snug break-words">
                  {cut.retentionEstimate}
                </div>

                {/* Cut Description (Tagline Strategy & Highlight Reason) */}
                <div className="space-y-1 pt-1 border-t border-[#1a1a1a]">
                  <p className="text-[11px] text-[#ccc] leading-relaxed">
                    {cut.tagline}
                  </p>
                  {cut.highlightReason && (
                    <p className="text-[10px] text-[#777] italic leading-snug">
                      {cut.highlightReason}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="pt-2.5 mt-2 border-t border-[#1c1c1c] flex items-center justify-between">
                <div className="text-[9px] font-mono text-[#666] flex items-center space-x-1">
                  {isActive ? (
                    <>
                      <Check className="w-3 h-3 text-[#00ffc3]" />
                      <span className="text-[#00ffc3] font-bold">ACTIVE TIMELINE</span>
                    </>
                  ) : (
                    <span>Click to activate</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCut(cut);
                    onExportCut(cut);
                  }}
                  disabled={isCompiling}
                  className={`text-[9px] font-mono uppercase tracking-wider px-2 py-1 flex items-center space-x-1 transition ${
                    isActive
                      ? "bg-[#00ffc3] hover:bg-[#00e6b0] text-black font-bold"
                      : "bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#ddd] border border-[#333]"
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>Export Cut</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
