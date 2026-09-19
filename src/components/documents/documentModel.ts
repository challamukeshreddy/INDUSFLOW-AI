import { ApprovalItem, UploadedDocument, ComplianceDocumentRecord, DocumentStatus } from '../../types/index.js';

export interface DerivedDocumentsState {
  allRecords: ComplianceDocumentRecord[];
  requiredDocuments: ComplianceDocumentRecord[];
  uploadedDocuments: ComplianceDocumentRecord[];
  missingDocuments: ComplianceDocumentRecord[];
  attentionDocuments: ComplianceDocumentRecord[];
  verifiedDocuments: ComplianceDocumentRecord[];
}

/**
 * Derives a consolidated list of document records by joining
 * statutory approval requirements with uploaded files.
 */
export function deriveComplianceDocuments(
  approvals: ApprovalItem[],
  uploadedDocs: UploadedDocument[]
): DerivedDocumentsState {
  const records: ComplianceDocumentRecord[] = [];
  const processedUploadIds = new Set<string>();

  // 1. Process all required documents defined across applicable approvals
  approvals.forEach((approval) => {
    const reqDocs = approval.requiredDocuments || [];

    reqDocs.forEach((reqDef, index) => {
      // Find if there is an uploaded document corresponding to this approval & document type
      const matchingUpload = uploadedDocs.find(
        (u) =>
          !processedUploadIds.has(u.id) &&
          (u.approvalCode === approval.code || u.approvalTitle.includes(approval.title)) &&
          (u.documentTypeCode === reqDef.code ||
            u.documentName.toLowerCase().includes(reqDef.name.toLowerCase()) ||
            reqDef.name.toLowerCase().includes(u.documentName.toLowerCase()))
      );

      if (matchingUpload) {
        processedUploadIds.add(matchingUpload.id);

        // Determine unified status
        let status: DocumentStatus = matchingUpload.status || 'UPLOADED';
        const issues: string[] = matchingUpload.issues ? [...matchingUpload.issues] : [];

        if (matchingUpload.validationResult) {
          if (
            matchingUpload.validationResult.status === 'passed' &&
            matchingUpload.validationResult.criticalDiscrepancies.length === 0
          ) {
            status = 'VERIFIED';
          } else if (
            matchingUpload.validationResult.status === 'mismatch' ||
            matchingUpload.validationResult.criticalDiscrepancies.length > 0
          ) {
            status = 'NEEDS CORRECTION';
            if (issues.length === 0) {
              issues.push(...matchingUpload.validationResult.criticalDiscrepancies);
            }
          } else if (matchingUpload.validationResult.status === 'warning') {
            status = 'UNDER REVIEW';
            if (issues.length === 0) {
              issues.push(...matchingUpload.validationResult.advisoryNotes);
            }
          }
        }

        // Determine validationStatus text
        let validationStatusText = 'Not Scanned';
        if (matchingUpload.validationStatus === 'passed') {
          validationStatusText = 'Passed (AI Consistency Checked)';
        } else if (matchingUpload.validationStatus === 'mismatch') {
          validationStatusText = 'Discrepancy Detected';
        } else if (matchingUpload.validationStatus === 'warning') {
          validationStatusText = 'Advisory Warning';
        } else if (matchingUpload.validationStatus === 'validating') {
          validationStatusText = 'Scanning...';
        } else if (matchingUpload.status === 'VERIFIED') {
          validationStatusText = 'Verified';
        }

        records.push({
          id: matchingUpload.id,
          name: matchingUpload.documentName || reqDef.name,
          documentType: reqDef.description || 'Statutory Technical Dossier',
          relatedApproval: `${approval.title} (${approval.code})`,
          relatedApprovalCode: approval.code,
          status,
          uploadDate: matchingUpload.uploadedAt ? matchingUpload.uploadedAt.split(' ')[0] : '2026-08-25',
          validationStatus: validationStatusText,
          issues,
          expiryDate: matchingUpload.expiryDate || (approval.code.includes('CTE') ? '2027-08-31' : 'N/A (Perpetual)'),
          fileName: matchingUpload.fileName,
          fileSizeKb: matchingUpload.fileSizeKb,
          fileType: matchingUpload.fileName.endsWith('.png')
            ? 'image/png'
            : matchingUpload.fileName.endsWith('.jpg') || matchingUpload.fileName.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'application/pdf',
          isRequired: true,
          format: reqDef.format || 'PDF',
          description: reqDef.description,
          validationScore: matchingUpload.validationResult?.score,
          advisoryNotes: matchingUpload.validationResult?.advisoryNotes,
          verifiedFields: matchingUpload.validationResult?.verifiedFields,
          geminiValidated: matchingUpload.validationResult?.geminiValidated,
          aiPreValidation: matchingUpload.aiPreValidation || matchingUpload.validationResult?.aiPreValidation,
        });
      } else {
        // Not uploaded yet: create a "NOT UPLOADED" record
        const syntheticId = `doc_req_${approval.code}_${reqDef.code || index}`;

        records.push({
          id: syntheticId,
          name: reqDef.name,
          documentType: reqDef.description || 'Statutory Requirement',
          relatedApproval: `${approval.title} (${approval.code})`,
          relatedApprovalCode: approval.code,
          status: 'NOT UPLOADED',
          uploadDate: null,
          validationStatus: 'Pending Upload',
          issues: ['Mandatory document not yet uploaded for statutory submission.'],
          expiryDate: null,
          fileName: undefined,
          fileSizeKb: undefined,
          fileType: undefined,
          isRequired: true,
          format: reqDef.format || 'PDF',
          description: reqDef.description,
        });
      }
    });
  });

  // 2. Add any remaining uploaded documents that weren't strictly matched to an approval's required list
  uploadedDocs.forEach((u) => {
    if (!processedUploadIds.has(u.id)) {
      processedUploadIds.add(u.id);

      let status: DocumentStatus = u.status || 'UPLOADED';
      const issues: string[] = u.issues ? [...u.issues] : [];

      if (u.validationResult) {
        if (
          u.validationResult.status === 'passed' &&
          u.validationResult.criticalDiscrepancies.length === 0
        ) {
          status = 'VERIFIED';
        } else if (
          u.validationResult.status === 'mismatch' ||
          u.validationResult.criticalDiscrepancies.length > 0
        ) {
          status = 'NEEDS CORRECTION';
          if (issues.length === 0) issues.push(...u.validationResult.criticalDiscrepancies);
        } else if (u.validationResult.status === 'warning') {
          status = 'UNDER REVIEW';
          if (issues.length === 0) issues.push(...u.validationResult.advisoryNotes);
        }
      }

      records.push({
        id: u.id,
        name: u.documentName,
        documentType: u.documentTypeCode || 'Supplementary Technical Dossier',
        relatedApproval: `${u.approvalTitle} (${u.approvalCode})`,
        relatedApprovalCode: u.approvalCode,
        status,
        uploadDate: u.uploadedAt ? u.uploadedAt.split(' ')[0] : '2026-09-01',
        validationStatus:
          u.validationStatus === 'passed'
            ? 'Passed'
            : u.validationStatus === 'mismatch'
            ? 'Discrepancy Detected'
            : u.validationStatus === 'warning'
            ? 'Advisory Warning'
            : u.validationStatus === 'validating'
            ? 'Scanning...'
            : 'Unvalidated',
        issues,
        expiryDate: u.expiryDate || null,
        fileName: u.fileName,
        fileSizeKb: u.fileSizeKb,
        fileType: u.fileName.endsWith('.png')
          ? 'image/png'
          : u.fileName.endsWith('.jpg') || u.fileName.endsWith('.jpeg')
          ? 'image/jpeg'
          : 'application/pdf',
        isRequired: false,
        format: u.fileName.split('.').pop()?.toUpperCase() || 'PDF',
        description: 'Uploaded compliance file',
        validationScore: u.validationResult?.score,
        advisoryNotes: u.validationResult?.advisoryNotes,
        verifiedFields: u.validationResult?.verifiedFields,
        geminiValidated: u.validationResult?.geminiValidated,
        aiPreValidation: u.aiPreValidation || u.validationResult?.aiPreValidation,
      });
    }
  });

  // 3. Compute categorical slices
  const requiredDocuments = records.filter((r) => r.isRequired);
  const uploadedDocuments = records.filter((r) => r.status !== 'NOT UPLOADED');
  const missingDocuments = records.filter((r) => r.status === 'NOT UPLOADED');
  const attentionDocuments = records.filter(
    (r) => r.status === 'NEEDS CORRECTION' || (r.issues && r.issues.length > 0 && r.status !== 'NOT UPLOADED')
  );
  const verifiedDocuments = records.filter((r) => r.status === 'VERIFIED');

  return {
    allRecords: records,
    requiredDocuments,
    uploadedDocuments,
    missingDocuments,
    attentionDocuments,
    verifiedDocuments,
  };
}
