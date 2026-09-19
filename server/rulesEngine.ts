import {
  BusinessProfile,
  ApprovalItem,
  BottleneckAlert,
  NextActionStep,
  ApprovalDependencyEdge,
  UploadedDocument,
} from '../src/types/index.js';
import { MASTER_APPROVAL_CATALOG, STANDARD_DEPENDENCY_EDGES } from './knowledgeBase.js';
import { detectAllBottlenecks } from '../src/components/risks/riskEngine.js';
import { selectNextBestAction } from '../src/components/nextAction/nextBestActionEngine.js';

interface StateAuthorityMap {
  sidc: string;
  spcb: string;
  fire: string;
  dish: string;
  discom: string;
  ceig: string;
  boilers: string;
  revenue: string;
  legalMetrology: string;
}

function resolveStateAuthorities(stateName: string = 'Maharashtra', districtName: string = 'Pune'): StateAuthorityMap {
  const normState = (stateName || '').toLowerCase().trim();

  if (normState.includes('maharashtra')) {
    return {
      sidc: 'Maharashtra Industrial Development Corporation (MIDC)',
      spcb: 'Maharashtra Pollution Control Board (MPCB)',
      fire: 'Maharashtra Fire Services / MIDC Fire Brigade',
      dish: 'Directorate of Industrial Safety and Health (DISH), Maharashtra',
      discom: 'Maharashtra State Electricity Distribution Co. Ltd. (MSEDCL)',
      ceig: 'Chief Electrical Inspector to Govt (CEIG), Industries & Energy Dept, Maharashtra',
      boilers: 'Directorate of Steam Boilers, Maharashtra',
      revenue: `District Collector & Sub-Divisional Magistrate (${districtName || 'Pune'})`,
      legalMetrology: 'Department of Legal Metrology, Maharashtra',
    };
  }

  if (normState.includes('gujarat')) {
    return {
      sidc: 'Gujarat Industrial Development Corporation (GIDC)',
      spcb: 'Gujarat Pollution Control Board (GPCB)',
      fire: 'Gujarat State Fire Prevention Services',
      dish: 'Directorate of Industrial Safety and Health (DISH), Gujarat',
      discom: 'Paschim/Uttar Gujarat Vij Company Ltd (UGVCL / PGVCL)',
      ceig: 'Chief Electrical Inspector to Govt of Gujarat, Energy Dept',
      boilers: 'Directorate of Boilers, Gujarat',
      revenue: `District Collector (${districtName || 'Ahmedabad'})`,
      legalMetrology: 'Department of Legal Metrology, Gujarat',
    };
  }

  if (normState.includes('tamil')) {
    return {
      sidc: 'State Industries Promotion Corporation of Tamil Nadu (SIPCOT)',
      spcb: 'Tamil Nadu Pollution Control Board (TNPCB)',
      fire: 'Tamil Nadu Fire and Rescue Services (TNFRS)',
      dish: 'Directorate of Industrial Safety and Health (DISH), Tamil Nadu',
      discom: 'Tamil Nadu Generation and Distribution Corporation (TANGEDCO)',
      ceig: 'Chief Electrical Inspector to Government of Tamil Nadu',
      boilers: 'Directorate of Boilers, Tamil Nadu',
      revenue: `District Collector (${districtName || 'Sriperumbudur'})`,
      legalMetrology: 'Department of Legal Metrology, Tamil Nadu',
    };
  }

  if (normState.includes('karnataka')) {
    return {
      sidc: 'Karnataka Industrial Areas Development Board (KIADB)',
      spcb: 'Karnataka State Pollution Control Board (KSPCB)',
      fire: 'Karnataka State Fire and Emergency Services (KSFES)',
      dish: 'Directorate of Factories, Industrial Safety & Health, Karnataka',
      discom: 'Bangalore Electricity Supply Company (BESCOM / HESCOM)',
      ceig: 'Department of Electrical Inspectorate, Karnataka',
      boilers: 'Directorate of Boilers, Karnataka',
      revenue: `District Deputy Commissioner (${districtName || 'Bengaluru'})`,
      legalMetrology: 'Department of Legal Metrology, Karnataka',
    };
  }

  // Generic fallback for other states
  const stateLabel = stateName || 'State';
  return {
    sidc: `${stateLabel} Industrial Development Corporation`,
    spcb: `${stateLabel} Pollution Control Board (SPCB)`,
    fire: `${stateLabel} Directorate of Fire and Emergency Services`,
    dish: `Directorate of Industrial Safety and Health (DISH), ${stateLabel}`,
    discom: `${stateLabel} State Power Distribution Corporation (DISCOM)`,
    ceig: `Chief Electrical Inspector to Govt (CEIG), ${stateLabel}`,
    boilers: `Directorate of Steam Boilers, ${stateLabel}`,
    revenue: `District Collector (${districtName || 'District Headquarter'})`,
    legalMetrology: `Department of Legal Metrology, ${stateLabel}`,
  };
}

