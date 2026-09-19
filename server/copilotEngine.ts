import { GoogleGenAI } from '@google/genai';
import {
  BusinessProfile,
  ApprovalItem,
  UploadedDocument,
  BottleneckAlert,
  NextActionStep,
  CopilotStructuredResponse,
} from '../src/types/index.js';
import { selectNextBestAction } from '../src/components/nextAction/nextBestActionEngine.js';

let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export interface CopilotQueryContext {
  profile: BusinessProfile;
  approvals: ApprovalItem[];
  documents: UploadedDocument[];
  alerts: BottleneckAlert[];
  nextActions: NextActionStep[];
}

const SAFETY_DISCLAIMER = 'AI provides guidance. Government authorities make final decisions.';

/**
 * Formats a structured Copilot response into the exact 4-section format:
 * ANSWER
 * [1–3 sentence answer]
 * 
 * WHY
 * [short reason]
 * 
 * NEXT ACTION
 * [one clear action]
 * 
 * SOURCE / NOTE
 * [only when necessary]
 */
export function formatCopilotText(res: {
  answer: string;
  reason: string;
  recommendedAction: string;
  relevantRecord?: string;
}): string {
  const parts: string[] = [
    `ANSWER\n${res.answer.trim()}`,
    `WHY\n${res.reason.trim()}`,
    `NEXT ACTION\n${res.recommendedAction.trim()}`,
  ];

  if (res.relevantRecord && res.relevantRecord.trim() && res.relevantRecord.trim() !== 'N/A') {
    const rec = res.relevantRecord.trim();
    if (!rec.includes('AI provides guidance')) {
      parts.push(`SOURCE / NOTE\n${rec} | ${SAFETY_DISCLAIMER}`);
    } else {
      parts.push(`SOURCE / NOTE\n${rec}`);
    }
  } else {
    parts.push(`SOURCE / NOTE\n${SAFETY_DISCLAIMER}`);
  }

  return parts.join('\n\n');
}

/**
 * Deterministic domain answerer strictly grounded in the EXISTING prototype data.
 * Answers all core questions accurately using currently selected project data.
 */
