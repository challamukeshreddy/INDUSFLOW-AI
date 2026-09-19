import { BusinessProfile, ApprovalItem, IndustrySector, InvestmentScale } from '../../types/index.js';

export interface GovernmentScheme {
  id: string;
  name: string;
  shortName: string;
  sponsoringBody: string;
  level: 'Central' | 'State';
  applicableStates?: string[]; // Empty or undefined means all states
  applicableSectors?: IndustrySector[] | 'all';
  minInvestmentCrores?: number;
  maxInvestmentCrores?: number;
  scale?: InvestmentScale[] | 'all';
  cpcbCategories?: ('Red' | 'Orange' | 'Green' | 'White')[];
  benefitType: 'Capital Subsidy' | 'Production Linked Incentive' | 'Tax & Duty Exemption' | 'Interest Subvention' | 'Green Technology Grant';
  maxBenefit: string;
  description: string;
  keyBenefits: string[];
  eligibilityHighlights: string[];
  requiredClearances: string[];
  officialPortal: string;
}

export interface MatchedScheme extends GovernmentScheme {
  matchPercentage: number;
  matchReasons: string[];
  prerequisitesMetCount: number;
  prerequisitesTotalCount: number;
  isEligible: boolean;
}

export const MASTER_GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    id: 'scheme_pli_pharma',
    name: 'Production Linked Incentive (PLI) Scheme for Promotion of Domestic Manufacturing of Key Starting Materials (KSMs) / Active Pharmaceutical Ingredients (APIs)',
    shortName: 'Pharma & Bulk Drug PLI',
    sponsoringBody: 'Department of Pharmaceuticals, Ministry of Chemicals and Fertilizers',
    level: 'Central',
    applicableSectors: ['pharma', 'chemicals'],
    minInvestmentCrores: 20,
    benefitType: 'Production Linked Incentive',
    maxBenefit: 'Up to 20% incentive on incremental sales (Max ₹1,000 Cr envelope)',
    description:
      'A flagship central initiative to reduce import dependency in critical active pharmaceutical ingredients (APIs), fermentation-based intermediates, and synthetic bulk drugs.',
    keyBenefits: [
      '5% to 20% financial incentive on net incremental sales for 6 consecutive financial years',
      'Priority allotment in designated Bulk Drug Parks',
      'Fast-track environmental clearance coordination via MoEF&CC green channel',
    ],
    eligibilityHighlights: [
      'Greenfield manufacturing of identified 41 critical KSMs/APIs',
      'Minimum committed cumulative investment threshold of ₹20 Crores to ₹50 Crores depending on product category',
      'Commercial production commencement within committed gestation window',
    ],
    requiredClearances: ['SIDC_LAND_ALLOTMENT', 'MOEF_EC', 'SPCB_CTE', 'FACTORY_PLAN_APPROVAL'],
    officialPortal: 'https://pharmaceuticals.gov.in/schemes',
  },
  {
    id: 'scheme_pli_food',
    name: 'Production Linked Incentive Scheme for Food Processing Industry (PLISFPI)',
    shortName: 'Food Processing PLI',
    sponsoringBody: 'Ministry of Food Processing Industries (MoFPI)',
    level: 'Central',
    applicableSectors: ['food_processing'],
    minInvestmentCrores: 10,
    benefitType: 'Production Linked Incentive',
    maxBenefit: '4% to 10% incentive on incremental turnover for 6 years',
    description:
      'Incentivizes creation of global food manufacturing champions, supporting value-added ready-to-eat/ready-to-cook, dairy, organic, and processed agro products.',
    keyBenefits: [
      'Incentive paid on incremental sales of processed food products',
      'Branding & marketing support abroad (up to 50% of expenditure or 3% of sales)',
      'Direct linkage to farm gate aggregation clusters',
    ],
    eligibilityHighlights: [
      'Minimum cumulative capital investment of ₹10 Crores for MSME / Medium scale',
      'Mandatory FSSAI manufacturing license and product compliance certification',
      'Minimum CAGR in sales of eligible products year-on-year',
    ],
    requiredClearances: ['SIDC_LAND_ALLOTMENT', 'SPCB_CTE', 'FSSAI_CENTRAL_LIC'],
    officialPortal: 'https://www.mofpi.gov.in',
  },
  {
    id: 'scheme_pmfme',
    name: 'Prime Minister Formalisation of Micro food processing Enterprises (PMFME) Scheme',
    shortName: 'PMFME Credit Subsidy',
    sponsoringBody: 'Ministry of Food Processing Industries (MoFPI) & State Directorate of Industries',
    level: 'Central',
    applicableSectors: ['food_processing'],
    scale: ['micro', 'small'],
    benefitType: 'Capital Subsidy',
    maxBenefit: '35% Credit-Linked Capital Subsidy up to ₹10 Lakhs + Seed Capital',
    description:
      'Provides financial, technical and business support for the upgradation and formalisation of micro and small food processing enterprises under Atmanirbhar Bharat.',
    keyBenefits: [
      '35% credit-linked capital subsidy for plant and machinery modernizations',
      'Seed capital for working capital and minor tools (₹40,000 per member)',
      'Subsidized laboratory testing and food safety training via NIFTEM',
    ],
    eligibilityHighlights: [
      'Micro and small food processing enterprises with valid Udyam Registration',
      'Adherence to "One District One Product" (ODOP) focus clusters',
      'Enterprise ownership of existing or newly allotted processing premises',
    ],
    requiredClearances: ['FSSAI_CENTRAL_LIC', 'SPCB_CTE'],
    officialPortal: 'https://pmfme.mofpi.gov.in',
  },
  {
    id: 'scheme_state_psi_mh',
    name: 'Maharashtra Package Scheme of Incentives (PSI 2019)',
    shortName: 'Maharashtra PSI 2019',
    sponsoringBody: 'Directorate of Industries, Government of Maharashtra',
    level: 'State',
    applicableStates: ['Maharashtra'],
    applicableSectors: 'all',
    benefitType: 'Tax & Duty Exemption',
    maxBenefit: 'Up to 80% Gross SGST Reimbursement + 100% Stamp Duty Exemption for 7–10 Years',
    description:
      'Premier state industrial incentive policy offering extensive fiscal exemptions, electricity duty waivers, and capital subsidies to manufacturing units across developing zones.',
    keyBenefits: [
      'Reimbursement of 50% to 80% of eligible State GST paid for 7 to 10 years',
      '100% exemption from payment of Stamp Duty on land purchase or lease deed execution',
      'Exemption from electricity duty for 7 years and power tariff subsidy of ₹1.50 per unit in non-metropolitan zones',
      '5% interest subsidy on term loans for MSMEs and green technology investments',
    ],
    eligibilityHighlights: [
      'Unit situated in MIDC industrial area or designated industrial land in Maharashtra (Talukas classified under B, C, D, or D+ zones)',
      'Commencement of commercial operations within prescribed gestation timeline',
      'Maintenance of local workforce employment quotas under State Industrial Policy',
    ],
    requiredClearances: ['SIDC_LAND_ALLOTMENT', 'SPCB_CTE', 'DISCOM_POWER_SANCTION'],
    officialPortal: 'https://di.maharashtra.gov.in',
  },
  {
    id: 'scheme_state_gip_gj',
    name: 'Gujarat Industrial Policy - Scheme for Financial Assistance to Industrial Undertakings',
    shortName: 'Gujarat Industrial Policy',
    sponsoringBody: 'Industries Commissionerate, Government of Gujarat',
    level: 'State',
    applicableStates: ['Gujarat'],
    applicableSectors: 'all',
    benefitType: 'Capital Subsidy',
    maxBenefit: '12% Capital Subsidy (Up to ₹1.5 Cr) + 7% Interest Subsidy for 7 Years',
    description:
      'Comprehensive financial incentives framework supporting capital asset creation, environmentally benign manufacturing, and technology adoption in GIDC clusters.',
    keyBenefits: [
      '12% Capital Investment Subsidy on eligible gross fixed assets (Plant & Machinery)',
      '7% interest subsidy on term loan for 7 years (maximum ₹35 Lakhs/year)',
      '100% reimbursement of stamp duty and registration fees on land acquisition',
      '50% assistance for setting up effluent treatment plants (ETP) up to ₹50 Lakhs',
    ],
    eligibilityHighlights: [
      'Manufacturing enterprise registered in Gujarat with GIDC plot possession or certified industrial land',
      'Minimum investment in eligible fixed assets with verified banking trail',
    ],
    requiredClearances: ['SIDC_LAND_ALLOTMENT', 'SPCB_CTE'],
    officialPortal: 'https://ic.gujarat.gov.in',
  },
  {
    id: 'scheme_state_tnip',
    name: 'Tamil Nadu Industrial Policy (TNIP) - Standard & Structured Incentive Package',
    shortName: 'Tamil Nadu Industrial Package',
    sponsoringBody: 'Guidance Tamil Nadu & Department of Industries',
    level: 'State',
    applicableStates: ['Tamil Nadu'],
    applicableSectors: 'all',
    benefitType: 'Capital Subsidy',
    maxBenefit: 'Up to 25% Capital Subsidy + 100% Electricity Tax Exemption for 5 Years',
    description:
      'Promotes advanced manufacturing, automotive, electronics, and technical textiles across SIPCOT estates and backward industrial districts of Tamil Nadu.',
    keyBenefits: [
      'Investment promotion capital subsidy of 15% to 25% of eligible fixed assets',
      '100% electricity tax exemption for 5 years from commercial operations',
      '50% land cost concession when establishing units in southern districts (SIPCOT)',
      'Green subsidy up to ₹1 Crore for Zero Liquid Discharge (ZLD) installations',
    ],
    eligibilityHighlights: [
      'New manufacturing facility established in Tamil Nadu',
      'Commitment to direct employment generation and minimum fixed investment',
    ],
    requiredClearances: ['SIDC_LAND_ALLOTMENT', 'SPCB_CTE', 'DISCOM_POWER_SANCTION'],
    officialPortal: 'https://investingintamilnadu.com',
  },
  {
    id: 'scheme_zed_msme',
    name: 'MSME Sustainable (ZED) Certification Scheme (Zero Defect Zero Effect)',
    shortName: 'ZED Green Certification',
    sponsoringBody: 'Ministry of Micro, Small and Medium Enterprises (MoMSME)',
    level: 'Central',
    applicableSectors: 'all',
    cpcbCategories: ['Red', 'Orange', 'Green'],
    benefitType: 'Green Technology Grant',
    maxBenefit: '80% Subsidy on Certification + Up to ₹5 Lakhs for Clean Tech / ETP Upgrades',
    description:
      'Empowers MSMEs to adopt world-class manufacturing standards with zero environmental defects, providing subsidized testing, cleaner production audits, and green technology adoption.',
    keyBenefits: [
      '80% financial subsidy on Bronze, Silver, and Gold level ZED certification fees',
      'Financial support of up to ₹5 Lakhs for installing pollution control equipment, energy meters, and testing tools',
      'Concession of 0.5% in bank interest rates on working capital and term loans from scheduled public sector banks',
      'Priority consideration in public procurement tenders with exemption from earnest money deposit (EMD)',
    ],
    eligibilityHighlights: [
      'Manufacturing MSME with valid Udyam Registration number',
      'Commitment to environmental norms and baseline statutory compliance',
    ],
    requiredClearances: ['SPCB_CTE'],
    officialPortal: 'https://zed.msme.gov.in',
  },
  {
    id: 'scheme_pli_auto',
    name: 'Production Linked Incentive (PLI) Scheme for Automobile and Auto Component Industry',
    shortName: 'Auto Components PLI',
    sponsoringBody: 'Ministry of Heavy Industries (MHI)',
    level: 'Central',
    applicableSectors: ['automobile', 'electronics'],
    minInvestmentCrores: 25,
    benefitType: 'Production Linked Incentive',
    maxBenefit: '8% to 18% incentive on sales of Advanced Automotive Technology (AAT) products',
    description:
      'Designed to overcome cost disabilities of the industry for manufacture of Advanced Automotive Technology products and electric vehicle powertrain systems.',
    keyBenefits: [
      'Direct financial incentive on determined sales value of eligible automotive components',
      'Fast-track testing clearance at certified automotive test agencies (ARAI / ICAT)',
    ],
    eligibilityHighlights: [
      'Manufacturing facility producing certified Advanced Automotive Technology (AAT) components or EV systems',
      'Minimum cumulative new domestic investment of ₹25 Cr over 5 years',
    ],
    requiredClearances: ['SIDC_LAND_ALLOTMENT', 'SPCB_CTE', 'FACTORY_PLAN_APPROVAL'],
    officialPortal: 'https://heavyindustries.gov.in',
  },
  {
    id: 'scheme_specs_electronics',
    name: 'Scheme for Promotion of Manufacturing of Electronic Components and Semiconductors (SPECS)',
    shortName: 'SPECS Electronics Subsidy',
    sponsoringBody: 'Ministry of Electronics and Information Technology (MeitY)',
    level: 'Central',
    applicableSectors: ['electronics'],
    minInvestmentCrores: 5,
    benefitType: 'Capital Subsidy',
    maxBenefit: '25% Capital Incentive on Plant, Machinery & Clean Room Equipment',
    description:
      'Reimburses 25% of capital expenditure on eligible machinery and equipment for electronic components, semiconductor packaging, and printed circuit board assemblies.',
    keyBenefits: [
      '25% reimbursement on capital expenditure for plant, machinery, clean rooms, and utilities',
      'Exemption from basic customs duty on capital goods imports under Project Import Regulations',
    ],
    eligibilityHighlights: [
      'New manufacturing facility or major expansion producing electronic components or semiconductor assemblies',
      'Minimum threshold investment ranging from ₹5 Cr to ₹1,000 Cr depending on item class',
    ],
    requiredClearances: ['SIDC_LAND_ALLOTMENT', 'SPCB_CTE', 'DISCOM_POWER_SANCTION'],
    officialPortal: 'https://www.meity.gov.in/esdm/specs',
  },
  {
    id: 'scheme_rooftop_solar',
    name: 'Industrial Renewable Energy & Captive Solar Capital Support Scheme',
    shortName: 'Captive Solar & Energy Subsidy',
    sponsoringBody: 'Ministry of New and Renewable Energy (MNRE) & State DISCOM',
    level: 'Central',
    applicableSectors: 'all',
    benefitType: 'Capital Subsidy',
    maxBenefit: 'Accelerated Depreciation (40%) + Net Metering Tariff Concessions',
    description:
      'Supports high-demand industrial power consumers to install captive rooftop solar and energy storage systems to offset industrial electricity tariffs.',
    keyBenefits: [
      '40% accelerated depreciation on solar rooftop and energy-saving machinery in Year 1',
      'Concessional wheeling and transmission charges for green energy captive banking',
      'State green duty exemption on self-generated captive solar power',
    ],
    eligibilityHighlights: [
      'Industrial premises with minimum 100 kVA sanctioned connected load',
      'Available unshaded roof area or ground mount perimeter with structural load certification',
    ],
    requiredClearances: ['DISCOM_POWER_SANCTION', 'CEIG_ELECTRICAL_APPROVAL'],
    officialPortal: 'https://solarrooftop.gov.in',
  },
];

