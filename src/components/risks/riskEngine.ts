import {
  ApprovalItem,
  BusinessProfile,
  UploadedDocument,
  BottleneckAlert,
  RiskSeverity,
  BottleneckCategory,
} from '../../types/index.js';

export interface ExplainableRiskScoreBreakdownItem {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
  pointsPerItem: number;
  subtotal: number;
  description: string;
}

export interface PrimaryRiskDriver {
  id: string;
  issue: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedApproval: string;
  downstreamImpact: string;
  recommendedAction: string;
  pointsContributed: number;
  category: BottleneckCategory;
}

export interface ExplainableRiskScore {
  compositeRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  overallRiskScore: number; // 0 to 100
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalBottlenecks: number;
  totalDownstreamBlocked: number;
  cumulativeDelayDays: number;
  scoreBreakdown: ExplainableRiskScoreBreakdownItem[];
  primaryRiskDrivers: PrimaryRiskDriver[];
  categoryCounts: Record<BottleneckCategory, number>;
  explanationSummary: string;
  disclaimer: string;
}

/**
 * Normalizes any casing of severity to canonical uppercase
 */
export function normalizeSeverity(severity: string | undefined): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  const s = (severity || '').toUpperCase();
  if (s === 'CRITICAL') return 'CRITICAL';
  if (s === 'HIGH') return 'HIGH';
  if (s === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

/**
 * Computes downstream dependent approvals that rely on a given approval code
 */
function getDownstreamApprovals(approvalCode: string, allApprovals: ApprovalItem[]): ApprovalItem[] {
  return allApprovals.filter((item) => {
    const deps = item.dependencies || item.prerequisites || [];
    return deps.includes(approvalCode);
  });
}

/**
 * Detect prototype bottlenecks across the 6 mandated sources:
 * 1. missing documents
 * 2. overdue applications
 * 3. unresolved queries
 * 4. blocked dependencies
 * 5. upcoming deadlines
 * 6. document inconsistencies
 */
export function detectAllBottlenecks(
  approvals: ApprovalItem[],
  profile: BusinessProfile | null,
  documents: UploadedDocument[] = []
): BottleneckAlert[] {
  const alerts: BottleneckAlert[] = [];
  const referenceDateMs = new Date('2026-09-14T00:00:00Z').getTime();

  // Map uploaded documents by approvalCode and doc type
  const uploadedDocMap = new Map<string, UploadedDocument[]>();
  for (const doc of documents) {
    const list = uploadedDocMap.get(doc.approvalCode) || [];
    list.push(doc);
    uploadedDocMap.set(doc.approvalCode, list);
  }

  // ----------------------------------------------------
  // 1. MISSING DOCUMENTS
  // ----------------------------------------------------
  for (const approval of approvals) {
    // Check approvals that are not yet approved
    if (approval.status === 'approved') continue;

    const uploadedForThis = uploadedDocMap.get(approval.code) || [];
    const downstream = getDownstreamApprovals(approval.code, approvals);
    const downstreamCount = downstream.length;
    const downstreamNames = downstream.map((d) => d.name);

    for (const reqDoc of approval.requiredDocuments || []) {
      const match = uploadedForThis.find((u) => {
        if (u.documentTypeCode && reqDoc.code && u.documentTypeCode === reqDoc.code) return true;
        return (
          u.documentName?.toLowerCase().trim() === reqDoc.name?.toLowerCase().trim()
        );
      });

      const isMissing = !match || match.status === 'NOT UPLOADED';

      if (isMissing) {
        // Evaluate severity based on critical path and active filing status
        let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (approval.status === 'query_raised') {
          severity = 'CRITICAL';
        } else if (approval.isCriticalPath || approval.status === 'in_review' || approval.status === 'documents_pending') {
          severity = 'HIGH';
        }

        const impactText =
          downstreamCount > 0
            ? `${downstreamCount} downstream approval activities are blocked: ${downstreamNames.slice(0, 2).join(', ')}${downstreamCount > 2 ? ` (+${downstreamCount - 2} more)` : ''} cannot proceed.`
            : `Statutory application dossier for ${approval.name} cannot be formally lodged with ${approval.authority}.`;

        alerts.push({
          id: `bot_missing_${approval.code}_${reqDoc.code}`,
          severity,
          category: 'missing_documents',
          issue: `Required document missing: ${reqDoc.name}`,
          affectedApproval: `${approval.name} (${approval.code})`,
          approvalCode: approval.code,
          approvalTitle: approval.name,
          downstreamImpact: impactText,
          recommendedAction: `Upload the corrected ${reqDoc.name} document in PDF or image format in the Documents Module.`,
          impactOnCommercialDateDays: approval.isCriticalPath ? 21 : 10,
          routeTab: 'documents',
          title: `Required document missing: ${reqDoc.name}`,
          description: `Mandatory document ${reqDoc.name} has not been uploaded for ${approval.name}. ${impactText}`,
          suggestedAction: `Upload the corrected ${reqDoc.name} in Documents module.`,
          mitigationRecommendation: `Upload the corrected ${reqDoc.name} in Documents module.`,
          type: 'document_gap',
        });
      }
    }
  }

  // ----------------------------------------------------
  // 2. OVERDUE APPLICATIONS
  // ----------------------------------------------------
  for (const approval of approvals) {
    if (approval.status === 'in_review') {
      const sla = approval.slaDays || 30;
      const daysElapsed = approval.daysElapsed || 0;
      const ratio = daysElapsed / sla;

      if (ratio >= 0.8) {
        let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (daysElapsed >= sla * 1.5 || daysElapsed - sla >= 15) {
          severity = 'CRITICAL';
        } else if (daysElapsed >= sla) {
          severity = 'HIGH';
        }

        const overdueDays = Math.max(0, daysElapsed - sla);
        const downstream = getDownstreamApprovals(approval.code, approvals);
        const downstreamCount = downstream.length;

        const impactText =
          overdueDays > 0
            ? `Review time exceeded by ${overdueDays} working days. Stalls ${downstreamCount} downstream clearances and risks delay to commercial plant commissioning.`
            : `Department SLA review timeline has elapsed ${Math.round(ratio * 100)}%. Nearing statutory deadline without official sanction.`;

        alerts.push({
          id: `bot_overdue_${approval.code}`,
          severity,
          category: 'overdue_applications',
          issue: `Statutory Review SLA Overdue: ${daysElapsed} days elapsed against limit of ${sla} days (${approval.issuingAuthority})`,
          affectedApproval: `${approval.name} (${approval.code})`,
          approvalCode: approval.code,
          approvalTitle: approval.name,
          downstreamImpact: impactText,
          recommendedAction: `Lodge an official SLA escalation grievance via the State Single Window Grievance Redressal portal or contact the Competent Authority officer.`,
          impactOnCommercialDateDays: Math.max(14, overdueDays + 10),
          routeTab: 'tracker',
          title: `Statutory Review SLA Overdue: ${approval.name}`,
          description: `${approval.authority} review timeline exceeded statutory SLA (${daysElapsed}/${sla} days). ${impactText}`,
          suggestedAction: `Lodge an official SLA escalation grievance via the State Single Window portal.`,
          mitigationRecommendation: `Generate an automated status escalation grievance through the State Single Window Grievance Redressal mechanism.`,
          type: 'sla_breach_risk',
        });
      }
    }
  }

  // ----------------------------------------------------
  // 3. UNRESOLVED QUERIES
  // ----------------------------------------------------
  for (const approval of approvals) {
    if (approval.status === 'query_raised' && approval.queryDetails) {
      const q = approval.queryDetails;
      let daysRemaining = 15;
      if (q.deadlineDate) {
        const dueMs = new Date(q.deadlineDate).getTime();
        daysRemaining = Math.max(0, Math.ceil((dueMs - referenceDateMs) / (1000 * 60 * 60 * 24)));
      }

      // Severity is CRITICAL if deadline <= 7 days or officer urgency is critical
      const severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' =
        daysRemaining <= 7 || q.urgency === 'critical' ? 'CRITICAL' : 'HIGH';

      const downstream = getDownstreamApprovals(approval.code, approvals);
      const downstreamCount = downstream.length;

      const impactText = `Application scrutiny is completely halted. If clarification is not submitted by statutory deadline (${q.deadlineDate || '15 days'}), the application is deemed rejected with forfeiture of fees, blocking ${downstreamCount} downstream approvals.`;

      alerts.push({
        id: `bot_query_${approval.code}`,
        severity,
        category: 'unresolved_queries',
        issue: `Unresolved Department Clarification Query: "${q.queryText}" raised by ${q.departmentOfficer}`,
        affectedApproval: `${approval.name} (${approval.code})`,
        approvalCode: approval.code,
        approvalTitle: approval.name,
        downstreamImpact: impactText,
        recommendedAction: `Upload revised documentation and submit statutory clarification response before ${q.deadlineDate}.`,
        impactOnCommercialDateDays: 21,
        dueDate: q.deadlineDate,
        routeTab: 'tracker',
        title: `Clarification Notice Pending: ${approval.name}`,
        description: `Department Officer (${q.departmentOfficer}) raised query: "${q.queryText}". ${impactText}`,
        suggestedAction: `Upload revised documentation responding to the query on the department portal immediately.`,
        mitigationRecommendation: `Upload revised documentation responding to the query on the department portal immediately to avert application rejection.`,
        type: 'query_overdue',
      });
    }
  }

  // ----------------------------------------------------
  // 4. BLOCKED DEPENDENCIES
  // ----------------------------------------------------
  for (const approval of approvals) {
    if (approval.status === 'not_started' || approval.status === 'documents_pending') {
      const prereqCodes = approval.dependencies || approval.prerequisites || [];
      const unapprovedPrereqs = prereqCodes.filter((pCode) => {
        const prereq = approvals.find((a) => a.code === pCode);
        return !prereq || prereq.status !== 'approved';
      });

      if (unapprovedPrereqs.length > 0) {
        const unapprovedNames = unapprovedPrereqs.map(
          (c) => approvals.find((a) => a.code === c)?.name || c
        );
        const downstream = getDownstreamApprovals(approval.code, approvals);
        const downstreamCount = downstream.length;

        const severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' =
          approval.isCriticalPath ? 'HIGH' : 'MEDIUM';

        const impactText = `${approval.name} cannot be legally lodged with ${approval.authority} until prerequisites are formally granted. ${downstreamCount} downstream lifecycle activities remain locked.`;

        alerts.push({
          id: `bot_dep_${approval.code}`,
          severity,
          category: 'blocked_dependencies',
          issue: `Prerequisite dependency blocked: Awaiting ${unapprovedPrereqs.length} prerequisite clearance(s): ${unapprovedNames.slice(0, 2).join(', ')}`,
          affectedApproval: `${approval.name} (${approval.code})`,
          approvalCode: approval.code,
          approvalTitle: approval.name,
          downstreamImpact: impactText,
          recommendedAction: `Expedite submission and clearance of prerequisite approvals (${unapprovedPrereqs.join(', ')}).`,
          impactOnCommercialDateDays: approval.isCriticalPath ? 30 : 15,
          routeTab: 'dependencies',
          title: `Critical Path Blocked: Awaiting Prerequisites`,
          description: `Cannot apply for ${approval.name} until prerequisite approvals are formally granted: ${unapprovedNames.join(', ')}.`,
          suggestedAction: `Expedite submission and clearance of prerequisite approvals (${unapprovedPrereqs.join(', ')}).`,
          mitigationRecommendation: `Expedite submission and clearance of prerequisite approvals (${unapprovedPrereqs.join(', ')}).`,
          type: 'dependency_blocked',
        });
      }
    }
  }

  // ----------------------------------------------------
  // 5. UPCOMING DEADLINES
  // ----------------------------------------------------
  for (const approval of approvals) {
    // Deadlines on queries
    if (approval.status === 'query_raised' && approval.queryDetails?.deadlineDate) {
      const dueMs = new Date(approval.queryDetails.deadlineDate).getTime();
      const daysRemaining = Math.max(0, Math.ceil((dueMs - referenceDateMs) / (1000 * 60 * 60 * 24)));

      if (daysRemaining <= 15) {
        const severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' =
          daysRemaining <= 5 ? 'CRITICAL' : daysRemaining <= 10 ? 'HIGH' : 'MEDIUM';

        alerts.push({
          id: `bot_deadline_query_${approval.code}`,
          severity,
          category: 'upcoming_deadlines',
          issue: `Statutory query response deadline approaching in ${daysRemaining} days (Due: ${approval.queryDetails.deadlineDate})`,
          affectedApproval: `${approval.name} (${approval.code})`,
          approvalCode: approval.code,
          approvalTitle: approval.name,
          downstreamImpact: `Missing the ${approval.queryDetails.deadlineDate} statutory deadline triggers automatic application cancellation and forfeiture of filing fees.`,
          recommendedAction: `Finalize response dossier and submit on State Single Window before ${approval.queryDetails.deadlineDate}.`,
          impactOnCommercialDateDays: 25,
          dueDate: approval.queryDetails.deadlineDate,
          routeTab: 'tracker',
          title: `Statutory Response Deadline Looming: ${approval.name}`,
          description: `Statutory countdown expires in ${daysRemaining} days. Non-compliance results in deemed refusal.`,
          suggestedAction: `Prioritize filing response within ${daysRemaining} days.`,
          mitigationRecommendation: `Submit technical clarifications before statutory deadline.`,
          type: 'query_overdue',
        });
      }
    }
  }

  // Check document expiry dates within next 45 days
  for (const doc of documents) {
    if (doc.expiryDate) {
      const expMs = new Date(doc.expiryDate).getTime();
      if (!isNaN(expMs)) {
        const daysRemaining = Math.max(0, Math.ceil((expMs - referenceDateMs) / (1000 * 60 * 60 * 24)));
        if (daysRemaining <= 30) {
          const severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' =
            daysRemaining <= 7 ? 'CRITICAL' : daysRemaining <= 15 ? 'HIGH' : 'MEDIUM';

          alerts.push({
            id: `bot_doc_expiry_${doc.id}`,
            severity,
            category: 'upcoming_deadlines',
            issue: `Statutory document validity expiring in ${daysRemaining} days (${doc.documentName})`,
            affectedApproval: `${doc.approvalTitle} (${doc.approvalCode})`,
            approvalCode: doc.approvalCode,
            approvalTitle: doc.approvalTitle,
            downstreamImpact: `Expired document invalidates statutory filing; department inspection will reject the application dossier.`,
            recommendedAction: `Renew ${doc.documentName} and upload updated certified copy before ${doc.expiryDate}.`,
            impactOnCommercialDateDays: 14,
            dueDate: doc.expiryDate,
            routeTab: 'documents',
            title: `Document Validity Expiring: ${doc.documentName}`,
            description: `Document expires on ${doc.expiryDate}. Submissions with expired certificates will be rejected.`,
            suggestedAction: `Renew document with issuing authority immediately.`,
            mitigationRecommendation: `Renew document and upload updated copy.`,
            type: 'document_gap',
          });
        }
      }
    }
  }

  // ----------------------------------------------------
  // 6. DOCUMENT INCONSISTENCIES
  // ----------------------------------------------------
  for (const doc of documents) {
    const isCorrectionNeeded =
      doc.status === 'NEEDS CORRECTION' ||
      doc.validationStatus === 'mismatch' ||
      (doc.issues && doc.issues.length > 0) ||
      (doc.validationResult?.status === 'mismatch') ||
      (doc.aiPreValidation?.inconsistencies && doc.aiPreValidation.inconsistencies.length > 0);

    if (isCorrectionNeeded) {
      const relatedAppr = approvals.find((a) => a.code === doc.approvalCode);
      const isCriticalAppr = relatedAppr?.isCriticalPath || relatedAppr?.status === 'query_raised';

      const severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = isCriticalAppr ? 'HIGH' : 'MEDIUM';

      const issuesText =
        doc.issues && doc.issues.length > 0
          ? doc.issues.join('; ')
          : doc.validationResult?.criticalDiscrepancies?.join('; ') ||
            doc.aiPreValidation?.inconsistencies?.join('; ') ||
            'Technical data mismatch with registered business profile';

      const impactText = `Department scrutinizing officers will reject the filing or raise a formal clarification query due to contradictory parameters (${issuesText.slice(0, 80)}...), introducing 15-30 days of procedural delay.`;

      alerts.push({
        id: `bot_inconsistency_${doc.id}`,
        severity,
        category: 'document_inconsistencies',
        issue: `Document Inconsistency Detected: ${issuesText}`,
        affectedApproval: `${doc.approvalTitle} (${doc.approvalCode})`,
        approvalCode: doc.approvalCode,
        approvalTitle: doc.approvalTitle,
        downstreamImpact: impactText,
        recommendedAction: `Review AI pre-validation findings in Documents module, reconcile conflicting fields, and re-upload the revised document.`,
        impactOnCommercialDateDays: isCriticalAppr ? 21 : 14,
        routeTab: 'documents',
        title: `Document Inconsistency Detected: ${doc.documentName}`,
        description: `Discrepancies found in ${doc.documentName}: ${issuesText}.`,
        suggestedAction: `Correct document and re-upload in Documents module.`,
        mitigationRecommendation: `Re-upload revised document matching business profile.`,
        type: 'document_gap',
      });
    }
  }

  // Sort alerts by severity order: CRITICAL > HIGH > MEDIUM > LOW
  const severityOrder: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  alerts.sort((a, b) => {
    const sevDiff = severityOrder[normalizeSeverity(b.severity)] - severityOrder[normalizeSeverity(a.severity)];
    if (sevDiff !== 0) return sevDiff;
    return (b.impactOnCommercialDateDays || 0) - (a.impactOnCommercialDateDays || 0);
  });

  return alerts;
}

/**
 * Calculates a fully explainable, transparent risk score and breakdown.
 * Does NOT invent arbitrary numerical claims or black-box percentages.
 */
export function calculateExplainableRiskScore(
  bottlenecks: BottleneckAlert[]
): ExplainableRiskScore {
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  const categoryCounts: Record<BottleneckCategory, number> = {
    missing_documents: 0,
    overdue_applications: 0,
    unresolved_queries: 0,
    blocked_dependencies: 0,
    upcoming_deadlines: 0,
    document_inconsistencies: 0,
  };

  for (const b of bottlenecks) {
    const sev = normalizeSeverity(b.severity);
    if (sev === 'CRITICAL') criticalCount++;
    else if (sev === 'HIGH') highCount++;
    else if (sev === 'MEDIUM') mediumCount++;
    else lowCount++;

    if (b.category && categoryCounts[b.category] !== undefined) {
      categoryCounts[b.category]++;
    }
  }

  // Calculate explainable composite level
  let compositeRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (criticalCount >= 1) {
    compositeRiskLevel = 'CRITICAL';
  } else if (highCount >= 2 || (highCount >= 1 && mediumCount >= 2)) {
    compositeRiskLevel = 'HIGH';
  } else if (highCount >= 1 || mediumCount >= 2) {
    compositeRiskLevel = 'MEDIUM';
  } else {
    compositeRiskLevel = 'LOW';
  }

  // Mathematical point model:
  // CRITICAL: 25 pts each
  // HIGH: 15 pts each
  // MEDIUM: 8 pts each
  // LOW: 3 pts each
  const criticalPoints = criticalCount * 25;
  const highPoints = highCount * 15;
  const mediumPoints = mediumCount * 8;
  const lowPoints = lowCount * 3;

  const rawScore = criticalPoints + highPoints + mediumPoints + lowPoints;
  const overallRiskScore = Math.min(100, Math.max(0, rawScore));

  const scoreBreakdown: ExplainableRiskScoreBreakdownItem[] = [
    {
      severity: 'CRITICAL',
      count: criticalCount,
      pointsPerItem: 25,
      subtotal: criticalPoints,
      description: 'Immediate procedural forfeiture or statutory cancellation threat',
    },
    {
      severity: 'HIGH',
      count: highCount,
      pointsPerItem: 15,
      subtotal: highPoints,
      description: 'Critical path prerequisite blocks or breached statutory review SLAs',
    },
    {
      severity: 'MEDIUM',
      count: mediumCount,
      pointsPerItem: 8,
      subtotal: mediumPoints,
      description: 'Non-critical prerequisite delays, impending deadlines, or data mismatches',
    },
    {
      severity: 'LOW',
      count: lowCount,
      pointsPerItem: 3,
      subtotal: lowPoints,
      description: 'Minor advisory notes or advance documentation preparations',
    },
  ];

  // Downstream activities impact calculation
  let totalDownstreamBlocked = 0;
  const primaryRiskDrivers: PrimaryRiskDriver[] = bottlenecks.slice(0, 6).map((b) => {
    const sev = normalizeSeverity(b.severity);
    const pts = sev === 'CRITICAL' ? 25 : sev === 'HIGH' ? 15 : sev === 'MEDIUM' ? 8 : 3;

    // Extract downstream count from impact text if present
    const match = b.downstreamImpact.match(/(\d+)\s+downstream/i);
    if (match && match[1]) {
      totalDownstreamBlocked += parseInt(match[1], 10);
    } else if (sev === 'CRITICAL' || sev === 'HIGH') {
      totalDownstreamBlocked += 1;
    }

    return {
      id: b.id,
      issue: b.issue,
      severity: sev,
      affectedApproval: b.affectedApproval,
      downstreamImpact: b.downstreamImpact,
      recommendedAction: b.recommendedAction,
      pointsContributed: pts,
      category: b.category,
    };
  });

  const cumulativeDelayDays = bottlenecks.reduce(
    (max, a) => Math.max(max, a.impactOnCommercialDateDays || 0),
    0
  );

  const explanationSummary =
    compositeRiskLevel === 'CRITICAL'
      ? `Composite risk is CRITICAL due to ${criticalCount} urgent bottleneck(s) requiring immediate intervention within 48-72 hours to prevent statutory rejection or legal procedural forfeiture.`
      : compositeRiskLevel === 'HIGH'
      ? `Composite risk is HIGH with ${highCount} significant hurdle(s) on the critical path that threaten to postpone subsequent licensing stages and commercial production.`
      : compositeRiskLevel === 'MEDIUM'
      ? `Composite risk is MEDIUM with ${mediumCount} active bottleneck(s) that should be systematically resolved to maintain optimal project trajectory.`
      : `Composite risk is LOW with zero critical or high hurdles currently stalling application progress.`;

  const disclaimer =
    'This explainable regulatory risk score is a procedural benchmarking metric derived deterministically from active statutory clearance states, unresolved query notices, verified document completeness, and SLA timelines. It does not represent an actuarial, financial, or legal forecast.';

  return {
    compositeRiskLevel,
    overallRiskScore,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    totalBottlenecks: bottlenecks.length,
    totalDownstreamBlocked,
    cumulativeDelayDays,
    scoreBreakdown,
    primaryRiskDrivers,
    categoryCounts,
    explanationSummary,
    disclaimer,
  };
}
