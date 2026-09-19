import React from 'react';
import {
  X,
  Scale,
  Info,
  AlertOctagon,
  AlertTriangle,
  Clock,
  FileCheck2,
  GitBranch,
  FileWarning,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ExplainableRiskScore } from './riskEngine.js';

interface RiskScoreExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskScore: ExplainableRiskScore;
}

export const RiskScoreExplanationModal: React.FC<RiskScoreExplanationModalProps> = ({
  isOpen,
  onClose,
  riskScore,
}) => {
  if (!isOpen) return null;

  const severityColors = {
    CRITICAL: {
      bg: 'bg-rose-100 border-rose-300 text-rose-900',
      badge: 'bg-rose-600 text-white',
      border: 'border-rose-300',
    },
    HIGH: {
      bg: 'bg-amber-100 border-amber-300 text-amber-900',
      badge: 'bg-amber-600 text-white',
      border: 'border-amber-300',
    },
    MEDIUM: {
      bg: 'bg-blue-100 border-blue-300 text-blue-900',
      badge: 'bg-blue-600 text-white',
      border: 'border-blue-300',
    },
    LOW: {
      bg: 'bg-slate-100 border-slate-300 text-slate-900',
      badge: 'bg-slate-600 text-white',
      border: 'border-slate-300',
    },
  };

  const levelColor = severityColors[riskScore.compositeRiskLevel];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Why is my risk score this value?</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  EXPLAINABLE PROTOTYPE MODEL
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Deterministic statutory bottleneck risk rating — zero fabricated or simulated numerical claims
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ethical / Explainability Banner */}
        <div className="bg-amber-50 px-6 py-3 border-b border-amber-200 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">No Invented Numerical Claims: </span>
            {riskScore.disclaimer}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Summary Banner */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center justify-center">
                <span
                  className={`px-3 py-1.5 rounded-xl text-sm font-black tracking-wider uppercase shadow-2xs border ${levelColor.badge}`}
                >
                  {riskScore.compositeRiskLevel} RISK
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 mt-1.5">
                  Index: {riskScore.overallRiskScore} / 100
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Composite Statutory Risk Level
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
                  {riskScore.explanationSummary}
                </p>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="w-full sm:w-auto bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-600 shrink-0 font-mono">
              <span className="font-semibold text-slate-800 block text-[11px] mb-1 font-sans">
                Bottlenecks by Severity:
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div>Critical: <span className="font-bold text-rose-700">{riskScore.criticalCount}</span></div>
                <div>High: <span className="font-bold text-amber-700">{riskScore.highCount}</span></div>
                <div>Medium: <span className="font-bold text-blue-700">{riskScore.mediumCount}</span></div>
                <div>Low: <span className="font-bold text-slate-700">{riskScore.lowCount}</span></div>
              </div>
            </div>
          </div>

          {/* Point Formula Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-700" />
              <span>Transparent Mathematical Point Attribution</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Severity Tier</th>
                    <th className="py-2.5 px-3 text-center">Detected Count</th>
                    <th className="py-2.5 px-3 text-center">Points Each</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-4">Statutory Criteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {riskScore.scoreBreakdown.map((row) => (
                    <tr key={row.severity} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            row.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : row.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : row.severity === 'MEDIUM'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {row.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        {row.count}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        +{row.pointsPerItem} pts
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {row.subtotal} pts
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-slate-600 font-sans">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/80 font-bold font-sans text-slate-900 border-t border-slate-200">
                    <td className="py-2.5 px-4">Total Risk Index</td>
                    <td className="py-2.5 px-3 text-center font-mono">{riskScore.totalBottlenecks} items</td>
                    <td className="py-2.5 px-3 text-center font-mono">&mdash;</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                      {riskScore.overallRiskScore} / 100
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-500">
                      Evaluated level: <strong className="text-slate-900">{riskScore.compositeRiskLevel} RISK</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 6 Detection Pillars Checked */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>6 Statutory Bottleneck Detection Sources</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block">1. Missing Documents</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Flags required statutory files not yet uploaded for active approvals.
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-800 mt-1 block">
                  {riskScore.categoryCounts.missing_documents} Detected
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block">2. Overdue Applications</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Flags applications exceeding statutory departmental review SLAs.
                </span>
                <span className="text-[10px] font-mono font-bold text-rose-800 mt-1 block">
                  {riskScore.categoryCounts.overdue_applications} Detected
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block">3. Unresolved Queries</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Flags formal scrutiny queries with countdown to application cancellation.
                </span>
                <span className="text-[10px] font-mono font-bold text-rose-800 mt-1 block">
                  {riskScore.categoryCounts.unresolved_queries} Detected
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block">4. Blocked Dependencies</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Flags prerequisite approvals holding up downstream clearance filings.
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-800 mt-1 block">
                  {riskScore.categoryCounts.blocked_dependencies} Detected
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block">5. Upcoming Deadlines</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Tracks query response windows, certificate renewals, and target dates.
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-800 mt-1 block">
                  {riskScore.categoryCounts.upcoming_deadlines} Detected
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block">6. Document Inconsistencies</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Flags technical data mismatches identified by AI pre-validation scans.
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-800 mt-1 block">
                  {riskScore.categoryCounts.document_inconsistencies} Detected
                </span>
              </div>
            </div>
          </div>

          {/* Primary Risk Drivers */}
          {riskScore.primaryRiskDrivers.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Top Identified Risk Drivers
              </h4>
              <div className="space-y-2">
                {riskScore.primaryRiskDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            driver.severity === 'CRITICAL'
                              ? 'bg-rose-200 text-rose-900'
                              : driver.severity === 'HIGH'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-blue-200 text-blue-900'
                          }`}
                        >
                          {driver.severity}
                        </span>
                        <span className="font-bold text-slate-900">{driver.issue}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        Affected: {driver.affectedApproval} &bull; Impact: {driver.downstreamImpact}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-700 shrink-0">
                      +{driver.pointsContributed} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Deterministic Engine: SIH26130 Transparent Procedural Scrutiny v2.4
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
