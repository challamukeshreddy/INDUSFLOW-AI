import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  evaluateRoadmapGraph,
  ROADMAP_STAGES,
  EvaluatedGraphNode,
  VisualGraphStatus,
  RoadmapStageKey,
} from './roadmapTypes.js';
import { RoadmapDetailPanel } from './RoadmapDetailPanel.js';
import {
  Network,
  GitBranch,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Hourglass,
  ArrowRight,
  ArrowDown,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const DependencyMapView: React.FC = () => {
  const {
    approvals,
    dependencyEdges,
    documents,
    profile,
    updateApprovalStatus,
  } = useApp();

  // Active view: 'dependency_graph' (A -> B DAG Canvas) or 'roadmap_flow' (Sequential Stage Pipeline)
  const [viewMode, setViewMode] = useState<'dependency_graph' | 'roadmap_flow'>('dependency_graph');

  // Selected node code for detail drawer
  const [selectedNodeCode, setSelectedNodeCode] = useState<string | null>('MPCB_CTE');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'pre_establishment' | 'pre_construction' | 'pre_operation'>('all');
  const [statusFilter, setStatusFilter] = useState<VisualGraphStatus | 'all'>('all');
  const [highlightCriticalOnly, setHighlightCriticalOnly] = useState(false);
  const [highlightParallelOnly, setHighlightParallelOnly] = useState(false);

  // Evaluated nodes using the central roadmap evaluation engine
  const evaluatedNodes = useMemo(() => {
    return evaluateRoadmapGraph(approvals, dependencyEdges, documents);
  }, [approvals, dependencyEdges, documents]);

  // Map of code -> EvaluatedGraphNode for O(1) lookups
  const nodeMap = useMemo(() => {
    return new Map<string, EvaluatedGraphNode>(evaluatedNodes.map((n) => [n.approval.code, n]));
  }, [evaluatedNodes]);

  // Selected node object
  const selectedNode = selectedNodeCode ? nodeMap.get(selectedNodeCode) : null;

  // Compute status metric counts for the legend
  const metrics = useMemo(() => {
    const total = evaluatedNodes.length;
    let completed = 0;
    let in_progress = 0;
    let attention = 0;
    let blocked = 0;
    let not_started = 0;

    evaluatedNodes.forEach((n) => {
      switch (n.visualStatus) {
        case 'completed':
          completed++;
          break;
        case 'in_progress':
          in_progress++;
          break;
        case 'attention_required':
          attention++;
          break;
        case 'blocked':
          blocked++;
          break;
        case 'not_started':
        default:
          not_started++;
          break;
      }
    });

    return { total, completed, in_progress, attention, blocked, not_started };
  }, [evaluatedNodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return evaluatedNodes.filter((node) => {
      const item = node.approval;

      // 1. Stage filter
      if (stageFilter !== 'all' && item.stage !== stageFilter) {
        return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all' && node.visualStatus !== statusFilter) {
        return false;
      }

      // 3. Critical path toggle
      if (highlightCriticalOnly && !item.isCriticalPath) {
        return false;
      }

      // 4. Parallel paths toggle
      if (highlightParallelOnly && !node.canRunParallel) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.name || item.title || '').toLowerCase().includes(q);
        const matchesCode = (item.code || '').toLowerCase().includes(q);
        const matchesAuth = (item.authority || item.issuingAuthority || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesAuth) {
          return false;
        }
      }

      return true;
    });
  }, [
    evaluatedNodes,
    stageFilter,
    statusFilter,
    highlightCriticalOnly,
    highlightParallelOnly,
    searchQuery,
  ]);

  // Group nodes by the 7 roadmap stages for Roadmap View
  const stageGroupedNodes = useMemo(() => {
    return ROADMAP_STAGES.map((stage) => {
      const stageNodes = filteredNodes.filter((n) => n.stageKey === stage.key);
      return { stage, nodes: stageNodes };
    });
  }, [filteredNodes]);

  // Group nodes by 3 statutory tiers for Dependency Graph Canvas
  const tierGroupedNodes = useMemo(() => {
    return [
      {
        id: 'tier_1',
        title: 'Stage 1: Pre-Establishment',
        subtitle: 'Land, Baseline Identity & Environmental CTE',
        stageValue: 'pre_establishment',
        nodes: filteredNodes.filter((n) => n.approval.stage === 'pre_establishment'),
      },
      {
        id: 'tier_2',
        title: 'Stage 2: Pre-Construction',
        subtitle: 'Factory Layout, Provisional Fire NOC & Utilities',
        stageValue: 'pre_construction',
        nodes: filteredNodes.filter((n) => n.approval.stage === 'pre_construction'),
      },
      {
        id: 'tier_3',
        title: 'Stage 3: Pre-Operation',
        subtitle: 'Operating Consents, Final Fire & Factory License',
        stageValue: 'pre_operation',
        nodes: filteredNodes.filter((n) => n.approval.stage === 'pre_operation'),
      },
    ];
  }, [filteredNodes]);

  // Helpers for styling nodes based on status
  const getNodeStyle = (status: VisualGraphStatus, isSelected: boolean) => {
    switch (status) {
      case 'completed':
        return {
          container: isSelected
            ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400 shadow-sm'
            : 'bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'Completed',
        };
      case 'in_progress':
        return {
          container: isSelected
            ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400 shadow-sm'
            : 'bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50/30',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          icon: Clock,
          label: 'In Progress',
        };
      case 'attention_required':
        return {
          container: isSelected
            ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-400 shadow-sm'
            : 'bg-white border-amber-300 hover:border-amber-400 hover:bg-amber-50/30',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'Attention Required',
        };
      case 'blocked':
        return {
          container: isSelected
            ? 'bg-rose-50/90 border-rose-500 ring-2 ring-rose-400 shadow-sm'
            : 'bg-white border-rose-300 hover:border-rose-400 hover:bg-rose-50/30',
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          dot: 'bg-rose-500',
          icon: Lock,
          label: 'Blocked',
        };
      case 'not_started':
      default:
        return {
          container: isSelected
            ? 'bg-slate-50 border-slate-600 ring-2 ring-slate-400 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50',
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          icon: Hourglass,
          label: 'Not Started',
        };
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'pre_establishment':
        return 'Pre-Establishment';
      case 'pre_construction':
        return 'Pre-Construction';
      case 'pre_operation':
        return 'Pre-Operation';
      default:
        return stage ? stage.replace(/_/g, ' ') : 'General';
    }
  };

  // Quick simulation helper
  const handleSimulateCte = () => {
    updateApprovalStatus('MPCB_CTE', { status: 'approved' });
  };

  const handleResetSimulation = () => {
    updateApprovalStatus('MPCB_CTE', { status: 'query_raised' });
    updateApprovalStatus('FACTORY_PLAN', { status: 'not_started' });
    updateApprovalStatus('FIRE_PROVISIONAL', { status: 'not_started' });
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-base sm:text-lg text-slate-900">
              Dependency Graph &amp; Approval Roadmap
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
              {filteredNodes.length} Clearances
            </span>
            <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
              A &rarr; B Directed Flow (B depends on A)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualizing statutory precedence constraints for {profile?.companyName || 'Industrial Enterprise'}. If clearance A is blocked or pending, dependent clearance B is locked.
          </p>
        </div>

        {/* Quick Simulation Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSimulateCte}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all cursor-pointer"
            title="Simulate clearance of MPCB CTE to watch downstream Factory, Fire, and Power unblock!"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Simulate CTE Approval</span>
          </button>

          <button
            type="button"
            onClick={handleResetSimulation}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            title="Reset CTE to Query Raised to see downstream clearances become blocked again"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* 2. Simple Legend Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mr-1">
            Status Legend:
          </span>

          {/* Completed */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
              statusFilter === 'completed'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold ring-2 ring-emerald-300'
                : 'bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Completed</span>
            <span className="ml-1 font-mono text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">
              {metrics.completed}
            </span>
          </button>

          {/* In Progress */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
              statusFilter === 'in_progress'
                ? 'bg-blue-100 text-blue-900 border-blue-400 font-bold ring-2 ring-blue-300'
                : 'bg-blue-50/60 text-blue-800 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>In Progress</span>
            <span className="ml-1 font-mono text-[10px] bg-blue-200/80 text-blue-900 px-1.5 py-0.2 rounded-full font-bold">
              {metrics.in_progress}
            </span>
          </button>

          {/* Attention */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'attention_required' ? 'all' : 'attention_required')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
              statusFilter === 'attention_required'
                ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold ring-2 ring-amber-300'
                : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Attention</span>
            <span className="ml-1 font-mono text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
              {metrics.attention}
            </span>
          </button>

          {/* Blocked */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
              statusFilter === 'blocked'
                ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold ring-2 ring-rose-300'
                : 'bg-rose-50/60 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Blocked</span>
            <span className="ml-1 font-mono text-[10px] bg-rose-200/80 text-rose-900 px-1.5 py-0.2 rounded-full font-bold">
              {metrics.blocked}
            </span>
          </button>

          {/* Not Started */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'not_started' ? 'all' : 'not_started')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
              statusFilter === 'not_started'
                ? 'bg-slate-200 text-slate-900 border-slate-400 font-bold ring-2 ring-slate-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>Not Started</span>
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

      {/* 3. Toolbar: View Mode, Filters, Toggles */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* View Mode Toggle: Dependency Graph vs Roadmap */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('dependency_graph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'dependency_graph'
                ? 'bg-white text-indigo-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dependency Graph (A &rarr; B)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('roadmap_flow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'roadmap_flow'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-teal-600" />
            <span>Roadmap Pipeline Flow</span>
          </button>
        </div>

        {/* Search, Stage Filter & Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clearances..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-36 sm:w-44"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 cursor-pointer font-medium"
          >
            <option value="all">All Stages</option>
            <option value="pre_establishment">Pre-Establishment</option>
            <option value="pre_construction">Pre-Construction</option>
            <option value="pre_operation">Pre-Operation</option>
          </select>

          {/* Critical Path Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={highlightCriticalOnly}
              onChange={(e) => setHighlightCriticalOnly(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="font-semibold">Critical Path</span>
          </label>

          {/* Parallel Paths Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={highlightParallelOnly}
              onChange={(e) => setHighlightParallelOnly(e.target.checked)}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="font-semibold">Parallel Paths</span>
          </label>
        </div>
      </div>

      {/* 4. Main Graph & Drawer Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Graph Visualization Canvas */}
        <div className={selectedNode ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'}>
          {viewMode === 'dependency_graph' ? (
            /* ======================================================== */
            /* VIEW 1: DEPENDENCY GRAPH (A -> B DAG Flow Canvas)        */
            /* ======================================================== */
            <div className="space-y-4">
              {/* Visual Dependency Flow Banner */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-950">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Rule: A &rarr; B (B depends on A).</strong> Upstream clearance A must be approved before downstream clearance B can proceed.
                  </span>
                </div>
                {selectedNode && (
                  <span className="text-[11px] font-semibold bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800 shrink-0">
                    Inspecting: {selectedNode.approval.code}
                  </span>
                )}
              </div>

              {/* Tier Columns with Directed Connectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tierGroupedNodes.map((tier, tierIdx) => {
                  return (
                    <div
                      key={tier.id}
                      className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 flex flex-col space-y-3"
                    >
                      {/* Tier Header */}
                      <div className="border-b border-slate-200 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                            {tier.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-600">
                            {tier.nodes.length}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{tier.subtitle}</p>
                      </div>

                      {/* Nodes in this Tier */}
                      <div className="space-y-2.5 flex-1">
                        {tier.nodes.length > 0 ? (
                          tier.nodes.map((node) => {
                            const item = node.approval;
                            const isSelected = selectedNodeCode === item.code;
                            const style = getNodeStyle(node.visualStatus, isSelected);
                            const StatusIcon = style.icon;

                            // Direct prerequisites (A) and downstream dependents (B)
                            const prereqCount = node.incompletePrereqs.length + node.clearedPrereqs.length;
                            const dependentCount = node.outgoingDependents.length;

                            return (
                              <div
                                key={item.code}
                                onClick={() => setSelectedNodeCode(item.code)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${style.container}`}
                              >
                                {/* Top Row: Stage & Status Pill */}
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                    {getStageLabel(item.stage)}
                                  </span>

                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${style.badge}`}
                                  >
                                    <StatusIcon className="w-2.5 h-2.5" />
                                    <span>{style.label}</span>
                                  </span>
                                </div>

                                {/* Node Body: Approval Name & Authority (NO large text) */}
                                <h3 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                                  {item.title || item.name}
                                </h3>

                                <p className="text-[10px] text-slate-500 mt-1 truncate flex items-center gap-1">
                                  <span>{item.issuingAuthority || item.authority}</span>
                                </p>

                                {/* Blocked Indicator if A is blocked */}
                                {node.isBlocked && (
                                  <div className="mt-2 p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[10px] flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-rose-600 shrink-0" />
                                    <span className="truncate font-semibold">
                                      Blocked by: {node.blockedByNames[0] || 'Upstream'}
                                    </span>
                                  </div>
                                )}

                                {/* Dependency Relationship Line: A -> B indication */}
                                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                                  <span>
                                    {prereqCount > 0 ? `Depends on ${prereqCount}` : 'Entry Level'}
                                  </span>
                                  <span className="flex items-center gap-0.5 font-bold text-indigo-700">
                                    <span>Unlocks {dependentCount}</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 italic">
                            No clearances in this tier.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Chain Detail for Selected Node */}
              {selectedNode && (
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-indigo-600" />
                      <span>Direct Dependency Chain for &ldquo;{selectedNode.approval.title || selectedNode.approval.name}&rdquo;</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Code: {selectedNode.approval.code}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Incoming Upstream: A -> SelectedNode */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-800 flex items-center justify-between text-xs">
                        <span>Upstream Prerequisites (A &rarr; {selectedNode.approval.code})</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {selectedNode.incompletePrereqs.length + selectedNode.clearedPrereqs.length} Required
                        </span>
                      </div>

                      {selectedNode.incompletePrereqs.length === 0 && selectedNode.clearedPrereqs.length === 0 ? (
                        <p className="text-slate-500 text-[11px] italic">
                          None. This clearance has no upstream dependencies and can be initiated immediately.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {selectedNode.clearedPrereqs.map((p) => (
                            <div
                              key={p.code}
                              onClick={() => setSelectedNodeCode(p.code)}
                              className="p-2 rounded bg-white border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-400 shadow-2xs"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-semibold truncate">{p.name}</span>
                              </div>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                Approved &rarr; Unlocked
                              </span>
                            </div>
                          ))}
                          {selectedNode.incompletePrereqs.map((p) => (
                            <div
                              key={p.code}
                              onClick={() => setSelectedNodeCode(p.code)}
                              className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-950 flex items-center justify-between text-xs cursor-pointer hover:border-rose-400 shadow-2xs"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span className="font-bold truncate">{p.name}</span>
                              </div>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 shrink-0">
                                Pending &rarr; Blocks This
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Outgoing Downstream: SelectedNode -> B */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-800 flex items-center justify-between text-xs">
                        <span>Downstream Clearances ({selectedNode.approval.code} &rarr; B)</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {selectedNode.outgoingDependents.length} Unlocked
                        </span>
                      </div>

                      {selectedNode.outgoingDependents.length === 0 ? (
                        <p className="text-slate-500 text-[11px] italic">
                          None. This is a terminal operational compliance clearance.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {selectedNode.outgoingDependents.map((dep) => (
                            <div
                              key={dep.code}
                              onClick={() => setSelectedNodeCode(dep.code)}
                              className={`p-2 rounded border flex items-center justify-between text-xs cursor-pointer transition-all shadow-2xs ${
                                dep.isLockedByThis
                                  ? 'bg-amber-50 border-amber-200 text-amber-950 hover:border-amber-400'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-medium truncate">{dep.name}</span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                  dep.isLockedByThis
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {dep.isLockedByThis ? 'Affected / Blocked' : 'Unlocked'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* VIEW 2: ROADMAP PIPELINE FLOW (7 Stages with Down Arrows) */
            /* ======================================================== */
            <div className="space-y-4">
              {stageGroupedNodes.map(({ stage, nodes }, stageIndex) => {
                const isLast = stageIndex === stageGroupedNodes.length - 1;
                const hasNodes = nodes.length > 0;

                return (
                  <div key={stage.key} className="space-y-3">
                    {/* Stage Header */}
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shadow-2xs">
                          0{stage.order}
                        </div>
                        <div>
                          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                            <span>{stage.label}</span>
                            <span className="text-[10px] font-normal text-slate-500 lowercase">
                              ({nodes.length} clearances)
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {stage.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium shrink-0">
                        <span>Stage {stage.order} of 7</span>
                      </div>
                    </div>

                    {/* Nodes in this stage */}
                    {hasNodes ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {nodes.map((node) => {
                          const item = node.approval;
                          const isSelected = selectedNodeCode === item.code;
                          const style = getNodeStyle(node.visualStatus, isSelected);
                          const StatusIcon = style.icon;

                          return (
                            <div
                              key={item.code}
                              onClick={() => setSelectedNodeCode(item.code)}
                              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${style.container}`}
                            >
                              {/* Top Bar: Stage & Status Badge */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                    {getStageLabel(item.stage)}
                                  </span>
                                  {node.canRunParallel && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                                      Parallel Allowed
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.badge}`}
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  <span>{style.label}</span>
                                </div>
                              </div>

                              {/* Approval Name & Authority */}
                              <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                                {item.title || item.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-1 truncate">
                                {item.issuingAuthority || item.authority}
                              </p>

                              {/* Blocked Warning */}
                              {node.isBlocked && (
                                <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[10px] space-y-0.5">
                                  <div className="flex items-center gap-1 font-bold text-rose-800">
                                    <Lock className="w-3 h-3 text-rose-600 shrink-0" />
                                    <span>Blocked by upstream:</span>
                                  </div>
                                  <p className="truncate text-rose-950 font-medium">
                                    {node.blockedByNames.join(', ')}
                                  </p>
                                </div>
                              )}

                              {/* Footer: Dependencies info */}
                              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                <span>
                                  {node.incompletePrereqs.length + node.clearedPrereqs.length} Prereq(s) &bull; {node.outgoingDependents.length} Downstream
                                </span>
                                <span className="font-mono text-slate-600 font-semibold">
                                  {item.slaDays || 30}d SLA
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
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shadow-2xs border border-slate-300">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Detail Drawer */}
        {selectedNode && (
          <div className="lg:col-span-5 xl:col-span-4">
            <RoadmapDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNodeCode(null)}
              onSelectNodeByCode={(code) => setSelectedNodeCode(code)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
