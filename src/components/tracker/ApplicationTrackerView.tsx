import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { ApprovalItem, ApprovalStatus } from '../../types/index.js';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Send,
  Sparkles,
  Calendar,
  Building,
  Check,
  ArrowRight,
} from 'lucide-react';

export const ApplicationTrackerView: React.FC = () => {
  const { approvals, updateApprovalStatus, profile, selectedApproval } = useApp();

  const [selectedForQuery, setSelectedForQuery] = useState<ApprovalItem | null>(
    selectedApproval || approvals.find((a) => a.status === 'query_raised') || null
  );

  React.useEffect(() => {
    if (selectedApproval && selectedApproval.status === 'query_raised') {
      setSelectedForQuery(selectedApproval);
    }
  }, [selectedApproval]);

  const [replyText, setReplyText] = useState(
    'In response to the query regarding Water Balance calculations: The registered fresh water intake of 65 KLD reflects total facility demand, which incorporates the 4 TPH industrial steam boiler feed (18 KLD) and cooling tower make-up (12 KLD). Attached is the revised Engineering Flow Diagram v2.0 demonstrating zero liquid discharge (ZLD) with 92% RO permeate recycling.'
  );
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  const handleResolveQuery = async (code: string) => {
    setIsSubmittingReply(true);
    await updateApprovalStatus(code, {
      status: 'in_review',
      queryDetails: undefined,
    });
    setIsSubmittingReply(false);
    setReplySuccess(true);
    setTimeout(() => {
      setReplySuccess(false);
      setSelectedForQuery(null);
    }, 2500);
  };

  const handleGenerateAiDraft = () => {
    if (!selectedForQuery || !profile) return;
    setReplyText(
      `To: ${selectedForQuery.queryDetails?.departmentOfficer || 'The Sub-Regional Officer'}\n${selectedForQuery.issuingAuthority}\n\nSubject: Compliance Clarification for Application ${selectedForQuery.code} (${profile.companyName})\n\nRespected Sir/Madam,\nWith reference to the clarification notice dated ${selectedForQuery.queryDetails?.raisedDate || 'recently'} regarding our industrial unit at ${profile.industrialArea}:\n\n1. The water demand calculations have been reconciled to exactly 65 KLD to account for the ${profile.boilerCapacityTph || 4} TPH steam boiler blowdown.\n2. We confirm Zero Liquid Discharge (ZLD) with Multi-Effect Evaporator (MEE) and ATFD salt harvesting.\n3. Updated process flow schematics and certified water balance charts are enclosed herewith.\n\nWe request your kind office to proceed with the issuance of Consent to Establish.\n\nSincerely,\nAuthorized Signatory, ${profile.companyName}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Statutory Application &amp; Deadline Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of filed dossiers, statutory SLA countdowns, and government query response deadlines.
          </p>
        </div>
      </div>

      {/* Active Clarification Notice Card (if any query raised) */}
      {selectedForQuery && selectedForQuery.queryDetails && (
        <div className="bg-rose-50/70 border-2 border-rose-300 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded">
                  CRITICAL STATUTORY CLARIFICATION NOTICE
                </span>
                <h3 className="font-bold text-base text-rose-950 mt-0.5">
                  {selectedForQuery.title} ({selectedForQuery.code})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-white/80 px-3 py-1.5 rounded-lg border border-rose-200">
              <Calendar className="w-4 h-4 text-rose-600" />
              <span>Response Deadline: {selectedForQuery.queryDetails.deadlineDate}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-white p-4 rounded-xl border border-rose-200 text-rose-900">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Notice Text from {selectedForQuery.queryDetails.departmentOfficer}
              </span>
              <p className="font-medium text-slate-800 leading-relaxed text-xs">
                "{selectedForQuery.queryDetails.queryText}"
              </p>
            </div>

            {/* Interactive Response Composer */}
            <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <span>Draft Official Statutory Clarification Reply</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Draft Formal Response with AI</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Enclosure: Revised Water Balance Schematic v2.0 (Attached)
                </span>

                <button
                  type="button"
                  onClick={() => handleResolveQuery(selectedForQuery.code)}
                  disabled={isSubmittingReply}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {replySuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Clarification Submitted!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isSubmittingReply ? 'Submitting...' : 'Submit Response & Resume SLA'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Tracking Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Statutory Approval Applications &amp; SLAs
          </h3>
          <span className="text-xs text-slate-500">
            Showing all {approvals.length} clearances
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Approval / Code</th>
                <th className="py-3 px-4 font-semibold">Issuing Authority</th>
                <th className="py-3 px-4 font-semibold">Stage</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Statutory SLA Progress</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {approvals.map((item) => {
                const ratio = item.daysElapsed / item.slaDays;
                const isOverdueRisk = ratio >= 0.8 && item.status === 'in_review';

                return (
                  <tr key={item.code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="font-mono text-[10px] text-slate-400">{item.code}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div>{item.issuingAuthority}</div>
                      <div className="text-[10px] text-teal-700 font-mono">{item.portalName}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 capitalize">
                      {item.stage.replace('_', ' ')}
                    </td>

                    <td className="py-3 px-4">
                      {item.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Granted
                        </span>
                      ) : item.status === 'query_raised' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Query Pending
                        </span>
                      ) : item.status === 'in_review' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-blue-600" /> In Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Not Started
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 min-w-[160px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-medium text-slate-700">
                          {item.daysElapsed} / {item.slaDays} Days
                        </span>
                        {isOverdueRisk && (
                          <span className="text-[10px] font-bold text-rose-600">
                            SLA Alert
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            item.status === 'approved'
                              ? 'bg-emerald-500'
                              : isOverdueRisk
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(Math.round(ratio * 100), 100)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {item.status === 'query_raised' ? (
                        <button
                          onClick={() => setSelectedForQuery(item)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs cursor-pointer"
                        >
                          Resolve Query
                        </button>
                      ) : (
                        <select
                          value={item.status}
                          onChange={(e) => updateApprovalStatus(item.code, { status: e.target.value as ApprovalStatus })}
                          className="text-[11px] px-2 py-1 rounded border border-slate-200 bg-white"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_review">In Review</option>
                          <option value="query_raised">Query Raised</option>
                          <option value="approved">Approved</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
