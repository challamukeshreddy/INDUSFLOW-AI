import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import { ApprovalItem } from '../../types/index.js';
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
  const { approvals, uploadDocument, preValidateDocument } = useApp();

  const [selectedApprovalCode, setSelectedApprovalCode] = useState<string>(
    initialApprovalCode || (approvals[0]?.code ?? 'SPCB_CTE')
  );
  const [docName, setDocName] = useState<string>(
    initialDocName || 'Effluent Treatment Plant (ETP) Engineering Drawing'
  );
  const [docType, setDocType] = useState<string>(
    initialDocType || 'Engineering Drawing / Schematic'
  );
  const [expiryDate, setExpiryDate] = useState<string>('2028-03-31');
  const [hasExpiry, setHasExpiry] = useState<boolean>(true);
  const [runAiValidationNow, setRunAiValidationNow] = useState<boolean>(true);
  const [mockContent, setMockContent] = useState<string>(
    'Detailed technical engineering schematic illustrating 65 KLD fresh water intake, 42 KLD effluent discharge, primary neutralization tank, aerobic activated sludge basin, and RO permeate recycling system.'
  );

  // File drag & drop state
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sizeKb: number;
    type: string;
    dataUrl?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Validate format: PDF, PNG, JPG/JPEG
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      alert('Please upload a PDF, PNG, or JPG/JPEG file.');
      return;
    }

    const sizeKb = Math.round(file.size / 1024);
    const fileObj: { name: string; sizeKb: number; type: string; dataUrl?: string } = {
      name: file.name,
      sizeKb: sizeKb || 850,
      type: file.type || (ext === 'pdf' ? 'application/pdf' : 'image/' + ext),
    };

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        fileObj.dataUrl = event.target?.result as string;
        setSelectedFile({ ...fileObj });
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(fileObj);
    }

    if (!docName || docName.includes('Engineering Drawing')) {
      // derive clean name from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setDocName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const fileName = selectedFile?.name || `${docName.replace(/\s+/g, '_')}.pdf`;
      const fileSizeKb = selectedFile?.sizeKb || Math.floor(Math.random() * 1500) + 950;

      const newDoc = await uploadDocument({
        approvalCode: selectedApprovalCode,
        documentTypeCode: docType.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20),
        documentName: docName,
        fileName,
        fileSizeKb,
        status: 'UPLOADED',
        expiryDate: hasExpiry ? expiryDate : 'N/A (Perpetual)',
        issues: [],
        mockContentSnippet: mockContent,
        fileDataUrl: selectedFile?.dataUrl,
      });

      if (newDoc && runAiValidationNow) {
        await preValidateDocument(newDoc.id, mockContent, selectedFile?.dataUrl);
      }

      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Upload Compliance Document
              </h3>
              <p className="text-xs text-slate-500">
                Supports PDF, PNG, and JPG/JPEG files for statutory pre-filing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Non-legal Disclaimer Callout */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Advisory AI Pre-Validation Notice</span>
            <span className="text-[11px] text-amber-800 leading-relaxed">
              Automated pre-checks scan uploaded documents for data consistency with your registered business profile. This does NOT constitute legal validation or statutory government certification.
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. File Upload Dropzone (PDF, PNG, JPG/JPEG) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Select Document File (PDF, PNG, JPG/JPEG) *
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-200'
                  : selectedFile
                  ? 'border-emerald-300 bg-emerald-50/30'
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

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  {selectedFile.type.includes('image') ? (
                    <ImageIcon className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <FileText className="w-8 h-8 text-emerald-600" />
                  )}
                  <div className="text-left">
                    <p className="font-bold text-slate-900 text-xs">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {selectedFile.sizeKb} KB •{' '}
                      <span className="uppercase font-mono text-emerald-700 font-bold">
                        {selectedFile.type.split('/')[1]}
                      </span>
                    </p>
                  </div>
                  <span className="ml-auto text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                    Change File
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                  <p className="font-bold text-slate-800">
                    Click to browse or drag &amp; drop document here
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Accepted formats: <span className="font-semibold text-slate-700">.pdf, .png, .jpg, .jpeg</span> (Max 15MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Target Related Approval */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Related Statutory Approval *
            </label>
            <select
              value={selectedApprovalCode}
              onChange={(e) => setSelectedApprovalCode(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
            >
              {approvals.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.title} ({a.code}) — {a.authority}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Document Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Document Name / Description *
              </label>
              <input
                type="text"
                required
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g., Water Balance & ETP Scheme"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Document Classification / Type *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Engineering Drawing / Schematic">Engineering Drawing / Schematic</option>
                <option value="Detailed Project Report (DPR)">Detailed Project Report (DPR)</option>
                <option value="Legal & Identity Certificate">Legal &amp; Identity Certificate</option>
                <option value="Environmental & Waste Management Plan">Environmental &amp; Waste Management Plan</option>
                <option value="Fire Safety & Evacuation Layout">Fire Safety &amp; Evacuation Layout</option>
                <option value="Electrical Single Line Diagram (SLD)">Electrical Single Line Diagram (SLD)</option>
                <option value="Boiler & Pressure Vessel Certificate">Boiler &amp; Pressure Vessel Certificate</option>
                <option value="Factory Building & Civil Plan">Factory Building &amp; Civil Plan</option>
                <option value="Supplementary Technical Dossier">Supplementary Technical Dossier</option>
              </select>
            </div>
          </div>

          {/* 4. Expiry Date (if applicable) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Document Has Statutory Validity / Expiry Date</span>
              </label>
              <span className="text-[10px] text-slate-400">e.g. NOC or Lease validity</span>
            </div>

            {hasExpiry && (
              <div className="flex items-center gap-2 pt-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-500"
                />
                <span className="text-[11px] text-slate-500">
                  (Used for compliance renewal alerts)
                </span>
              </div>
            )}
          </div>

          {/* 5. Document Content / Technical Summary for AI Analysis */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Technical Content Summary / OCR Snippet (for AI Consistency Check)
            </label>
            <textarea
              rows={2}
              value={mockContent}
              onChange={(e) => setMockContent(e.target.value)}
              placeholder="Key specifications, capacities, chemical names, or dimensions to audit against business profile..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* 6. AI Pre-validation Toggle */}
          <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <div>
                <span className="font-bold text-teal-900 block">
                  Run AI Pre-Validation Upon Upload
                </span>
                <span className="text-[10px] text-teal-700">
                  Immediately tests parameters against your profile for discrepancies.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={runAiValidationNow}
              onChange={(e) => setRunAiValidationNow(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
