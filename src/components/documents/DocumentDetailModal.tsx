import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { ComplianceDocumentRecord, DocumentStatus } from '../../types/index.js';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  Calendar,
  Building2,
  FileCheck,
  AlertOctagon,
  RefreshCw,
  X,
  HelpCircle,
  Hash,
  MapPin,
  CalendarDays,
  ArrowRight,
  Info,
} from 'lucide-react';

interface DocumentDetailModalProps {
  documentRecord: ComplianceDocumentRecord;
  onClose: () => void;
  onUploadReplacement?: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  documentRecord,
  onClose,
  onUploadReplacement,
}) => {
  const { preValidateDocument, updateDocumentStatus } = useApp();

  const [currentStatus, setCurrentStatus] = useState<DocumentStatus>(documentRecord.status);
  const [currentExpiry, setCurrentExpiry] = useState<string>(
    documentRecord.expiryDate || 'N/A (Perpetual)'
  );
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'audit_report' | 'checks' | 'issues' | 'metadata'>('audit_report');

  const aiResult = documentRecord.aiPreValidation;

  const handleRunPreValidation = async () => {
    setIsValidating(true);
    try {
      await preValidateDocument(documentRecord.id);
    } catch (err) {
      console.error('Error running pre-validation:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    setCurrentStatus(newStatus);
    await updateDocumentStatus(documentRecord.id, {
      status: newStatus,
      expiryDate: currentExpiry,
    });
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'VERIFIED':
        return {
          classes: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: CheckCircle2,
          label: 'VERIFIED',
        };
      case 'UNDER REVIEW':
        return {
          classes: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: Clock,
          label: 'UNDER REVIEW',
        };
      case 'NEEDS CORRECTION':
        return {
          classes: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: AlertOctagon,
          label: 'NEEDS CORRECTION',
        };
      case 'UPLOADED':
        return {
          classes: 'bg-teal-100 text-teal-900 border-teal-300',
          icon: FileCheck,
          label: 'UPLOADED',
        };
      case 'NOT UPLOADED':
      default:
        return {
          classes: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: XCircle,
          label: 'NOT UPLOADED',
        };
    }
  };

  const statusBadge = getStatusBadge(currentStatus);
  const StatusIcon = statusBadge.icon;

  const score = aiResult?.readinessScore ?? documentRecord.validationScore;

  return (
    <div className="fixed inset-0 bg-slate-950/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                ID: {documentRecord.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusBadge.classes}`}
              >
                <StatusIcon className="w-3 h-3" />
                <span>{statusBadge.label}</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                {aiResult?.documentType || documentRecord.documentType}
              </span>
              {aiResult?.geminiValidated && (
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                  <span>Gemini 3.8 Flash Engine</span>
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {documentRecord.name}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Related Approval:</span>
              <span className="font-semibold text-slate-700">
                {documentRecord.relatedApproval}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Non-Legal Disclaimer Callout (Strictly verbatim per guidelines) */}
        <div className="p-3.5 rounded-xl bg-amber-50/95 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5 shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-amber-950">
              Statutory Pre-Screening Disclaimer
            </span>
            <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
              {aiResult?.disclaimer ||
                'AI pre-validation is a prototype screening tool and does not constitute official or legal verification.'}
            </p>
          </div>
        </div>

        {/* Action Toolbar: Run AI Pre-Validation & Quick Status Selector */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Lifecycle Status:</span>
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as DocumentStatus)}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="NOT UPLOADED">NOT UPLOADED</option>
              <option value="UPLOADED">UPLOADED</option>
              <option value="UNDER REVIEW">UNDER REVIEW</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="NEEDS CORRECTION">NEEDS CORRECTION</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunPreValidation}
              disabled={isValidating || documentRecord.status === 'NOT UPLOADED'}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Runs Gemini consistency check against business profile parameters"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Pre-Validation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('audit_report')}
            className={`pb-2 px-2 font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'audit_report'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            AI Pre-Validation Audit
          </button>
          {aiResult?.checks && aiResult.checks.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('checks')}
              className={`pb-2 px-2 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'checks'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Statutory Checks</span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full">
                {aiResult.checks.length}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            className={`pb-2 px-2 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'issues'
                ? 'border-rose-600 text-rose-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Inconsistencies &amp; Warnings</span>
            {((aiResult?.inconsistencies?.length || 0) + (aiResult?.warnings?.length || 0) > 0 ||
              (documentRecord.issues && documentRecord.issues.length > 0)) && (
              <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full">
                {aiResult?.inconsistencies?.length || documentRecord.issues?.length || 0}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`pb-2 px-2 font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Record Metadata &amp; Expiry
          </button>
        </div>

        {/* Tab 1: AI Pre-Validation Audit Report */}
        {activeTab === 'audit_report' && (
          <div className="space-y-4">
            {score !== undefined ? (
              <>
                {/* Readiness Score & Classification Header */}
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    score >= 85
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                      : score >= 70
                      ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                      : 'bg-rose-50/90 border-rose-200 text-rose-950'
                  }`}
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 block">
                      Statutory Readiness Pre-Check Score
                    </span>
                    <div className="text-3xl font-black font-mono mt-0.5 flex items-baseline gap-2">
                      <span>{score}</span>
                      <span className="text-sm font-normal text-slate-500">/ 100</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          score >= 85
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : score >= 70
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        {score >= 85
                          ? 'Consistent with Profile'
                          : score >= 70
                          ? 'Advisory Attention Required'
                          : 'Profile Mismatch Identified'}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right max-w-sm text-xs">
                    {score >= 85 ? (
                      <span className="font-semibold text-emerald-900 flex items-center gap-1.5 sm:justify-end">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Data points align with statutory profile parameters.</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-rose-900 flex items-center gap-1.5 sm:justify-end">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Discrepancies found that may trigger a regulatory clarification notice.</span>
                      </span>
                    )}
                    {aiResult?.scanTimestamp && (
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Audited at: {aiResult.scanTimestamp}
                      </span>
                    )}
                  </div>
                </div>

                {/* Recommended Action Prior to Submission */}
                {aiResult?.recommendedAction && (
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-1">
                    <span className="font-bold text-teal-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                      <span>Recommended Action Prior to Portal Filing:</span>
                    </span>
                    <p className="text-teal-950 font-medium leading-relaxed pl-5">
                      {aiResult.recommendedAction}
                    </p>
                  </div>
                )}

                {/* Structured Extracted Fields Breakdown */}
                {aiResult?.extractedFields && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>AI Extracted Document Entities &amp; Parameters</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {/* Company Name */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>Extracted Enterprise Name</span>
                        </span>
                        <div className="font-semibold text-slate-900">
                          {aiResult.extractedFields.companyName || 'Not detected in document content'}
                        </div>
                      </div>

                      {/* Site Address */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Extracted Site Location</span>
                        </span>
                        <div className="font-semibold text-slate-900">
                          {aiResult.extractedFields.address || 'Not detected in document content'}
                        </div>
                      </div>

                      {/* Visible Registration Numbers */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span>Visible Registration Numbers</span>
                        </span>
                        <div className="font-mono text-[11px] text-slate-900">
                          {aiResult.extractedFields.visibleRegistrationNumbers &&
                          aiResult.extractedFields.visibleRegistrationNumbers.length > 0
                            ? aiResult.extractedFields.visibleRegistrationNumbers.join(', ')
                            : 'None identified on submitted pages'}
                        </div>
                      </div>

                      {/* Dates & Possible Expiry */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-slate-400" />
                          <span>Detected Dates &amp; Possible Expiry</span>
                        </span>
                        <div className="text-slate-900">
                          <span className="font-semibold">
                            Expiry: {aiResult.extractedFields.possibleExpiryDate || 'N/A (Perpetual / Not Indicated)'}
                          </span>
                          {aiResult.extractedFields.dates && aiResult.extractedFields.dates.length > 0 && (
                            <span className="text-[11px] text-slate-500 block font-mono">
                              Dates found: {aiResult.extractedFields.dates.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Important Technical Fields Table */}
                    {aiResult.extractedFields.importantFields &&
                      Object.keys(aiResult.extractedFields.importantFields).length > 0 && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden mt-2">
                          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-700">
                            <span>Key Technical Parameters</span>
                            <span className="text-slate-400 font-normal">Extracted Values</span>
                          </div>
                          <div className="divide-y divide-slate-100 text-xs">
                            {Object.entries(aiResult.extractedFields.importantFields).map(([k, v], i) => (
                              <div key={i} className="py-2 px-3 flex items-center justify-between">
                                <span className="text-slate-600 font-medium">{k}</span>
                                <span className="font-mono font-semibold text-slate-900 text-[11px]">
                                  {String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Legacy or fallback verified fields table */}
                {(!aiResult?.extractedFields || !aiResult?.checks?.length) &&
                  documentRecord.verifiedFields &&
                  documentRecord.verifiedFields.length > 0 && (
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                        Profile Parameter Consistency Comparison
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                            <tr>
                              <th className="py-2 px-3 font-semibold">Parameter</th>
                              <th className="py-2 px-3 font-semibold">Extracted In Document</th>
                              <th className="py-2 px-3 font-semibold">Business Profile Registered</th>
                              <th className="py-2 px-3 font-semibold text-right">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {documentRecord.verifiedFields.map((field, idx) => (
                              <tr key={idx} className={field.isMatch ? '' : 'bg-rose-50/60'}>
                                <td className="py-2 px-3 font-medium text-slate-900">{field.field}</td>
                                <td className="py-2 px-3 font-mono text-[11px]">{field.extractedValue}</td>
                                <td className="py-2 px-3 font-mono text-[11px]">{field.profileValue}</td>
                                <td className="py-2 px-3 text-right">
                                  {field.isMatch ? (
                                    <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">
                                      Match
                                    </span>
                                  ) : (
                                    <span className="text-rose-700 font-bold text-[10px] bg-rose-100 px-1.5 py-0.5 rounded">
                                      Mismatch
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Missing Information / Insufficient Information Alert */}
                {aiResult?.missingInformation && aiResult.missingInformation.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 space-y-1.5 text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                      <span>Missing Statutory Information / Unstated Specifications:</span>
                    </span>
                    <p className="text-[11px] text-slate-500">
                      The AI detected that the following statutory prerequisites or technical parameters were absent or unconfirmed in this document:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 pt-0.5">
                      {aiResult.missingInformation.map((m, i) => (
                        <li key={i} className="leading-relaxed font-medium">
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : documentRecord.status === 'NOT UPLOADED' ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-3 bg-slate-50/50">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Document File Not Yet Uploaded
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Upload your technical drawing, DPR, or statutory certificate to run automated consistency pre-checks.
                  </p>
                </div>
                {onUploadReplacement && (
                  <button
                    type="button"
                    onClick={onUploadReplacement}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <span>Upload Document File</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-3 bg-slate-50/50">
                <Sparkles className="w-8 h-8 text-teal-600 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Ready for AI Pre-Validation
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Click "Run AI Pre-Validation" above to compare technical values in this dossier against your registered profile using Gemini.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Statutory Checks */}
        {activeTab === 'checks' && aiResult?.checks && (
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800">
                {aiResult.checks.length} Statutory Consistency Checks Conducted:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {aiResult.checks.filter((c) => c.status === 'pass').length} passed /{' '}
                {aiResult.checks.filter((c) => c.status === 'fail').length} failed
              </span>
            </div>

            <div className="space-y-2">
              {aiResult.checks.map((checkItem, idx) => {
                let badgeStyle = 'bg-slate-100 text-slate-800 border-slate-300';
                let IconComponent = Info;
                if (checkItem.status === 'pass') {
                  badgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                  IconComponent = CheckCircle2;
                } else if (checkItem.status === 'fail') {
                  badgeStyle = 'bg-rose-100 text-rose-900 border-rose-300';
                  IconComponent = XCircle;
                } else if (checkItem.status === 'warning') {
                  badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300';
                  IconComponent = AlertTriangle;
                } else if (checkItem.status === 'inconclusive') {
                  badgeStyle = 'bg-purple-100 text-purple-900 border-purple-300';
                  IconComponent = HelpCircle;
                }

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs">{checkItem.check}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badgeStyle}`}
                      >
                        <IconComponent className="w-3 h-3" />
                        <span className="uppercase">{checkItem.status}</span>
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      {checkItem.details}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Issues, Inconsistencies & Warnings */}
        {activeTab === 'issues' && (
          <div className="space-y-4 text-xs">
            {/* Inconsistencies & Profile Mismatches */}
            {aiResult?.inconsistencies && aiResult.inconsistencies.length > 0 ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {aiResult.inconsistencies.length} Critical Discrepancies &amp; Profile Mismatches:
                  </span>
                </div>
                <div className="space-y-2">
                  {aiResult.inconsistencies.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-rose-200 bg-white shadow-2xs space-y-1"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="font-semibold text-rose-950 leading-relaxed">
                          {issue}
                        </p>
                      </div>
                      <div className="pl-7 text-[11px] text-slate-500 font-medium">
                        Resolution: Align document numbers with registered business profile before statutory submission.
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : documentRecord.issues && documentRecord.issues.length > 0 ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{documentRecord.issues.length} Discrepancy Point(s) Identified:</span>
                </div>
                <div className="space-y-2">
                  {documentRecord.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-rose-200 bg-white shadow-2xs space-y-1"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="font-semibold text-rose-950 leading-relaxed">{issue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 text-center space-y-1.5">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-950 text-sm">
                  Zero Outstanding Discrepancies
                </h4>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                  No contradictions or profile deviations were detected.
                </p>
              </div>
            )}

            {/* Warnings list */}
            {aiResult?.warnings && aiResult.warnings.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Advisory Warnings ({aiResult.warnings.length})</span>
                </h4>
                <div className="space-y-1.5">
                  {aiResult.warnings.map((warn, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
                      • {warn}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Record Metadata & Expiry */}
        {activeTab === 'metadata' && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1">
                  Document ID
                </span>
                <span className="font-mono font-bold text-slate-900">{documentRecord.id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1">
                  Upload Date
                </span>
                <span className="font-medium text-slate-900">
                  {documentRecord.uploadDate || 'Not Uploaded Yet'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1">
                  Validation Status
                </span>
                <span className="font-medium text-slate-900">
                  {documentRecord.validationStatus}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1">
                  Mandatory For Clearance
                </span>
                <span className="font-medium text-slate-900">
                  {documentRecord.isRequired ? 'Yes (Statutory Prerequisite)' : 'No (Supplementary)'}
                </span>
              </div>
            </div>

            {/* Expiry Date Editor */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Statutory Expiry / Validity Date</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Current: {currentExpiry}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={currentExpiry}
                  onChange={(e) => setCurrentExpiry(e.target.value)}
                  placeholder="e.g. 2027-12-31 or N/A (Perpetual)"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs w-full focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateDocumentStatus(documentRecord.id, {
                      expiryDate: currentExpiry,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer shrink-0"
                >
                  Save Expiry
                </button>
              </div>
            </div>

            {documentRecord.fileName && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase block mb-0.5">
                    Attached File
                  </span>
                  <span className="font-mono text-slate-800 text-xs">
                    {documentRecord.fileName} (
                    {documentRecord.fileSizeKb
                      ? `${(documentRecord.fileSizeKb / 1024).toFixed(1)} MB`
                      : '1.2 MB'}
                    )
                  </span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                  {documentRecord.format || 'PDF'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-medium">
            INDUSFLOW AI Document Readiness Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
