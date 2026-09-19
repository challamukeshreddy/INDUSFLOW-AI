import {
  BusinessProfile,
  ApprovalItem,
  UploadedDocument,
  DemonstrationScheme,
  MatchedDemonstrationScheme,
  SchemeApplicationStatus,
} from '../../types/index.js';
import { DEMONSTRATION_SCHEMES } from './demonstrationSchemesData.js';

export function matchDemonstrationSchemes(
  profile: BusinessProfile,
  approvals: ApprovalItem[],
  documents: UploadedDocument[],
  persistedStatuses?: Record<string, SchemeApplicationStatus>
): MatchedDemonstrationScheme[] {
  const approvedCodeSet = new Set(
    approvals.filter((a) => a.status === 'approved').map((a) => a.code)
  );

  // Map of uploaded document codes and their validation states
  const uploadedDocMap = new Map<string, UploadedDocument>();
  documents.forEach((doc) => {
    if (doc.documentTypeCode) uploadedDocMap.set(doc.documentTypeCode, doc);
    if (doc.approvalCode) uploadedDocMap.set(doc.approvalCode, doc);
  });

  return DEMONSTRATION_SCHEMES.map((scheme) => {
    // -------------------------------------------------------------
    // 1. Industry Alignment Check
    // -------------------------------------------------------------
    let industryScore = 0;
    let industryWhy = '';
    const userSector = profile.sector || 'pharma';
    const userIndustry = profile.industry || profile.subIndustry || '';

    const isAllIndustries = scheme.applicableIndustries.includes('all');
    const isSectorMatch = scheme.applicableIndustries.includes(userSector);
    const isTextMatch = scheme.applicableIndustries.some((ind) =>
      ind !== 'all' && userIndustry.toLowerCase().includes(ind.toLowerCase())
    );

    if (isSectorMatch || isTextMatch) {
      industryScore = 30;
      industryWhy = `Direct sector match: Scheme explicitly targets ${userSector.toUpperCase()} and allied manufacturing operations.`;
    } else if (isAllIndustries) {
      industryScore = 24;
      industryWhy = `Broad manufacturing eligibility: Policy applies to all compliant industrial manufacturing sectors including ${userSector.toUpperCase()}.`;
    } else {
      industryScore = 5;
      industryWhy = `Sector divergence: Scheme focuses on ${scheme.applicableIndustries.join(', ')}, whereas registered profile is ${userSector.toUpperCase()}.`;
    }

    // -------------------------------------------------------------
    // 2. Location Alignment Check
    // -------------------------------------------------------------
    let locationScore = 0;
    let locationWhy = '';
    const userState = profile.state || 'Maharashtra';
    const userDistrict = profile.district || '';
    const userIndustrialArea = profile.industrialArea || '';

    if (!scheme.applicableStates || scheme.applicableStates.length === 0) {
      locationScore = 25;
      locationWhy = `Pan-India Central Scheme: Available across all States and Union Territories including ${userState}.`;
    } else if (
      scheme.applicableStates.some((st) =>
        userState.toLowerCase().includes(st.toLowerCase())
      )
    ) {
      locationScore = 25;
      const areaSnippet = userIndustrialArea ? ` (${userIndustrialArea})` : '';
      locationWhy = `State jurisdiction match: Enterprise is situated in ${userState}${areaSnippet}, fulfilling state industrial policy domicile.`;
    } else {
      locationScore = 0;
      locationWhy = `State boundary constraint: Exclusively applicable to units in ${scheme.applicableStates.join(', ')}; current plant is located in ${userState}.`;
    }

    // -------------------------------------------------------------
    // 3. Project Type Alignment Check
    // -------------------------------------------------------------
    let projectTypeScore = 0;
    let projectTypeWhy = '';
    const userProjectType = profile.projectType || 'Greenfield Manufacturing Unit';
    const userUnitType = profile.unitType || 'New Unit';

    const matchesProjectType = scheme.applicableProjectTypes.some(
      (pt) =>
        userProjectType.toLowerCase().includes(pt.toLowerCase()) ||
        pt.toLowerCase().includes(userProjectType.toLowerCase()) ||
        pt.toLowerCase().includes(userUnitType.toLowerCase())
    );

    if (matchesProjectType) {
      projectTypeScore = 15;
      projectTypeWhy = `Project archetype match: Eligible for ${userProjectType} / ${userUnitType} setup and capital asset creation.`;
    } else {
      projectTypeScore = 8;
      projectTypeWhy = `Conditional project scope: Scheme primarily targets ${scheme.applicableProjectTypes.join(', ')}.`;
    }

    // -------------------------------------------------------------
    // 4. Investment Alignment Check
    // -------------------------------------------------------------
    let investmentScore = 0;
    let investmentWhy = '';
    const investmentCr = profile.investmentInrCrores || 0;
    const minInv = scheme.minInvestmentInrCrores;
    const maxInv = scheme.maxInvestmentInrCrores;

    if (investmentCr >= minInv && (!maxInv || investmentCr <= maxInv)) {
      investmentScore = 20;
      investmentWhy = `Capital outlay threshold met: Proposed investment of ₹${investmentCr} Cr complies with eligible bracket (₹${minInv} Cr – ${maxInv ? `₹${maxInv} Cr` : 'Above'}).`;
    } else if (investmentCr < minInv) {
      investmentScore = 6;
      investmentWhy = `Below baseline investment: Committed investment of ₹${investmentCr} Cr is below the required ₹${minInv} Cr minimum threshold.`;
    } else {
      investmentScore = 10;
      investmentWhy = `Investment exceeds standard bracket: Committed ₹${investmentCr} Cr exceeds typical ₹${maxInv} Cr tier, requiring mega-project review.`;
    }

    // -------------------------------------------------------------
    // 5. Business Type Alignment Check
    // -------------------------------------------------------------
    let businessTypeScore = 0;
    let businessTypeWhy = '';
    const userBusinessType = profile.businessType || 'Private Limited Company';

    const matchesBusinessType = scheme.applicableBusinessTypes.some(
      (bt) =>
        userBusinessType.toLowerCase().includes(bt.toLowerCase()) ||
        bt.toLowerCase().includes(userBusinessType.toLowerCase()) ||
        (userBusinessType.includes('Limited') && bt.includes('Limited'))
    );

    if (matchesBusinessType) {
      businessTypeScore = 10;
      businessTypeWhy = `Legal entity match: Constitution type '${userBusinessType}' is an authorized applicant category.`;
    } else {
      businessTypeScore = 5;
      businessTypeWhy = `Entity structure notice: Scheme lists ${scheme.applicableBusinessTypes.join(', ')}. Verification required for '${userBusinessType}'.`;
    }

    // -------------------------------------------------------------
    // Calculate Overall Match Score & Relevance Level
    // -------------------------------------------------------------
    const rawScore = industryScore + locationScore + projectTypeScore + investmentScore + businessTypeScore;
    // Normalize score to realistic 25% - 98% range
    const potentialRelevanceScore = Math.min(98, Math.max(25, rawScore));

    let potentialRelevance: 'High' | 'Moderate' | 'Conditional' = 'Moderate';
    if (potentialRelevanceScore >= 80) {
      potentialRelevance = 'High';
    } else if (potentialRelevanceScore >= 55) {
      potentialRelevance = 'Moderate';
    } else {
      potentialRelevance = 'Conditional';
    }

    // -------------------------------------------------------------
    // Match Required Documents against Uploaded Documents
    // -------------------------------------------------------------
    const documentsStatus = scheme.requiredDocuments.map((docDef) => {
      let isUploaded = false;
      let validationStatus: string | undefined = undefined;

      // Check matching document code
      if (docDef.matchingDocCode && uploadedDocMap.has(docDef.matchingDocCode)) {
        isUploaded = true;
        validationStatus = uploadedDocMap.get(docDef.matchingDocCode)?.validationStatus;
      } else {
        // Fallback: search by name fuzzy match
        for (const [code, doc] of uploadedDocMap.entries()) {
          const docNameLower = (doc.documentName || code).toLowerCase();
          const targetLower = docDef.name.toLowerCase();
          if (
            (targetLower.includes('dpr') && docNameLower.includes('dpr')) ||
            (targetLower.includes('allotment') && docNameLower.includes('allotment')) ||
            (targetLower.includes('cte') && docNameLower.includes('cte')) ||
            (targetLower.includes('power') && docNameLower.includes('power')) ||
            (targetLower.includes('incorporation') && docNameLower.includes('incorporation')) ||
            (targetLower.includes('financial') && docNameLower.includes('financial'))
          ) {
            isUploaded = true;
            validationStatus = doc.validationStatus;
            break;
          }
        }
      }

      return {
        docId: docDef.id,
        name: docDef.name,
        isUploaded,
        validationStatus,
        mandatory: docDef.mandatory,
      };
    });

    const uploadedDocumentsCount = documentsStatus.filter((d) => d.isUploaded).length;
    const requiredDocumentsCount = scheme.requiredDocuments.length;

    // Prerequisites check
    const totalPrereqs = scheme.requiredClearances.length;
    const metPrereqs = scheme.requiredClearances.filter((c) => approvedCodeSet.has(c)).length;

    // Determine application status (either from user override, or smart prototype default)
    let applicationStatus: SchemeApplicationStatus = 'not_started';
    if (persistedStatuses && persistedStatuses[scheme.id]) {
      applicationStatus = persistedStatuses[scheme.id];
    } else {
      // Default prototype status based on clearances and documents
      if (metPrereqs === totalPrereqs && uploadedDocumentsCount >= requiredDocumentsCount) {
        applicationStatus = 'ready_for_submission';
      } else if (uploadedDocumentsCount > 0) {
        applicationStatus = 'preparing_documents';
      } else if (totalPrereqs > 0 && metPrereqs < totalPrereqs) {
        applicationStatus = 'prerequisites_pending';
      } else {
        applicationStatus = 'not_started';
      }
    }

    const overallSummary = `Evaluated against active business profile (${userSector.toUpperCase()}, ${userState}, ${userProjectType}, ₹${investmentCr} Cr investment, ${userBusinessType}).`;

    return {
      ...scheme,
      potentialRelevance,
      potentialRelevanceScore,
      potentialRelevanceDisclaimer: 'Potentially relevant based on prototype criteria.',
      authorityVerificationNotice: 'Verify eligibility with the concerned authority.',
      whyItMayBeRelevant: {
        industryWhy,
        locationWhy,
        projectTypeWhy,
        investmentWhy,
        businessTypeWhy,
        overallSummary,
      },
      documentsStatus,
      requiredDocumentsCount,
      uploadedDocumentsCount,
      prerequisitesMetCount: metPrereqs,
      prerequisitesTotalCount: totalPrereqs,
      applicationStatus,
    };
  }).sort((a, b) => b.potentialRelevanceScore - a.potentialRelevanceScore);
}
