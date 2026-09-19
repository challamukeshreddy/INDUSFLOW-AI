import React from 'react';
import { EvaluatedGraphNode } from './roadmapTypes.js';
import { useApp } from '../../context/AppContext.js';
import {
  X,
  Building2,
  FileText,
  GitBranch,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  ArrowRight,
  ExternalLink,
  Hourglass,
  Layers,
  Upload,
  Check,
  AlertOctagon,
  Calendar,
  Compass,
  FileCheck,
  Globe,
  Hash,
  CreditCard,
} from 'lucide-react';

interface RoadmapDetailPanelProps {
  node: EvaluatedGraphNode;
  onClose: () => void;
  onSelectNodeByCode: (code: string) => void;
}

export const RoadmapDetailPanel: React.FC<RoadmapDetailPanelProps> = ({
  node,
  onClose,
  onSelectNodeByCode,
}) => {
  const { updateApprovalStatus, setActiveTab } = useApp();
  const { approval, stageMeta, visualStatus, isBlocked } = node;

  const getStatusBadgeConfig = () => {
    switch (visualStatus) {
      case 'completed':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'Completed',
          subtext: 'Statutory clearance granted and operationalized.',
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          icon: Clock,
          label: 'In Progress',
          subtext: `Under scrutiny by department (Day ${approval.daysElapsed || 10} of ${approval.slaDays || 30} SLA).`,
        };
      case 'attention_required':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'Attention Required',
          subtext:
            approval.status === 'query_raised'
              ? 'Statutory query or clarification notice pending response.'
              : 'Mandatory technical submission dossier pending upload.',
        };
      case 'blocked':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200',
          dot: 'bg-rose-500',
          icon: Lock,
          label: 'Blocked',
          subtext: 'Cannot proceed until upstream prerequisite clearances are granted.',
        };
      case 'not_started':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          icon: Hourglass,
          label: 'Not Started',
          subtext: 'All upstream prerequisites cleared. Ready to initiate filing.',
        };
    }
  };

  const badgeConfig = getStatusBadgeConfig();
  const StatusIcon = badgeConfig.icon;

  const getStageDisplay = () => {
    switch (approval.stage) {
      case 'pre_establishment':
        return 'Pre-Establishment';
      case 'pre_construction':
        return 'Pre-Construction';
      case 'pre_operation':
        return 'Pre-Operation';
      default:
        return approval.stage ? approval.stage.replace(/_/g, ' ') : 'General Establishment';
    }
  };

  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[88vh] sticky top-20 z-20">
      {/* 1. Header with Close Button */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                {approval.code}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {getStageDisplay()}
              </span>
              {node.canRunParallel && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  Parallel Track
                </span>
              )}
            </div>

            <h3 className="font-bold text-base text-slate-900 leading-snug pt-1">
              {approval.title || approval.name}
            </h3>

            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-800">
                {approval.issuingAuthority || approval.authority}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-all cursor-pointer shrink-0"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout Banner */}
        <div className={`mt-3 p-3 rounded-xl border flex items-start gap-2.5 ${badgeConfig.bg}`}>
          <StatusIcon className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold flex items-center gap-1.5">
              <span>Status: {badgeConfig.label}</span>
              <span className={`w-2 h-2 rounded-full ${badgeConfig.dot}`} />
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">{badgeConfig.subtext}</p>
          </div>
        </div>

        {/* If Blocked: Notice Banner */}
        {isBlocked && (
          <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wide">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Downstream Approval Blocked</span>
            </div>
            <p className="text-xs text-rose-950 font-medium leading-relaxed">
              This clearance cannot be processed until the following upstream prerequisite(s) are cleared:
            </p>
            <ul className="space-y-1 pt-1">
              {node.incompletePrereqs.map((prereq) => (
                <li
                  key={prereq.code}
                  onClick={() => onSelectNodeByCode(prereq.code)}
                  className="text-xs flex items-center justify-between p-2 rounded-lg bg-white border border-rose-200 text-rose-900 hover:border-rose-400 cursor-pointer shadow-2xs"
                  title="Click to inspect this prerequisite"
                >
                  <span className="font-bold truncate max-w-[200px]">{prereq.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold shrink-0">
                    {prereq.status.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Scrollable Body: All 11 Required Fields */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs text-slate-700 divide-y divide-slate-100">
        {/* 1. Overview */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Overview</span>
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            {approval.description ||
              `Statutory compliance clearance administered under state industrial guidelines for ${approval.name || approval.title}.`}
          </p>
          {approval.legalBasis && (
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              <strong className="text-slate-800 font-semibold block text-[10px] uppercase tracking-wider">
                Legal Basis / Statutory Act:
              </strong>
              <span>{approval.legalBasis}</span>
            </div>
          )}
        </div>

        {/* 2. Authority */}
        <div className="pt-4 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Authority</span>
          </h4>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-900 text-xs">
              {approval.issuingAuthority || approval.authority}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Jurisdiction: {approval.level || 'State Level'}</span>
              <span>&bull;</span>
              <span>Category: {approval.category || 'Environmental & Industrial Safety'}</span>
            </div>
          </div>
        </div>

        {/* 3. Stage */}
        <div className="pt-4 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Stage</span>
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold">
              {getStageDisplay()}
            </span>
            <span className="text-[11px] text-slate-500">
              {stageMeta.label} (Roadmap Tier {stageMeta.order} of 7)
            </span>
          </div>
        </div>

        {/* 4. Status & Simulator */}
        <div className="pt-4 space-y-2.5">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Status</span>
          </h4>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeConfig.bg}`}>
              {badgeConfig.label}
            </span>
            {approval.isCriticalPath && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                Critical Path
              </span>
            )}
          </div>

          {/* Interactive Status Simulation Buttons */}
          <div className="pt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Change Clearance Status (Interactive Simulation):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => updateApprovalStatus(approval.code, { status: 'approved' })}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  approval.status === 'approved'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>Mark Approved</span>
              </button>

              <button
                type="button"
                onClick={() => updateApprovalStatus(approval.code, { status: 'in_review' })}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  approval.status === 'in_review'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Mark In Review</span>
              </button>

              <button
                type="button"
                onClick={() => updateApprovalStatus(approval.code, { status: 'query_raised' })}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  approval.status === 'query_raised'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Raise Query</span>
              </button>

              <button
                type="button"
                onClick={() => updateApprovalStatus(approval.code, { status: 'not_started' })}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  approval.status === 'not_started'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <Hourglass className="w-3 h-3" />
                <span>Reset Pending</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. Why It Applies */}
        <div className="pt-4 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Why It Applies</span>
          </h4>
          <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-200/80 text-teal-950">
            <p className="text-xs leading-relaxed">
              {approval.whyApplicable || approval.applicabilityReason ||
                'Statutorily mandatory for this enterprise category, location zoning, and industrial production thresholds.'}
            </p>
          </div>
        </div>

        {/* 6. Prerequisites */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Prerequisites (Upstream Approvals)</span>
            </h4>
            <span className="text-[10px] text-slate-400">
              {node.incompletePrereqs.length + node.clearedPrereqs.length} Required
            </span>
          </div>

          {node.incompletePrereqs.length === 0 && node.clearedPrereqs.length === 0 ? (
            <p className="text-slate-500 italic text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
              None. This is an entry-level baseline clearance.
            </p>
          ) : (
            <div className="space-y-1.5">
              {node.clearedPrereqs.map((p) => (
                <div
                  key={p.code}
                  onClick={() => onSelectNodeByCode(p.code)}
                  className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-300"
                  title="Prerequisite cleared! Click to view"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900 truncate max-w-[200px]">{p.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                    Approved
                  </span>
                </div>
              ))}
              {node.incompletePrereqs.map((p) => (
                <div
                  key={p.code}
                  onClick={() => onSelectNodeByCode(p.code)}
                  className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60 flex items-center justify-between text-xs cursor-pointer hover:border-rose-400"
                  title="Prerequisite pending! Blocks this clearance. Click to view"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="font-bold text-rose-950 truncate max-w-[200px]">{p.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold shrink-0">
                    Pending ({p.status.replace(/_/g, ' ')})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. Dependencies (Downstream Clearances) */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>Dependencies (Downstream Clearances)</span>
            </h4>
            <span className="text-[10px] text-slate-400">
              {node.outgoingDependents.length} Unlocked by this
            </span>
          </div>

          {node.outgoingDependents.length === 0 ? (
            <p className="text-slate-500 italic text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
              Final operational compliance clearance. Directly enables commercial production.
            </p>
          ) : (
            <div className="space-y-1.5">
              {node.outgoingDependents.map((dep) => (
                <div
                  key={dep.code}
                  onClick={() => onSelectNodeByCode(dep.code)}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                    dep.isLockedByThis
                      ? 'bg-amber-50/50 border-amber-200 text-amber-950 hover:border-amber-300'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                  }`}
                  title="Click to view downstream clearance"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-900 truncate max-w-[200px]">{dep.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                      dep.isLockedByThis
                        ? 'bg-amber-100 text-amber-800 font-bold'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {dep.isLockedByThis ? 'Currently Blocked' : 'Unlocked'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 8. Required Documents */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Required Documents ({(approval.requiredDocuments || []).length})</span>
            </h4>
            <span className="text-[10px] text-slate-400">Mandatory Dossier</span>
          </div>

          <div className="space-y-2">
            {(approval.requiredDocuments || []).map((doc) => (
              <div
                key={doc.id || doc.code}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start justify-between gap-2 shadow-2xs"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs truncate">{doc.name}</span>
                    <span className="text-[9px] font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 shrink-0">
                      {doc.format}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{doc.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className="w-full mt-2 py-2 px-3 rounded-lg border border-teal-300 text-teal-800 bg-teal-50/60 hover:bg-teal-100 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            <span>Open Document Hub for Verification</span>
          </button>
        </div>

        {/* 9. Indicative Timeline */}
        <div className="pt-4 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Indicative Timeline</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Statutory SLA
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {approval.demoProcessingTime || `${approval.slaDays || 30} Working Days`}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Elapsed Scrutiny
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {approval.daysElapsed !== undefined ? `${approval.daysElapsed} Days` : '0 Days'}
              </span>
            </div>
          </div>
        </div>

        {/* 10. Application Information */}
        <div className="pt-4 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Application Information</span>
          </h4>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Government Portal:</span>
              <span className="font-semibold text-slate-900">{approval.portalName || 'State Single Window (Maitri)'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Filing Reference / ID:</span>
              <span className="font-mono font-bold text-slate-900">
                APP/MH/{approval.code}/2026
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Statutory Fee:</span>
              <span className="font-mono font-semibold text-slate-900">
                {approval.estimatedFeeInr ? `₹${approval.estimatedFeeInr.toLocaleString('en-IN')}` : 'Included in Consolidated Fee'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Submission State:</span>
              <span className="font-medium text-slate-800">
                {approval.submissionDate ? `Filed on ${approval.submissionDate}` : 'Pending Dossier Readiness'}
              </span>
            </div>
          </div>
        </div>

        {/* 11. Next Action */}
        <div className="pt-4 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Next Action</span>
          </h4>
          <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-950">
            <p className="text-xs font-semibold leading-relaxed">
              {approval.nextAction || 'Prepare comprehensive technical submission dossier for upload in Document Hub.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Panel Footer */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('dependencies')}
          className="text-xs font-semibold text-teal-800 hover:text-teal-950 cursor-pointer"
        >
          View in Graph &rarr;
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Close Drawer
        </button>
      </div>
    </aside>
  );
};
