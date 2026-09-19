import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.js';
import { ApprovalItem } from '../../types/index.js';
import {
  ROADMAP_STAGES,
  RoadmapStageKey,
  evaluateRoadmapGraph,
  EvaluatedGraphNode,
  VisualGraphStatus,
} from './roadmapTypes.js';
import { RoadmapDetailPanel } from './RoadmapDetailPanel.js';
import {
  Network,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Hourglass,
  Layers,
  GitBranch,
  Sparkles,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Zap,
  Info,
  Check,
  Building2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const DependencyMapView: React.FC = () => {
  const { approvals, dependencyEdges, documents, updateApprovalStatus, setSelectedApproval, setActiveTab } =
    useApp();

  const [selectedNodeCode, setSelectedNodeCode] = useState<string>('SPCB_CTE');
  const [viewMode, setViewMode] = useState<'roadmap_flow' | 'graph_canvas'>('roadmap_flow');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [highlightParallelOnly, setHighlightParallelOnly] = useState<boolean>(false);
  const [highlightCriticalOnly, setHighlightCriticalOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Data-Driven Evaluation of all nodes
  const evaluatedNodes = useMemo(() => {
    return evaluateRoadmapGraph(approvals, dependencyEdges, documents);
  }, [approvals, dependencyEdges, documents]);

  const selectedNode = useMemo(() => {
    return (
      evaluatedNodes.find((n) => n.approval.code === selectedNodeCode) ||
      evaluatedNodes[0] ||
      null
    );
  }, [evaluatedNodes, selectedNodeCode]);

  // Status Metrics Calculation
  const metrics = useMemo(() => {
    const counts = {
      completed: 0,
      in_progress: 0,
      attention_required: 0,
      blocked: 0,
      not_started: 0,
      total: evaluatedNodes.length,
    };
    evaluatedNodes.forEach((n) => {
      counts[n.visualStatus]++;
    });
    return counts;
  }, [evaluatedNodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return evaluatedNodes.filter((node) => {
      if (statusFilter !== 'all' && node.visualStatus !== statusFilter) {
        return false;
      }
      if (highlightCriticalOnly && !node.approval.isCriticalPath) {
        return false;
      }
      if (highlightParallelOnly && !node.canRunParallel) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (node.approval.title || node.approval.name || '').toLowerCase().includes(q);
        const matchCode = node.approval.code.toLowerCase().includes(q);
        const matchAuth = (node.approval.authority || node.approval.issuingAuthority || '')
          .toLowerCase()
          .includes(q);
        if (!matchTitle && !matchCode && !matchAuth) return false;
      }
      return true;
    });
  }, [evaluatedNodes, statusFilter, highlightCriticalOnly, highlightParallelOnly, searchQuery]);

  // Group nodes by the 7 Roadmap Stages
  const stageGroupedNodes = useMemo(() => {
    return ROADMAP_STAGES.map((stage) => {
      const nodes = filteredNodes.filter((n) => n.stageKey === stage.key);
      return {
        stage,
        nodes,
        totalInStage: evaluatedNodes.filter((n) => n.stageKey === stage.key).length,
      };
    });
  }, [ROADMAP_STAGES, filteredNodes, evaluatedNodes]);

  // Styling helper for the 5 requested colors:
  // GREEN = Completed
  // BLUE = In Progress
  // YELLOW = Attention Required
  // RED = Blocked
  // GREY = Not Started
  const getNodeColorClasses = (status: VisualGraphStatus, isSelected: boolean) => {
    switch (status) {
      case 'completed': // GREEN
        return {
          container: isSelected
            ? 'bg-emerald-50/95 border-emerald-500 ring-2 ring-emerald-500 shadow-md'
            : 'bg-white border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/40 shadow-2xs',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          text: 'text-emerald-900',
        };
      case 'in_progress': // BLUE
        return {
          container: isSelected
            ? 'bg-blue-50/95 border-blue-500 ring-2 ring-blue-500 shadow-md'
            : 'bg-white border-blue-300 hover:border-blue-400 hover:bg-blue-50/40 shadow-2xs',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          icon: Clock,
          text: 'text-blue-900',
        };
      case 'attention_required': // YELLOW
        return {
          container: isSelected
            ? 'bg-amber-50/95 border-amber-500 ring-2 ring-amber-500 shadow-md'
            : 'bg-white border-amber-300 hover:border-amber-400 hover:bg-amber-50/40 shadow-2xs',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          text: 'text-amber-900',
        };
      case 'blocked': // RED
        return {
          container: isSelected
            ? 'bg-rose-50/95 border-rose-500 ring-2 ring-rose-500 shadow-md'
            : 'bg-white border-rose-300 hover:border-rose-400 hover:bg-rose-50/40 shadow-2xs',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          icon: Lock,
          text: 'text-rose-900',
        };
      case 'not_started': // GREY
      default:
        return {
          container: isSelected
            ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-500 shadow-md'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: Hourglass,
          text: 'text-slate-800',
        };
    }
  };

  // Quick Action: Simulate CTE approval to witness downstream unblocking
  const handleSimulateUnblockCTE = () => {
    updateApprovalStatus('SPCB_CTE', { status: 'approved' });
    setSelectedNodeCode('FACTORY_PLAN_APPROVAL');
  };

  const handleResetSimulation = () => {
    updateApprovalStatus('SPCB_CTE', { status: 'query_raised' });
    updateApprovalStatus('FIRE_NOC_PROVISIONAL', { status: 'documents_pending' });
    updateApprovalStatus('FACTORY_PLAN_APPROVAL', { status: 'not_started' });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shadow-2xs">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Approval Roadmap &amp; Interactive Dependency Graph
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual statutory progression mapping prerequisites, concurrent filings, and downstream blocked clearances.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Simulation Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSimulateUnblockCTE}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Demonstrate unblocking downstream factory and fire approvals by approving CTE"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate CTE Approval</span>
            </button>
            <button
              type="button"
              onClick={handleResetSimulation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
              title="Reset simulation back to initial scenario"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* 2. Mandatory Color Legend Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Color Coding:</span>
            </span>

            {/* GREEN = Completed */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                statusFilter === 'completed'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold ring-2 ring-emerald-300'
                  : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <span>GREEN = Completed</span>
              <span className="ml-1 font-mono text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">
                {metrics.completed}
              </span>
            </button>

            {/* BLUE = In Progress */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                statusFilter === 'in_progress'
                  ? 'bg-blue-100 text-blue-900 border-blue-400 font-bold ring-2 ring-blue-300'
                  : 'bg-blue-50/70 text-blue-800 border-blue-200 hover:bg-blue-100/70'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
              <span>BLUE = In Progress</span>
              <span className="ml-1 font-mono text-[10px] bg-blue-200/80 text-blue-900 px-1.5 py-0.2 rounded-full font-bold">
                {metrics.in_progress}
              </span>
            </button>

            {/* YELLOW = Attention Required */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'attention_required' ? 'all' : 'attention_required')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                statusFilter === 'attention_required'
                  ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold ring-2 ring-amber-300'
                  : 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100/70'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
              <span>YELLOW = Attention Required</span>
              <span className="ml-1 font-mono text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                {metrics.attention_required}
              </span>
            </button>

            {/* RED = Blocked */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                statusFilter === 'blocked'
                  ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold ring-2 ring-rose-300'
                  : 'bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100/70'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
              <span>RED = Blocked</span>
              <span className="ml-1 font-mono text-[10px] bg-rose-200/80 text-rose-900 px-1.5 py-0.2 rounded-full font-bold">
                {metrics.blocked}
              </span>
            </button>

            {/* GREY = Not Started */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'not_started' ? 'all' : 'not_started')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                statusFilter === 'not_started'
                  ? 'bg-slate-200 text-slate-900 border-slate-400 font-bold ring-2 ring-slate-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-200" />
              <span>GREY = Not Started</span>
              <span className="ml-1 font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
                {metrics.not_started}
              </span>
            </button>
          </div>

          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-[11px] text-teal-700 font-bold hover:underline cursor-pointer"
            >
              Reset Filter (Show All {metrics.total})
            </button>
          )}
        </div>

        {/* 3. Toolbar: View Mode, Search, Toggles */}
        <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('roadmap_flow')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'roadmap_flow'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-teal-600" />
              <span>Roadmap Pipeline Flow</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('graph_canvas')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'graph_canvas'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-indigo-600" />
              <span>Network Dependency Canvas</span>
            </button>
          </div>

          {/* Search & Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clearances..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-44"
              />
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={highlightParallelOnly}
                onChange={(e) => setHighlightParallelOnly(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Parallel Paths</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={highlightCriticalOnly}
                onChange={(e) => setHighlightCriticalOnly(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Critical Path</span>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Main Content Area: Left = Roadmap or Canvas, Right = Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Visual Graph Display (takes 7 or 8 columns on large screens) */}
        <div className={selectedNode ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'}>
          {viewMode === 'roadmap_flow' ? (
            /* ======================================================== */
            /* VIEW 1: ROADMAP PIPELINE FLOW (7 Stages with Down Arrows) */
            /* ======================================================== */
            <div className="space-y-4">
              {stageGroupedNodes.map(({ stage, nodes }, stageIndex) => {
                const isLast = stageIndex === stageGroupedNodes.length - 1;
                const hasNodes = nodes.length > 0;

                return (
                  <div key={stage.key} className="space-y-3">
                    {/* Stage Header Banner */}
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shadow-2xs">
                          0{stage.order}
                        </div>
                        <div>
                          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                            <span>{stage.label}</span>
                            <span className="text-[10px] font-normal text-slate-500 font-sans lowercase">
                              ({nodes.length} clearances)
                            </span>
                          </h2>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {stage.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <span>Stage {stage.order} of 7</span>
                      </div>
                    </div>

                    {/* Nodes in this stage (Allowing parallel layout side-by-side) */}
                    {hasNodes ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {nodes.map((node) => {
                          const isSelected = selectedNodeCode === node.approval.code;
                          const colorCfg = getNodeColorClasses(node.visualStatus, isSelected);
                          const StatusIcon = colorCfg.icon;

                          return (
                            <div
                              key={node.approval.code}
                              onClick={() => setSelectedNodeCode(node.approval.code)}
                              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${colorCfg.container}`}
                            >
                              {/* Top Bar: Code + Status Badge */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                    {node.approval.code}
                                  </span>
                                  {node.canRunParallel && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                                      Parallel Allowed
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorCfg.badge}`}
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  <span>{node.statusLabel}</span>
                                </div>
                              </div>

                              {/* Title & Authority */}
                              <h3 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                                {node.approval.title || node.approval.name}
                              </h3>
                              <p className="text-[10px] text-slate-500 mt-1 truncate">
                                {node.approval.authority || node.approval.issuingAuthority}
                              </p>

                              {/* Blocked or Attention Warning */}
                              {node.isBlocked ? (
                                <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[10px] space-y-0.5">
                                  <div className="flex items-center gap-1 font-bold text-rose-800">
                                    <Lock className="w-3 h-3 text-rose-600" />
                                    <span>Blocked by incomplete upstream:</span>
                                  </div>
                                  <p className="truncate text-rose-950 font-medium">
                                    {node.blockedByNames.join(', ')}
                                  </p>
                                </div>
                              ) : node.visualStatus === 'attention_required' ? (
                                <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] space-y-0.5">
                                  <div className="flex items-center gap-1 font-bold text-amber-800">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>Action required before filing / approval</span>
                                  </div>
                                </div>
                              ) : null}

                              {/* Bottom Footer: SLA + Dependencies info */}
                              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <span>{node.incompletePrereqs.length + node.clearedPrereqs.length} Prereq(s)</span>
                                  <span>&bull;</span>
                                  <span>{node.outgoingDependents.length} Downstream</span>
                                </span>
                                <span className="font-mono text-slate-500 font-semibold">
                                  {node.approval.slaDays || 30}d SLA
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-white text-center text-xs text-slate-400 italic">
                        No active clearances in this stage matching current filter.
                      </div>
                    )}

                    {/* Sequential Progression Down-Arrow */}
                    {!isLast && (
                      <div className="flex justify-center py-1">
                        <div className="w-7 h-7 rounded-full bg-slate-200/80 text-slate-600 flex items-center justify-center shadow-2xs border border-slate-300/80">
                          <ArrowDown className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ======================================================== */
            /* VIEW 2: INTERACTIVE NETWORK DEPENDENCY CANVAS            */
            /* ======================================================== */
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-indigo-600" />
                  <span>Statutory Node-Link Canvas (Topological Hierarchy)</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Showing {filteredNodes.length} nodes &bull; Click node to inspect details
                </span>
              </div>

              {/* Stage Progression Tier Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Tier 1: Pre-Establishment',
                    subtitle: 'Land, Environmental & Baseline Clearances',
                    keys: ['business_profile', 'project_land', 'environmental'] as RoadmapStageKey[],
                  },
                  {
                    title: 'Tier 2: Pre-Construction',
                    subtitle: 'Building Plans, Fire & Utility Connections',
                    keys: ['factory_operational', 'fire_safety', 'utility'] as RoadmapStageKey[],
                  },
                  {
                    title: 'Tier 3: Pre-Operation',
                    subtitle: 'Operating Consents, Form 4 & FSSAI',
                    keys: ['operational_compliance'] as RoadmapStageKey[],
                  },
                ].map((tier, idx) => {
                  const tierNodes = filteredNodes.filter((n) => tier.keys.includes(n.stageKey));

                  return (
                    <div
                      key={tier.title}
                      className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col space-y-3"
                    >
                      <div className="border-b border-slate-200 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                            {tier.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                            {tierNodes.length}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{tier.subtitle}</p>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {tierNodes.map((node) => {
                          const isSelected = selectedNodeCode === node.approval.code;
                          const colorCfg = getNodeColorClasses(node.visualStatus, isSelected);
                          const StatusIcon = colorCfg.icon;

                          return (
                            <div
                              key={node.approval.code}
                              onClick={() => setSelectedNodeCode(node.approval.code)}
                              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${colorCfg.container}`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] font-mono font-bold text-slate-600">
                                  {node.approval.code}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border flex items-center gap-0.5 ${colorCfg.badge}`}
                                >
                                  <StatusIcon className="w-2.5 h-2.5" />
                                  <span>{node.statusLabel}</span>
                                </span>
                              </div>

                              <h4 className="font-bold text-xs text-slate-900 leading-tight line-clamp-1">
                                {node.approval.title || node.approval.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {node.approval.authority || node.approval.issuingAuthority}
                              </p>

                              {node.isBlocked && (
                                <div className="mt-1.5 flex items-center gap-1 text-[9px] text-rose-700 font-bold">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Blocked by {node.blockedByCodes.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Comprehensive Detail Panel */}
        {selectedNode && (
          <div className="lg:col-span-5 xl:col-span-4">
            <RoadmapDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNodeCode('')}
              onSelectNodeByCode={(code) => setSelectedNodeCode(code)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