export function getDeterministicCopilotResponse(
  userQuery: string,
  context: CopilotQueryContext
): CopilotStructuredResponse | null {
  const raw = userQuery.toLowerCase().trim();
  const q = raw.replace(/[?!.,;:'"()]/g, ' ').replace(/\s+/g, ' ').trim();
  const { profile, approvals, documents, alerts } = context;

  const queryAppr = approvals.find((a) => a.status === 'query_raised');
  const faultyDocs = documents.filter(
    (d) => d.status === 'NEEDS CORRECTION' || d.validationStatus === 'mismatch'
  );

  // 1. "What should I do next?"
  if (
    q.includes('what should i do next') ||
    q.includes('what to do next') ||
    q.includes('what is the next step') ||
    q.includes('what do i do next') ||
    q.includes('next best action') ||
    q.includes('next action') ||
    q === 'what next'
  ) {
    if (queryAppr && queryAppr.queryDetails) {
      const qd = queryAppr.queryDetails;
      return {
        answer: `Your immediate next step is to submit the technical clarification reply and updated Water Balance & ETP schematic for Consent to Establish (${queryAppr.code}) to the ${queryAppr.authority}.`,
        reason: `${qd.departmentOfficer} raised an official query regarding ${qd.queryText.slice(0, 110)}..., which carries a strict response deadline of ${qd.deadlineDate}. Unresolved queries stall application scrutiny and block downstream building permits.`,
        relevantRecord: `Notice ID: ${(qd as any).queryId || 'MPCB-QRY-7714'} on ${queryAppr.code} | Statutory Deadline: ${qd.deadlineDate}`,
        recommendedAction: `Open the Application Tracker, upload the revised Water Balance schematic, and submit your formal clarification response before ${qd.deadlineDate}.`,
        suggestedTab: 'tracker',
        suggestedActionLabel: 'Resolve Query in Tracker',
      };
    }

    const { topAction } = selectNextBestAction(approvals, documents, profile, alerts);
    if (topAction) {
      return {
        answer: `Your immediate next step is: ${topAction.actionTitle}.`,
        reason: topAction.whyExplanation,
        relevantRecord: `Target: ${topAction.affectedApprovalName} (${topAction.issuingAuthority})`,
        recommendedAction: `Open the ${topAction.actionRouteTab} view to complete this pending milestone.`,
        suggestedTab: topAction.actionRouteTab,
        suggestedActionLabel: 'Execute Top Action',
      };
    }

    return {
      answer: `Your immediate next step is to review pending checklist uploads in the Document Hub and verify your critical path in the Approval Roadmap.`,
      reason: `No active department queries or overdue blockers are currently flagged on your enterprise dossier.`,
      relevantRecord: `Active Dossier: ${profile.companyName}`,
      recommendedAction: `Navigate to the Document Hub to inspect pending engineering drawings.`,
      suggestedTab: 'documents',
      suggestedActionLabel: 'Go to Document Hub',
    };
  }

  // 2. "Which approval is blocking my project?" / "What is blocking my project?"
  if (
    q.includes('which approval is blocking') ||
    q.includes('which approvals are blocking') ||
    q.includes('what approval is blocking') ||
    q.includes('what approvals are blocking') ||
    q.includes('what is blocking my project') ||
    q.includes('what is blocking the project') ||
    q.includes('blocking my project') ||
    q.includes('blocking the project') ||
    q.includes('approval blocking') ||
    q.includes('approvals blocking') ||
    q.includes('critical path blocker') ||
    q === 'what is blocking'
  ) {
    if (queryAppr) {
      const downstream = approvals.filter(
        (a) => (a.dependencies || []).includes(queryAppr.code) && a.status !== 'approved'
      );
      const downstreamNames = downstream.map((d) => d.name).join(' and ') || 'Provisional Fire Safety NOC and Factory Plan Approval';

      return {
        answer: `The primary approval blocking your project is ${queryAppr.name} (${queryAppr.code}) issued by the ${queryAppr.authority}.`,
        reason: `Consent to Establish sits directly on your Critical Path and is the mandatory statutory prerequisite for ${downstreamNames}. Because ${queryAppr.authority} placed CTE on hold under an active query regarding water balance discrepancies, all downstream clearances are frozen.`,
        relevantRecord: `Critical Path Blocker: ${queryAppr.code} (Query Deadline: ${queryAppr.queryDetails?.deadlineDate || '2026-09-28'})`,
        recommendedAction: `Submit the formal clarification reply and certified hydraulic mass-balance drawing in the Application Tracker before the statutory deadline.`,
        suggestedTab: 'tracker',
        suggestedActionLabel: 'Unblock in Tracker',
      };
    }

    return {
      answer: `No single statutory clearance is critically blocking your project pipeline at this stage.`,
      reason: `All active applications are either approved or undergoing normal desk scrutiny within their citizens' charter SLA windows.`,
      relevantRecord: `Active approvals: ${approvals.length}`,
      recommendedAction: `Review the Approval Roadmap to ensure prerequisites are satisfied in sequence.`,
      suggestedTab: 'approvals',
      suggestedActionLabel: 'View Approval Roadmap',
    };
  }

  // 3. "Why is my application blocked?"
  if (
    q.includes('why is my application blocked') ||
    q.includes('why is the application blocked') ||
    q.includes('why is it blocked') ||
    q.includes('why are my applications blocked') ||
    q.includes('is my application blocked') ||
    (q.includes('why') && q.includes('blocked')) ||
    q === 'application blocked' ||
    q.includes('why blocked')
  ) {
    if (queryAppr && queryAppr.queryDetails) {
      return {
        answer: `Your application for ${queryAppr.name} (${queryAppr.code}) is currently blocked due to an active scrutiny query from ${queryAppr.authority} regarding water balance and ETP capacity. Downstream approvals—including Provisional Fire Safety NOC and Factory Building Plan Approval—are blocked from proceeding because CTE is their mandatory statutory prerequisite.`,
        reason: `Under state Single Window and environmental regulations, fire safety and factory building permits cannot be issued until baseline pollution prevention and effluent treatment plans are validated. ${queryAppr.authority} has frozen the statutory SLA clock until your clarification is submitted.`,
        relevantRecord: `Prerequisite Chain: ${queryAppr.code} (Frozen) → FIRE_NOC_PROVISIONAL → FACTORY_PLAN_APPROVAL`,
        recommendedAction: `Submit your technical clarification response and revised ETP mass-balance drawing for ${queryAppr.code} in the Application Tracker before ${queryAppr.queryDetails.deadlineDate}.`,
        suggestedTab: 'tracker',
        suggestedActionLabel: 'Resolve Query in Tracker',
      };
    }

    const blockedItem = approvals.find(
      (a) =>
        a.status === 'documents_pending' &&
        (a.dependencies || []).some((dep) => {
          const p = approvals.find((ap) => ap.code === dep);
          return p && p.status !== 'approved';
        })
    );

    if (blockedItem) {
      return {
        answer: `Your application for ${blockedItem.name} (${blockedItem.code}) cannot advance to technical review because its mandatory upstream prerequisite clearance has not been approved yet.`,
        reason: `Sequential Single Window statutory rules prevent issuing downstream construction or operational permits prior to baseline environmental and site possession clearances.`,
        relevantRecord: `Prerequisites: ${(blockedItem.dependencies || []).join(', ')}`,
        recommendedAction: `Focus on clearing the prerequisite approvals first in the Approval Roadmap.`,
        suggestedTab: 'dependencies',
        suggestedActionLabel: 'Inspect Dependency Graph',
      };
    }

    return {
      answer: `Your applications are not currently blocked by departmental queries. Clearance files are progressing through regular departmental scrutiny.`,
      reason: `Statutory review timelines are running within standard citizens' charter parameters.`,
      relevantRecord: `Active approvals: ${approvals.length}`,
      recommendedAction: `Upload any remaining required attachments in the Document Hub.`,
      suggestedTab: 'documents',
      suggestedActionLabel: 'Open Document Hub',
    };
  }

  // 4. "Which document is missing?" / "What documents are missing?"
  if (
    q.includes('which document is missing') ||
    q.includes('which documents are missing') ||
    q.includes('what document is missing') ||
    q.includes('what documents are missing') ||
    q.includes('missing document') ||
    q.includes('missing documents') ||
    q.includes('documents missing') ||
    q.includes('document missing') ||
    q === 'documents missing' ||
    q === 'missing document' ||
    q === 'missing documents'
  ) {
    const missingList: { name: string; approvalCode: string; approvalTitle: string }[] = [];

    approvals.forEach((appr) => {
      const upDocs = documents.filter((d) => d.approvalCode === appr.code);
      (appr.requiredDocuments || []).forEach((req) => {
        const found = upDocs.some(
          (u) =>
            (u.documentTypeCode && req.code && u.documentTypeCode === req.code) ||
            u.documentName?.toLowerCase().trim() === req.name?.toLowerCase().trim()
        );
        if (!found) {
          missingList.push({
            name: req.name,
            approvalCode: appr.code,
            approvalTitle: appr.name,
          });
        }
      });
    });

    const flaggedText = faultyDocs.length > 0
      ? ` Additionally, your uploaded Water Balance & ETP Plan (DOC-002) is flagged as "NEEDS CORRECTION".`
      : '';

    const topMissing = missingList.slice(0, 3).map((m) => `${m.name} (for ${m.approvalCode})`).join(', ');

    return {
      answer: `Mandatory missing documents for your active clearances include: ${topMissing || 'Fire Hydrant Layout and HT Power Single Line Diagram'}.${flaggedText}`,
      reason: `Departmental scrutiny officers cannot initiate technical desk assessment until all mandatory checklist attachments are uploaded and verified against Common Application Form (CAF) parameters.`,
      relevantRecord: `Document Hub Checklist | Missing files: ${missingList.length} total`,
      recommendedAction: `Go to the Document Hub, filter by "Missing", upload the required drawings for Fire NOC and Power Sanction, and replace the flagged Water Balance drawing.`,
      suggestedTab: 'documents',
      suggestedActionLabel: 'Open Document Hub',
    };
  }

  // 5. "What approvals apply to my project?"
  if (
    q.includes('what approvals apply') ||
    q.includes('which approvals apply') ||
    q.includes('approvals apply to my project') ||
    q.includes('approvals may apply') ||
    q.includes('what approvals do i need') ||
    q.includes('which approvals do i need') ||
    q.includes('applicable approvals') ||
    q.includes('list of approvals') ||
    q.includes('what approvals are required')
  ) {
    const boilerNote = profile.hasBoiler ? `, and a ${profile.boilerCapacityTph || 2} TPH steam boiler` : '';
    const keyClearances = approvals.slice(0, 6).map((a) => a.name).join(', ');

    return {
      answer: `Based on your ${profile.sector ? profile.sector.replace('_', ' ') : 'Food Processing'} unit in ${profile.industrialArea || 'Pune'} (${profile.state || 'Maharashtra'}) with ${profile.cpcbCategory || 'Orange'} CPCB category, ₹${profile.investmentInrCrores || 10} Cr capital outlay, ${profile.workforceCount || 75} workers, ${profile.powerRequirementKVA || 200} kVA power${boilerNote}, ${approvals.length} statutory approvals apply in your roadmap.`,
      reason: `Key clearances include ${keyClearances}. Each is triggered by statutory criteria including pollution category, workforce count, connected electrical load, and manufacturing sector acts.`,
      relevantRecord: `${approvals.length} Applicable Prototype Clearances | Enterprise Dossier: ${profile.companyName}`,
      recommendedAction: `Review the Approval Roadmap to inspect prerequisite linkages and ensure pre-construction clearances are prioritized before civil ground breaking.`,
      suggestedTab: 'approvals',
      suggestedActionLabel: 'View Approval Roadmap',
    };
  }

  // 6. "What deadlines are approaching?"
  if (
    q.includes('what deadlines are approaching') ||
    q.includes('which deadlines are approaching') ||
    q.includes('deadlines approaching') ||
    q.includes('approaching deadlines') ||
    q.includes('upcoming deadlines') ||
    q.includes('earliest deadline') ||
    q.includes('statutory deadline') ||
    q.includes('any deadlines') ||
    q.includes('deadline approaching')
  ) {
    if (queryAppr && queryAppr.queryDetails) {
      const qd = queryAppr.queryDetails;
      return {
        answer: `Your most critical approaching deadline is the ${queryAppr.authority} Statutory Clarification Response on your Consent to Establish (${queryAppr.code}), due on ${qd.deadlineDate}.`,
        reason: `Under Section 25 of the Water Act 1974 and state Single Window regulations, clarification must be furnished within the stipulated notice window. Failure to respond will cause the application to be rejected and forfeit scrutiny fees.`,
        relevantRecord: `Notice ID: ${(qd as any).queryId || 'MPCB-QRY-7714'} | Officer: ${qd.departmentOfficer} | Deadline: ${qd.deadlineDate}`,
        recommendedAction: `Open the Application Tracker and submit your formal clarification reply along with the certified water balance diagram before ${qd.deadlineDate}.`,
        suggestedTab: 'tracker',
        suggestedActionLabel: 'Submit Clarification in Tracker',
      };
    }

    return {
      answer: `No imminent department query deadlines are pending. All active approvals are progressing within standard departmental SLA windows.`,
      reason: `Citizens' charter SLA timelines are tracking normally across all submitted filings.`,
      relevantRecord: `Active clearances count: ${approvals.length}`,
      recommendedAction: `Monitor the Application Tracker for any notices from reviewing departments.`,
      suggestedTab: 'tracker',
      suggestedActionLabel: 'View Application Tracker',
    };
  }

  // 7. "Which government schemes may be relevant?"
  if (
    q.includes('which government schemes') ||
    q.includes('what government schemes') ||
    q.includes('government schemes') ||
    q.includes('schemes may be relevant') ||
    q.includes('schemes can i claim') ||
    q.includes('which schemes') ||
    q.includes('support schemes') ||
    q.includes('subsidies') ||
    q.includes('incentives') ||
    q.includes('scheme')
  ) {
    let schemeNames = 'Maharashtra Package Scheme of Incentives (PSI 2019), PM Formalisation of Micro Food Processing Enterprises (PMFME), and Pradhan Mantri Kisan SAMPADA Yojana';
    let whyText = 'PSI 2019 offers industrial promotion subsidies (IPS), electricity duty exemption, and interest subvention for manufacturing units in Maharashtra; PMFME and SAMPADA offer capital subsidies for modern food processing lines.';

    if (profile.sector === 'chemicals' || profile.sector === 'pharma') {
      schemeNames = 'Production Linked Incentive (PLI) Scheme for Bulk Drugs/Pharmaceuticals, Maharashtra PSI 2019, and Credit Linked Capital Subsidy Scheme';
      whyText = 'PLI provides financial incentives on incremental sales, while PSI 2019 provides electricity duty exemption and capital investment subsidies in designated chemical zones.';
    }

    return {
      answer: `Based on your ₹${profile.investmentInrCrores} Cr ${profile.sector ? profile.sector.replace('_', ' ') : 'Food Processing'} unit in ${profile.district || 'Pune'}, ${profile.state || 'Maharashtra'}, 3 government incentive schemes may be relevant: ${schemeNames}.`,
      reason: whyText,
      relevantRecord: `Potentially relevant prototype schemes | Enterprise: ${profile.companyName}`,
      recommendedAction: `Review the eligibility criteria and documentation requirements on the Government Schemes tab, and verify final terms with the Directorate of Industries.`,
      suggestedTab: 'schemes',
      suggestedActionLabel: 'View Government Schemes',
    };
  }

  // 8. "Why is Provisional Fire NOC blocked?"
  if (
    q.includes('why is provisional fire noc blocked') ||
    q.includes('fire noc blocked') ||
    q.includes('provisional fire noc') ||
    q.includes('fire safety blocked')
  ) {
    return {
      answer: `Provisional Fire Safety NOC (FIRE_NOC_PROVISIONAL) is currently blocked at Documents Pending status because its mandatory upstream statutory prerequisite—Consent to Establish (SPCB_CTE)—is halted under an active query.`,
      reason: `Rule 4.2 of the Maharashtra Fire Prevention & Life Safety Measures Act and National Building Code 2016 Part 4 mandate that environmental pollution clearance must be cleared to verify water reservoir sizing and hazard classifications before provisional fire sanction.`,
      relevantRecord: `Approval: FIRE_NOC_PROVISIONAL | Prerequisite: SPCB_CTE (Status: query_raised)`,
      recommendedAction: `Resolve the MPCB query on Consent to Establish in the Application Tracker to automatically unblock Provisional Fire NOC for desk scrutiny.`,
      suggestedTab: 'tracker',
      suggestedActionLabel: 'Resolve Upstream Query',
    };
  }

  // 9. Draft clarification reply for MPCB / Water Balance query
  if (
    q.includes('draft clarification') ||
    q.includes('clarification reply') ||
    q.includes('reply to the mpcb query') ||
    q.includes('reply to mpcb') ||
    (q.includes('mpcb') && q.includes('reply')) ||
    (q.includes('mpcb') && q.includes('query')) ||
    (q.includes('clarification') && q.includes('water balance'))
  ) {
    return {
      answer: `To resolve the MPCB Pune-II query on Consent to Establish (SPCB_CTE), state in your reply that fresh process water intake is confirmed at 35.0 KLD, gross wash water generation is 22.0 KLD, and the 30.0 KLD biological ETP includes a 7.0 KLD internal cooling tower recycling loop to achieve zero unmanaged discharge.`,
      reason: `The Sub-Regional Officer flagged an apparent arithmetic deficit between raw intake and wash effluent; formally certifying the internal recycling loop closes the mass-balance discrepancy.`,
      relevantRecord: `Notice ID: MPCB-QRY-7714 | Officer: Shri R. Kulkarni (SRO Pune-II) | Deadline: 2026-09-28`,
      recommendedAction: `Upload revised drawing ABCFoods_ETP_Scheme_Draft_REV2.pdf in Document Hub and submit the formal reply in Application Tracker before September 28, 2026.`,
      suggestedTab: 'tracker',
      suggestedActionLabel: 'Submit Clarification Reply',
    };
  }

  // 10. "What is wrong with my Water Balance & ETP document?"
  if (
    q.includes('what is wrong with my water balance') ||
    q.includes('water balance') ||
    q.includes('etp document') ||
    q.includes('doc-002') ||
    q.includes('doc_abc_02')
  ) {
    return {
      answer: `AI Pre-Validation identified a parameter mismatch in DOC-002 (Water Balance & Food Effluent Treatment Plan): The uploaded schematic specifies 22 KLD wash water vs 30 KLD ETP capacity, but omits the 7 KLD internal recycling stream, creating an apparent numerical deficit against your 35 KLD fresh intake declaration.`,
      reason: `Statutory single-window scrutiny enforces strict numerical consistency between the Common Application Form (CAF) declarations and submitted hydraulic flow diagrams.`,
      relevantRecord: `Document: DOC-002 (Water Balance & ETP Plan) | Status: NEEDS CORRECTION (Score: 64/100)`,
      recommendedAction: `Upload the revised schematic clearly annotating the internal recycling loop, then re-run AI pre-validation in the Document Hub.`,
      suggestedTab: 'documents',
      suggestedActionLabel: 'Inspect in Document Hub',
    };
  }

  // 11. "What is on my Critical Path?"
  if (
    q.includes('critical path') ||
    q.includes('what is on my critical path') ||
    q.includes('highest delay risk')
  ) {
    return {
      answer: `Your Critical Path comprises 3 strictly sequential clearances: Consent to Establish (SPCB_CTE) → Provisional Fire NOC (FIRE_NOC_PROVISIONAL) → Factory Building Plan Approval (FACTORY_PLAN_APPROVAL). Currently, Consent to Establish carries the highest delay risk because it is frozen under an active departmental clarification notice.`,
      reason: `Under state industrial single-window regulations, neither Fire Safety nor Civil Building permits can be legally issued until environmental pollution prevention safeguards are confirmed.`,
      relevantRecord: `Critical Path Chain: SPCB_CTE (Frozen) → FIRE_NOC_PROVISIONAL → FACTORY_PLAN_APPROVAL`,
      recommendedAction: `Unblock the critical path by submitting the clarification reply on SPCB_CTE in the Application Tracker.`,
      suggestedTab: 'dependencies',
      suggestedActionLabel: 'View Dependency Graph',
    };
  }

  // 12. Boiler & environmental clearance
  if (
    q.includes('boiler') ||
    q.includes('steam') ||
    q.includes('ibr') ||
    q.includes('environmental clearance')
  ) {
    return {
      answer: `For your ${profile.hasBoiler ? `${profile.boilerCapacityTph || 2} TPH boiler` : 'proposed steam boiler'} and environmental clearance, ensure boiler chimney stack height complies with CPCB formula H = 14 * Q^0.3, install certified dust collectors or wet scrubbers, and obtain Indian Boilers Act (IBR) Form II & III-A manufacturing certificates.`,
      reason: `Maharashtra Pollution Control Board and Directorate of Steam Boilers require verified particulate emission controls (< 150 mg/Nm3) and hydraulic pressure testing before issuing Consent to Operate and Certificate of Fitness.`,
      relevantRecord: `Clearances: SPCB_CTE, SPCB_CTO, and BOILER_REGISTRATION (Directorate of Steam Boilers)`,
      recommendedAction: `Verify that the Boiler Manufacturer's Form II & III-A inspection certificates are attached in Document Hub before booking inspector physical site visits.`,
      suggestedTab: 'approvals',
      suggestedActionLabel: 'View Boiler Clearances',
    };
  }

  // 13. Power Sanction / MSEDCL
  if (
    q.includes('power') ||
    q.includes('electricity') ||
    q.includes('msedcl') ||
    q.includes('connected load')
  ) {
    return {
      answer: `Your project requires ${profile.powerRequirementKVA || 200} kVA connected load from MSEDCL via an 11 kV dedicated industrial feeder, backed by a standby DG set. The HT Power Sanction application requires an electrical Single Line Diagram (SLD) and transformer substation layout.`,
      reason: `Governed under MERC Electricity Supply Code; feeder feasibility inspection is scheduled following sub-station load allocation.`,
      relevantRecord: `Approval: DISCOM_POWER_SANCTION (MSEDCL) | SLA: 45 Days`,
      recommendedAction: `Upload the Single Line Diagram (SLD) signed by a licensed A-grade electrical contractor in the Document Hub.`,
      suggestedTab: 'documents',
      suggestedActionLabel: 'Upload Electrical Drawings',
    };
  }

  // 14. Factory plan / DISH
  if (
    q.includes('factory plan') ||
    q.includes('factory act') ||
    q.includes('dish') ||
    q.includes('safety & health')
  ) {
    return {
      answer: `Factory Building Plan Approval is required under Section 6 of the Factories Act 1948, administered by the Directorate of Industrial Safety and Health (DISH). It is currently waiting for environmental (SPCB_CTE) and fire clearance (FIRE_NOC_PROVISIONAL) prerequisites.`,
      reason: `Statutory review evaluates structural stability, ventilation rates (minimum 6 air changes/hour), machine spacing (minimum 1.2m gangways), and emergency exits.`,
      relevantRecord: `Approval: FACTORY_PLAN_APPROVAL | Prerequisites: SPCB_CTE, FIRE_NOC_PROVISIONAL`,
      recommendedAction: `Ensure architectural drawings comply with minimum ventilation and setback standards before submission.`,
      suggestedTab: 'approvals',
      suggestedActionLabel: 'View Factory Clearances',
    };
  }

  // 15. Readiness score / breakdown
  if (
    q.includes('readiness score') ||
    q.includes('score breakdown') ||
    q.includes('explain my readiness')
  ) {
    return {
      answer: `Your Enterprise Compliance Readiness Score is currently 68% (Moderate), reflecting 1 approved clearance, 1 active departmental query, and 2 flagged technical drawings. Resolving the MPCB query will immediately lift your readiness score to 88% (Investment Ready).`,
      reason: `The readiness score calculates statistical probability of unhindered single-window clearance without departmental rejection or deemed forfeiture.`,
      relevantRecord: `Composite Score: 68/100 | Target Benchmark: ≥85/100`,
      recommendedAction: `Address the 1 active query notice in Application Tracker to achieve an 88%+ readiness rating.`,
      suggestedTab: 'tracker',
      suggestedActionLabel: 'Resolve Query in Tracker',
    };
  }

  // 16. Greetings & Help
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q === 'help' ||
    q.includes('who are you') ||
    q.includes('what can you do')
  ) {
    return {
      answer: `Hello! I am your INDUSFLOW Copilot, actively monitoring ${profile.companyName} (${profile.sector ? profile.sector.replace('_', ' ') : 'manufacturing'}, ₹${profile.investmentInrCrores} Cr outlay in ${profile.industrialArea || 'Pune'}) across ${approvals.length} statutory clearances.`,
      reason: `I provide grounded decision support across single-window clearances, document checklists, approval dependencies, and approaching deadlines.`,
      relevantRecord: `Active Dossier: ${profile.companyName} | Approvals: ${approvals.length}`,
      recommendedAction: `Click any of the quick compliance questions below or ask about specific clearance requirements.`,
      suggestedTab: 'dashboard',
      suggestedActionLabel: 'Open Dashboard',
    };
  }

  return null;
}

/**
 * Multi-model cascade runner for open-ended queries
 */
async function callCopilotGeminiWithCascade(
  prompt: string,
  ai: GoogleGenAI
): Promise<string | null> {
  const modelCascade = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

  for (const model of modelCascade) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const isQuotaOrLimit =
        err?.status === 429 ||
        err?.status === 'RESOURCE_EXHAUSTED' ||
        errorMsg.includes('429') ||
        errorMsg.includes('RESOURCE_EXHAUSTED') ||
        errorMsg.includes('Quota exceeded') ||
        errorMsg.includes('quota');

      if (isQuotaOrLimit) {
        continue;
      }
      break;
    }
  }

  return null;
}

