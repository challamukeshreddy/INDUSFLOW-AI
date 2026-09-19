import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.js';
import { ComplianceDocumentRecord, DocumentStatus } from '../../types/index.js';
import { deriveComplianceDocuments } from './documentModel.js';
import { DocumentUploadModal } from './DocumentUploadModal.js';
import { DocumentDetailModal } from './DocumentDetailModal.js';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  FileCheck,
  ShieldAlert,
  Search,
  Filter,
  Layers,
  AlertOctagon,
  Calendar,
  Building2,
  RefreshCw,
  Plus,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';

export const DocumentHubView: React.FC = () => {
  const {
    approvals,
    documents: rawUploadedDocs,
    preValidateDocument,
    runBatchPreValidation,
    updateDocumentStatus,
    selectedApproval,
  } = useApp();

  // State
  const [activeTab, setActiveTab] = useState<
    'required' | 'uploaded' | 'missing' | 'attention' | 'verified' | 'all'
  >('required');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApprovalFilter, setSelectedApprovalFilter] = useState<string>(
    selectedApproval?.code || 'all'
  );

  React.useEffect(() => {
    if (selectedApproval) {
      setSelectedApprovalFilter(selectedApproval.code);
    }
  }, [selectedApproval]);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadPreset, setUploadPreset] = useState<{
    approvalCode?: string;
    docName?: string;
    docType?: string;
  }>({});
  const [inspectingDoc, setInspectingDoc] = useState<ComplianceDocumentRecord | null>(null);
  const [isBatchValidating, setIsBatchValidating] = useState<boolean>(false);

  // 1. Data-Driven Derivation of the 5 Document Collections
  const derived = useMemo(() => {
    return deriveComplianceDocuments(approvals, rawUploadedDocs);
  }, [approvals, rawUploadedDocs]);

  // Handle batch validation
  const handleBatchValidation = async () => {
    setIsBatchValidating(true);
    try {
      await runBatchPreValidation();
    } catch (err) {
      console.error('Batch validation failed:', err);
    } finally {
      setIsBatchValidating(false);
    }
  };

  // 2. Select document list according to the active tab
  const tabRecords = useMemo(() => {
    switch (activeTab) {
      case 'required':
        return derived.requiredDocuments;
      case 'uploaded':
        return derived.uploadedDocuments;
      case 'missing':
        return derived.missingDocuments;
      case 'attention':
        return derived.attentionDocuments;
      case 'verified':
        return derived.verifiedDocuments;
      case 'all':
      default:
        return derived.allRecords;
    }
  }, [activeTab, derived]);

  // 3. Apply search & approval filter
  const filteredRecords = useMemo(() => {
    return tabRecords.filter((doc) => {
      if (selectedApprovalFilter !== 'all' && doc.relatedApprovalCode !== selectedApprovalFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = doc.name.toLowerCase().includes(q);
        const matchApp = doc.relatedApproval.toLowerCase().includes(q);
        const matchType = doc.documentType.toLowerCase().includes(q);
        const matchIssues = doc.issues.some((i) => i.toLowerCase().includes(q));
        if (!matchName && !matchApp && !matchType && !matchIssues) return false;
      }
      return true;
    });
  }, [tabRecords, selectedApprovalFilter, searchQuery]);

  // Helper for 5 statutory statuses
  const getStatusBadgeConfig = (status: DocumentStatus) => {
    switch (status) {
      case 'VERIFIED':
        return {
          container: 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: CheckCircle2,
          label: 'VERIFIED',
        };
      case 'UNDER REVIEW':
        return {
          container: 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-200',
          badge: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: Clock,
          label: 'UNDER REVIEW',
        };
      case 'NEEDS CORRECTION':
        return {
          container: 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200',
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: AlertOctagon,
          label: 'NEEDS CORRECTION',
        };
      case 'UPLOADED':
        return {
          container: 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-200',
          badge: 'bg-teal-100 text-teal-900 border-teal-300',
          icon: FileCheck,
          label: 'UPLOADED',
        };
      case 'NOT UPLOADED':
      default:
        return {
          container: 'bg-slate-50/80 border-slate-300',
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: XCircle,
          label: 'NOT UPLOADED',
        };
    }
  };

  const handleOpenUploadForDoc = (doc: ComplianceDocumentRecord) => {
    setUploadPreset({
      approvalCode: doc.relatedApprovalCode,
      docName: doc.name,
      docType: doc.documentType,
    });
    setShowUploadModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Main Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shadow-2xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Documents &amp; Statutory Dossier Hub
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized management of required technical drawings, statutory certificates, and automated AI pre-validation audits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleBatchValidation}
              disabled={isBatchValidating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Runs Gemini AI pre-validation consistency checks across all pending dossiers"
            >
              {isBatchValidating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Pre-Validation</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadPreset({});
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* 2. Mandatory Non-Legal Disclaimer Callout Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-950">Statutory Pre-Validation Notice:</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 font-bold">
                Non-Legal Advisory Check
              </span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              The AI Pre-Validation Engine evaluates technical documents for data consistency, metric alignment, and prerequisite completeness against your registered business parameters. <strong>It does NOT legally validate documents</strong> or replace statutory scrutiny, site inspections, and formal certifications by government regulatory authorities (SPCB, DISH, CPCB, or DISCOM).
            </p>
          </div>
        </div>

        {/* 3. The 5 Core Categories Requested: Metric Selector Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* Card 1: Required Documents */}
          <button
            type="button"
            onClick={() => setActiveTab('required')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'required'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                activeTab === 'required' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              1. Required Documents
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono">
                {derived.requiredDocuments.length}
              </span>
              <Layers
                className={`w-4 h-4 ${
                  activeTab === 'required' ? 'text-teal-400' : 'text-slate-400'
                }`}
              />
            </div>
            <p
              className={`text-[10px] mt-1 truncate ${
                activeTab === 'required' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Mandatory clearances
            </p>
          </button>

          {/* Card 2: Uploaded Documents */}
          <button
            type="button"
            onClick={() => setActiveTab('uploaded')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'uploaded'
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-700/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-teal-50/40'
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                activeTab === 'uploaded' ? 'text-teal-100' : 'text-slate-500'
              }`}
            >
              2. Uploaded Documents
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono">
                {derived.uploadedDocuments.length}
              </span>
              <FileText
                className={`w-4 h-4 ${
                  activeTab === 'uploaded' ? 'text-teal-200' : 'text-teal-600'
                }`}
              />
            </div>
            <p
              className={`text-[10px] mt-1 truncate ${
                activeTab === 'uploaded' ? 'text-teal-100' : 'text-slate-500'
              }`}
            >
              Available dossiers
            </p>
          </button>

          {/* Card 3: Missing Documents */}
          <button
            type="button"
            onClick={() => setActiveTab('missing')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'missing'
                ? 'bg-slate-700 text-white border-slate-700 shadow-sm ring-2 ring-slate-700/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                activeTab === 'missing' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              3. Missing Documents
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono">
                {derived.missingDocuments.length}
              </span>
              <XCircle
                className={`w-4 h-4 ${
                  activeTab === 'missing' ? 'text-slate-300' : 'text-slate-500'
                }`}
              />
            </div>
            <p
              className={`text-[10px] mt-1 truncate ${
                activeTab === 'missing' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Pending upload
            </p>
          </button>

          {/* Card 4: Documents Requiring Attention */}
          <button
            type="button"
            onClick={() => setActiveTab('attention')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'attention'
                ? 'bg-rose-700 text-white border-rose-700 shadow-sm ring-2 ring-rose-700/20'
                : 'bg-white border-rose-200 hover:border-rose-300 hover:bg-rose-50/50'
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                activeTab === 'attention' ? 'text-rose-100' : 'text-rose-700'
              }`}
            >
              4. Requiring Attention
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-rose-950">
                {derived.attentionDocuments.length}
              </span>
              <AlertTriangle
                className={`w-4 h-4 ${
                  activeTab === 'attention' ? 'text-rose-200' : 'text-rose-600'
                }`}
              />
            </div>
            <p
              className={`text-[10px] mt-1 truncate ${
                activeTab === 'attention' ? 'text-rose-100' : 'text-rose-600 font-medium'
              }`}
            >
              Discrepancies found
            </p>
          </button>

          {/* Card 5: Verified Documents */}
          <button
            type="button"
            onClick={() => setActiveTab('verified')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'verified'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-700/20'
                : 'bg-white border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                activeTab === 'verified' ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            >
              5. Verified Documents
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-emerald-950">
                {derived.verifiedDocuments.length}
              </span>
              <CheckCircle2
                className={`w-4 h-4 ${
                  activeTab === 'verified' ? 'text-emerald-200' : 'text-emerald-600'
                }`}
              />
            </div>
            <p
              className={`text-[10px] mt-1 truncate ${
                activeTab === 'verified' ? 'text-emerald-100' : 'text-emerald-600 font-medium'
              }`}
            >
              Pre-check cleared
            </p>
          </button>
        </div>

        {/* 4. Filter Toolbar & Search */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Navigation Pill Buttons */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-slate-700 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('required')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'required'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Required ({derived.requiredDocuments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('uploaded')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'uploaded'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Uploaded ({derived.uploadedDocuments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('missing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'missing'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Missing ({derived.missingDocuments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attention')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'attention'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attention ({derived.attentionDocuments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('verified')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'verified'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verified ({derived.verifiedDocuments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({derived.allRecords.length})
            </button>
          </div>

          {/* Search & Approval Dropdown Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents or issues..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-52"
              />
            </div>

            <select
              value={selectedApprovalFilter}
              onChange={(e) => setSelectedApprovalFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 max-w-[200px] truncate"
            >
              <option value="all">All Approvals</option>
              {approvals.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. Document Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((doc) => {
            const statusConfig = getStatusBadgeConfig(doc.status);
            const StatusBadgeIcon = statusConfig.icon;
            const isMissing = doc.status === 'NOT UPLOADED';

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                  doc.status === 'NEEDS CORRECTION'
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : doc.status === 'VERIFIED'
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Related Approval Code + Status Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {doc.relatedApprovalCode || 'STATUTORY'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {doc.format || 'PDF'}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.badge}`}
                    >
                      <StatusBadgeIcon className="w-3 h-3" />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Document Name & Classification */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {doc.documentType}
                    </p>
                  </div>

                  {/* Related Approval Target */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Target Statutory Clearance
                    </span>
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {doc.relatedApproval}
                    </span>
                  </div>

                  {/* Metadata Row: Upload Date, Validation Status & Expiry Date */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block text-[10px]">Upload Date:</span>
                      <span className="font-medium text-slate-700 font-mono">
                        {doc.uploadDate ? doc.uploadDate : '— Not Uploaded —'}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block text-[10px]">Expiry Date:</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{doc.expiryDate || 'N/A (Perpetual)'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Issues Section (Highlighting attention items) */}
                  {doc.issues && doc.issues.length > 0 && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                        doc.status === 'NOT UPLOADED'
                          ? 'bg-slate-100/80 border-slate-200 text-slate-700'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        {doc.status === 'NOT UPLOADED' ? (
                          <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                        <span>
                          {doc.status === 'NOT UPLOADED'
                            ? 'Filing Requirement:'
                            : `${doc.issues.length} Discrepancy Found:`}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-2">
                        {doc.issues[0]}
                      </p>
                    </div>
                  )}

                  {/* AI Pre-Validation Score snippet (if scanned) */}
                  {doc.validationScore !== undefined && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Consistency Match: {doc.validationScore}%
                        </span>
                        <span className="text-[10px] text-teal-700 font-bold">
                          {doc.validationStatus}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            doc.validationScore >= 85
                              ? 'bg-emerald-500'
                              : doc.validationScore >= 70
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${doc.validationScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  {isMissing ? (
                    <button
                      type="button"
                      onClick={() => handleOpenUploadForDoc(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Document</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => preValidateDocument(doc.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Run AI Pre-Validation</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setInspectingDoc(doc)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-950 cursor-pointer"
                  >
                    <span>Inspect Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 p-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h3 className="font-bold text-slate-700 text-sm">
                No Document Records Found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No documents match the active filter or search query. Try clearing filters or uploading a new file.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedApprovalFilter('all');
                setActiveTab('required');
              }}
              className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          initialApprovalCode={uploadPreset.approvalCode}
          initialDocName={uploadPreset.docName}
          initialDocType={uploadPreset.docType}
        />
      )}

      {/* Inspect Document Detail Modal */}
      {inspectingDoc && (
        <DocumentDetailModal
          documentRecord={inspectingDoc}
          onClose={() => setInspectingDoc(null)}
          onUploadReplacement={() => {
            handleOpenUploadForDoc(inspectingDoc);
            setInspectingDoc(null);
          }}
        />
      )}
    </div>
  );
};
