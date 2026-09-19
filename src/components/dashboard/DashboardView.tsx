import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileCheck2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Zap,
  Droplets,
  Layers,
  Sparkles,
  Network,
  HelpCircle,
  FileWarning,
  Calendar,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ChevronRight,
  Scale,
  ShieldAlert,
  Info,
  Check,
  Landmark,
} from 'lucide-react';
import { calculateDashboardMetrics, ScorePillar } from './dashboardCalculations.js';
import { matchGovernmentSchemes, MatchedScheme } from './governmentSchemes.js';
import { matchDemonstrationSchemes } from '../schemes/schemeMatchingEngine.js';
import { ReadinessScoreModal } from './ReadinessScoreModal.js';
import { GovernmentSchemeModal } from './GovernmentSchemeModal.js';
import { NextBestActionBanner } from '../nextAction/NextBestActionBanner.js';
import { selectNextBestAction } from '../nextAction/nextBestActionEngine.js';

export const DashboardView: React.FC = () => {
  const {
    profile,
    approvals,
    alerts,
    nextActions,
    documents,
    setActiveTab,
    setSelectedApproval,
    setSelectedDocument,
    generateApprovalPlan,
    isEvaluating,
    schemeApplicationStatuses,
  } = useApp();

  // State for modals and inline accordions
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isInlineExplanationExpanded, setIsInlineExplanationExpanded] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<MatchedScheme | null>(null);

  // Compute all metrics dynamically from underlying state
  const metrics = useMemo(() => {
    return calculateDashboardMetrics(profile, approvals, documents, alerts);
  }, [profile, approvals, documents, alerts]);

  // Compute matched government schemes dynamically based on profile and approvals
  const matchedSchemes = useMemo(() => {
    if (!profile) return [];
    return matchGovernmentSchemes(profile, approvals);
  }, [profile, approvals]);

  // Compute demonstration schemes matched across 5 parameters
  const matchedDemoSchemes = useMemo(() => {
    if (!profile) return [];
    return matchDemonstrationSchemes(profile, approvals, documents, schemeApplicationStatuses);
  }, [profile, approvals, documents, schemeApplicationStatuses]);

  if (!profile) return null;

  const {
    overallReadiness,
    approvalsCompletedCount,
    approvalsTotalCount,
    approvalsInReviewCount,
    documentsVerifiedCount,
    documentsTotalCount,
    documentsNeedsCorrectionCount,
    documentsMissingCount,
    blockedItemsCount,
    upcomingDeadlinesCount,
    readinessExplanation,
    upcomingDeadlines,
    stageGroups,
    derivedDocs,
    riskSummary,
  } = metrics;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* Top Banner: Industrial Facility Dossier Header */}
      {/* ---------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-xs border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>SIH26130 Intelligent Industrial Orchestrator</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {profile.companyName}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Industrial compliance orchestration for{' '}
              <span className="text-amber-300 font-semibold">{profile.cpcbCategory} Category</span>{' '}
              {profile.sector.toUpperCase()} facility in {profile.industrialArea || 'Industrial Area'},{' '}
              {profile.district}, {profile.state}. Dynamically tracking {approvalsTotalCount} statutory approvals,{' '}
              {documentsTotalCount} required statutory documents, and prerequisite dependency chains.
            </p>
          </div>

          {/* Quick Actions & High-level Status */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsScoreModalOpen(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-2xs"
              title="View transparent formula breakdown"
            >
              <HelpCircle className="w-4 h-4 text-teal-300" />
              <span>Why is my score {overallReadiness}%?</span>
            </button>

            <button
              onClick={() => setActiveTab('department')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              <Landmark className="w-4 h-4 text-teal-400" />
              <span>Department View</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              <span>Ask AI Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtle Watermark */}
        <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
          <Layers className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Top 5 KPI Cards (Dynamically Calculated) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Overall Readiness */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:border-teal-400 transition-colors">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Overall Readiness
              </span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
                <Scale className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {overallReadiness}%
              </span>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-mono">
                Prototype Score
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${overallReadiness}%` }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setIsScoreModalOpen(true)}
              className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Why this value?</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-slate-400 font-mono">5 Pillars</span>
          </div>
        </div>

        {/* KPI 2: Approvals Completed */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Approvals Completed
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {approvalsCompletedCount} / {approvalsTotalCount}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1 font-medium">
              {approvalsInReviewCount} in review &bull; {approvalsTotalCount - approvalsCompletedCount - approvalsInReviewCount} pending
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{Math.round((approvalsCompletedCount / approvalsTotalCount) * 100)}% Sanctioned</span>
            <button
              onClick={() => setActiveTab('approvals')}
              className="text-slate-700 hover:text-teal-700 font-semibold cursor-pointer"
            >
              View Matrix &rarr;
            </button>
          </div>
        </div>

        {/* KPI 3: Documents Verified */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Documents Verified
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
                <FileCheck2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-900 font-mono tracking-tight">
                {documentsVerifiedCount} Verified
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1 font-medium">
              out of {documentsTotalCount} required statutory records
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {documentsNeedsCorrectionCount > 0 ? (
                <span className="text-amber-700 font-semibold">
                  {documentsNeedsCorrectionCount} Need Review
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">All Uploads Clean</span>
              )}
            </span>
            <button
              onClick={() => setActiveTab('documents')}
              className="text-slate-700 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Repository &rarr;
            </button>
          </div>
        </div>

        {/* KPI 4: Blocked Items */}
        <div className={`bg-white rounded-xl p-4 border shadow-2xs flex flex-col justify-between transition-colors ${
          blockedItemsCount > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Blocked Items
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                blockedItemsCount > 0
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                <AlertOctagon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono tracking-tight ${
                blockedItemsCount > 0 ? 'text-amber-900' : 'text-slate-900'
              }`}>
                {blockedItemsCount}
              </span>
              {blockedItemsCount > 0 && (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                  Needs Action
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 font-medium">
              Prerequisites &amp; Clarification notices
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {riskSummary.queryRaisedCount} Queries &bull; {riskSummary.criticalPathBlockedCount} Pre-reqs
            </span>
            <button
              onClick={() => setActiveTab('tracker')}
              className="text-amber-800 hover:text-amber-950 font-semibold cursor-pointer"
            >
              Resolve &rarr;
            </button>
          </div>
        </div>

        {/* KPI 5: Upcoming Deadlines */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-rose-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Upcoming Deadlines
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200/60">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-950 font-mono tracking-tight">
                {upcomingDeadlinesCount}
              </span>
              {upcomingDeadlines.some((d) => d.daysRemaining <= 10) && (
                <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                  Urgent
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 truncate font-medium">
              Earliest: {upcomingDeadlines[0]?.dueDate || 'None scheduled'}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {upcomingDeadlines[0] ? `${upcomingDeadlines[0].daysRemaining}d remaining` : 'On track'}
            </span>
            <a
              href="#upcoming-deadlines-section"
              className="text-slate-700 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Timeline &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* PROMINENT NEXT BEST ACTION BANNER */}
      {/* ---------------------------------------------------- */}
      <NextBestActionBanner className="my-2" />

      {/* ---------------------------------------------------- */}
      {/* "Why is my readiness score this value?" Expandable Box */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <button
          onClick={() => setIsInlineExplanationExpanded(!isInlineExplanationExpanded)}
          className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer border-b border-slate-200/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  Why is my readiness score {overallReadiness}%?
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200">
                  Transparent Scoring Model
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  Prototype Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated dynamically from 5 weighted pillars: Approvals (30%), Documents (25%), Dependencies (20%), Issues (15%), and Deadlines (10%).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 shrink-0">
            <span>{isInlineExplanationExpanded ? 'Hide Calculation' : 'Inspect Formula & Drivers'}</span>
            {isInlineExplanationExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {isInlineExplanationExpanded && (
          <div className="p-5 bg-white space-y-4 animate-in fade-in duration-150">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Notice on Regulatory Scoring: </span>
                {readinessExplanation.disclaimer}
              </div>
            </div>

            {/* 5 Pillars Quick Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {(Object.values(readinessExplanation.pillars) as ScorePillar[]).map((p) => (
                <div
                  key={p.key}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800">{p.title}</span>
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      {p.weightPercent}% Wt
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {p.rawScore}%
                    </span>
                    <span className="text-[11px] text-teal-700 font-mono font-semibold">
                      (+{p.weightedContribution}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {p.statusText}
                  </p>
                </div>
              ))}
            </div>

            {/* Positive vs Negative Influencers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Key Positive Drivers (Supporting Score)</span>
                </span>
                <ul className="text-xs text-emerald-950 space-y-1">
                  {readinessExplanation.topPositiveFactors.map((f, i) => (
                    <li key={i} className="text-[11px]">&bull; {f}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                  <span>Score Drag Factors (Areas for Improvement)</span>
                </span>
                <ul className="text-xs text-rose-950 space-y-1">
                  {readinessExplanation.topDragFactors.map((f, i) => (
                    <li key={i} className="text-[11px]">&bull; {f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsScoreModalOpen(true)}
                className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Interactive Breakdown &amp; Mathematical Formulas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 7 Core Dashboard Sections */}
      {/* ---------------------------------------------------- */}

      {/* Grid: Sections 1 & 2 (Approval Progress + Document Readiness) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: Approval Progress */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900">
                    1. Approval Progress by Lifecycle Stage
                  </h2>
                  <p className="text-xs text-slate-500">
                    Calculated tracking across 4 industrial establishment phases
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('approvals')}
                className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Matrix</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Stages Stack */}
            <div className="space-y-3 mt-4">
              {stageGroups.map((grp) => (
                <div
                  key={grp.stage}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800">{grp.stageTitle}</span>
                    <span className="font-mono text-xs font-semibold text-slate-600">
                      {grp.approved} / {grp.total} Cleared ({grp.percentComplete}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${grp.percentComplete}%` }}
                    />
                  </div>

                  {/* Status Pills */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                    {grp.approved > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        {grp.approved} Approved
                      </span>
                    )}
                    {grp.inReview > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                        {grp.inReview} In Review
                      </span>
                    )}
                    {grp.queryRaised > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                        {grp.queryRaised} Query
                      </span>
                    )}
                    {grp.documentsPending > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        {grp.documentsPending} Docs Pending
                      </span>
                    )}
                    {grp.notStarted > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {grp.notStarted} Queued
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Progress: {approvalsCompletedCount} of {approvalsTotalCount} Cleared</span>
            <button
              onClick={() => setActiveTab('dependencies')}
              className="text-teal-700 font-semibold hover:underline flex items-center gap-1"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Interactive Roadmap</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: Document Readiness */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900">
                    2. Document Readiness
                  </h2>
                  <p className="text-xs text-slate-500">
                    Statutory dossier status &amp; AI consistency verification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('documents')}
                className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Documents Module</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Document Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Required</span>
                <span className="text-lg font-bold text-slate-900 font-mono">{documentsTotalCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Verified</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">{documentsVerifiedCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-700 uppercase font-semibold block">In Review</span>
                <span className="text-lg font-bold text-amber-700 font-mono">
                  {metrics.documentsUnderReviewCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-rose-700 uppercase font-semibold block">Missing</span>
                <span className="text-lg font-bold text-rose-700 font-mono">{documentsMissingCount}</span>
              </div>
            </div>

            {/* Critical Document Samples */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Critical Compliance Documents:
              </span>
              {derivedDocs.allRecords.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setActiveTab('documents');
                  }}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30 transition-all flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <span className="font-bold text-slate-900 block truncate">
                      {doc.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {doc.relatedApproval}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      doc.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'NEEDS CORRECTION'
                        ? 'bg-rose-100 text-rose-800'
                        : doc.status === 'UNDER REVIEW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>AI Screened: {documentsVerifiedCount} verified</span>
            <button
              onClick={() => setActiveTab('documents')}
              className="text-blue-700 font-semibold hover:underline"
            >
              Upload / Pre-Validate Dossiers &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Sections 3 & 4 (Risk Overview + Current Bottlenecks) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 3: Risk Overview */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900">
                    3. Statutory Risk Overview
                  </h2>
                  <p className="text-xs text-slate-500">
                    Regulatory, environmental, and timeline exposure analysis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('risks')}
                className="text-xs text-rose-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Risk Radar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Delay Exposure Pill */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold font-mono text-sm">
                  +{riskSummary.cumulativePotentialDelayDays}d
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                    Critical Path Delay Exposure
                  </span>
                  <span className="text-xs font-semibold text-rose-950">
                    {riskSummary.criticalRiskCount > 0 && `${riskSummary.criticalRiskCount} Critical • `}
                    {riskSummary.highRiskCount} High Severity &bull; {riskSummary.mediumRiskCount} Medium Risk
                  </span>
                </div>
              </div>
              <span className="text-xs text-rose-800 font-mono font-bold bg-white px-2 py-1 rounded border border-rose-200">
                {riskSummary.compositeRiskLevel} Risk Rating
              </span>
            </div>

            {/* Risk Factor Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <Flame className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Environmental &amp; Pollution Scrutiny:</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Unit classified as CPCB Red Category with high effluent load ({profile.effluentQuantityKLD || 42} KLD) and hazardous chemical storage. Strict Zero Liquid Discharge (ZLD) norms apply.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Statutory SLA Timeline Adherence:</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Department review SLA progress is active. MoEF&amp;CC Environmental Clearance and DISCOM Power review require automated status escalation if timeline exceeds 80%.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Automated statutory heuristic monitoring</span>
            <button
              onClick={() => setActiveTab('risks')}
              className="text-rose-700 font-semibold hover:underline"
            >
              View All Risk Details &rarr;
            </button>
          </div>
        </div>

        {/* SECTION 4: Current Bottlenecks */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900">
                    4. Current Bottlenecks
                  </h2>
                  <p className="text-xs text-slate-500">
                    Issues actively halting application progress
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {alerts.length} Active
              </span>
            </div>

            {/* Bottlenecks List */}
            <div className="space-y-2.5">
              {alerts.slice(0, 3).map((alert) => {
                const s = (alert.severity || '').toUpperCase();
                const isCrit = s === 'CRITICAL';
                const isHigh = s === 'HIGH' || s === 'CRITICAL';
                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border text-xs ${
                      isCrit
                        ? 'bg-rose-50/80 border-rose-300'
                        : isHigh
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-blue-50/60 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isCrit
                            ? 'bg-rose-200 text-rose-900 font-black'
                            : isHigh
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-blue-200 text-blue-900'
                        }`}
                      >
                        {s} Risk
                      </span>
                      {alert.impactOnCommercialDateDays > 0 && (
                        <span className="text-[11px] font-bold text-rose-700">
                          +{alert.impactOnCommercialDateDays}d delay
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 mt-1">
                      {alert.issue || alert.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                      {alert.downstreamImpact || alert.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-800 font-medium truncate max-w-[220px]">
                        Action: {alert.recommendedAction || alert.suggestedAction || 'Review filing'}
                      </span>
                      <button
                        onClick={() => setActiveTab('risks')}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer shrink-0 ml-2"
                      >
                        View in Radar &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Critical path blockers resolved through portal filing</span>
            <button
              onClick={() => setActiveTab('tracker')}
              className="text-indigo-700 font-semibold hover:underline"
            >
              Open Clarifications Tracker &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 5: Upcoming Deadlines */}
      {/* ---------------------------------------------------- */}
      <div id="upcoming-deadlines-section" className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                5. Upcoming Deadlines &amp; Statutory Milestones
              </h2>
              <p className="text-xs text-slate-500">
                Calculated countdown for clarification notices, review SLAs, document validity, and target commissioning
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            {upcomingDeadlines.length} Milestones Scheduled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {upcomingDeadlines.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                item.urgency === 'critical'
                  ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-50'
                  : item.urgency === 'warning'
                  ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-50'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {item.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      item.urgency === 'critical'
                        ? 'bg-rose-200 text-rose-900'
                        : item.urgency === 'warning'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.daysRemaining} Days Left
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                  {item.title}
                </h4>

                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Due: {item.dueDate}</span>
                </div>

                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {item.actionPrompt}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {item.authority}
                </span>
                <button
                  onClick={() => setActiveTab(item.routeTab)}
                  className="text-xs font-bold text-slate-900 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Action</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 6: Next Best Action */}
      {/* ---------------------------------------------------- */}
      <div id="next-best-action-section" className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                6. Next Best Action (Statutory Prioritization Engine)
              </h2>
              <p className="text-xs text-slate-500">
                Data-driven recommendation derived by examining approval statuses, document status, dependencies, deadlines, bottlenecks &amp; risk
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            Deterministic Engine
          </span>
        </div>

        {/* Embedded prominent Next Best Action Card */}
        <NextBestActionBanner variant="detailed" />
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 7: Potential Government Schemes */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-900">
                  7. Potential Government Schemes &amp; Financial Support
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  DEMONSTRATION DATA
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Matched against {profile.sector.toUpperCase()}, {profile.state}, {profile.projectType}, ₹{profile.investmentInrCrores} Cr outlay, and {profile.businessType}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('schemes')}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Explore All {matchedDemoSchemes.length} Schemes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mandatory Prototype Disclaimer Bar */}
        <div className="mb-4 p-3 rounded-lg bg-amber-50/70 border border-amber-300 text-xs text-amber-950 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-[11px] text-amber-900">
              &bull; Potentially relevant based on prototype criteria.
            </p>
            <p className="text-[11px] text-amber-800">
              &bull; Verify eligibility with the concerned authority. Never state that the company is definitely eligible.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchedDemoSchemes.slice(0, 3).map((scheme) => (
            <div
              key={scheme.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    DEMONSTRATION RECORD
                  </span>
                  <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {scheme.potentialRelevance} ({scheme.potentialRelevanceScore}%)
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {scheme.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                    {scheme.sponsoringBody}
                  </span>
                </div>

                {/* Potential Relevance & Notice */}
                <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>Potential Relevance:</span>
                    <span className="text-teal-700 font-mono">{scheme.potentialRelevance}</span>
                  </div>
                  <p className="text-[10px] text-slate-600 italic">
                    &ldquo;Potentially relevant based on prototype criteria.&rdquo;
                  </p>
                </div>

                {/* Why It May Be Relevant */}
                <div className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-100 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider block">
                    Why It May Be Relevant:
                  </span>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {scheme.whyItMayBeRelevant.industryWhy}
                  </p>
                </div>

                {/* Required Documents */}
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>Required Documents:</span>
                    <span className="font-mono text-teal-700">
                      {scheme.uploadedDocumentsCount} / {scheme.requiredDocumentsCount} In Hub
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {scheme.requiredDocuments.slice(0, 2).map((doc) => (
                      <span key={doc.id} className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-700 truncate max-w-[140px]">
                        {doc.name}
                      </span>
                    ))}
                    {scheme.requiredDocuments.length > 2 && (
                      <span className="text-[10px] text-slate-400 py-0.5">
                        +{scheme.requiredDocuments.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Application Status */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="font-semibold text-slate-700">Application Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800">
                    {scheme.applicationStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <button
                  onClick={() => setActiveTab('schemes')}
                  className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Scheme Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <a
                  href={scheme.officialPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-700 p-1 rounded"
                  title="Visit Official Portal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Modals */}
      {/* ---------------------------------------------------- */}

      {/* "Why is my readiness score this value?" Detailed Modal */}
      <ReadinessScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        explanation={readinessExplanation}
      />

      {/* Government Scheme Detail Modal */}
      <GovernmentSchemeModal
        scheme={selectedScheme}
        approvals={approvals}
        onClose={() => setSelectedScheme(null)}
        onNavigateApprovals={() => setActiveTab('approvals')}
      />
    </div>
  );
};