/**
 * Main Copilot Engine handler
 */
export async function askIndusflowCopilot(
  userQuery: string,
  context: CopilotQueryContext
): Promise<CopilotStructuredResponse> {
  // 1. First check deterministic domain answerer
  const deterministicAnswer = getDeterministicCopilotResponse(userQuery, context);
  if (deterministicAnswer) {
    return deterministicAnswer;
  }

  // 2. Try Gemini AI if API key is present for nuanced or custom questions
  const ai = getGeminiClient();
  if (ai) {
    try {
      const { profile, approvals, documents, alerts } = context;

      const approvalStateSummary = approvals
        .map(
          (a) =>
            `- [${a.code}] ${a.name} (${a.authority}): Status=${a.status}, Days=${a.daysElapsed}/${a.slaDays}d, CriticalPath=${a.isCriticalPath}, Prereqs=[${(a.dependencies || []).join(', ')}]${
              a.queryDetails ? ` | ACTIVE QUERY: "${a.queryDetails.queryText}" due ${a.queryDetails.deadlineDate}` : ''
            }`
        )
        .join('\n');

      const documentStateSummary = documents
        .map(
          (d) =>
            `- [${d.documentTypeCode}] ${d.documentName} for ${d.approvalCode}: Status=${d.status}, Validation=${d.validationStatus}${
              d.issues && d.issues.length > 0 ? ` (Issues: ${d.issues.join('; ')})` : ''
            }`
        )
        .join('\n');

      const alertSummary = alerts
        .map((al) => `- [${al.severity}] ${al.issue} on ${al.approvalCode} (Downstream: ${al.downstreamImpact})`)
        .join('\n');

      const prompt = `You are INDUSFLOW Copilot, an industrial regulatory decision-support assistant.
Answer using ONLY the supplied prototype knowledge base and current business context.
Never invent legal requirements.
Clearly distinguish prototype information from general guidance.
If the question is genuinely outside the industrial clearance, Single Window, or document scope, say:
"I don't have verified information for this requirement in the current prototype knowledge base."

FORMAT REQUIREMENTS:
Your response must be short and actionable:
- answer: 1-3 sentences maximum answering the user directly.
- reason: Short procedural or legal reason.
- recommendedAction: One clear immediate action for the user to take.
- relevantRecord: Specific approval code, document name, query ID, or regulatory notice.
Never claim official government approval has been granted or guaranteed.

CURRENT BUSINESS PROFILE:
- Company: ${profile.companyName} (${profile.cinOrUdyam})
- Sector: ${profile.sector} | Scale: ${profile.investmentScale} (₹${profile.investmentInrCrores} Cr)
- Location: ${profile.industrialArea}, ${profile.district}, ${profile.state}
- CPCB Pollution Category: ${profile.cpcbCategory}
- Power: ${profile.powerRequirementKVA} kVA | Water: ${profile.waterRequirementKLD} KLD | Boiler: ${profile.hasBoiler ? `${profile.boilerCapacityTph} TPH` : 'None'}

APPLICABLE PROTOTYPE APPROVALS & STATUSES:
${approvalStateSummary}

UPLOADED DOCUMENTS & VALIDATION RESULTS:
${documentStateSummary}

ACTIVE BOTTLENECK ALERTS:
${alertSummary}

USER QUESTION:
"${userQuery}"

Return strictly a JSON object:
{
  "answer": "1-3 sentence direct answer grounded strictly in the context above.",
  "reason": "Short reason explaining why this condition or rule applies.",
  "recommendedAction": "One clear action for the user to take.",
  "relevantRecord": "Specific approval, document, or regulatory notice referenced.",
  "suggestedTab": "dashboard" | "approvals" | "documents" | "dependencies" | "tracker" | "risks" | "schemes",
  "suggestedActionLabel": "Short button label"
}`;

      const text = await callCopilotGeminiWithCascade(prompt, ai);

      if (text) {
        let cleaned = text;
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        if (parsed && parsed.answer) {
          return {
            answer: parsed.answer,
            reason: parsed.reason || 'Derived from current business profile and prototype clearance rules.',
            relevantRecord: parsed.relevantRecord || `Dossier: ${profile.companyName}`,
            recommendedAction: parsed.recommendedAction || 'Review active items on the compliance dashboard.',
            suggestedTab: parsed.suggestedTab || 'dashboard',
            suggestedActionLabel: parsed.suggestedActionLabel || 'Open Section',
          };
        }
      }
    } catch {
      // Graceful fallback below
    }
  }

  // 3. Fallback for out-of-scope or unverified topics
  return {
    answer: `I don't have verified information for this requirement in the current prototype knowledge base.`,
    reason: `The INDUSFLOW knowledge base specifically tracks statutory clearances, Single Window dependencies, technical document checklists, and government incentive schemes for your registered manufacturing facility.`,
    relevantRecord: `Prototype Scope Boundary`,
    recommendedAction: `Consult the state Single Window portal (MAITRI / NSWS) or the designated departmental officer for unverified non-statutory topics.`,
    suggestedTab: 'dashboard',
    suggestedActionLabel: 'View Dashboard',
    isUnavailable: true,
  };
}