export function evaluateApplicableApprovals(
  profile: BusinessProfile,
  existingApprovalsState: Map<string, Partial<ApprovalItem>> = new Map()
): ApprovalItem[] {
  const authorities = resolveStateAuthorities(profile.state, profile.district);
  const applicableList: ApprovalItem[] = [];

  const isFoodSector =
    profile.sector === 'food_processing' ||
    (profile.industry && profile.industry.toLowerCase().includes('food')) ||
    (profile.subIndustry && profile.subIndustry.toLowerCase().includes('food'));

  const isPharmaChem =
    ['pharma', 'chemicals'].includes(profile.sector) ||
    (profile.industry && /pharma|chemical|drug/i.test(profile.industry));

  const isIndustrialEstate =
    profile.landType === 'designated_industrial_estate' ||
    (profile.landStatus && /industrial/i.test(profile.landStatus));

  const isAgriculturalOrPrivate =
    profile.landType === 'agricultural_conversion' ||
    profile.landType === 'private_industrial_land' ||
    (profile.landStatus && /agricultural|private/i.test(profile.landStatus));

  for (const master of MASTER_APPROVAL_CATALOG) {
    let isApplicable = false;
    let dynamicReason = master.whyApplicable;
    let dynamicAuthority = master.authority;
    let dynamicRisk = master.risk;
    let dynamicNextAction = master.nextAction;

    switch (master.code) {
      case 'SIDC_LAND_ALLOTMENT':
        // Applicable when locating in industrial land or estate
        if (isIndustrialEstate || !isAgriculturalOrPrivate) {
          isApplicable = true;
          dynamicAuthority = authorities.sidc;
          dynamicReason = `Mandatory for securing plot possession, lease deed registration, and planning rights within ${authorities.sidc} cluster in ${profile.district || 'Pune'}, ${profile.state || 'Maharashtra'}.`;
          dynamicNextAction = `Execute registered lease deed and obtain physical site possession certificate from ${authorities.sidc} sub-division office.`;
        }
        break;

      case 'NON_AGRI_CONVERSION':
        // Applicable when locating on private or agricultural land
        if (isAgriculturalOrPrivate) {
          isApplicable = true;
          dynamicAuthority = authorities.revenue;
          dynamicReason = `Mandatory Change of Land Use (CLU) / Section 42 NA permission from ${authorities.revenue} because project is sited on agricultural or private conversion land.`;
          dynamicRisk = 'high';
          dynamicNextAction = 'Submit 30-year title search certificate, encumbrance certificate, and town planning scrutiny file to District Collector.';
        }
        break;

      case 'SPCB_CTE':
        // Applicable for Red, Orange, Green (White category is exempt)
        if (profile.cpcbCategory !== 'White') {
          isApplicable = true;
          dynamicAuthority = authorities.spcb;
          dynamicRisk = profile.cpcbCategory === 'Red' ? 'high' : 'high';
          dynamicReason = `Mandatory statutory Consent to Establish under Water Act 1974 & Air Act 1981 prior to breaking ground for ${profile.cpcbCategory} Category ${profile.industry || profile.sector} unit generating ${profile.waterRequirementKLD > 0 ? (profile.effluentQuantityKLD || Math.round(profile.waterRequirementKLD * 0.6)) + ' KLD effluent' : 'process emissions'}.`;
          dynamicNextAction = `Upload revised ETP engineering design, water mass balance schematic, and air pollution control equipment specs to ${authorities.spcb} OCMMS portal.`;
        }
        break;

      case 'MOEF_EC':
        // Scheduled high-impact sectors or Red category with heavy investment
        if (
          profile.cpcbCategory === 'Red' ||
          isPharmaChem ||
          profile.sector === 'metallurgy' ||
          profile.investmentInrCrores >= 50
        ) {
          isApplicable = true;
          dynamicReason = `Prior Environmental Clearance (EC) under EIA Notification 2006 required for ${profile.cpcbCategory} Category ${profile.sector.toUpperCase()} process manufacturing.`;
          dynamicRisk = 'high';
          dynamicNextAction = 'Commission NABET-accredited environmental baseline monitoring report and draft Environmental Management Plan (EMP).';
        }
        break;

      case 'CGWA_GROUNDWATER_NOC':
        // Evaluated for all units
        isApplicable = true;
        if (profile.waterSource === 'borewell' || profile.waterRequirementKLD > 50) {
          dynamicReason = `Mandatory groundwater abstraction NOC from CGWA triggered by proposed borewell extraction (${profile.waterRequirementKLD} KLD daily demand).`;
          dynamicRisk = 'medium';
          dynamicNextAction = 'Submit hydrogeological investigation report and comprehensive rooftop rainwater harvesting recharge plan.';
        } else {
          // Exemption filing when on industrial piped water
          dynamicReason = `Exemption Verification: 100% water demand (${profile.waterRequirementKLD} KLD) is supplied via industrial piped network. Requires formal non-abstraction self-declaration.`;
          dynamicRisk = 'low';
          dynamicNextAction = 'Submit formal non-abstraction self-declaration along with industrial water supply agreement.';
        }
        break;

      case 'FIRE_NOC_PROVISIONAL':
        // Applicable if builtUpArea >= 500 sqm, or hazardous chemicals, or Red/Orange category, or workers >= 20
        if (
          profile.builtUpAreaSqMeters >= 500 ||
          profile.hasHazardousChemicals ||
          ['Red', 'Orange'].includes(profile.cpcbCategory) ||
          profile.workforceCount >= 20
        ) {
          isApplicable = true;
          dynamicAuthority = authorities.fire;
          dynamicReason = `Mandatory under State Fire Act for ${profile.builtUpAreaSqMeters || 2500} sq.m built-up industrial occupancy housing ${profile.workforceCount} workers and process equipment.`;
          dynamicNextAction = 'Submit fire hydrant network layout, compartmentation drawings, and static underground fire reservoir sizing calculations.';
        }
        break;

      case 'FACTORY_PLAN_APPROVAL':
        // Factories Act Section 6: workforce >= 10 with power
        if (profile.workforceCount >= 10) {
          isApplicable = true;
          dynamicAuthority = authorities.dish;
          dynamicReason = `Mandatory Section 6 clearance under The Factories Act 1948 triggered by projected workforce of ${profile.workforceCount} workers utilizing ${profile.powerRequirementKVA} kVA electric power.`;
          dynamicNextAction = `Upload Form 1 application with machinery placement drawings (min 1.2m gangways) to ${authorities.dish} portal.`;
        }
        break;

      case 'DISCOM_POWER_SANCTION':
        // Applicable if power requirement >= 50 kVA
        if (profile.powerRequirementKVA >= 50) {
          isApplicable = true;
          dynamicAuthority = authorities.discom;
          dynamicReason = `Required for High Tension (HT 11kV) power load sanction of ${profile.powerRequirementKVA} kVA connected industrial load in ${profile.district || 'Pune'}.`;
          dynamicNextAction = `Pay demand note charges for 11 kV metering cubicle and sign consumer bulk power agreement with ${authorities.discom}.`;
        }
        break;

      case 'CEIG_ELECTRICAL_APPROVAL':
        // High voltage installations >= 100 kVA
        if (profile.powerRequirementKVA >= 100) {
          isApplicable = true;
          dynamicAuthority = authorities.ceig;
          dynamicReason = `Statutory safety clearance under Central Electricity Authority Regulations for high voltage transformer (${profile.powerRequirementKVA} kVA capacity) and earthing grid resistance.`;
          dynamicNextAction = 'Schedule electrical pre-commissioning inspection and submit transformer routine test certificates and earth-pit resistance logs.';
        }
        break;

      case 'WATER_SUPPLY_SANCTION':
        // Applicable when relying on piped municipal/industrial supply
        if (profile.waterSource === 'industrial_pipe' || isIndustrialEstate) {
          isApplicable = true;
          dynamicAuthority = `${authorities.sidc} (Water Supply Division)`;
          dynamicReason = `Required for dedicated ${profile.waterRequirementKLD} KLD fresh water pipeline allocation, metering tapping, and tariff agreement.`;
          dynamicNextAction = 'Execute industrial water supply agreement and install calibrated electromagnetic water meter at factory boundary.';
        }
        break;

      case 'BOILER_REGISTRATION':
        // Applicable if steam boiler is declared or capacity > 0
        if (
          profile.hasBoiler ||
          (profile.boilerCapacityTph && profile.boilerCapacityTph > 0) ||
          (profile.fuelUsage && /boiler|steam/i.test(profile.fuelUsage))
        ) {
          isApplicable = true;
          dynamicAuthority = authorities.boilers;
          dynamicReason = `Mandatory under The Indian Boilers Act 1923 for proposed ${profile.boilerCapacityTph || 2} TPH steam boiler deployed for process heating and thermal sterilization.`;
          dynamicNextAction = 'Coordinate with Boiler Inspector for on-site cold hydrostatic pressure testing at 1.5x design working pressure.';
        }
        break;

      case 'DG_SET_EMISSION_NOC':
        // Applicable if standby DG set is installed
        if (
          profile.dgSetCapacityKVA > 0 ||
          (profile.fuelUsage && /dg|diesel/i.test(profile.fuelUsage)) ||
          profile.powerRequirementKVA >= 50
        ) {
          isApplicable = true;
          dynamicAuthority = authorities.spcb;
          dynamicReason = `Required under Environment (Protection) Rules for installation of ${profile.dgSetCapacityKVA || 125} kVA standby diesel generator with acoustic attenuation (<75 dB(A)) and adequate stack height.`;
          dynamicNextAction = 'Ensure chimney height meets statutory formula (building height + 2.5m) and submit manufacturer acoustic enclosure certificate.';
        }
        break;

      case 'PLASTIC_PACKAGING_EPR':
        // Applicable for food or consumer packaging brand owners
        if (
          isFoodSector ||
          (profile.wasteGeneration && /plastic|pouches|packaging/i.test(profile.wasteGeneration))
        ) {
          isApplicable = true;
          dynamicReason = `Mandatory Extended Producer Responsibility (EPR) under Plastic Waste Management Rules 2016 for brand owners utilizing flexible/multi-layered plastic packaging pouches.`;
          dynamicNextAction = 'Register on CPCB National EPR portal with annual plastic procurement forecast and tie-up with registered plastic waste processor.';
        }
        break;

      case 'LEGAL_METROLOGY_PACKAGED':
        // Applicable for packaged goods
        if (
          isFoodSector ||
          (profile.manufacturingActivity && /pack|bottle|box|retort/i.test(profile.manufacturingActivity))
        ) {
          isApplicable = true;
          dynamicAuthority = authorities.legalMetrology;
          dynamicReason = `Mandatory under Rule 27 of Legal Metrology (Packaged Commodities) Rules 2011 for commercial manufacturing of pre-packaged consumer goods.`;
          dynamicNextAction = 'Submit specimen product label artwork showing font size, MRP, net weight, manufacturing date, and customer care details.';
        }
        break;

      case 'FSSAI_CENTRAL_LIC':
        // Mandatory for food processing facilities
        if (isFoodSector) {
          isApplicable = true;
          dynamicReason = `Mandatory Central Food Safety License under Food Safety and Standards Act 2006 for commercial ${profile.subIndustry || 'Food Manufacturing'} operations.`;
          dynamicRisk = 'high';
          dynamicNextAction = 'Upload NABL-certified potable water chemical & microbiological testing report and FSMS hygiene plan on FoSCoS portal.';
        }
        break;

      case 'PESO_EXPLOSIVES_LIC':
        // Applicable if hazardous chemicals or solvents are declared
        if (profile.hasHazardousChemicals || isPharmaChem) {
          isApplicable = true;
          dynamicReason = `Mandatory PESO storage license under Petroleum Act 1934 for chemical solvents and flammables (${profile.hazardousDetails || 'industrial solvents'}).`;
          dynamicRisk = 'high';
          dynamicNextAction = 'Submit tank fabrication drawings with CIMFR flameproof electrical certificates and dyke wall containment volume calculations.';
        }
        break;

      case 'FIRE_NOC_FINAL':
        // Companion to provisional fire NOC
        if (
          profile.builtUpAreaSqMeters >= 500 ||
          profile.hasHazardousChemicals ||
          ['Red', 'Orange'].includes(profile.cpcbCategory) ||
          profile.workforceCount >= 20
        ) {
          isApplicable = true;
          dynamicAuthority = authorities.fire;
          dynamicReason = `Statutory final fire safety occupancy NOC required after civil construction verifying working hydrants, alarms, and emergency evacuation drills.`;
          dynamicNextAction = 'Schedule on-site physical fire drill demonstration and static pressure test (3.5 bar nozzle pressure) with Local Fire Officer.';
        }
        break;

      case 'SPCB_CTO':
        // Consent to operate for Red/Orange/Green
        if (profile.cpcbCategory !== 'White') {
          isApplicable = true;
          dynamicAuthority = authorities.spcb;
          dynamicRisk = 'high';
          dynamicReason = `Mandatory statutory Consent to Operate (CTO) under Water & Air Acts prior to commencing trial runs, raw material processing, and commercial manufacture.`;
          dynamicNextAction = `Complete civil construction of captive ETP and submit point-by-point CTE compliance report for ${authorities.spcb} field inspection.`;
        }
        break;

      case 'FACTORY_LICENSE':
        // Factory license companion to factory plan
        if (profile.workforceCount >= 10) {
          isApplicable = true;
          dynamicAuthority = authorities.dish;
          dynamicRisk = 'high';
          dynamicReason = `Statutory Form 4 Factory License under Section 7 of The Factories Act 1948 authorising physical employment of ${profile.workforceCount} workers for commercial manufacturing.`;
          dynamicNextAction = 'Obtain Form 1A Structural Stability Certificate signed by chartered civil engineer upon completion of building construction.';
        }
        break;

      case 'ESIC_EPFO_REGISTRATION':
        // Applicable if workforce >= 20
        if (profile.workforceCount >= 20) {
          isApplicable = true;
          dynamicReason = `Mandatory statutory social security coverage under EPF & MP Act 1952 and ESI Act 1948 for enterprises employing 20+ workers (${profile.workforceCount} projected employees).`;
          dynamicNextAction = 'Maintain online electronic monthly challans (ECR) for employee wage registers and provident fund contributions.';
        }
        break;

      case 'NSWS_COMPOSITE_REGISTRATION':
        // Always applicable as master composite investor filing
        isApplicable = true;
        dynamicReason = 'Composite common application filing linking Central Ministries and State Single Window with centralized investor tracking ID.';
        dynamicNextAction = 'Keep central investor profile updated and synchronize state application tracking numbers with NSWS dashboard.';
        break;

      default:
        isApplicable = false;
        break;
    }

    if (isApplicable) {
      const existing = existingApprovalsState.get(master.code);
      applicableList.push({
        ...master,
        name: master.name,
        title: master.name,
        authority: dynamicAuthority,
        issuingAuthority: dynamicAuthority,
        whyApplicable: dynamicReason,
        applicabilityReason: dynamicReason,
        risk: dynamicRisk,
        nextAction: dynamicNextAction,
        dependencies: master.dependencies,
        prerequisites: master.prerequisites,
        demoProcessingTime: master.demoProcessingTime,
        status: existing?.status || 'not_started',
        daysElapsed: existing?.daysElapsed || 0,
        submissionDate: existing?.submissionDate,
        approvedDate: existing?.approvedDate,
        queryDetails: existing?.queryDetails,
      });
    }
  }

  return applicableList;
}

