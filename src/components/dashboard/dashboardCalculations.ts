import {
  ApprovalItem,
  UploadedDocument,
  BottleneckAlert,
  BusinessProfile,
  ApprovalStage,
} from '../../types/index.js';
import { deriveComplianceDocuments, DerivedDocumentsState } from '../documents/documentModel.js';

export interface ScorePillar {
  key: 'approvals' | 'documents' | 'dependencies' | 'issues' | 'deadlines';
  title: string;
  weightPercent: number;
  weight: number;
  rawScore: number; // 0 to 100
  weightedContribution: number; // rawScore * weight
  statusText: string;
  formula: string;
  metricLabel: string;
  metricValue: string;
  positiveDrivers: string[];
  negativeDrivers: string[];
  recommendation: string;
}

export interface ReadinessScoreExplanation {
  overallScore: number;
  scoringModelVersion: string;
  disclaimer: string;
  isPrototype: boolean;
  pillars: {
    approvalCompletion: ScorePillar;
    documentCompleteness: ScorePillar;
    dependencyResolution: ScorePillar;
    openIssues: ScorePillar;
    deadlineRisk: ScorePillar;
  };
  summaryText: string;
  topPositiveFactors: string[];
  topDragFactors: string[];
}

export interface DashboardUpcomingDeadline {
  id: string;
  title: string;
  approvalCode?: string;
  authority: string;
  dueDate: string;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'normal';
  category: 'Clarification Notice' | 'Statutory SLA Review' | 'Document Renewal' | 'Commercial Milestone';
  actionPrompt: string;
  routeTab: 'tracker' | 'documents' | 'approvals';
}

export interface ApprovalStageGroup {
  stage: ApprovalStage;
  stageTitle: string;
  stageDescription: string;
  total: number;
  approved: number;
  inReview: number;
  queryRaised: number;
  documentsPending: number;
  notStarted: number;
  percentComplete: number;
  items: ApprovalItem[];
}

export interface DashboardComputedMetrics {
  // Top 5 KPI values
  overallReadiness: number;
  approvalsCompletedCount: number;
  approvalsTotalCount: number;
  approvalsInReviewCount: number;
  documentsVerifiedCount: number;
  documentsTotalCount: number;
  documentsUnderReviewCount: number;
  documentsNeedsCorrectionCount: number;
  documentsMissingCount: number;
  blockedItemsCount: number;
  upcomingDeadlinesCount: number;
  earliestDeadline: DashboardUpcomingDeadline | null;

  // Breakdown objects
  readinessExplanation: ReadinessScoreExplanation;
  upcomingDeadlines: DashboardUpcomingDeadline[];
  stageGroups: ApprovalStageGroup[];
  derivedDocs: DerivedDocumentsState;
  riskSummary: {
    criticalRiskCount: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    compositeRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    cumulativePotentialDelayDays: number;
    criticalPathBlockedCount: number;
    queryRaisedCount: number;
  };
}

/**
 * Calculates all dynamic metrics for the Compliance Dashboard
 * entirely from underlying state.
 */
