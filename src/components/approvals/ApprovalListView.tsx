import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { ApprovalItem, ApprovalStage, ApprovalStatus } from '../../types/index.js';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  Search,
  Filter,
  ExternalLink,
  ChevronDown,
  FileText,
  Shield,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
  AlertTriangle,
  FileCheck2,
  GitBranch,
  Building2,
  Compass,
  Hourglass,
  Tag,
  Check,
} from 'lucide-react';

export const ApprovalListView: React.FC = () => {
  const {
    profile,
    approvals,
    updateApprovalStatus,
    generateApprovalPlan,
    isEvaluating,
    selectedApproval,
    setSelectedApproval,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [planGeneratedToast, setPlanGeneratedToast] = useState<boolean>(false);

  // Extract unique categories for filtering
  const categories = Array.from(new Set(approvals.map((a) => a.category || 'General Compliance'))).sort();

  const filteredApprovals = approvals.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (item.name || item.title || '').toLowerCase().includes(q) ||
      (item.authority || item.issuingAuthority || '').toLowerCase().includes(q) ||
      (item.whyApplicable || item.applicabilityReason || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q);

    const matchesStage = stageFilter === 'all' || item.stage === stageFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesRisk = riskFilter === 'all' || item.risk === riskFilter;

    return matchesSearch && matchesStage && matchesStatus && matchesCategory && matchesRisk;
  });

  const handleRunEvaluation = async () => {
    await generateApprovalPlan();
    setPlanGeneratedToast(true);
    setTimeout(() => setPlanGeneratedToast(false), 4000);
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
        };
      case 'in_review':
        return {
          label: 'In Review',
          classes: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Clock,
        };
      case 'query_raised':
        return {
          label: 'Query Raised',
          classes: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
          icon: AlertOctagon,
        };
      case 'documents_pending':
        return {
          label: 'Dossier Pending',
          classes: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock,
        };
      default:
        return {
          label: 'Not Started',
          classes: 'bg-slate-100 text-slate-600 border-slate-300',
          icon: Clock,
        };
    }
  };

  const getRiskBadge = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high':
        return {
          label: 'High Criticality',
          classes: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'medium':
        return {
          label: 'Medium Criticality',
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'low':
      default:
        return {
          label: 'Standard',
          classes: 'bg-slate-50 text-slate-600 border-slate-200',
        };
    }
  };

  const getStageLabel = (stage: ApprovalStage) => {
    switch (stage) {
      case 'pre_establishment':
        return 'Stage 1: Pre-Establishment';
      case 'pre_construction':
        return 'Stage 2: Pre-Construction';
      case 'pre_operation':
        return 'Stage 3: Pre-Operation';
      case 'post_operation':
        return 'Stage 4: Post-Operation';
    }
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Notice: Legal Prototype Engine */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 text-amber-900 flex items-start gap-3 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-amber-950 flex items-center gap-2">
            <span>Prototype Rule-Based Evaluation Engine</span>
            <span className="text-[10px] bg-amber-200/70 text-amber-800 px-1.5 py-0.5 rounded font-mono uppercase">
              Demonstration Mode
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            The clearances, authorities, and dependencies shown below are generated by evaluating the declared business parameters against modeled central and state industrial rules.
            <strong className="ml-1 text-amber-950">
              Important: These are prototype records and must NOT be presented as legally authoritative.
            </strong>
          </p>
        </div>
      </div>

      {/* Header & Plan Evaluation Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-teal-50 text-teal-700 border border-teal-200">
              <Compass className="w-4 h-4" />
            </span>
            <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <span>Approval Intelligence &amp; Clearance Matrix</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono font-bold">
                {approvals.length} Demonstration Records
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Automated statutory clearance roadmap synthesized for{' '}
            <span className="font-semibold text-slate-700">{profile?.companyName || 'Enterprise'}</span> (
            {profile?.industry || 'Manufacturing'} • {profile?.city || 'Pune'}, {profile?.state || 'Maharashtra'}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {planGeneratedToast && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Approval Plan Generated</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
            title="Re-run the rule-based prototype engine against current business profile"
          >
            {isEvaluating ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Evaluating Rules...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-teal-200" />
                <span>Generate Approval Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search approval name, authority, why applicable, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 cursor-pointer"
          >
            <option value="all">All Stages</option>
            <option value="pre_establishment">Stage 1: Pre-Establishment</option>
            <option value="pre_construction">Stage 2: Pre-Construction</option>
            <option value="pre_operation">Stage 3: Pre-Operation</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="in_review">In Review</option>
            <option value="query_raised">Query Raised</option>
            <option value="documents_pending">Dossier Pending</option>
            <option value="not_started">Not Started</option>
          </select>

          {/* Risk */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 cursor-pointer"
          >
            <option value="all">All Criticalities</option>
            <option value="high">High Criticality</option>
            <option value="medium">Medium Criticality</option>
            <option value="low">Standard</option>
          </select>

          {(searchQuery || stageFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || riskFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStageFilter('all');
                setStatusFilter('all');
                setCategoryFilter('all');
                setRiskFilter('all');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800 font-mono">{filteredApprovals.length}</strong> of {approvals.length} recommendations
        </span>
        <span className="text-[11px] text-slate-400">
          Click any card for complete documentation dossier and statutory SLA breakdown
        </span>
      </div>

      {/* Approvals List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredApprovals.map((item) => {
          const badge = getStatusBadge(item.status);
          const BadgeIcon = badge.icon;
          const riskBadge = getRiskBadge(item.risk || 'low');

          // Resolve dependency items to see their actual status
          const resolvedPrereqs = (item.dependencies || item.prerequisites || []).map((pCode) => {
            const prereq = approvals.find((a) => a.code === pCode);
            return {
              code: pCode,
              name: prereq?.name || prereq?.title || pCode,
              status: prereq?.status || 'not_started',
              isApproved: prereq?.status === 'approved',
            };
          });

          return (
            <div
              key={item.code}
              className={`bg-white rounded-xl border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
                item.status === 'query_raised'
                  ? 'border-rose-300 ring-1 ring-rose-300/60 bg-rose-50/10'
                  : item.status === 'approved'
                  ? 'border-emerald-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-3.5">
                {/* 1. Header: Stage Tag, Category, Status Badge, Risk */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {getStageLabel(item.stage)}
                    </span>
                    {item.category && (
                      <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{item.category}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${riskBadge.classes}`}>
                      {riskBadge.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.classes}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* 2. Approval Name & Authority */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {item.name || item.title}
                    </h3>
                    {item.isCriticalPath && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0 uppercase">
                        Critical Path
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>Authority:</span> {item.authority || item.issuingAuthority}
                    </span>
                  </div>
                </div>

                {/* 3. Why It May Apply */}
                <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-700 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    <Info className="w-3 h-3 text-slate-400" />
                    <span>Why It May Apply:</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-normal">
                    {item.whyApplicable || item.applicabilityReason}
                  </p>
                </div>

                {/* 4. Dependencies */}
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <GitBranch className="w-3 h-3 text-slate-400" />
                    <span>Prerequisites &amp; Dependencies:</span>
                  </div>
                  {resolvedPrereqs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {resolvedPrereqs.map((p) => (
                        <span
                          key={p.code}
                          className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-mono ${
                            p.isApproved
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                          title={`Status: ${p.status}`}
                        >
                          {p.isApproved ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                          )}
                          <span>{p.name}</span>
                          <span className="text-[9px] opacity-75">({p.isApproved ? 'Cleared' : 'Pending'})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      None (Base establishment clearance — ready to initiate)
                    </span>
                  )}
                </div>

                {/* 5. Required Documents */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>Required Documents ({item.requiredDocuments?.length || 0}):</span>
                    </span>
                    <span className="text-slate-400 font-normal">PDF / Drawings</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(item.requiredDocuments || []).map((doc) => (
                      <span
                        key={doc.id}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[220px]"
                        title={`${doc.name}: ${doc.description}`}
                      >
                        {doc.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 6. Active Query Banner (If Query Raised) */}
                {item.queryDetails && item.status === 'query_raised' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-900 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-rose-800 uppercase">
                      <span>Statutory Clarification Notice</span>
                      <span>Due by {item.queryDetails.deadlineDate}</span>
                    </div>
                    <p className="text-[11px] text-rose-800 italic">
                      "{item.queryDetails.queryText}"
                    </p>
                  </div>
                )}

                {/* 7. Next Action Callout */}
                <div className="bg-teal-50/50 rounded-lg p-2.5 border border-teal-100/80 text-xs text-teal-950 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-teal-800 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>Recommended Next Action:</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-900 leading-relaxed font-medium">
                    {item.nextAction || 'Prepare comprehensive technical submission dossier.'}
                  </p>
                </div>
              </div>

              {/* Card Footer: Processing Time (Demo SLA), Status Selector & Details */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-slate-600">
                    <Hourglass className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-tight">Demo SLA</span>
                      <span className="font-mono font-bold text-slate-800">
                        {item.demoProcessingTime || `${item.slaDays || 30} Working Days`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2">
                  {/* Status switcher for interactive simulation */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">Simulate:</span>
                    <select
                      value={item.status}
                      onChange={(e) => updateApprovalStatus(item.code, { status: e.target.value as ApprovalStatus })}
                      className="text-[11px] px-2 py-1 rounded border border-slate-200 bg-slate-50 font-medium text-slate-700 cursor-pointer hover:bg-white"
                      title="Update status to test downstream dependency unlocking"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="documents_pending">Dossier Pending</option>
                      <option value="in_review">In Review</option>
                      <option value="query_raised">Query Raised</option>
                      <option value="approved">Approved</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setSelectedApproval(item)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="View complete clearance dossier"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Approval Modal / Drawer */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                    {selectedApproval.code}
                  </span>
                  {selectedApproval.category && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-medium">
                      {selectedApproval.category}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {selectedApproval.name || selectedApproval.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedApproval.authority || selectedApproval.issuingAuthority} • {selectedApproval.legalBasis}
                </p>
              </div>
              <button
                onClick={() => setSelectedApproval(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Description &amp; Regulatory Purpose</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedApproval.description}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Why Applicable to Profile</h4>
                <p className="text-slate-700 leading-relaxed bg-teal-50/50 p-3 rounded-lg border border-teal-100/60">
                  {selectedApproval.whyApplicable || selectedApproval.applicabilityReason}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Prerequisite Dependencies</h4>
                {(selectedApproval.dependencies || selectedApproval.prerequisites || []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedApproval.dependencies || selectedApproval.prerequisites || []).map((p) => {
                      const prereq = approvals.find((a) => a.code === p);
                      return (
                        <span
                          key={p}
                          className={`px-2 py-1 rounded text-[11px] font-mono border flex items-center gap-1 ${
                            prereq?.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <span>{prereq?.name || p}</span>
                          <span className="text-[10px] font-sans">({prereq?.status || 'pending'})</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No prior clearances required (Base stage clearance).</p>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1.5">
                  Required Technical Dossier ({(selectedApproval.requiredDocuments || []).length} Mandatory Documents)
                </h4>
                <div className="space-y-2">
                  {(selectedApproval.requiredDocuments || []).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2.5 rounded-lg border border-slate-200 flex items-start justify-between gap-3 bg-white"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{doc.name}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{doc.description}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {doc.format}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Recommended Next Action</h4>
                <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/60 text-teal-900">
                  <p className="font-medium text-[11px]">
                    {selectedApproval.nextAction || 'Prepare comprehensive technical submission dossier.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setActiveTab('documents');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
              >
                <span>Upload Documents for this Clearance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSelectedApproval(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