export function matchGovernmentSchemes(
  profile: BusinessProfile,
  approvals: ApprovalItem[]
): MatchedScheme[] {
  const approvedCodes = new Set(
    approvals.filter((a) => a.status === 'approved').map((a) => a.code)
  );

  return MASTER_GOVERNMENT_SCHEMES.map((scheme) => {
    let score = 50; // baseline
    const reasons: string[] = [];

    // 1. Sector match
    if (scheme.applicableSectors === 'all') {
      score += 15;
      reasons.push('Broad manufacturing sector eligibility');
    } else if (scheme.applicableSectors && scheme.applicableSectors.includes(profile.sector)) {
      score += 30;
      reasons.push(`Target sector match: ${profile.sector.toUpperCase()}`);
    } else {
      score -= 30;
    }

    // 2. State match
    if (!scheme.applicableStates || scheme.applicableStates.length === 0) {
      score += 10;
      reasons.push('Central pan-India scheme available in all states');
    } else if (
      scheme.applicableStates.some((st) =>
        (profile.state || '').toLowerCase().includes(st.toLowerCase())
      )
    ) {
      score += 25;
      reasons.push(`State jurisdiction match: ${profile.state}`);
    } else {
      score -= 40;
    }

    // 3. Investment scale match
    const investment = profile.investmentInrCrores || 0;
    if (scheme.minInvestmentCrores) {
      if (investment >= scheme.minInvestmentCrores) {
        score += 15;
        reasons.push(`Investment (₹${investment} Cr) meets minimum threshold (₹${scheme.minInvestmentCrores} Cr)`);
      } else {
        score -= 20;
      }
    }

    // 4. Pollution category match (for green schemes)
    if (scheme.cpcbCategories && scheme.cpcbCategories.includes(profile.cpcbCategory)) {
      score += 10;
      reasons.push(`CPCB ${profile.cpcbCategory} Category pollution compliance incentive`);
    }

    // 5. Prerequisites check
    const totalPrereqs = scheme.requiredClearances.length;
    const metPrereqs = scheme.requiredClearances.filter((c) => approvedCodes.has(c)).length;

    if (totalPrereqs > 0) {
      if (metPrereqs === totalPrereqs) {
        score += 10;
        reasons.push(`All ${totalPrereqs} prerequisite approvals cleared`);
      } else {
        reasons.push(`${metPrereqs} of ${totalPrereqs} prerequisite approvals cleared`);
      }
    }

    // Normalize match percentage between 20 and 99
    const matchPercentage = Math.min(99, Math.max(25, score));
    const isEligible = matchPercentage >= 60;

    return {
      ...scheme,
      matchPercentage,
      matchReasons: reasons,
      prerequisitesMetCount: metPrereqs,
      prerequisitesTotalCount: totalPrereqs,
      isEligible,
    };
  })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
}
