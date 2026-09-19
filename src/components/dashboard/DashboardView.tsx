import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  ApprovalItem,
  BottleneckAlert,
} from '../../types/index.js';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Bot,
  Layers,
  ChevronRight,
  HelpCircle,
  X,
  FileCheck2,
  Building2,
  FileText,
  AlertOctagon,
  ArrowLeftRight,
  Search,
  Upload,
  Award,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { RoadmapDetailPanel } from '../dependencies/RoadmapDetailPanel.js';
import { evaluateRoadmapGraph } from '../dependencies/roadmapTypes.js';
import { ProjectSwitcherModal } from '../common/ProjectSwitcherModal.js';
import { DocumentUploadModal } from '../documents/DocumentUploadModal.js';

export const DashboardView: React.FC = () => {
  const {
    profile,
    approvals,
    dependencyEdges,
    documents,
    alerts,
    setActiveTab,
    openCopilot,
  } = useApp();

  const [selectedDrawerCode, setSelectedDrawerCode] = useState<string | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState<boolean>(false);
  const [isSwitcherModalOpen, setIsSwitcherModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Filters for Approval Matrix
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Evaluated nodes for roadmap drawer
  const evaluatedNodes = useMemo(() => {
    return evaluateRoadmapGraph(approvals, dependencyEdges, documents);
  }, [approvals, dependencyEdges, documents]);

  const activeNode = useMemo(() => {
    if (!selectedDrawerCode) return null;
    return evaluatedNodes.find((n) => n.approval.code === selectedDrawerCode) || null;
  }, [selectedDrawerCode, evaluatedNodes]);

  if (!profile) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading industrial compliance dossier...</p>
      </div>
    );
  }

  // Calculate 5 core summary metrics
  const totalApprovals = approvals.length;
  const completedApprovals = approvals.filter((a) => a.status === 'approved').length;
  const inProgressApprovals = approvals.filter(
    (a) => a.status === 'in_review' || a.status === 'documents_pending'
  ).length;
  const attentionApprovals = approvals.filter((a) => a.status === 'query_raised').length;
  const blockedApprovals = approvals.filter(
    (a) => a.status === 'not_started' && a.prerequisites && a.prerequisites.length > 0
  ).length;

  // Calculate Overall Readiness Score (0 - 100%)
  const readinessScore = Math.min(
    100,
    Math.round(
      (completedApprovals * 35) / (totalApprovals || 1) +
        (inProgressApprovals * 15) / (totalApprovals || 1) +
        (documents.filter((d) => d.status === 'VERIFIED').length * 30) / (documents.length || 1) +
        (attentionApprovals === 0 ? 20 : 5)
    )
  );

  // Filtered approvals for the summary table
  const filteredApprovals = useMemo(() => {
    return approvals.filter((app) => {
      // Stage filter
      if (stageFilter !== 'all' && app.stage !== stageFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && app.status !== 'approved') return false;
        if (statusFilter === 'in_progress' && app.status !== 'in_review' && app.status !== 'documents_pending') return false;
        if (statusFilter === 'attention' && app.status !== 'query_raised') return false;
        if (statusFilter === 'blocked') {
          const isBlock = app.status === 'not_started' && app.prerequisites && app.prerequisites.length > 0;
          if (!isBlock) return false;
        }
        if (statusFilter === 'not_started' && app.status !== 'not_started') return false;
      }
      // Search query
      if (matrixSearch.trim()) {
        const q = matrixSearch.toLowerCase();
        const matches =
          app.name.toLowerCase().includes(q) ||
          app.code.toLowerCase().includes(q) ||
          app.issuingAuthority.toLowerCase().includes(q) ||
          app.stage.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [approvals, stageFilter, statusFilter, matrixSearch]);

  // Upcoming Statutory Deadlines
  const upcomingDeadlines = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      authority: string;
      dueDate: string;
      daysRemaining: number;
      type: 'query' | 'submission';
      urgency: 'critical' | 'normal';
      approvalCode: string;
    }> = [];

    // Check for active queries raised
    approvals.forEach((app) => {
      if (app.queryDetails?.deadlineDate) {
        list.push({
          id: `query_${app.code}`,
          title: `Clarification Notice: ${app.name}`,
          authority: app.issuingAuthority,
          dueDate: app.queryDetails.deadlineDate,
          daysRemaining: 9,
          type: 'query',
          urgency: 'critical',
          approvalCode: app.code,
        });
      }
    });

    // Add scheduled submission deadline
    list.push({
      id: 'sub_fire_provisional',
      title: 'Architectural Plan: Provisional Fire NOC',
      authority: 'MIDC Fire Directorate',
      dueDate: '2026-10-15',
      daysRemaining: 26,
      type: 'submission',
      urgency: 'normal',
      approvalCode: 'FIRE_NOC_PROVISIONAL',
    });

    return list;
  }, [approvals]);

  // Important Bottlenecks derived from active alerts
  const importantBottlenecks = useMemo(() => {
    if (alerts && alerts.length > 0) {
      return alerts.slice(0, 2);
    }
    return [
      {
        id: 'btl_water_balance',
        title: 'MPCB CTE Clarification Notice: Water Balance Calculation',
        description: 'Officer query regarding 65 KLD fresh intake vs boiler blowdown & cooling tower consumption.',
        severity: 'high' as const,
        impactOnCommercialDateDays: 21,
        approvalCode: 'SPCB_CTE',
        recommendedAction: 'Submit revised Water Balance calculation and ETP flow diagram.',
      },
    ];
  }, [alerts]);

  return (
    <div id="executive-dashboard-view" className="space-y-4">
      {/* ---------------------------------------------------- */}
      {/* 1. TOP ENTERPRISE BANNER: Company, Scale, Category, Switcher */}
      {/* ---------------------------------------------------- */}
      <div className="bg-slate-900 rounded-xl p-4 sm:p-5 text-white border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>Active Enterprise</span>
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold">
                {profile.cpcbCategory} Category &bull; {profile.projectStage.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                ₹{profile.investmentInrCrores} Cr Outlay &bull; {profile.workforceCount} Workers
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {profile.companyName}
              </h1>
              <span className="text-xs text-slate-400 font-mono">
                ({profile.sector.toUpperCase()} &bull; {profile.industrialArea || profile.district})
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                DEMO PROJECT
              </span>
            </div>

            <p className="text-xs text-slate-300 truncate max-w-2xl">
              Survey No. {profile.plotNumber || 'Plot A-42'}, {profile.industrialArea || 'Chakan MIDC'}, {profile.district}, {profile.state} &bull; Pin: {profile.pincode}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Switch Enterprise Button */}
            <button
              id="dashboard-switch-project-btn"
              onClick={() => setIsSwitcherModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Switch industrial project dossier"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-teal-400" />
              <span>Switch Project</span>
            </button>

            {/* Overall Readiness Score Trigger */}
            <button
              onClick={() => setIsScoreModalOpen(true)}
              className="flex items-center gap-1.5 bg-teal-900/60 hover:bg-teal-900 text-teal-200 border border-teal-700/60 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              title="View readiness calculation breakdown"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              <span>Readiness: <strong className="text-white font-mono">{readinessScore}%</strong></span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. CRITICAL ROADBLOCK / ATTENTION ALERT (If queries exist) */}
      {/* ---------------------------------------------------- */}
      {attentionApprovals > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-950">
                Immediate Action Required: Clarification Notice Received on Consent to Establish (CTE)
              </h3>
              <p className="text-[11px] text-amber-800 mt-0.5">
                MPCB Officer query regarding Water Balance and ETP intake. Response deadline in <strong>9 days</strong>. 2 downstream clearances (Factory Building Plan, Fire NOC) remain blocked until resolved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setActiveTab('tracker')}
              className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              Respond in Tracker &rarr;
            </button>
            <button
              onClick={() => openCopilot('Draft clarification reply for MPCB Consent to Establish water balance query')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-amber-700" />
              <span>Ask Copilot</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. MAIN KPI ROW: 5 Clean Status Metrics (Clickable Filters) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Approvals */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setStageFilter('all');
          }}
          className={`bg-white p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'all' && stageFilter === 'all'
              ? 'border-teal-500 ring-2 ring-teal-200'
              : 'border-slate-200 hover:border-slate-400'
          }`}
          title="Show all applicable statutory clearances"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Approvals</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900 font-mono">
            {totalApprovals}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 truncate">Statutory clearances</p>
        </div>

        {/* Completed */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`bg-white p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'completed'
              ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/20'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
          title="Filter by completed clearances"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-800 font-mono">
            {completedApprovals}
          </div>
          <p className="mt-0.5 text-[11px] text-emerald-700 truncate">Granted / Possessed</p>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          className={`bg-white p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'in_progress'
              ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/20'
              : 'border-slate-200 hover:border-blue-300'
          }`}
          title="Filter by in-progress scrutiny"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 text-2xl font-black text-blue-900 font-mono">
            {inProgressApprovals}
          </div>
          <p className="mt-0.5 text-[11px] text-blue-700 truncate">Under desk review</p>
        </div>

        {/* Attention Required */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'attention' ? 'all' : 'attention')}
          className={`bg-white p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'attention'
              ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/40'
              : 'border-amber-300 bg-amber-50/20 hover:border-amber-500'
          }`}
          title="Filter by approvals with clarification notices"
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold">
            <span>Attention Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-black text-amber-900 font-mono">
            {attentionApprovals}
          </div>
          <p className="mt-0.5 text-[11px] text-amber-800 font-medium truncate">
            {attentionApprovals > 0 ? 'Clarification query pending' : 'Zero queries'}
          </p>
        </div>

        {/* Blocked */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked')}
          className={`bg-white p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs col-span-2 sm:col-span-1 ${
            statusFilter === 'blocked'
              ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
              : 'border-slate-200 hover:border-rose-300'
          }`}
          title="Filter by clearances blocked by upstream prerequisites"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Blocked</span>
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1 text-2xl font-black text-slate-700 font-mono">
            {blockedApprovals}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 truncate">Prerequisites pending</p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. MAIN CONTENT AREA: Approval Matrix (Left) + Deadlines & Quick Actions (Right) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: Approval Matrix Table (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Table Header & Controls */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Applicable Clearances Matrix</span>
                    <span className="text-[11px] font-normal text-slate-500 font-mono">
                      ({filteredApprovals.length} of {approvals.length})
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Click any clearance row or <strong>[View Details]</strong> to inspect prerequisites and statutory requirements.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('dependencies')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Interactive Dependency Roadmap &rarr;</span>
                </button>
              </div>

              {/* Filters & Search Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    placeholder="Search clearance name, authority, code..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {matrixSearch && (
                    <button
                      onClick={() => setMatrixSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Stage Filter */}
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">All Stages</option>
                  <option value="pre_establishment">Pre-Establishment</option>
                  <option value="pre_construction">Pre-Construction</option>
                  <option value="pre_operation">Pre-Operation</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="attention">Attention Required</option>
                  <option value="blocked">Blocked</option>
                  <option value="not_started">Not Started</option>
                </select>

                {(stageFilter !== 'all' || statusFilter !== 'all' || matrixSearch) && (
                  <button
                    onClick={() => {
                      setStageFilter('all');
                      setStatusFilter('all');
                      setMatrixSearch('');
                    }}
                    className="text-[11px] text-teal-700 hover:underline font-semibold cursor-pointer px-1 py-1"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Clearance / Code</th>
                    <th className="px-3.5 py-2.5">Department</th>
                    <th className="px-3.5 py-2.5">Stage</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5">Est. Timeline</th>
                    <th className="px-3.5 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                        No clearances match your current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredApprovals.map((app) => {
                      const isQuery = app.status === 'query_raised';
                      const isApproved = app.status === 'approved';
                      const isInReview = app.status === 'in_review' || app.status === 'documents_pending';
                      const isBlocked = app.status === 'not_started' && app.prerequisites && app.prerequisites.length > 0;

                      return (
                        <tr
                          key={app.code}
                          className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                          onClick={() => setSelectedDrawerCode(app.code)}
                        >
                          <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              {app.isCriticalPath && (
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" title="Critical Path" />
                              )}
                              <span className="truncate max-w-[200px] sm:max-w-xs">{app.name}</span>
                            </div>
                            <div className="font-mono text-[10px] text-slate-400 font-normal">{app.code}</div>
                          </td>

                          <td className="px-3.5 py-2.5 text-slate-600 truncate max-w-[140px]">
                            {app.issuingAuthority}
                          </td>

                          <td className="px-3.5 py-2.5">
                            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                              {app.stage.replace('pre_', '').replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-3.5 py-2.5">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Completed</span>
                              </span>
                            ) : isQuery ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Attention</span>
                              </span>
                            ) : isBlocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                                <Lock className="w-3 h-3 text-rose-600" />
                                <span>Blocked</span>
                              </span>
                            ) : isInReview ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                <Clock className="w-3 h-3" />
                                <span>In Progress</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                <span>Not Started</span>
                              </span>
                            )}
                          </td>

                          <td className="px-3.5 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                            {app.daysElapsed !== undefined ? `${app.daysElapsed} / ${app.slaDays}d` : `${app.slaDays}d SLA`}
                          </td>

                          <td className="px-3.5 py-2.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerCode(app.code);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Operational Deadlines, Bottlenecks & Quick Actions (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-slate-900">Upcoming Deadlines</h3>
              </div>
              <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-bold">
                Time-Critical
              </span>
            </div>

            <div className="space-y-2">
              {upcomingDeadlines.map((dl) => (
                <div
                  key={dl.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    dl.urgency === 'critical' ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate text-[11px]">{dl.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{dl.authority}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-rose-700 text-[11px] block">{dl.dueDate}</span>
                    <button
                      onClick={() => setActiveTab('tracker')}
                      className="text-[10px] text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      Act ({dl.daysRemaining}d left)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Bottlenecks */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
              <div className="flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900">Active Roadblocks &amp; Risks</h3>
              </div>
              <button
                onClick={() => setActiveTab('risks')}
                className="text-[10px] text-teal-700 font-bold hover:underline cursor-pointer"
              >
                Inspect All &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {importantBottlenecks.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 text-[11px] truncate">
                      {b.title}
                    </span>
                    {b.impactOnCommercialDateDays && (
                      <span className="text-[10px] font-mono font-bold text-rose-700 shrink-0">
                        +{b.impactOnCommercialDateDays}d delay
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 line-clamp-1">{b.recommendedAction}</p>
                  <div className="pt-0.5 text-right">
                    <button
                      onClick={() => setActiveTab('tracker')}
                      className="text-[10px] font-bold text-teal-800 hover:underline cursor-pointer"
                    >
                      Resolve in Tracker &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions (Functional Enterprise Triggers) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
              Operations Quick Actions
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {/* 1. View Pending Tasks */}
              <button
                id="quick-action-pending-tasks"
                onClick={() => setActiveTab('tracker')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 text-xs font-semibold transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <span>Review Pending Department Tasks</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* 2. Upload Document */}
              <button
                id="quick-action-upload-doc"
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 text-xs font-semibold transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  <span>Upload Compliance Document</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* 3. Ask INDUSFLOW AI */}
              <button
                id="quick-action-ask-copilot"
                onClick={() => openCopilot('What should I do next?')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all cursor-pointer text-left group shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span>Ask Regulatory Decision Copilot</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-teal-200 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 4. Explore Government Schemes */}
              <button
                id="quick-action-explore-schemes"
                onClick={() => setActiveTab('schemes')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 text-xs font-semibold transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <span>Explore State &amp; Central Subsidies</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5. RIGHT-SIDE DETAIL DRAWER (When user clicks "View Details" on any approval) */}
      {/* ---------------------------------------------------- */}
      {activeNode && (
        <div
          id="approval-detail-drawer-overlay"
          className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setSelectedDrawerCode(null)}
          />

          {/* Right-Side Drawer Container */}
          <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-10 border-l border-slate-200 animate-slideLeft">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Statutory Clearance Specifications</span>
              </span>
              <button
                onClick={() => setSelectedDrawerCode(null)}
                className="p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <RoadmapDetailPanel
                node={activeNode}
                onClose={() => setSelectedDrawerCode(null)}
                onSelectNodeByCode={(code) => setSelectedDrawerCode(code)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Full Project Switcher Modal */}
      <ProjectSwitcherModal
        isOpen={isSwitcherModalOpen}
        onClose={() => setIsSwitcherModalOpen(false)}
      />

      {/* Document Upload Modal */}
      {isUploadModalOpen && (
        <DocumentUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          initialApprovalCode={approvals[0]?.code}
        />
      )}

      {/* Readiness Score Breakdown Modal */}
      {isScoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Commercial Readiness Score Calculation
                </h3>
              </div>
              <button
                onClick={() => setIsScoreModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-4xl font-black text-slate-900 font-mono">{readinessScore}%</span>
              <p className="text-xs text-slate-500 mt-0.5">Weighted Industrial Establishment Readiness</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <span className="text-slate-700">Completed Clearances (35% Weight)</span>
                <span className="font-bold text-emerald-800 font-mono">
                  {completedApprovals} / {totalApprovals} ({Math.round((completedApprovals * 35) / (totalApprovals || 1))} pts)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 border border-blue-200">
                <span className="text-slate-700">In-Progress Scrutiny (15% Weight)</span>
                <span className="font-bold text-blue-800 font-mono">
                  {inProgressApprovals} / {totalApprovals} ({Math.round((inProgressApprovals * 15) / (totalApprovals || 1))} pts)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50/60 border border-teal-200">
                <span className="text-slate-700">Pre-Validated Documents (30% Weight)</span>
                <span className="font-bold text-teal-800 font-mono">
                  {documents.filter((d) => d.status === 'VERIFIED').length} / {documents.length} verified
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200">
                <span className="text-slate-700">Clean SLA / Query Penalty (20% Weight)</span>
                <span className="font-bold text-amber-900 font-mono">
                  {attentionApprovals === 0 ? '+20 pts (Clean)' : '+5 pts (Query active)'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsScoreModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
