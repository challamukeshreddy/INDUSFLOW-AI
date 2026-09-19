import React from 'react';
import {
  X,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  GitBranch,
  ShieldCheck,
  TrendingUp,
  Info,
  Scale,
  Sparkles,
} from 'lucide-react';
import { ReadinessScoreExplanation, ScorePillar } from './dashboardCalculations.js';

interface ReadinessScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: ReadinessScoreExplanation;
}

export const ReadinessScoreModal: React.FC<ReadinessScoreModalProps> = ({
  isOpen,
  onClose,
  explanation,
}) => {
  if (!isOpen) return null;

  const pillarIcons: Record<string, React.ReactNode> = {
    approvals: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    documents: <FileText className="w-5 h-5 text-blue-600" />,
    dependencies: <GitBranch className="w-5 h-5 text-purple-600" />,
    issues: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    deadlines: <Clock className="w-5 h-5 text-rose-600" />,
  };

  const pillarBgColors: Record<string, string> = {
    approvals: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    documents: 'bg-blue-50 border-blue-200 text-blue-900',
    dependencies: 'bg-purple-50 border-purple-200 text-purple-900',
    issues: 'bg-amber-50 border-amber-200 text-amber-900',
    deadlines: 'bg-rose-50 border-rose-200 text-rose-900',
  };

  const pillarBarColors: Record<string, string> = {
    approvals: 'bg-emerald-500',
    documents: 'bg-blue-500',
    dependencies: 'bg-purple-500',
    issues: 'bg-amber-500',
    deadlines: 'bg-rose-500',
  };

  const pillarsList: ScorePillar[] = Object.values(explanation.pillars);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Why is my readiness score this value?</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  PROTOTYPE SCORING MODEL
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Transparent multi-criteria algorithmic breakdown for industrial compliance readiness
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close explanation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prototype Notice Banner */}
        <div className="bg-amber-50 px-6 py-3 border-b border-amber-200 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">Demonstration Scoring Engine: </span>
            {explanation.disclaimer}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Score Summary Card */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-teal-500/20 flex items-center justify-center bg-white shadow-xs">
                  <div className="text-center">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {explanation.overallScore}%
                    </span>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Readiness
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Calculated Composite Readiness</h3>
                  <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 font-medium">
                    Mathematical Model
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-md">
                  {explanation.summaryText}
                </p>
              </div>
            </div>

            {/* Quick Weight Distribution Pill */}
            <div className="w-full sm:w-auto bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-600 shrink-0">
              <span className="font-semibold text-slate-800 block text-[11px] mb-1">
                Score Weighting Distribution:
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
                <div>Approvals: <span className="font-bold text-emerald-700">30%</span></div>
                <div>Documents: <span className="font-bold text-blue-700">25%</span></div>
                <div>Dependencies: <span className="font-bold text-purple-700">20%</span></div>
                <div>Open Issues: <span className="font-bold text-amber-700">15%</span></div>
                <div>Deadline Risk: <span className="font-bold text-rose-700">10%</span></div>
              </div>
            </div>
          </div>

          {/* Pillars Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>5 Core Calculation Pillars</span>
            </h4>

            <div className="space-y-4">
              {pillarsList.map((pillar) => {
                return (
                  <div
                    key={pillar.key}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                          {pillarIcons[pillar.key]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{pillar.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              Weight: {pillar.weightPercent}%
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                            {pillar.statusText}
                          </span>
                        </div>
                      </div>

                      {/* Score metrics */}
                      <div className="flex items-center gap-4 sm:text-right">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Component Score</span>
                          <span className="text-base font-bold text-slate-900 font-mono">
                            {pillar.rawScore} / 100
                          </span>
                        </div>
                        <div className="pl-3 border-l border-slate-200">
                          <span className="text-[11px] text-teal-700 block font-medium">Points to Total</span>
                          <span className="text-base font-bold text-teal-800 font-mono">
                            +{pillar.weightedContribution}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pillarBarColors[pillar.key]} transition-all duration-500`}
                          style={{ width: `${pillar.rawScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Formula & Rule Details */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
                      <span className="font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        {pillar.formula}
                      </span>
                      <span className="text-slate-600 italic">
                        {pillar.recommendation}
                      </span>
                    </div>

                    {/* Positive & Negative Drivers */}
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {pillar.positiveDrivers.length > 0 && (
                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-2.5">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Positive Influencers
                          </span>
                          <ul className="mt-1 space-y-0.5">
                            {pillar.positiveDrivers.map((item, idx) => (
                              <li key={idx} className="text-emerald-900 text-[11px]">
                                &bull; {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {pillar.negativeDrivers.length > 0 && (
                        <div className="bg-rose-50/70 border border-rose-100 rounded-lg p-2.5">
                          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Score Drag / Bottlenecks
                          </span>
                          <ul className="mt-1 space-y-0.5">
                            {pillar.negativeDrivers.map((item, idx) => (
                              <li key={idx} className="text-rose-900 text-[11px]">
                                &bull; {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Recommendations to Boost Score */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-4 h-4 text-teal-700" /> How to Reach 100% Readiness
            </h4>
            <div className="space-y-1.5 text-xs text-teal-950">
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-700 shrink-0">1. Clear Clarification Queries:</span>
                <span>Submit required ETP water balance schematics for SPCB CTE before statutory deadline to prevent automatic cancellation.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-700 shrink-0">2. Fix Document Inconsistencies:</span>
                <span>Re-upload the revised Water Balance Diagram with 65 KLD capacity matching the business profile.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-700 shrink-0">3. Sequence Approvals:</span>
                <span>Once CTE is granted, apply for Factory Building Plan Approval and High-Tension Power Sanction.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Algorithm: SIH26130 Multi-Criteria Weighted Regulatory Vector {explanation.scoringModelVersion}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
