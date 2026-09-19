import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { NextBestAction } from '../../types/index.js';
import { selectNextBestAction } from './nextBestActionEngine.js';
import {
  Compass,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  FileText,
  Upload,
  Clock,
  Building2,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Send,
  X,
} from 'lucide-react';

interface NextBestActionBannerProps {
  className?: string;
  variant?: 'prominent' | 'compact' | 'detailed';
}

export const NextBestActionBanner: React.FC<NextBestActionBannerProps> = ({
  className = '',
  variant = 'prominent',
}) => {
  const {
    approvals,
    documents,
    profile,
    alerts,
    setActiveTab,
    setSelectedApproval,
    uploadDocument,
    updateDocumentStatus,
    updateApprovalStatus,
  } = useApp();

  // Deterministically compute top action and prioritized actions from live data
  const { topAction, prioritizedActions } = selectNextBestAction(
    approvals,
    documents,
    profile,
    alerts
  );

  const [isFactorsExpanded, setIsFactorsExpanded] = useState(false);
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);
  const [resolveModalAction, setResolveModalAction] = useState<NextBestAction | null>(null);

  // Quick Resolve Modal State
  const [quickFileName, setQuickFileName] = useState('Revised_Compliance_Document_v2.pdf');
  const [quickNote, setQuickNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveSuccessMessage, setResolveSuccessMessage] = useState<string | null>(null);

  if (!topAction) {
    return (
      <div className={`bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 shadow-2xs ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
              NEXT BEST ACTION &bull; ALL CLEARANCES ON SCHEDULE
            </h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              All statutory queries are answered, required documents verified, and no immediate critical path blockers detected.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle clicking "Resolve Now"
  const handleResolveNowClick = (action: NextBestAction) => {
    // Open the targeted quick resolution modal
    setQuickNote(
      action.category === 'query_reply'
        ? 'Formal response addressing departmental query points with attached technical compliance annexures.'
        : `Corrected and signed technical submission complying with ${action.issuingAuthority} norms.`
    );
    setResolveModalAction(action);
  };

  // Perform live data resolution
  const handleExecuteResolution = async () => {
    if (!resolveModalAction) return;
    setIsResolving(true);

    try {
      const payload = resolveModalAction.resolvePayload;

      if (payload.type === 'reply_query') {
        // Resolve query by updating approval status back to in_review
        await updateApprovalStatus(payload.approvalCode, {
          status: 'in_review',
          queryDetails: undefined,
        });
        setResolveSuccessMessage('Clarification reply submitted to department. Status returned to In Review.');
      } else if (payload.type === 'correct_document' && payload.documentId) {
        // Update existing faulty document to VERIFIED
        await updateDocumentStatus(payload.documentId, {
          status: 'VERIFIED',
          issues: [],
          documentName: `Corrected ${payload.documentName || 'Document'}`,
        });
        setResolveSuccessMessage('Corrected document uploaded and verified. Discrepancy cleared.');
      } else if (payload.type === 'upload_document') {
        // Upload the missing document
        await uploadDocument({
          approvalCode: payload.approvalCode,
          documentTypeCode: payload.documentTypeCode || 'SITE_LAYOUT',
          documentName: payload.documentName || 'Site Layout Plan',
          fileName: quickFileName || 'Apex_Site_Layout_Corrected.pdf',
          fileSizeKb: 2840,
          status: 'VERIFIED',
          mockContentSnippet: 'Verified layout drawing conforming to NBC 2016 Part IV specifications.',
        });
        setResolveSuccessMessage('Document successfully registered in repository and verified.');
      } else if (payload.type === 'escalate_sla') {
        // Escalate SLA
        setResolveSuccessMessage('Statutory reminder filed via Single Window grievance portal.');
      } else if (payload.type === 'file_application') {
        await updateApprovalStatus(payload.approvalCode, {
          status: 'in_review',
          submissionDate: new Date().toISOString().slice(0, 10),
          daysElapsed: 1,
        });
        setResolveSuccessMessage('Application dossier marked submitted.');
      }

      setTimeout(() => {
        setIsResolving(false);
        setResolveModalAction(null);
        setResolveSuccessMessage(null);
      }, 1200);
    } catch (err) {
      console.error('Failed to execute resolution:', err);
      setIsResolving(false);
    }
  };

  // Navigate to corresponding view
  const handleNavigateToSection = (action: NextBestAction) => {
    const targetApproval = approvals.find((a) => a.code === action.affectedApprovalCode);
    if (targetApproval) {
      setSelectedApproval(targetApproval);
    }
    setActiveTab(action.actionRouteTab);
    setResolveModalAction(null);
  };

  const priorityColor =
    topAction.priority === 'CRITICAL'
      ? 'bg-rose-50 border-rose-200 text-rose-900'
      : topAction.priority === 'HIGH'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : 'bg-teal-50 border-teal-200 text-teal-900';

  const priorityBadge =
    topAction.priority === 'CRITICAL'
      ? 'bg-rose-700 text-white'
      : topAction.priority === 'HIGH'
      ? 'bg-amber-700 text-white'
      : 'bg-teal-700 text-white';

  return (
    <section
      id="next-best-action-card"
      aria-label="Next Best Action Recommendation"
      className={`bg-white rounded-2xl border-2 border-slate-900/90 shadow-lg overflow-hidden transition-all relative ${className}`}
    >
      {/* Top Banner Stripe */}
      <div className="bg-slate-900 text-white px-5 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center font-black text-xs">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-xs font-black tracking-widest uppercase text-teal-300">
            NEXT BEST ACTION
          </span>
          <span className="hidden sm:inline-block text-slate-400 text-xs">&bull;</span>
          <span className="hidden sm:inline-block text-[11px] text-slate-300 font-medium">
            Prioritized by Approval Statuses, Documents, Dependencies, Deadlines &amp; Risk
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityBadge}`}>
            {topAction.priority} PRIORITY
          </span>
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
            Rank #{topAction.rank} of {prioritizedActions.length}
          </span>
        </div>
      </div>

      {/* Main Action Content Body */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Row 1: Action Headline & Primary Resolve Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{topAction.issuingAuthority}</span>
              <span>&bull;</span>
              <span className="font-semibold text-slate-700">{topAction.affectedApprovalName}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
              &ldquo;{topAction.actionTitle}&rdquo;
            </h2>
          </div>

          {/* Prominent "Resolve Now" Button */}
          <div className="shrink-0 flex items-center gap-3">
            <button
              id="resolve-now-button"
              onClick={() => handleResolveNowClick(topAction)}
              className="w-full sm:w-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-slate-950 font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Resolve Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Row 2: Prominent "WHY?" Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5 font-mono">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                WHY?
              </span>
              <span className="text-xs text-slate-500">
                (Deterministic Causal Explanation)
              </span>
            </div>
            {topAction.daysRemaining !== undefined && topAction.daysRemaining <= 15 && (
              <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                {topAction.daysRemaining} days until statutory deadline
              </span>
            )}
          </div>

          <p className="text-base font-semibold text-slate-900 leading-relaxed">
            &ldquo;{topAction.whyExplanation}&rdquo;
          </p>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-bold text-slate-700">Downstream Impact:</span>
              <span>{topAction.downstreamImpact}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Estimated Resolution Effort: <span className="font-bold text-slate-700">{topAction.estimatedTime}</span>
            </div>
          </div>
        </div>

        {/* Row 3: 6 Examined Factors Toggle (Transparency & Audit) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
          <button
            onClick={() => setIsFactorsExpanded(!isFactorsExpanded)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>
                Engine Audit: How all 6 criteria were examined
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                Calculated Score: {topAction.totalScore} pts
              </span>
            </div>
            <div className="flex items-center gap-1 text-teal-700">
              <span>{isFactorsExpanded ? 'Hide Factor Breakdown' : 'Inspect Factor Breakdown'}</span>
              {isFactorsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {isFactorsExpanded && (
            <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="font-bold text-slate-900 block mb-1">1. Approval Status</span>
                <p className="text-slate-600">{topAction.examinationSummary.approvalStatus}</p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="font-bold text-slate-900 block mb-1">2. Document Status</span>
                <p className="text-slate-600">{topAction.examinationSummary.documentStatus}</p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="font-bold text-slate-900 block mb-1">3. Dependencies</span>
                <p className="text-slate-600">{topAction.examinationSummary.dependencies}</p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="font-bold text-slate-900 block mb-1">4. Deadlines</span>
                <p className="text-slate-600">{topAction.examinationSummary.deadlines}</p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="font-bold text-slate-900 block mb-1">5. Bottlenecks</span>
                <p className="text-slate-600">{topAction.examinationSummary.bottlenecks}</p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="font-bold text-slate-900 block mb-1">6. Procedural Risk</span>
                <p className="text-slate-600">{topAction.examinationSummary.risk}</p>
              </div>
            </div>
          )}
        </div>

        {/* Row 4: Action Queue Preview (Actions #2 to #4) */}
        {prioritizedActions.length > 1 && (
          <div className="pt-2">
            <button
              onClick={() => setIsQueueExpanded(!isQueueExpanded)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                View Next In Queue ({prioritizedActions.length - 1} more ranked actions)
              </span>
              {isQueueExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isQueueExpanded && (
              <div className="mt-3 space-y-2.5">
                {prioritizedActions.slice(1, 4).map((action) => (
                  <div
                    key={action.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          #{action.rank}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {action.actionTitle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-rose-700 font-mono">WHY? </span>
                        {action.whyExplanation}
                      </p>
                    </div>

                    <button
                      onClick={() => handleResolveNowClick(action)}
                      className="shrink-0 px-3 py-1.5 bg-slate-900 hover:bg-teal-600 hover:text-slate-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 self-start sm:self-center cursor-pointer"
                    >
                      <span>Resolve</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* QUICK RESOLVE MODAL / DIALOG */}
      {/* ---------------------------------------------------- */}
      {resolveModalAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Resolve Next Best Action</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {resolveModalAction.actionTitle}
                </h3>
              </div>
              <button
                onClick={() => setResolveModalAction(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Grounded Context */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Affected Approval:</span>
                  <span className="font-mono text-slate-900">{resolveModalAction.affectedApprovalName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Statutory Authority:</span>
                  <span className="text-slate-900">{resolveModalAction.issuingAuthority}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 text-slate-600">
                  <span className="font-bold text-rose-700">WHY? </span>
                  {resolveModalAction.whyExplanation}
                </div>
              </div>

              {/* Form Input based on Action Category */}
              {resolveModalAction.category === 'document_correction' ||
              resolveModalAction.category === 'missing_document' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-900">
                    File Attachment to Register &amp; Verify
                  </label>
                  <div className="border-2 border-dashed border-teal-300 bg-teal-50/40 rounded-xl p-4 text-center space-y-1">
                    <Upload className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                    <span className="text-xs font-semibold text-slate-800 block">
                      {quickFileName}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      2.8 MB &bull; Signed and stamped engineering layout
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Compliance Note / Revision Remark
                    </label>
                    <textarea
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="Enter verification notes..."
                    />
                  </div>
                </div>
              ) : resolveModalAction.category === 'query_reply' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-900">
                    Department Clarification Response
                  </label>
                  <textarea
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Enter official reply statement..."
                  />
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Includes revised hydraulic water balance and ZLD engineering annexures.</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                  Clicking resolve will lodge the required Single Window procedure and advance your application workflow.
                </div>
              )}

              {/* Status or Success Feedback */}
              {resolveSuccessMessage && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{resolveSuccessMessage}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleNavigateToSection(resolveModalAction)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Go to full {resolveModalAction.actionRouteTab} view</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResolveModalAction(null)}
                  disabled={isResolving}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteResolution}
                  disabled={isResolving}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-slate-950 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResolving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm &amp; Resolve Now</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
