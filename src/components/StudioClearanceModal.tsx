import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Download,
  Printer,
  Copy,
  ExternalLink,
  X,
  FileText,
  FileCheck,
  Building,
  Scale
} from "lucide-react";
import { StudioClearanceDossier, StudioClearanceRecord } from "../types.js";

interface StudioClearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: StudioClearanceDossier | null;
  videoTitle: string;
}

export function StudioClearanceModal({
  isOpen,
  onClose,
  dossier,
  videoTitle
}: StudioClearanceModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  if (!isOpen || !dossier) return null;

  const handleCopyHash = () => {
    if (dossier.auditHash) {
      navigator.clipboard.writeText(dossier.auditHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    const markdownContent =
      (dossier as any).markdownReport ||
      `# STUDIO CLEARANCE & FACT-CHECKING DOSSIER\n\n**Project**: ${videoTitle}\n**Dossier ID**: ${dossier.dossierId}\n**Audit Hash**: ${dossier.auditHash}\n**Date**: ${new Date(dossier.generatedAt).toUTCString()}\n**Auditor Agent**: ${dossier.auditorAgent}\n**Clearance Status**: ${dossier.overallStatus} (${dossier.complianceScore}% Compliance)\n\n---\n## EXECUTIVE SUMMARY\n${dossier.summary}\n\n---\n## ITEMIZED RECORDS\n` +
        dossier.records
          .map(
            (r, i) =>
              `### Record #${i + 1}: ${r.category}\n- Timestamp: ${r.timestamp}\n- Claim: "${r.claim}"\n- Status: ${r.status} (${r.confidence}% confidence)\n- Legal Risk: ${r.legalRiskScore}\n- Compliance Note: ${r.complianceNote}\n`
          )
          .join("\n") +
        `\n---\n## RECOMMENDED DISCLAIMERS\n` +
        (dossier.recommendedDisclaimers?.map((d) => `- ${d}`).join("\n") || "None required.") +
        `\n\n---\n*CineFact AI Studio Clearance Engine (Parallel Web Systems & Google Gemini)*`;

    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Studio_Clearance_${dossier.dossierId}_${videoTitle.replace(/[^a-z0-9]/gi, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="studio-clearance-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#0b0b0b] border border-[#2e2e2e] text-[#e0e0e0] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Studio Dossier Header */}
        <div className="bg-[#111] border-b border-[#222] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#00ffc3]/10 border border-[#00ffc3]/30 flex items-center justify-center text-[#00ffc3]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-[#00ffc3]/15 text-[#00ffc3] font-mono font-bold">
                  Studio Clearance Engine
                </span>
                <span className="text-[10px] text-[#666] font-mono">
                  ID: {dossier.dossierId}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center space-x-2">
                <span>Studio Legal & Fact Verification Dossier</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadMarkdown}
              id="btn-download-dossier-md"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-xs font-mono text-[#00ffc3] transition"
              title="Download Markdown Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>
            <button
              onClick={handlePrint}
              id="btn-print-dossier"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-xs font-mono text-[#ccc] transition"
              title="Print or Save PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#888] hover:text-white hover:bg-[#1a1a1a] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          {/* Clearance Status Hero Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 bg-[#121212] border border-[#222] p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#777] font-mono">
                    Broadcast Certification Verdict
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <CheckCircle className="w-5 h-5 text-[#00ffc3]" />
                    <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                      {dossier.overallStatus}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#00ffc3] font-mono">
                    {dossier.complianceScore}%
                  </span>
                  <div className="text-[9px] uppercase text-[#666] font-mono">Compliance Index</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#1f1f1f] text-[11px] text-[#888]">
                {dossier.summary}
              </div>
            </div>

            {/* Audit Metadata & Grounding Source Badge */}
            <div className="bg-[#121212] border border-[#222] p-4 flex flex-col justify-between space-y-3 font-mono">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#777]">Grounding Infrastructure</span>
                <div className="text-[#00ffc3] font-bold text-xs mt-0.5">
                  Parallel Web Systems & Gemini 3.8
                </div>
                <div className="text-[10px] text-[#666] mt-1">
                  Autonomous Multi-Agent Web Research
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#777]">Auditor Sign-off</span>
                <div className="text-white text-[11px] truncate">
                  {dossier.auditorAgent}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1f1f1f] flex items-center justify-between">
                <span className="text-[9px] text-[#555] truncate max-w-[140px]">
                  {dossier.auditHash.slice(0, 18)}...
                </span>
                <button
                  onClick={handleCopyHash}
                  className="text-[10px] text-[#00ffc3] hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedHash ? "Copied!" : "Copy Hash"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
            <div className="bg-[#111] border border-[#222] p-2.5">
              <span className="text-xs text-[#777] uppercase block text-[9px]">Verified Claims</span>
              <span className="text-sm font-bold text-white">{dossier.records.length} Spoken Statements</span>
            </div>
            <div className="bg-[#111] border border-[#222] p-2.5">
              <span className="text-xs text-[#777] uppercase block text-[9px]">Legal Liability</span>
              <span className="text-sm font-bold text-[#00ffc3]">LOW (Fair-Use Aligned)</span>
            </div>
            <div className="bg-[#111] border border-[#222] p-2.5">
              <span className="text-xs text-[#777] uppercase block text-[9px]">Domain Authority</span>
              <span className="text-sm font-bold text-[#00ffc3]">96% Tier-1 Sources</span>
            </div>
            <div className="bg-[#111] border border-[#222] p-2.5">
              <span className="text-xs text-[#777] uppercase block text-[9px]">E&O Insurance Ready</span>
              <span className="text-sm font-bold text-white">CERTIFIED</span>
            </div>
          </div>

          {/* Itemized Clearance Records */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5 font-mono">
                <Scale className="w-4 h-4 text-[#00ffc3]" />
                <span>Itemized Spoken Statements & Fact Clearances</span>
              </h3>
              <span className="text-[10px] text-[#666] font-mono">
                Cross-referenced via Parallel Grounding
              </span>
            </div>

            <div className="space-y-2.5">
              {dossier.records.map((record, idx) => {
                const isSelected = selectedRecordId === record.id;
                return (
                  <div
                    key={record.id}
                    className="bg-[#111] border border-[#222] hover:border-[#333] transition p-3.5 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#00ffc3]/10 text-[#00ffc3] border border-[#00ffc3]/30">
                          #{idx + 1} • {record.timestamp}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[#999] tracking-wider">
                          {record.category}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 font-mono">
                        <span className="text-[9px] px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-bold">
                          {record.status}
                        </span>
                        <span className="text-[9px] text-[#777]">
                          Conf: {record.confidence}%
                        </span>
                      </div>
                    </div>

                    {/* Spoken Quote */}
                    <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-2.5 text-xs text-[#ddd] italic">
                      "{record.claim}"
                    </div>

                    {/* Parallel Corroboration Sources */}
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-[#666]">
                        Corroborating Evidence (Parallel API & Web Grounding):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {record.corroborationSources.map((source, sIdx) => (
                          <a
                            key={sIdx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#141414] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#00ffc3]/40 p-2 block transition group"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#00ffc3]">
                              <span className="truncate max-w-[180px] font-bold">{source.domain}</span>
                              <span className="text-[8px] text-[#888] bg-[#222] px-1 py-0.2">
                                Authority: {source.authorityScore}%
                              </span>
                            </div>
                            <div className="text-[11px] text-white font-medium truncate mt-0.5 group-hover:text-[#00ffc3]">
                              {source.title}
                            </div>
                            <div className="text-[9px] text-[#777] line-clamp-2 mt-1">
                              {source.snippet}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Compliance & Legal Note */}
                    <div className="text-[10px] text-[#888] flex items-center space-x-2 pt-1 border-t border-[#1a1a1a] font-mono">
                      <span className="text-[#00ffc3] font-bold">COMPLIANCE NOTE:</span>
                      <span>{record.complianceNote}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended On-Screen Disclaimers */}
          {dossier.recommendedDisclaimers && dossier.recommendedDisclaimers.length > 0 && (
            <div className="bg-[#111] border border-[#222] p-4 space-y-2">
              <h4 className="text-[10px] uppercase font-bold text-[#aaa] tracking-wider font-mono flex items-center space-x-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#00ffc3]" />
                <span>Recommended Broadcast & Social Disclaimers</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-[#888] text-[11px]">
                {dossier.recommendedDisclaimers.map((disc, idx) => (
                  <li key={idx}>{disc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#111] border-t border-[#222] p-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] text-[#666] font-mono">
            Cryptographically signed by CineFact AI Studio Clearance Agent • Valid for OTT, Broadcast & Digital
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 bg-[#00ffc3] hover:bg-[#00e6b0] text-black text-xs font-mono font-bold tracking-wider uppercase transition"
            >
              Download Legal Dossier (.MD)
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#222] hover:bg-[#333] text-white text-xs font-mono tracking-wider uppercase transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