export function calculateDashboardMetrics(
  profile: BusinessProfile | null,
  approvals: ApprovalItem[],
  uploadedDocuments: UploadedDocument[],
  alerts: BottleneckAlert[]
): DashboardComputedMetrics {
  const derivedDocs = deriveComplianceDocuments(approvals, uploadedDocuments);

  const totalApprovals = approvals.length || 1;
  const approvedApprovals = approvals.filter((a) => a.status === 'approved');
  const inReviewApprovals = approvals.filter((a) => a.status === 'in_review');
  const queryApprovals = approvals.filter((a) => a.status === 'query_raised');
  const docsPendingApprovals = approvals.filter((a) => a.status === 'documents_pending');
  const notStartedApprovals = approvals.filter((a) => a.status === 'not_started');

  const approvedCount = approvedApprovals.length;
  const inReviewCount = inReviewApprovals.length;

  // 1. Pillar 1: Approval Completion (Weight: 30%)
  // 100% credit for approved, 40% credit for applications actively under official review
  const rawApprovalScore = Math.min(
    100,
    Math.round(((approvedCount * 1.0 + inReviewCount * 0.4) / totalApprovals) * 100)
  );
  const weightedApprovalScore = Math.round(rawApprovalScore * 0.3 * 10) / 10;

  const approvalPositiveDrivers: string[] = [];
  const approvalNegativeDrivers: string[] = [];

  if (approvedCount > 0) {
    approvalPositiveDrivers.push(
      `${approvedCount} statutory clearances formally sanctioned (${approvedApprovals.map((a) => a.code).join(', ')})`
    );
  }
  if (inReviewCount > 0) {
    approvalPositiveDrivers.push(
      `${inReviewCount} applications lodged and undergoing departmental review`
    );
  }
  if (queryApprovals.length > 0) {
    approvalNegativeDrivers.push(
      `${queryApprovals.length} clearances halted by department clarification notice (${queryApprovals.map((a) => a.name).join(', ')})`
    );
  }
  if (notStartedApprovals.length > 0) {
    approvalNegativeDrivers.push(
      `${notStartedApprovals.length} clearances not yet initiated in filing roadmap`
    );
  }

  // 2. Pillar 2: Document Completeness (Weight: 25%)
  const totalRequiredDocs = derivedDocs.allRecords.length || 1;
  const verifiedCount = derivedDocs.verifiedDocuments.length;
  const uploadedReviewCount = derivedDocs.allRecords.filter(
    (d) => d.status === 'UPLOADED' || d.status === 'UNDER REVIEW'
  ).length;
  const needsCorrectionCount = derivedDocs.attentionDocuments.length;
  const missingDocsCount = derivedDocs.missingDocuments.length;

  const rawDocScore = Math.min(
    100,
    Math.round(((verifiedCount * 1.0 + uploadedReviewCount * 0.5) / totalRequiredDocs) * 100)
  );
  const weightedDocScore = Math.round(rawDocScore * 0.25 * 10) / 10;

  const docPositiveDrivers: string[] = [];
  const docNegativeDrivers: string[] = [];

  if (verifiedCount > 0) {
    docPositiveDrivers.push(
      `${verifiedCount} of ${totalRequiredDocs} required documents AI-screened & verified`
    );
  }
  if (needsCorrectionCount > 0) {
    docNegativeDrivers.push(
      `${needsCorrectionCount} uploaded files contain critical discrepancies or profile mismatches`
    );
  }
  if (missingDocsCount > 0) {
    docNegativeDrivers.push(
      `${missingDocsCount} mandatory statutory documents are missing / not yet uploaded`
    );
  }

  // 3. Pillar 3: Dependency Resolution (Weight: 20%)
  // Check how many approvals have their prerequisites satisfied
  const approvedCodeSet = new Set(approvedApprovals.map((a) => a.code));
  let unblockedCount = 0;
  let blockedCount = 0;
  const blockedNames: string[] = [];

  approvals.forEach((appr) => {
    const deps = appr.dependencies || [];
    if (deps.length === 0) {
      unblockedCount++;
    } else {
      const allSatisfied = deps.every((d) => approvedCodeSet.has(d));
      if (allSatisfied) {
        unblockedCount++;
      } else {
        blockedCount++;
        blockedNames.push(appr.name);
      }
    }
  });

  const rawDepScore = Math.min(
    100,
    Math.round((unblockedCount / totalApprovals) * 100)
  );
  const weightedDepScore = Math.round(rawDepScore * 0.2 * 10) / 10;

  const depPositiveDrivers: string[] = [];
  const depNegativeDrivers: string[] = [];

  if (unblockedCount > 0) {
    depPositiveDrivers.push(
      `${unblockedCount} clearances are sequence-unblocked and ready for immediate filing`
    );
  }
  if (blockedCount > 0) {
    depNegativeDrivers.push(
      `${blockedCount} approvals on critical path await prior stage approvals (e.g. ${blockedNames.slice(0, 2).join(', ')})`
    );
  }

  // 4. Pillar 4: Open Issues & Discrepancies (Weight: 15%)
  // Base 100, penalties for queries (-25 each), document mismatches (-15 each), high alerts (-10 each)
  const queryCount = queryApprovals.length;
  const highAlertsCount = alerts.filter((a) => a.severity === 'high').length;
  const rawIssueScore = Math.max(
    0,
    100 - (queryCount * 25 + needsCorrectionCount * 15 + highAlertsCount * 10)
  );
  const weightedIssueScore = Math.round(rawIssueScore * 0.15 * 10) / 10;

  const issuePositiveDrivers: string[] = [];
  const issueNegativeDrivers: string[] = [];

  if (queryCount === 0 && needsCorrectionCount === 0) {
    issuePositiveDrivers.push('Zero active departmental queries or severe document mismatches');
  } else {
    if (queryCount > 0) {
      issueNegativeDrivers.push(
        `${queryCount} active clarification queries raised by statutory departments`
      );
    }
    if (needsCorrectionCount > 0) {
      issueNegativeDrivers.push(
        `${needsCorrectionCount} documents flagged with data mismatches against business profile`
      );
    }
  }

  // 5. Pillar 5: Deadline & SLA Risk (Weight: 10%)
  // Base 100, penalty if query due within 14 days (-25), SLA breached (-20)
  let deadlineDeductions = 0;
  const deadlinePositiveDrivers: string[] = [];
  const deadlineNegativeDrivers: string[] = [];

  // Check query deadlines
  queryApprovals.forEach((appr) => {
    if (appr.queryDetails?.deadlineDate) {
      deadlineDeductions += 25;
      deadlineNegativeDrivers.push(
        `Looming query forfeiture deadline (${appr.queryDetails.deadlineDate}) for ${appr.name}`
      );
    }
  });

  // Check SLA breaches
  inReviewApprovals.forEach((appr) => {
    const ratio = appr.daysElapsed / (appr.slaDays || 30);
    if (ratio >= 0.8) {
      deadlineDeductions += 15;
      deadlineNegativeDrivers.push(
        `SLA review timeline elapsed ${Math.round(ratio * 100)}% for ${appr.name}`
      );
    }
  });

  if (deadlineDeductions === 0) {
    deadlinePositiveDrivers.push('No immediate deadline forfeiture risks or severe SLA breaches');
  }

  const rawDeadlineScore = Math.max(15, 100 - deadlineDeductions);
  const weightedDeadlineScore = Math.round(rawDeadlineScore * 0.1 * 10) / 10;

  // Composite overall readiness score
  const overallReadiness = Math.min(
    100,
    Math.max(
      10,
      Math.round(
        weightedApprovalScore +
          weightedDocScore +
          weightedDepScore +
          weightedIssueScore +
          weightedDeadlineScore
      )
    )
  );

  // Generate upcoming deadlines list dynamically
  const upcomingDeadlines: DashboardUpcomingDeadline[] = [];

  // Reference today date for demonstration (mid-September 2026)
  const referenceDateMs = new Date('2026-09-14T00:00:00Z').getTime();

  // 1. Clarification query deadlines
  queryApprovals.forEach((item) => {
    if (item.queryDetails?.deadlineDate) {
      const dueMs = new Date(item.queryDetails.deadlineDate).getTime();
      const diffDays = Math.max(0, Math.ceil((dueMs - referenceDateMs) / (1000 * 60 * 60 * 24)));
      upcomingDeadlines.push({
        id: `deadline_query_${item.code}`,
        title: `Statutory Clarification Notice Due: ${item.name}`,
        approvalCode: item.code,
        authority: item.authority,
        dueDate: item.queryDetails.deadlineDate,
        daysRemaining: diffDays,
        urgency: diffDays <= 10 ? 'critical' : 'warning',
        category: 'Clarification Notice',
        actionPrompt: 'Upload revised technical drawings / response note before deadline to avert deemed rejection.',
        routeTab: 'tracker',
      });
    }
  });

  // 2. Review SLA deadlines for in-review items
  inReviewApprovals.forEach((item) => {
    const totalSla = item.slaDays || 30;
    const remainingSlaDays = Math.max(1, totalSla - item.daysElapsed);
    const estDate = new Date(referenceDateMs + remainingSlaDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    upcomingDeadlines.push({
      id: `deadline_sla_${item.code}`,
      title: `Expected SLA Scrutiny Decision: ${item.name}`,
      approvalCode: item.code,
      authority: item.authority,
      dueDate: estDate,
      daysRemaining: remainingSlaDays,
      urgency: remainingSlaDays <= 7 ? 'warning' : 'normal',
      category: 'Statutory SLA Review',
      actionPrompt: `Department file has been in process for ${item.daysElapsed} days (SLA ${totalSla} days).`,
      routeTab: 'tracker',
    });
  });

  // 3. Document renewal or provisional validity dates
  uploadedDocuments.forEach((doc) => {
    if (
      doc.expiryDate &&
      doc.expiryDate !== 'N/A (Perpetual)' &&
      doc.expiryDate !== 'N/A (Process Spec)' &&
      !doc.expiryDate.startsWith('N/A')
    ) {
      const expMs = new Date(doc.expiryDate).getTime();
      if (!isNaN(expMs)) {
        const diffDays = Math.max(0, Math.ceil((expMs - referenceDateMs) / (1000 * 60 * 60 * 24)));
        if (diffDays <= 365) {
          upcomingDeadlines.push({
            id: `deadline_doc_${doc.id}`,
            title: `Document Validity Expiry: ${doc.documentName}`,
            authority: doc.approvalTitle,
            dueDate: doc.expiryDate,
            daysRemaining: diffDays,
            urgency: diffDays <= 30 ? 'warning' : 'normal',
            category: 'Document Renewal',
            actionPrompt: `Schedule renewal dossier upload before document validity lapses.`,
            routeTab: 'documents',
          });
        }
      }
    }
  });

  // 4. Commercial Commissioning Milestone
  if (profile?.targetCommissioningDate) {
    const commMs = new Date(profile.targetCommissioningDate).getTime();
    if (!isNaN(commMs)) {
      const diffDays = Math.max(0, Math.ceil((commMs - referenceDateMs) / (1000 * 60 * 60 * 24)));
      upcomingDeadlines.push({
        id: 'deadline_target_comm',
        title: `Target Commercial Production Date (${profile.companyName || 'Project'})`,
        authority: 'Internal Commercial Milestone',
        dueDate: profile.targetCommissioningDate,
        daysRemaining: diffDays,
        urgency: diffDays <= 60 ? 'warning' : 'normal',
        category: 'Commercial Milestone',
        actionPrompt: 'Ensure all Pre-operation & CTO clearances are sanctioned prior to breaking commercial batch.',
        routeTab: 'approvals',
      });
    }
  }

  // Sort upcoming deadlines ascending by days remaining
  upcomingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Group approvals by stage
  const stages: { stage: ApprovalStage; title: string; desc: string }[] = [
    {
      stage: 'pre_establishment',
      title: 'Stage 1: Pre-Establishment Clearances',
      desc: 'Land allotment, zoning permissions, environmental consent to establish, and water sanctions.',
    },
    {
      stage: 'pre_construction',
      title: 'Stage 2: Pre-Construction Sanctions',
      desc: 'Factory building plan approval, provisional fire safety NOC, and power infrastructure NOC.',
    },
    {
      stage: 'pre_operation',
      title: 'Stage 3: Pre-Operation Clearances',
      desc: 'Consent to operate (CTO), final fire compliance, boiler registrations, and PESO licenses.',
    },
    {
      stage: 'post_operation',
      title: 'Stage 4: Post-Commissioning & Operations',
      desc: 'Factory license issuance, statutory labor registrations (EPF/ESI), and FSSAI certifications.',
    },
  ];

  const stageGroups: ApprovalStageGroup[] = stages.map((st) => {
    const items = approvals.filter((a) => a.stage === st.stage);
    const stageApproved = items.filter((a) => a.status === 'approved').length;
    const stageInReview = items.filter((a) => a.status === 'in_review').length;
    const stageQuery = items.filter((a) => a.status === 'query_raised').length;
    const stageDocsPending = items.filter((a) => a.status === 'documents_pending').length;
    const stageNotStarted = items.filter((a) => a.status === 'not_started').length;
    const total = items.length;
    const percentComplete = total > 0 ? Math.round((stageApproved / total) * 100) : 0;

    return {
      stage: st.stage,
      stageTitle: st.title,
      stageDescription: st.desc,
      total,
      approved: stageApproved,
      inReview: stageInReview,
      queryRaised: stageQuery,
      documentsPending: stageDocsPending,
      notStarted: stageNotStarted,
      percentComplete,
      items,
    };
  });

  // Blocked items count:
  // includes approvals blocked by dependencies + approvals with query_raised + high severity alerts
  const blockedItemsCount =
    blockedCount +
    queryCount +
    alerts.filter((a) => a.type === 'dependency_blocked').length;

  // Build Readiness Score Explanation structure
  const readinessExplanation: ReadinessScoreExplanation = {
    overallScore: overallReadiness,
    scoringModelVersion: 'v2.4-prototype',
    isPrototype: true,
    disclaimer:
      'This readiness score is generated by an automated prototype heuristics model to benchmark procedural preparedness. It is not an official government certification or legal guarantee of clearance.',
    summaryText: `Your overall compliance readiness is evaluated at ${overallReadiness}%. This calculation is derived from 5 weighted regulatory pillars: Approval Progress (30%), Document Verification (25%), Prerequisite Resolution (20%), Query Cleanliness (15%), and Deadline Proximity (10%).`,
    pillars: {
      approvalCompletion: {
        key: 'approvals',
        title: 'Approval Completion',
        weightPercent: 30,
        weight: 0.3,
        rawScore: rawApprovalScore,
        weightedContribution: weightedApprovalScore,
        statusText: `${approvedCount} Approved, ${inReviewCount} In Review (${totalApprovals} Total)`,
        formula: 'Formula: (Approved × 100% + InReview × 40%) ÷ Total Applicable Clearances',
        metricLabel: 'Applicable Clearances',
        metricValue: `${approvedCount} / ${totalApprovals} Granted`,
        positiveDrivers: approvalPositiveDrivers,
        negativeDrivers: approvalNegativeDrivers,
        recommendation:
          approvedCount === totalApprovals
            ? 'All clearances granted.'
            : 'Focus on advancing in-review files and lodging applications for unlocked clearances.',
      },
      documentCompleteness: {
        key: 'documents',
        title: 'Document Completeness',
        weightPercent: 25,
        weight: 0.25,
        rawScore: rawDocScore,
        weightedContribution: weightedDocScore,
        statusText: `${verifiedCount} Verified, ${needsCorrectionCount} Need Review (${totalRequiredDocs} Required)`,
        formula: 'Formula: (Verified × 100% + Uploaded × 50%) ÷ Total Statutory Required Documents',
        metricLabel: 'Statutory Documents',
        metricValue: `${verifiedCount} / ${totalRequiredDocs} Verified`,
        positiveDrivers: docPositiveDrivers,
        negativeDrivers: docNegativeDrivers,
        recommendation:
          needsCorrectionCount > 0
            ? 'Resolve data discrepancies in flagged documents and upload missing statutory requirements.'
            : 'Continue uploading remaining statutory dossiers to increase verification score.',
      },
      dependencyResolution: {
        key: 'dependencies',
        title: 'Dependency Resolution',
        weightPercent: 20,
        weight: 0.2,
        rawScore: rawDepScore,
        weightedContribution: weightedDepScore,
        statusText: `${unblockedCount} of ${totalApprovals} Clearances Unblocked`,
        formula: 'Formula: (Clearances with satisfied prerequisites ÷ Total Clearances) × 100',
        metricLabel: 'Workflow Chains',
        metricValue: `${unblockedCount} / ${totalApprovals} Unblocked`,
        positiveDrivers: depPositiveDrivers,
        negativeDrivers: depNegativeDrivers,
        recommendation:
          blockedCount > 0
            ? 'Expedite prerequisite approvals to unlock downstream critical-path applications.'
            : 'All downstream approval dependencies are currently clear.',
      },
      openIssues: {
        key: 'issues',
        title: 'Open Issues & Queries',
        weightPercent: 15,
        weight: 0.15,
        rawScore: rawIssueScore,
        weightedContribution: weightedIssueScore,
        statusText: `${queryCount} Clarification Notices, ${needsCorrectionCount} Document Mismatches`,
        formula: 'Formula: 100 - (25 × Queries) - (15 × Mismatches) - (10 × High Risk Alerts)',
        metricLabel: 'Cleanliness Index',
        metricValue: `${rawIssueScore}% Clean`,
        positiveDrivers: issuePositiveDrivers,
        negativeDrivers: issueNegativeDrivers,
        recommendation:
          queryCount > 0
            ? 'Respond to statutory clarification notices immediately to prevent application cancellation.'
            : 'Maintain zero open discrepancy items.',
      },
      deadlineRisk: {
        key: 'deadlines',
        title: 'Deadline & SLA Health',
        weightPercent: 10,
        weight: 0.1,
        rawScore: rawDeadlineScore,
        weightedContribution: weightedDeadlineScore,
        statusText: `${upcomingDeadlines.filter((d) => d.daysRemaining <= 14).length} Urgent Deadlines (<14 Days)`,
        formula: 'Formula: 100 - (25 per urgent query deadline) - (15 per SLA timeline breach)',
        metricLabel: 'Timeline Health',
        metricValue: `${rawDeadlineScore}% Safe`,
        positiveDrivers: deadlinePositiveDrivers,
        negativeDrivers: deadlineNegativeDrivers,
        recommendation:
          deadlineDeductions > 0
            ? 'Address upcoming deadlines to avoid statutory penalties or project commissioning delays.'
            : 'All statutory SLA schedules are within acceptable parameters.',
      },
    },
    topPositiveFactors: [
      ...approvalPositiveDrivers.slice(0, 2),
      ...docPositiveDrivers.slice(0, 2),
      ...depPositiveDrivers.slice(0, 1),
    ].slice(0, 3),
    topDragFactors: [
      ...approvalNegativeDrivers.slice(0, 2),
      ...docNegativeDrivers.slice(0, 2),
      ...depNegativeDrivers.slice(0, 1),
      ...deadlineNegativeDrivers.slice(0, 1),
    ].slice(0, 3),
  };

  const cumulativePotentialDelayDays = alerts.reduce(
    (max, a) => Math.max(max, a.impactOnCommercialDateDays || 0),
    0
  );

  return {
    overallReadiness,
    approvalsCompletedCount: approvedCount,
    approvalsTotalCount: totalApprovals,
    approvalsInReviewCount: inReviewCount,
    documentsVerifiedCount: verifiedCount,
    documentsTotalCount: totalRequiredDocs,
    documentsUnderReviewCount: uploadedReviewCount,
    documentsNeedsCorrectionCount: needsCorrectionCount,
    documentsMissingCount: missingDocsCount,
    blockedItemsCount,
    upcomingDeadlinesCount: upcomingDeadlines.length,
    earliestDeadline: upcomingDeadlines[0] || null,

    readinessExplanation,
    upcomingDeadlines,
    stageGroups,
    derivedDocs,
    riskSummary: {
      criticalRiskCount: alerts.filter((a) => (a.severity || '').toUpperCase() === 'CRITICAL').length,
      highRiskCount: alerts.filter((a) => (a.severity || '').toUpperCase() === 'HIGH').length,
      mediumRiskCount: alerts.filter((a) => (a.severity || '').toUpperCase() === 'MEDIUM').length,
      lowRiskCount: alerts.filter((a) => (a.severity || '').toUpperCase() === 'LOW').length,
      compositeRiskLevel:
        alerts.some((a) => (a.severity || '').toUpperCase() === 'CRITICAL')
          ? 'CRITICAL'
          : alerts.filter((a) => (a.severity || '').toUpperCase() === 'HIGH').length >= 2
          ? 'HIGH'
          : alerts.some((a) => (a.severity || '').toUpperCase() === 'HIGH')
          ? 'MEDIUM'
          : 'LOW',
      cumulativePotentialDelayDays,
      criticalPathBlockedCount: blockedCount,
      queryRaisedCount: queryCount,
    },
  };
}
