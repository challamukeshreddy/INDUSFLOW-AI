import React from 'react';
import { EvaluatedGraphNode } from './roadmapTypes.js';
import { useApp } from '../../context/AppContext.js';
import { ApprovalStatus } from '../../types/index.js';
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
          subtext: `Under scrutiny by authority (Day ${approval.daysElapsed || 10} of ${approval.slaDays} SLA).`,
        };
      case 'attention_required':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'Attention Required',
          subtext:
            approval.status === 'query_raised'
              ? 'Statutory query or clarification notice pending reply.'
              : 'Mandatory technical submission dossier incomplete.',
        };
      case 'blocked':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200',
          dot: 'bg-rose-500',
          icon: Lock,
          label: 'Blocked',
          subtext: 'Cannot be filed or processed until upstream statutory clearances are granted.',
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

  const getRiskBadge = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high':
        return {
          label: 'High Criticality (Strict Penalties / Stop-Work Risk)',
          classes: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'medium':
        return {
          label: 'Medium Criticality (Timeline & Utility Delay Risk)',
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'low':
      default:
        return {
          label: 'Standard Compliance (Procedural)',
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const riskBadge = getRiskBadge(approval.risk || 'low');

  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh] lg:max-h-none sticky top-24">
      {/* 1. Header with Close Button */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                {approval.code}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {stageMeta.label}
              </span>
              {node.canRunParallel && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  Parallel Track Allowed
                </span>
              )}
            </div>

            <h3 className="font-bold text-base text-slate-900 leading-snug pt-1">
              {approval.name || approval.title}
            </h3>

            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="font-medium text-slate-800">
                {approval.authority || approval.issuingAuthority}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-all cursor-pointer"
            title="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout Banner with Color Encoding */}
        <div className={`mt-3 p-3 rounded-xl border flex items-start gap-2.5 ${badgeConfig.bg}`}>
          <StatusIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold flex items-center gap-1.5">
              <span>Status: {badgeConfig.label}</span>
              <span className={`w-2 h-2 rounded-full ${badgeConfig.dot}`} />
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">{badgeConfig.subtext}</p>
          </div>
        </div>

        {/* If Blocked: Prominent Warning Banner */}
        {isBlocked && (
          <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wide">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Downstream Approval Blocked</span>
            </div>
            <p className="text-xs text-rose-950 font-medium leading-relaxed">
              This clearance cannot be processed because the following upstream prerequisite(s) have not been cleared:
            </p>
            <ul className="space-y-1 pt-1">
              {node.incompletePrereqs.map((prereq) => (
                <li
                  key={prereq.code}
                  onClick={() => onSelectNodeByCode(prereq.code)}
                  className="text-xs flex items-center justify-between p-2 rounded-lg bg-white border border-rose-200 text-rose-900 hover:border-rose-400 cursor-pointer shadow-2xs"
                  title="Click to inspect this prerequisite"
                >
                  <span className="font-bold">{prereq.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                    Status: {prereq.status.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Scrollable Body containing the 8 required fields */}
      <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 divide-y divide-slate-100">
        {/* Field 1 & 2: Approval & Authority Details */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Statutory Clearance Overview</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Statutory SLA</span>
              <span className="font-mono font-bold text-slate-800">
                {approval.demoProcessingTime || `${approval.slaDays || 30} Working Days`}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Government Portal</span>
              <span className="font-semibold text-slate-800 truncate block">
                {approval.portalName || 'State Single Window'}
              </span>
            </div>
          </div>
          {approval.legalBasis && (
            <p className="text-[11px] text-slate-500 italic">
              Legal Mandate: {approval.legalBasis}
            </p>
          )}
        </div>

        {/* Field 3: Why It May Apply */}
        <div className="pt-4 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Why It May Apply</span>
          </h4>
          <div className="bg-teal-50/50 p-3.5 rounded-xl border border-teal-200/70 text-teal-950 space-y-1">
            <p className="text-xs leading-relaxed font-normal">
              {approval.whyApplicable || approval.applicabilityReason}
            </p>
          </div>
        </div>

        {/* Field 4: Required Documents */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Required Technical Documents ({(approval.requiredDocuments || []).length})</span>
            </h4>
            <span className="text-[10px] text-slate-400">Mandatory Dossier</span>
          </div>

          <div className="space-y-2">
            {(approval.requiredDocuments || []).map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs">{doc.name}</span>
                    <span className="text-[9px] font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {doc.format}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{doc.description}</p>
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
            <span>Open Document Hub for AI Pre-validation</span>
          </button>
        </div>

        {/* Field 5: Dependencies (Upstream & Downstream) */}
        <div className="pt-4 space-y-3">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
            <span>Statutory Dependencies &amp; Relationships</span>
          </h4>

          {/* Upstream Prerequisites */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 block">
              Upstream Prerequisites (Must be approved before this):
            </span>
            {node.incompletePrereqs.length === 0 && node.clearedPrereqs.length === 0 ? (
              <p className="text-slate-500 italic text-[11px] p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                No upstream prerequisite statutory approvals. This is an entry-level clearance.
              </p>
            ) : (
              <div className="space-y-1.5">
                {node.clearedPrereqs.map((p) => (
                  <div
                    key={p.code}
                    onClick={() => onSelectNodeByCode(p.code)}
                    className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-300"
                    title="Prerequisite cleared! Click to inspect"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-900">{p.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      Approved
                    </span>
                  </div>
                ))}
                {node.incompletePrereqs.map((p) => (
                  <div
                    key={p.code}
                    onClick={() => onSelectNodeByCode(p.code)}
                    className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60 flex items-center justify-between text-xs cursor-pointer hover:border-rose-400"
                    title="Upstream pending! Blocks this approval. Click to inspect"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      <span className="font-bold text-rose-950">{p.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                      Pending ({p.status.replace(/_/g, ' ')})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Downstream Dependents */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold text-slate-700 block">
              Downstream Clearances (Unlocked by this approval):
            </span>
            {node.outgoingDependents.length === 0 ? (
              <p className="text-slate-500 italic text-[11px] p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                Final stage clearance. Unlocks physical commercial operations.
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
                  >
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-900">{dep.name}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
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
        </div>

        {/* Field 6: Risk Level & Critical Path */}
        <div className="pt-4 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Criticality &amp; Statutory Risk Profile</span>
          </h4>
          <div className="space-y-1.5">
            <div className={`p-2.5 rounded-lg border text-xs font-semibold ${riskBadge.classes}`}>
              {riskBadge.label}
            </div>
            {approval.isCriticalPath && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <span className="font-bold block uppercase text-[10px] text-amber-800">
                  Critical Path Clearance
                </span>
                <p>
                  Any delay in this statutory clearance directly pushes back the project's commercial commissioning date.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Field 7: Next Action */}
        <div className="pt-4 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Recommended Next Action</span>
          </h4>
          <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-950 space-y-2">
            <p className="text-xs font-medium leading-relaxed">
              {approval.nextAction || 'Prepare comprehensive technical submission dossier.'}
            </p>
          </div>
        </div>

        {/* Field 8: Interactive Status Simulator */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              Simulate Clearance Status
            </h4>
            <span className="text-[10px] text-indigo-600 font-medium">Interactive Demo</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Change this clearance status to watch downstream dependencies dynamically lock or unlock in the visual graph:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => updateApprovalStatus(approval.code, { status: 'approved' })}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                approval.status === 'approved'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Approved</span>
            </button>

            <button
              type="button"
              onClick={() => updateApprovalStatus(approval.code, { status: 'in_review' })}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                approval.status === 'in_review'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mark In Review</span>
            </button>

            <button
              type="button"
              onClick={() => updateApprovalStatus(approval.code, { status: 'query_raised' })}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                approval.status === 'query_raised'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Raise Query</span>
            </button>

            <button
              type="button"
              onClick={() => updateApprovalStatus(approval.code, { status: 'not_started' })}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                approval.status === 'not_started'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>Reset to Pending</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Panel Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          View in Approval Matrix &rarr;
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Done
        </button>
      </div>
    </aside>
  );
};
