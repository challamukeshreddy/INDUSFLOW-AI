import React from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  ShieldAlert,
  Bot,
  Factory,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  HelpCircle,
  UserPlus,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { profile, activeTab, setActiveTab, alerts, isEvaluating, refreshAllData } = useApp();

  const getCpcbBadge = (cat?: string) => {
    switch (cat) {
      case 'Red':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Orange':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Green':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'White':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const highSeverityAlerts = alerts.filter((a) => a.severity === 'high');

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      {/* SIH Prototype Disclaimer Top Strip */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            SIH26130 Demonstration MVP
          </span>
          <span className="hidden sm:inline text-slate-300">
            Efficiency in streamlining industrial approvals, compliance processes, and access to government support services.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-amber-300/90">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Non-authoritative simulated prototype • Not an official government portal</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500 flex items-center justify-center shadow-md shadow-indigo-500/20 border border-indigo-400/30 flex-shrink-0">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">
                  INDUSFLOW<span className="text-teal-400">.AI</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-800 font-medium tracking-wide">
                  COMPLIANCE ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Business-Side Industrial Approval &amp; Clearance Orchestrator
              </p>
            </div>
          </div>

          {/* Active Business Project Badge & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {profile && (
              <div
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 cursor-pointer transition-colors"
                title="Click to edit business parameters"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5 font-medium text-slate-100">
                    <span className="truncate max-w-[170px] sm:max-w-[220px]">{profile.companyName}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getCpcbBadge(
                        profile.cpcbCategory
                      )}`}
                    >
                      {profile.cpcbCategory} Cat
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[220px]">
                    {profile.industrialArea}, {profile.state}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}

            {/* Quick Bottleneck Counter Button */}
            {highSeverityAlerts.length > 0 && (
              <button
                onClick={() => setActiveTab('risks')}
                className="flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{highSeverityAlerts.length} Actionable Query</span>
              </button>
            )}

            {/* Onboard Business Button */}
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'onboarding'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-indigo-950/70 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-800/80'
              }`}
              title="Start New Business Onboarding"
            >
              <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Onboard Business</span>
            </button>

            {/* Copilot Launcher */}
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'assistant'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border border-teal-800/80'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI Copilot</span>
            </button>

            {/* Re-evaluate / Refresh */}
            <button
              onClick={() => refreshAllData()}
              disabled={isEvaluating}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh and re-evaluate compliance rules"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
