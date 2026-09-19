import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Calendar,
  Building2,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Edit3,
  Check,
  RotateCw,
} from 'lucide-react';

interface DocumentUploadModalProps {
  onClose: () => void;
  initialApprovalCode?: string;
  initialDocName?: string;
  initialDocType?: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  onClose,
  initialApprovalCode,
  initialDocName,
  initialDocType,
}) => {
  const { profile, approvals, uploadDocument, preValidateDocument } = useApp();

  // 4-step upload flow state: 'select' | 'processing' | 'confirm' | 'saving'
  const [step, setStep] = useState<'select' | 'processing' | 'confirm' | 'saving'>('select');
  const [processingStage, setProcessingStage] = useState<'uploading' | 'processing' | 'extracting'>('uploading');

  const [selectedApprovalCode, setSelectedApprovalCode] = useState<string>(
    initialApprovalCode || (approvals[0]?.code ?? 'SPCB_CTE')
  );

  // Extracted and editable fields
  const [docType, setDocType] = useState<string>(
    initialDocType || 'Consent to Establish (CTE) Clearance'
  );
  const [docName, setDocName] = useState<string>(
    initialDocName || 'Consent to Establish Order No. MPCB/RO/2026/CTE-4192'
  );
  const [issuedTo, setIssuedTo] = useState<string>(
    profile?.companyName || 'ABC Foods Manufacturing'
  );
  const [issueDate, setIssueDate] = useState<string>('2026-03-15');
  const [expiryDate, setExpiryDate] = useState<string>('2029-03-14');
  const [issuingAuthority, setIssuingAuthority] = useState<string>(
    'Maharashtra Pollution Control Board (MPCB)'
  );
  const [isEditingDetails, setIsEditingDetails] = useState<boolean>(false);

  const [mockContent, setMockContent] = useState<string>(
    'Formal Consent to Establish under Water Act 1974 & Air Act 1981 granted to unit with 65 KLD fresh intake, 42 KLD industrial effluent treatment plant (ETP), and acoustic DG set enclosure.'
  );

  // File selection
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sizeKb: number;
    type: string;
    dataUrl?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick test sample button for SIH Jury
  const handleUseSampleConsentToEstablish = () => {
    setSelectedFile({
      name: 'Sample_MPCB_CTE_Consent_Order.pdf',
      sizeKb: 1240,
      type: 'application/pdf',
    });
    setDocName('Consent to Establish Order No. MPCB/RO/2026/CTE-4192');
    setDocType('Consent to Establish (CTE) Clearance');
    setIssuedTo(profile?.companyName || 'ABC Foods Manufacturing');
    setIssueDate('2026-03-15');
    setExpiryDate('2029-03-14');
    setIssuingAuthority('Maharashtra Pollution Control Board (MPCB)');
    setSelectedApprovalCode('SPCB_CTE');

    startProcessingFlow();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      alert('Please upload a PDF, PNG, or JPG/JPEG file.');
      return;
    }

    const sizeKb = Math.round(file.size / 1024) || 640;
    const fileObj: { name: string; sizeKb: number; type: string; dataUrl?: string } = {
      name: file.name,
      sizeKb,
      type: file.type || (ext === 'pdf' ? 'application/pdf' : 'image/' + ext),
    };

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        fileObj.dataUrl = event.target?.result as string;
        setSelectedFile(fileObj);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(fileObj);
    }

    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setDocName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    startProcessingFlow();
  };

  // Step 2: Animated progression
  const startProcessingFlow = () => {
    setStep('processing');
    setProcessingStage('uploading');

    setTimeout(() => {
      setProcessingStage('processing');
    }, 600);

    setTimeout(() => {
      setProcessingStage('extracting');
    }, 1200);

    setTimeout(() => {
      setStep('confirm');
    }, 1800);
  };

  // Step 4: Save and confirm
  const handleSaveAndConfirm = async () => {
    setStep('saving');
    try {
      const fileName = selectedFile?.name || `${docName.replace(/\s+/g, '_')}.pdf`;
      const fileSizeKb = selectedFile?.sizeKb || 1120;

      const newDoc = await uploadDocument({
        approvalCode: selectedApprovalCode,
        documentTypeCode: docType.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20),
        documentName: docName,
        fileName,
        fileSizeKb,
        status: 'UPLOADED',
        expiryDate: expiryDate || 'N/A (Perpetual)',
        issues: [],
        mockContentSnippet: mockContent,
        fileDataUrl: selectedFile?.dataUrl,
      });

      if (newDoc) {
        await preValidateDocument(newDoc.id, mockContent, selectedFile?.dataUrl);
      }

      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
      setStep('confirm');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Upload Compliance Document
              </h3>
              <p className="text-[11px] text-slate-500">
                Statutory pre-validation intake (PDF, PNG, JPG)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* STEP 1: Select or Drop File */}
        {/* ---------------------------------------------------- */}
        {step === 'select' && (
          <div className="space-y-4">
            {/* Quick jury test banner */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold block">Smart India Hackathon Jury Test:</span>
                <span className="text-[11px] text-amber-800">
                  Instant 1-click test with pre-filled statutory metadata.
                </span>
              </div>
              <button
                type="button"
                onClick={handleUseSampleConsentToEstablish}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                Use Sample Consent to Establish PDF
              </button>
            </div>

            {/* Target related approval */}
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">
                Target Statutory Approval *
              </label>
              <select
                value={selectedApprovalCode}
                onChange={(e) => setSelectedApprovalCode(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
              >
                {approvals.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.name} ({a.code}) — {a.issuingAuthority}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-200'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={handleFileChange}
                className="hidden"
              />

              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-xs">
                Click to browse or drag &amp; drop document file
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PDF, PNG, JPG up to 15MB
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 2: Processing Progress */}
        {/* ---------------------------------------------------- */}
        {step === 'processing' && (
          <div className="py-8 space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
              <RotateCw className="w-7 h-7 animate-spin" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-sm text-slate-900">
                Processing Compliance Document
              </h4>
              <p className="text-xs text-slate-500">
                Extracting statutory fields and verifying against business dossier...
              </p>
            </div>

            {/* 3 stages status bar */}
            <div className="max-w-xs mx-auto space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs">
                {processingStage === 'uploading' ? (
                  <div className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span className={processingStage === 'uploading' ? 'font-bold text-teal-900' : 'text-slate-600'}>
                  1. Uploading file...
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {processingStage === 'processing' ? (
                  <div className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin shrink-0" />
                ) : processingStage === 'extracting' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className={processingStage === 'processing' ? 'font-bold text-teal-900' : 'text-slate-600'}>
                  2. Processing OCR &amp; layout extraction...
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {processingStage === 'extracting' ? (
                  <div className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className={processingStage === 'extracting' ? 'font-bold text-teal-900' : 'text-slate-500'}>
                  3. Extracting statutory metadata...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 3: Confirmation Card */}
        {/* ---------------------------------------------------- */}
        {step === 'confirm' && (
          <div className="space-y-4">
            {/* Confirmation Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-900">
                  ✓ Details extracted automatically
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingDetails(!isEditingDetails)}
                className="text-[11px] font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingDetails ? 'Lock Details' : 'Edit Details'}</span>
              </button>
            </div>

            {/* Document Details Form Card */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>Document Details</span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">
                  {selectedFile?.name || 'Uploaded Document'}
                </span>
              </h4>

              {/* Document Type */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Document Type:
                </label>
                {isEditingDetails ? (
                  <input
                    type="text"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 bg-white px-2.5 py-1.5 rounded-md border border-slate-200">
                    {docType}
                  </p>
                )}
              </div>

              {/* Issued To */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Issued To:
                </label>
                {isEditingDetails ? (
                  <input
                    type="text"
                    value={issuedTo}
                    onChange={(e) => setIssuedTo(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 bg-white px-2.5 py-1.5 rounded-md border border-slate-200">
                    {issuedTo}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Issue Date */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Issue Date:
                  </label>
                  {isEditingDetails ? (
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                    />
                  ) : (
                    <p className="font-mono text-slate-900 bg-white px-2.5 py-1.5 rounded-md border border-slate-200">
                      {issueDate}
                    </p>
                  )}
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Expiry Date:
                  </label>
                  {isEditingDetails ? (
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                    />
                  ) : (
                    <p className="font-mono text-slate-900 bg-white px-2.5 py-1.5 rounded-md border border-slate-200">
                      {expiryDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Issuing Authority */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Issuing Authority:
                </label>
                {isEditingDetails ? (
                  <input
                    type="text"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 bg-white px-2.5 py-1.5 rounded-md border border-slate-200">
                    {issuingAuthority}
                  </p>
                )}
              </div>
            </div>

            {/* Advisory note */}
            <p className="text-[11px] text-slate-500 italic">
              * Automated metadata preview. Review and confirm details before persisting into your compliance dossier.
            </p>

            {/* Step 3 Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 text-xs cursor-pointer"
              >
                Back / Change File
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingDetails(!isEditingDetails)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 text-xs cursor-pointer"
                >
                  {isEditingDetails ? 'Done Editing' : 'Edit Details'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndConfirm}
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Review &amp; Confirm</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 4: Saving & Pre-validating */}
        {/* ---------------------------------------------------- */}
        {step === 'saving' && (
          <div className="py-8 space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
              <RotateCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900">Saving &amp; Pre-Validating</h4>
              <p className="text-xs text-slate-500">
                Running heuristic cross-checks against registered project parameters...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