export function filterActiveDependencies(
  applicableApprovals: ApprovalItem[]
): ApprovalDependencyEdge[] {
  const activeCodes = new Set(applicableApprovals.map((a) => a.code));
  return STANDARD_DEPENDENCY_EDGES.filter(
    (edge) => activeCodes.has(edge.from) && activeCodes.has(edge.to)
  );
}

export function detectBottlenecks(
  approvals: ApprovalItem[],
  profile: BusinessProfile,
  documents: UploadedDocument[] = []
): BottleneckAlert[] {
  return detectAllBottlenecks(approvals, profile, documents);
}

export function generateNextActions(
  approvals: ApprovalItem[],
  alerts: BottleneckAlert[],
  profile: BusinessProfile,
  documents: UploadedDocument[] = []
): NextActionStep[] {
  // Use the deterministic multi-factor Next Best Action engine
  const { prioritizedActions } = selectNextBestAction(approvals, documents, profile, alerts);

  if (prioritizedActions && prioritizedActions.length > 0) {
    return prioritizedActions.slice(0, 5).map((action) => ({
      id: action.id,
      priority: action.priority === 'CRITICAL' ? 'immediate' : action.priority === 'HIGH' ? 'high' : 'medium',
      title: action.actionTitle,
      department: action.issuingAuthority,
      approvalCode: action.affectedApprovalCode,
      actionType: action.category === 'query_reply' ? 'query_reply' : action.category === 'sla_escalation' ? 'track_sla' : 'document_upload',
      reason: action.whyExplanation,
      estimatedTime: action.estimatedTime,
      actionRouteTab: action.actionRouteTab,
      why: action.whyExplanation,
      actionTitle: action.actionTitle,
      downstreamImpact: action.downstreamImpact,
      score: action.totalScore,
      examinationSummary: action.examinationSummary,
    }));
  }

  return [];
}
