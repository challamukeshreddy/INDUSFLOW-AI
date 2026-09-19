import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileWarning,
  Activity,
  Layers,
  CheckCircle2,
  FileCheck2,
  Search,
  Filter,
  Scale,
  Sparkles,
  Info,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  detectAllBottlenecks,
  calculateExplainableRiskScore,
  normalizeSeverity,
  ExplainableRiskScore,
} from './riskEngine.js';
import { RiskScoreExplanationModal } from './RiskScoreExplanationModal.js';
import { BottleneckAlert, BottleneckCategory, RiskSeverity } from '../../types/index.js';

export const BottleneckRadarView: React.FC = () => {
  const { alerts: rawAlerts, setActiveTab, setSelectedApproval, approvals, profile, documents } = useApp();

  // Selected filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState<boolean>(false);

  // Compute all bottlenecks reactively across the 6 mandated sources
  const detectedBottlenecks: BottleneckAlert[] = useMemo(() => {
    const computed = detectAllBottlenecks(approvals, profile, documents);
    if (computed && computed.length > 0) return computed;
    return rawAlerts || [];
  }, [approvals, profile, documents, rawAlerts]);

  // Calculate the explainable risk score from detected bottlenecks
  const riskScore: ExplainableRiskScore = useMemo(() => {
    return calculateExplainableRiskScore(detectedBottlenecks);
  }, [detectedBottlenecks]);

  // Filtered list
  const filteredBottlenecks = useMemo(() => {
    return detectedBottlenecks.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Severity filter
      if (selectedSeverity !== 'all' && normalizeSeverity(item.severity) !== selectedSeverity) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchIssue = (item.issue || item.title || '').toLowerCase().includes(query);
        const matchAppr = (item.affectedApproval || item.approvalTitle || '').toLowerCase().includes(query);
        const matchAction = (item.recommendedAction || item.suggestedAction || '').toLowerCase().includes(query);
        if (!matchIssue && !matchAppr && !matchAction) return false;
      }
      return true;
    });
  }, [detectedBottlenecks, selectedCategory, selectedSeverity, searchQuery]);

  // Severity styling map
  const getSeverityStyle = (severity: string) => {
    const s = normalizeSeverity(severity);
    switch (s) {
      case 'CRITICAL':
        return {
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          card: 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200',
          indicator: 'bg-rose-600',
          text: 'text-rose-900',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white',
          label: 'CRITICAL RISK',
        };
      case 'HIGH':
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          card: 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-200',
          indicator: 'bg-amber-600',
          text: 'text-amber-900',
          btn: 'bg-amber-700 hover:bg-amber-800 text-white',
          label: 'HIGH RISK',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-blue-100 text-blue-900 border-blue-300',
          card: 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-100',
          indicator: 'bg-blue-600',
          text: 'text-blue-900',
          btn: 'bg-blue-700 hover:bg-blue-800 text-white',
          label: 'MEDIUM RISK',
        };
      case 'LOW':
      default:
        return {
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          card: 'bg-white border-slate-200',
          indicator: 'bg-slate-500',
          text: 'text-slate-800',
          btn: 'bg-slate-800 hover:bg-slate-900 text-white',
          label: 'LOW RISK',
        };
    }
  };

  const getCategoryLabel = (cat: BottleneckCategory | undefined) => {
    switch (cat) {
      case 'missing_documents':
        return 'Missing Documents';
      case 'overdue_applications':
        return 'Overdue SLA';
      case 'unresolved_queries':
        return 'Unresolved Query';
      case 'blocked_dependencies':
        return 'Blocked Dependency';
      case 'upcoming_deadlines':
        return 'Upcoming Deadline';
      case 'document_inconsistencies':
        return 'Document Inconsistency';
      default:
        return 'Statutory Bottleneck';
    }
  };

  const levelStyle = getSeverityStyle(riskScore.compositeRiskLevel);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* 1. Header Banner & Explainable Risk Indicator */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="font-bold text-xl text-slate-900">
                Bottleneck &amp; Statutory Risk Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                SIH26130 ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time heuristic evaluation detecting compliance roadblocks across 6 statutory criteria:
              missing documents, overdue applications, unresolved queries, blocked dependencies, upcoming deadlines, and document inconsistencies.
            </p>
          </div>

          {/* Explainable Risk Level Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="flex flex-col items-center justify-center">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase border shadow-2xs ${levelStyle.badge}`}
                >
                  {riskScore.compositeRiskLevel} RISK
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-700 mt-1">
                  Index: {riskScore.overallRiskScore} / 100
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Overall Procedural Risk
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {riskScore.criticalCount} Critical &bull; {riskScore.highCount} High &bull; {riskScore.mediumCount} Medium
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsExplanationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 shadow-2xs transition-all cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-teal-700" />
              <span>Why is my risk score this value?</span>
            </button>
          </div>
        </div>

        {/* Ethical Transparency Alert */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Explainable Statutory Model:</strong> Derived deterministically from active filing states and verified checklist items. No invented numerical claims.
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
            Max delay exposure: +{riskScore.cumulativeDelayDays} days
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. Top Summary KPI Cards */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* CRITICAL */}
        <div
          onClick={() => setSelectedSeverity(selectedSeverity === 'CRITICAL' ? 'all' : 'CRITICAL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedSeverity === 'CRITICAL'
              ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-400'
              : 'bg-white border-slate-200 hover:border-rose-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold text-rose-800 uppercase tracking-wider text-[11px]">
              Critical Risk
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-rose-950">
              {riskScore.criticalCount}
            </span>
            <span className="text-[10px] text-rose-700 font-semibold">Immediate Action</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Imminent deadline or cancellation</p>
        </div>

        {/* HIGH */}
        <div
          onClick={() => setSelectedSeverity(selectedSeverity === 'HIGH' ? 'all' : 'HIGH')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedSeverity === 'HIGH'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold text-amber-800 uppercase tracking-wider text-[11px]">
              High Risk
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-amber-950">
              {riskScore.highCount}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">Critical Path Stalled</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Missing documents / SLA overdue</p>
        </div>

        {/* MEDIUM */}
        <div
          onClick={() => setSelectedSeverity(selectedSeverity === 'MEDIUM' ? 'all' : 'MEDIUM')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedSeverity === 'MEDIUM'
              ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-400'
              : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold text-blue-800 uppercase tracking-wider text-[11px]">
              Medium Risk
            </span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-blue-950">
              {riskScore.mediumCount}
            </span>
            <span className="text-[10px] text-blue-700 font-semibold">Procedural Lag</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Prerequisite sequence locks</p>
        </div>

        {/* LOW */}
        <div
          onClick={() => setSelectedSeverity(selectedSeverity === 'LOW' ? 'all' : 'LOW')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedSeverity === 'LOW'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Low Risk
            </span>
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-slate-800">
              {riskScore.lowCount}
            </span>
            <span className="text-[10px] text-slate-600 font-semibold">Advisory Only</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Early dossier preparations</p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. Filters & Category Tabs (The 6 Mandated Criteria) */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        {/* Category Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Statutory Detection Category</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Showing {filteredBottlenecks.length} of {detectedBottlenecks.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Bottlenecks ({detectedBottlenecks.length})
            </button>

            <button
              onClick={() => setSelectedCategory('missing_documents')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'missing_documents'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Missing Documents ({riskScore.categoryCounts.missing_documents})
            </button>

            <button
              onClick={() => setSelectedCategory('overdue_applications')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'overdue_applications'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Overdue Applications ({riskScore.categoryCounts.overdue_applications})
            </button>

            <button
              onClick={() => setSelectedCategory('unresolved_queries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'unresolved_queries'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Unresolved Queries ({riskScore.categoryCounts.unresolved_queries})
            </button>

            <button
              onClick={() => setSelectedCategory('blocked_dependencies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'blocked_dependencies'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              Blocked Dependencies ({riskScore.categoryCounts.blocked_dependencies})
            </button>

            <button
              onClick={() => setSelectedCategory('upcoming_deadlines')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'upcoming_deadlines'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200'
              }`}
            >
              Upcoming Deadlines ({riskScore.categoryCounts.upcoming_deadlines})
            </button>

            <button
              onClick={() => setSelectedCategory('document_inconsistencies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'document_inconsistencies'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              Document Inconsistencies ({riskScore.categoryCounts.document_inconsistencies})
            </button>
          </div>
        </div>

        {/* Search bar & Severity quick-filter */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search issue, approval, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
            <span className="text-slate-500 font-medium">Severity:</span>
            {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeverity(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  selectedSeverity === s
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. Rich Bottleneck Cards Grid */}
      {/* ---------------------------------------------------- */}
      {filteredBottlenecks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Bottlenecks Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No active compliance hurdles match your selected filter criteria. All statutory clearances under this selection are either satisfied or currently unblocked.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSeverity('all');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBottlenecks.map((b) => {
            const style = getSeverityStyle(b.severity);
            const sevNorm = normalizeSeverity(b.severity);

            return (
              <div
                key={b.id}
                className={`rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition-all hover:shadow-md ${style.card}`}
              >
                <div className="space-y-3.5">
                  {/* Card Header: Severity Badge, Category, Delay Impact */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border shadow-2xs ${style.badge}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-[10px] font-semibold bg-white/90 text-slate-700 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                        {getCategoryLabel(b.category)}
                      </span>
                    </div>

                    {b.impactOnCommercialDateDays > 0 && (
                      <span className="text-xs font-bold text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-200 font-mono shrink-0">
                        +{b.impactOnCommercialDateDays}d delay
                      </span>
                    )}
                  </div>

                  {/* Issue (Prominent Title & Description) */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Issue:
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {b.issue || b.title}
                    </h3>
                  </div>

                  {/* Affected Approval */}
                  <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Affected Approval:
                    </span>
                    <p className="font-bold text-slate-900 text-xs">
                      {b.affectedApproval || b.approvalTitle || b.approvalCode}
                    </p>
                  </div>

                  {/* Downstream Impact */}
                  <div className="bg-white/80 p-3 rounded-lg border border-slate-200/80 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Impact:</span>
                    </span>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      {b.downstreamImpact || b.description}
                    </p>
                  </div>

                  {/* Recommended Action */}
                  <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200/80 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-700" />
                      <span>Recommended action:</span>
                    </span>
                    <p className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                      {b.recommendedAction || b.suggestedAction || b.mitigationRecommendation}
                    </p>
                  </div>
                </div>

                {/* Card Footer with Action Routing */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    Code: <strong className="text-slate-800">{b.approvalCode}</strong>
                    {b.dueDate && ` • Due: ${b.dueDate}`}
                  </div>

                  <button
                    onClick={() => {
                      const target = approvals.find((a) => a.code === b.approvalCode);
                      if (target) setSelectedApproval(target);

                      if (b.routeTab) {
                        setActiveTab(b.routeTab as any);
                      } else if (b.category === 'missing_documents' || b.category === 'document_inconsistencies') {
                        setActiveTab('documents');
                      } else if (b.category === 'unresolved_queries' || b.category === 'overdue_applications') {
                        setActiveTab('tracker');
                      } else if (b.category === 'blocked_dependencies') {
                        setActiveTab('dependencies');
                      } else {
                        setActiveTab('approvals');
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${style.btn}`}
                  >
                    <span>Execute Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. Statutory Advisory Note & AI Guidance */}
      {/* ---------------------------------------------------- */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Statutory Single Window Legal Assurance Note</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Under State Single Window Clearance Acts, deemed approval provisions only activate once all queries are answered and required document formats are verified. Unresolved notices lead to automatic cancellation and filing fee forfeiture.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('assistant')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
        >
          <span>Ask AI Assistant for Resolution Script</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Transparent Risk Score Explanation Modal */}
      <RiskScoreExplanationModal
        isOpen={isExplanationModalOpen}
        onClose={() => setIsExplanationModalOpen(false)}
        riskScore={riskScore}
      />
    </div>
  );
};
