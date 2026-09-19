import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.js';
import { evaluateRoadmapGraph, EvaluatedGraphNode } from '../dependencies/roadmapTypes.js';
import { RoadmapDetailPanel } from '../dependencies/RoadmapDetailPanel.js';
import {
  Search,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Hourglass,
  Sparkles,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

export const ApprovalListView: React.FC = () => {
  const {
    approvals,
    dependencyEdges,
    documents,
    profile,
    runRuleEvaluation,
    isEvaluating,
  } = useApp();

  // Selected approval code for the right-side detail drawer
  const [selectedApprovalCode, setSelectedApprovalCode] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'pre_establishment' | 'pre_construction' | 'pre_operation'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'attention_required' | 'blocked' | 'not_started'>('all');
  const [planGeneratedToast, setPlanGeneratedToast] = useState(false);

  // Evaluate the entire roadmap graph to accurately determine statuses, blocked states, and prereqs
  const evaluatedNodes = useMemo(() => {
    return evaluateRoadmapGraph(approvals, dependencyEdges, documents);
  }, [approvals, dependencyEdges, documents]);

  // Map of code -> EvaluatedGraphNode for quick lookup
  const nodeMap = useMemo(() => {
    return new Map<string, EvaluatedGraphNode>(evaluatedNodes.map((n) => [n.approval.code, n]));
  }, [evaluatedNodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return evaluatedNodes.filter((node) => {
      const item = node.approval;

      // 1. Stage filter
      if (stageFilter !== 'all' && item.stage !== stageFilter) {
        return false;
      }

      // 2. Status filter based on visualStatus
      if (statusFilter !== 'all') {
        if (node.visualStatus !== statusFilter) {
          return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.name || item.title || '').toLowerCase().includes(q);
        const matchesCode = (item.code || '').toLowerCase().includes(q);
        const matchesAuth = (item.authority || item.issuingAuthority || '').toLowerCase().includes(q);
        const matchesWhy = (item.whyApplicable || item.applicabilityReason || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesAuth && !matchesWhy) {
          return false;
        }
      }

      return true;
    });
  }, [evaluatedNodes, stageFilter, statusFilter, searchQuery]);

  // Currently selected node for the drawer
  const selectedNode = selectedApprovalCode ? nodeMap.get(selectedApprovalCode) : null;

  const handleRunEvaluation = async () => {
    await runRuleEvaluation();
    setPlanGeneratedToast(true);
    setTimeout(() => setPlanGeneratedToast(false), 4000);
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'pre_establishment':
        return {
          label: 'Pre-Establishment',
          classes: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
      case 'pre_construction':
        return {
          label: 'Pre-Construction',
          classes: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'pre_operation':
        return {
          label: 'Pre-Operation',
          classes: 'bg-teal-50 text-teal-800 border-teal-200',
        };
      default:
        return {
          label: stage ? stage.replace(/_/g, ' ') : 'General',
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const getStatusBadge = (visualStatus: string) => {
    switch (visualStatus) {
      case 'completed':
        return {
          label: 'Completed',
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          classes: 'bg-blue-50 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          icon: Clock,
        };
      case 'attention_required':
        return {
          label: 'Attention Required',
          classes: 'bg-amber-50 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
        };
      case 'blocked':
        return {
          label: 'Blocked',
          classes: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200',
          dot: 'bg-rose-500',
          icon: Lock,
        };
      case 'not_started':
      default:
        return {
          label: 'Not Started',
          classes: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          icon: Hourglass,
        };
    }
  };

  const handleRowClick = (code: string) => {
    setSelectedApprovalCode(selectedApprovalCode === code ? null : code);
  };

  return (
    <div className="space-y-5">
      {/* Disclaimer Notice */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 text-amber-900 flex items-start gap-3 shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-amber-950 flex items-center gap-2">
            <span>Prototype Rule-Based Evaluation Engine</span>
            <span className="text-[10px] bg-amber-200/70 text-amber-800 px-1.5 py-0.2 rounded font-mono uppercase">
              Demonstration Mode
            </span>
          </div>
          <p className="text-amber-800 text-[11px] leading-relaxed">
            Statutory clearances, authorities, and dependencies generated from declared business parameters for{' '}
            <strong>{profile?.companyName || 'Industrial Enterprise'}</strong>. Click any approval row to inspect the full regulatory drawer.
          </p>
        </div>
      </div>

      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-base sm:text-lg text-slate-900">
              Approval Matrix
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
              {filteredNodes.length} of {approvals.length} Clearances
            </span>
            <span className="text-[11px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
              Summary First &rarr; Details on Click
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compact statutory register for {profile?.companyName || 'Enterprise'} ({profile?.city || 'Pune'}, {profile?.state || 'Maharashtra'}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {planGeneratedToast && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Plan Re-evaluated</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Re-run the rule evaluation engine"
          >
            {isEvaluating ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Evaluating Rules...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                <span>Generate Approval Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search approval name, authority, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Stage Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Stage:</span>
          </div>
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

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 ml-1">
            <span className="font-semibold text-slate-700">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="attention_required">Attention Required</option>
            <option value="blocked">Blocked</option>
            <option value="not_started">Not Started</option>
          </select>

          {(searchQuery || stageFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStageFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold underline px-1 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Compact Table on Left, Detail Drawer on Right (when selected) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Table Container */}
        <div className={selectedNode ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5">Approval Name</th>
                    <th className="py-3 px-3">Authority</th>
                    <th className="py-3 px-3">Stage</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Timeline</th>
                    <th className="py-3 px-3">Dependency</th>
                    <th className="py-3 px-3 text-right">View Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNodes.length > 0 ? (
                    filteredNodes.map((node) => {
                      const item = node.approval;
                      const isSelected = selectedApprovalCode === item.code;
                      const stageBadge = getStageBadge(item.stage);
                      const statusBadge = getStatusBadge(node.visualStatus);
                      const StatusIcon = statusBadge.icon;

                      // Dependency summary
                      const hasPrereqs = node.incompletePrereqs.length > 0 || node.clearedPrereqs.length > 0;
                      const primaryPrereq = node.incompletePrereqs[0] || node.clearedPrereqs[0];

                      return (
                        <tr
                          key={item.code}
                          onClick={() => handleRowClick(item.code)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-teal-50/70 border-l-4 border-l-teal-600 font-medium'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* 1. Approval Name */}
                          <td className="py-3 px-3.5 min-w-[180px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                {item.code}
                              </span>
                              {item.isCriticalPath && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200 uppercase">
                                  Critical
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-slate-900 leading-snug mt-0.5 text-xs">
                              {item.title || item.name}
                            </div>
                          </td>

                          {/* 2. Authority */}
                          <td className="py-3 px-3 text-slate-600 max-w-[160px]">
                            <div className="flex items-center gap-1 text-[11px] truncate">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item.issuingAuthority || item.authority}</span>
                            </div>
                          </td>

                          {/* 3. Stage */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${stageBadge.classes}`}>
                              {stageBadge.label}
                            </span>
                          </td>

                          {/* 4. Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.classes}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span>{statusBadge.label}</span>
                            </span>
                          </td>

                          {/* 5. Timeline */}
                          <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                            {item.demoProcessingTime || `${item.slaDays || 30}d SLA`}
                          </td>

                          {/* 6. Dependency */}
                          <td className="py-3 px-3 text-slate-600 max-w-[170px]">
                            {node.isBlocked ? (
                              <div className="flex items-center gap-1 text-[11px] text-rose-800 font-bold truncate">
                                <Lock className="w-3 h-3 text-rose-600 shrink-0" />
                                <span className="truncate">Blocked: {node.blockedByNames[0] || 'Prereq'}</span>
                              </div>
                            ) : hasPrereqs ? (
                              <div className="text-[11px] text-slate-600 truncate flex items-center gap-1">
                                <span className="truncate">Depends on: {primaryPrereq.name}</span>
                                {node.incompletePrereqs.length + node.clearedPrereqs.length > 1 && (
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-mono">
                                    +{node.incompletePrereqs.length + node.clearedPrereqs.length - 1}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">None (Entry)</span>
                            )}
                          </td>

                          {/* 7. View Details Button */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(item.code);
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-700 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800'
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isSelected ? 'Viewing' : 'View Details'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic text-xs">
                        No clearances matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>
                Showing <strong>{filteredNodes.length}</strong> clearances
              </span>
              <span className="text-[11px] text-slate-400">
                Click any row or &ldquo;View Details&rdquo; to open the comprehensive inspector drawer
              </span>
            </div>
          </div>
        </div>

        {/* Right-Side Detail Drawer */}
        {selectedNode && (
          <div className="lg:col-span-5 xl:col-span-4">
            <RoadmapDetailPanel
              node={selectedNode}
              onClose={() => setSelectedApprovalCode(null)}
              onSelectNodeByCode={(code) => setSelectedApprovalCode(code)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
