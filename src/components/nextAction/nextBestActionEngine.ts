import {
  ApprovalItem,
  BusinessProfile,
  UploadedDocument,
  BottleneckAlert,
  NextBestAction,
} from '../../types/index.js';
import { detectAllBottlenecks } from '../risks/riskEngine.js';

const REFERENCE_DATE_MS = new Date('2026-09-14T00:00:00Z').getTime();

/**
 * Calculates days between reference date and target ISO date string
 */
function getDaysUntil(dateStr: string | undefined): number {
  if (!dateStr) return 999;
  try {
    const targetMs = new Date(dateStr).getTime();
    if (isNaN(targetMs)) return 999;
    return Math.ceil((targetMs - REFERENCE_DATE_MS) / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

/**
 * Computes downstream approvals that depend on a given approval code
 */
function findDownstreamApprovals(approvalCode: string, allApprovals: ApprovalItem[]): ApprovalItem[] {
  return allApprovals.filter((item) => {
    const deps = item.dependencies || item.prerequisites || [];
    return deps.includes(approvalCode);
  });
}

/**
 * Next Best Action Engine
 * 
 * Deterministically examines:
 * 1. Current approval statuses (query_raised, documents_pending, in_review, not_started, approved)
 * 2. Document status (missing, needs correction, unvalidated, expired)
 * 3. Dependencies (downstream clearances blocked, critical path sequences)
 * 4. Deadlines (statutory query deadlines, review SLAs, project commissioning dates)
 * 5. Bottlenecks (active alerts across 6 statutory criteria)
 * 6. Risk (regulatory scrutiny, CPCB Red category, deemed rejection penalties)
 * 
 * Selects the #1 most important Next Best Action, grounded strictly in live project data.
 */
export function selectNextBestAction(
  approvals: ApprovalItem[],
  documents: UploadedDocument[] = [],
  profile: BusinessProfile | null = null,
  alerts?: BottleneckAlert[]
): {
  topAction: NextBestAction | null;
  prioritizedActions: NextBestAction[];
} {
  // If alerts not supplied, compute deterministically from risk engine
  const activeAlerts = alerts && alerts.length > 0 ? alerts : detectAllBottlenecks(approvals, profile, documents);

  // Map documents by approvalCode
  const docByApproval = new Map<string, UploadedDocument[]>();
  for (const doc of documents) {
    const list = docByApproval.get(doc.approvalCode) || [];
    list.push(doc);
    docByApproval.set(doc.approvalCode, list);
  }

  const candidateActions: NextBestAction[] = [];

  // =========================================================================
  // EVALUATION FACTOR 1 & 2: Clarification Queries & Associated Document Fixes
  // =========================================================================
  for (const approval of approvals) {
    if (approval.status === 'query_raised') {
      const q = approval.queryDetails;
      const daysLeft = q ? getDaysUntil(q.deadlineDate) : 7;
      const downstream = findDownstreamApprovals(approval.code, approvals);
      const downstreamNames = downstream.map((d) => d.name);

      // Check if there is a document needing correction for this approval
      const relatedDocs = docByApproval.get(approval.code) || [];
      const faultyDoc = relatedDocs.find(
        (d) => d.status === 'NEEDS CORRECTION' || d.validationStatus === 'mismatch' || (d.issues && d.issues.length > 0)
      );

      // Status weight
      const statusScore = 40; // query_raised is highest priority state

      // Document weight
      const documentScore = faultyDoc ? 35 : 20;

      // Dependency weight
      const dependencyScore = Math.min(downstream.length * 12 + (approval.isCriticalPath ? 20 : 0), 40);

      // Deadline weight
      let deadlineScore = 20;
      if (daysLeft <= 3) deadlineScore = 45;
      else if (daysLeft <= 8) deadlineScore = 35;
      else if (daysLeft <= 15) deadlineScore = 25;

      // Bottleneck weight
      const matchingAlert = activeAlerts.find((a) => a.approvalCode === approval.code);
      const bottleneckScore = matchingAlert ? (matchingAlert.severity === 'CRITICAL' ? 35 : 25) : 20;

      // Risk weight
      const isRedCategory = profile?.cpcbCategory === 'Red' || approval.code.includes('SPCB') || approval.code.includes('MOEF');
      const riskScore = isRedCategory ? 25 : 15;

      const totalScore = statusScore + documentScore + dependencyScore + deadlineScore + bottleneckScore + riskScore;

      // Specific handling if a document with discrepancy is the root cause
      if (faultyDoc) {
        const docLabel = faultyDoc.documentName || 'revised technical diagram';
        const isLayoutOrWater = /layout|water|balance|site|plan/i.test(docLabel);
        
        let actionTitle = `Upload the corrected ${docLabel.toLowerCase().replace('diagram', '').trim()}.`;
        if (faultyDoc.documentTypeCode === 'WATER_BALANCE') {
          actionTitle = 'Upload the corrected Water Balance & ETP Scheme.';
        } else if (/layout|site/i.test(docLabel)) {
          actionTitle = 'Upload the corrected site layout.';
        }

        const whyExplanation = downstream.length > 0
          ? `${approval.name} is halted under query scrutiny; ${downstreamNames[0] || 'downstream clearance'} is currently blocked by this document.`
          : `${approval.name} is halted under query scrutiny due to data discrepancy. Statutory query response due in ${daysLeft} days.`;

        candidateActions.push({
          id: `nba_correct_doc_${approval.code}_${faultyDoc.id}`,
          rank: 0,
          actionTitle,
          whyExplanation,
          priority: 'CRITICAL',
          category: 'document_correction',
          affectedApprovalCode: approval.code,
          affectedApprovalName: approval.name,
          issuingAuthority: approval.authority,
          downstreamImpact: downstream.length > 0
            ? `${downstream.length} downstream clearances stalled: ${downstreamNames.slice(0, 2).join(', ')}.`
            : 'Clearance issuance delayed.',
          daysRemaining: daysLeft,
          dueDate: q?.deadlineDate,
          estimatedTime: '45 mins',
          actionRouteTab: 'documents',
          resolvePayload: {
            type: 'correct_document',
            approvalCode: approval.code,
            documentTypeCode: faultyDoc.documentTypeCode,
            documentId: faultyDoc.id,
            documentName: faultyDoc.documentName,
          },
          examinationSummary: {
            approvalStatus: 'Query Raised (Department Scrutiny Notice)',
            documentStatus: `Needs Correction: ${faultyDoc.documentName}`,
            dependencies: `${downstream.length} downstream clearances blocked (${downstreamNames.slice(0, 2).join(', ') || 'None'})`,
            deadlines: `Strict statutory deadline: ${q?.deadlineDate || 'Pending'} (${daysLeft} days left)`,
            bottlenecks: matchingAlert?.issue || 'Active critical clarification bottleneck',
            risk: 'Critical: Risk of application deemed rejection under Single Window Act',
          },
          totalScore: totalScore + 10, // slight boost for fixing root cause document
          scoreFactors: {
            statusScore,
            documentScore,
            dependencyScore,
            deadlineScore,
            bottleneckScore,
            riskScore,
          },
        });
      }

      // Direct query submission candidate
      candidateActions.push({
        id: `nba_reply_query_${approval.code}`,
        rank: 0,
        actionTitle: `Submit formal clarification reply for ${approval.name}.`,
        whyExplanation: `Department officer raised query: "${q?.queryText?.slice(0, 95) || 'Clarification required'}...". Statutory deadline has ${daysLeft} days remaining.`,
        priority: daysLeft <= 7 ? 'CRITICAL' : 'HIGH',
        category: 'query_reply',
        affectedApprovalCode: approval.code,
        affectedApprovalName: approval.name,
        issuingAuthority: approval.authority,
        downstreamImpact: downstream.length > 0
          ? `Blocks ${downstream.length} subsequent approvals (${downstreamNames.slice(0, 2).join(', ')}).`
          : 'Prevents final consent issuance.',
        daysRemaining: daysLeft,
        dueDate: q?.deadlineDate,
        estimatedTime: '1-2 hours',
        actionRouteTab: 'tracker',
        resolvePayload: {
          type: 'reply_query',
          approvalCode: approval.code,
        },
        examinationSummary: {
          approvalStatus: 'Query Raised (Scrutiny Notice Active)',
          documentStatus: faultyDoc ? 'Supporting document needs revision' : 'Dossier uploaded',
          dependencies: `Blocks ${downstream.length} critical path activities`,
          deadlines: `Statutory countdown: ${daysLeft} days remaining (${q?.deadlineDate})`,
          bottlenecks: 'Unresolved department query alert',
          risk: 'High: Deemed rejection if reply not submitted before deadline',
        },
        totalScore,
        scoreFactors: {
          statusScore,
          documentScore: faultyDoc ? 30 : 15,
          dependencyScore,
          deadlineScore,
          bottleneckScore,
          riskScore,
        },
      });
    }
  }

  // =========================================================================
  // EVALUATION FACTOR 2 & 3: Missing Documents Blocking Downstream Clearances
  // =========================================================================
  for (const approval of approvals) {
    if (approval.status === 'approved') continue;

    const uploadedForThis = docByApproval.get(approval.code) || [];
    const downstream = findDownstreamApprovals(approval.code, approvals);
    const downstreamNames = downstream.map((d) => d.name);

    for (const reqDoc of approval.requiredDocuments || []) {
      const match = uploadedForThis.find((u) => {
        if (u.documentTypeCode && reqDoc.code && u.documentTypeCode === reqDoc.code) return true;
        return u.documentName?.toLowerCase().trim() === reqDoc.name?.toLowerCase().trim();
      });

      const isMissing = !match || match.status === 'NOT UPLOADED';
      if (!isMissing) continue;

      // Status weight
      let statusScore = 15;
      if (approval.status === 'documents_pending') statusScore = 30;
      else if (approval.status === 'not_started' && approval.isCriticalPath) statusScore = 25;

      // Document weight
      const documentScore = 35; // Missing mandatory checklist file

      // Dependency weight
      let dependencyScore = Math.min(downstream.length * 10, 35);
      if (approval.isCriticalPath) dependencyScore += 15;

      // Deadline weight
      const daysUntilTarget = getDaysUntil(profile?.targetCommissioningDate);
      const deadlineScore = daysUntilTarget < 90 ? 25 : 15;

      // Bottleneck weight
      const bottleneckAlert = activeAlerts.find(
        (a) => a.category === 'missing_documents' && a.approvalCode === approval.code
      );
      const bottleneckScore = bottleneckAlert ? 25 : 15;

      // Risk weight
      let riskScore = 15;
      if (/fire|safety/i.test(approval.name) || /fire|safety/i.test(reqDoc.name)) riskScore = 25;
      if (/pollution|cte|ec/i.test(approval.name)) riskScore = 20;

      const totalScore = statusScore + documentScore + dependencyScore + deadlineScore + bottleneckScore + riskScore;

      // Format clean user-facing action title and causal WHY? explanation
      const docNameLower = reqDoc.name.toLowerCase();
      let actionTitle = `Upload the ${reqDoc.name}.`;
      if (/layout/i.test(docNameLower) && /site/i.test(docNameLower)) {
        actionTitle = 'Upload the corrected site layout.';
      } else if (/fire/i.test(docNameLower) && /layout/i.test(docNameLower)) {
        actionTitle = 'Upload the Fire Hydrant & Emergency Layout Plan.';
      } else if (/hazard|risk/i.test(docNameLower)) {
        actionTitle = 'Upload the Fire Load & Hazard Assessment Report.';
      }

      // Generate exact WHY statement
      let whyExplanation = '';
      if (/fire/i.test(approval.name) || /fire/i.test(reqDoc.name)) {
        whyExplanation = 'Fire/Safety preparation is currently blocked by this missing document.';
      } else if (downstream.length > 0) {
        whyExplanation = `${approval.name} dossier cannot be lodged; ${downstreamNames[0]} is currently blocked by this missing document.`;
      } else {
        whyExplanation = `Statutory dossier for ${approval.name} cannot be submitted to ${approval.authority} without this required record.`;
      }

      candidateActions.push({
        id: `nba_missing_doc_${approval.code}_${reqDoc.code}`,
        rank: 0,
        actionTitle,
        whyExplanation,
        priority: approval.isCriticalPath ? 'HIGH' : 'MEDIUM',
        category: 'missing_document',
        affectedApprovalCode: approval.code,
        affectedApprovalName: approval.name,
        issuingAuthority: approval.authority,
        downstreamImpact: downstream.length > 0
          ? `${downstream.length} downstream approvals blocked (${downstreamNames.slice(0, 2).join(', ')}).`
          : 'Dossier completion delayed.',
        estimatedTime: '30-45 mins',
        actionRouteTab: 'documents',
        resolvePayload: {
          type: 'upload_document',
          approvalCode: approval.code,
          documentTypeCode: reqDoc.code,
          documentName: reqDoc.name,
        },
        examinationSummary: {
          approvalStatus: approval.status.replace('_', ' ').toUpperCase(),
          documentStatus: `Missing Required Document: ${reqDoc.name}`,
          dependencies: downstream.length > 0 ? `Blocks ${downstream.length} downstream clearances` : 'Prerequisite for application',
          deadlines: profile?.targetCommissioningDate ? `Target COD: ${profile.targetCommissioningDate}` : 'Pre-construction phase',
          bottlenecks: bottleneckAlert?.issue || 'Missing mandatory statutory document',
          risk: approval.isCriticalPath ? 'High: Direct delay to regulatory critical path' : 'Medium: Incomplete dossier',
        },
        totalScore,
        scoreFactors: {
          statusScore,
          documentScore,
          dependencyScore,
          deadlineScore,
          bottleneckScore,
          riskScore,
        },
      });
    }
  }

  // =========================================================================
  // EVALUATION FACTOR 4: Overdue SLAs & Bureaucratic Stalling
  // =========================================================================
  for (const approval of approvals) {
    if (approval.status === 'in_review') {
      const sla = approval.slaDays || 30;
      const elapsed = approval.daysElapsed || 0;
      const ratio = elapsed / sla;

      if (ratio >= 0.8) {
        const isBreached = ratio >= 1.0;
        const daysOverdue = elapsed - sla;
        const downstream = findDownstreamApprovals(approval.code, approvals);

        const statusScore = 20;
        const documentScore = 10;
        const dependencyScore = Math.min(downstream.length * 10 + (approval.isCriticalPath ? 15 : 0), 30);
        const deadlineScore = isBreached ? 35 : 25;
        const bottleneckScore = 25;
        const riskScore = 15;

        const totalScore = statusScore + documentScore + dependencyScore + deadlineScore + bottleneckScore + riskScore;

        const actionTitle = isBreached
          ? `Lodge SLA grievance escalation for ${approval.name}.`
          : `Submit status reminder for ${approval.name}.`;

        const whyExplanation = isBreached
          ? `Statutory review period has exceeded the ${sla}-day SLA by ${daysOverdue} days (${elapsed}/${sla} days); single-window escalation unblocks file movement.`
          : `Application review has reached ${Math.round(ratio * 100)}% of statutory SLA (${elapsed}/${sla} days); follow-up required to avoid bureaucratic lag.`;

        candidateActions.push({
          id: `nba_sla_escalate_${approval.code}`,
          rank: 0,
          actionTitle,
          whyExplanation,
          priority: isBreached ? 'HIGH' : 'MEDIUM',
          category: 'sla_escalation',
          affectedApprovalCode: approval.code,
          affectedApprovalName: approval.name,
          issuingAuthority: approval.authority,
          downstreamImpact: downstream.length > 0
            ? `${downstream.length} downstream approvals awaiting clearance (${downstream.map((d) => d.name).slice(0, 2).join(', ')}).`
            : 'Construction timeline exposure.',
          estimatedTime: '15 mins',
          actionRouteTab: 'tracker',
          resolvePayload: {
            type: 'escalate_sla',
            approvalCode: approval.code,
          },
          examinationSummary: {
            approvalStatus: `In Review (${elapsed} days elapsed)`,
            documentStatus: 'Dossier fully submitted',
            dependencies: `${downstream.length} downstream approvals waiting`,
            deadlines: `Statutory SLA of ${sla} days exceeded by ${Math.max(0, daysOverdue)} days`,
            bottlenecks: 'Overdue application review SLA',
            risk: isBreached ? 'High: Bureaucratic stalling on critical path' : 'Medium: Approaching statutory SLA limit',
          },
          totalScore,
          scoreFactors: {
            statusScore,
            documentScore,
            dependencyScore,
            deadlineScore,
            bottleneckScore,
            riskScore,
          },
        });
      }
    }
  }

  // =========================================================================
  // EVALUATION FACTOR 5: Ready to Apply Approvals (Prerequisites Satisfied)
  // =========================================================================
  for (const approval of approvals) {
    if (approval.status === 'not_started' || approval.status === 'documents_pending') {
      const prereqs = approval.dependencies || approval.prerequisites || [];
      const allPrereqsMet = prereqs.every((pCode) => {
        const prereq = approvals.find((a) => a.code === pCode);
        return prereq && prereq.status === 'approved';
      });

      if (allPrereqsMet && prereqs.length > 0) {
        const statusScore = 30;
        const documentScore = 20;
        const dependencyScore = approval.isCriticalPath ? 35 : 20;
        const deadlineScore = 15;
        const bottleneckScore = 10;
        const riskScore = 15;

        const totalScore = statusScore + documentScore + dependencyScore + deadlineScore + bottleneckScore + riskScore;

        candidateActions.push({
          id: `nba_apply_ready_${approval.code}`,
          rank: 0,
          actionTitle: `Lodge application dossier for ${approval.name}.`,
          whyExplanation: `All prerequisite approvals are formally approved; clearance window is now unlocked for ${approval.authority}.`,
          priority: approval.isCriticalPath ? 'HIGH' : 'MEDIUM',
          category: 'ready_to_apply',
          affectedApprovalCode: approval.code,
          affectedApprovalName: approval.name,
          issuingAuthority: approval.authority,
          downstreamImpact: 'Initiates mandatory scrutiny timeline under State Single Window.',
          estimatedTime: '2-3 hours',
          actionRouteTab: 'approvals',
          resolvePayload: {
            type: 'file_application',
            approvalCode: approval.code,
          },
          examinationSummary: {
            approvalStatus: 'Ready to Apply (Prerequisites Cleared)',
            documentStatus: 'Preparation required',
            dependencies: 'All prerequisite clearances satisfied',
            deadlines: 'Next immediate milestone on critical path',
            bottlenecks: 'None (Unblocked)',
            risk: 'Medium: Delay in lodgement shifts commissioning date',
          },
          totalScore,
          scoreFactors: {
            statusScore,
            documentScore,
            dependencyScore,
            deadlineScore,
            bottleneckScore,
            riskScore,
          },
        });
      }
    }
  }

  // =========================================================================
  // SORT & RANK ALL CANDIDATES
  // =========================================================================
  candidateActions.sort((a, b) => b.totalScore - a.totalScore);

  // Assign 1-indexed ranks
  candidateActions.forEach((item, index) => {
    item.rank = index + 1;
  });

  const topAction = candidateActions.length > 0 ? candidateActions[0] : null;

  return {
    topAction,
    prioritizedActions: candidateActions,
  };
}
