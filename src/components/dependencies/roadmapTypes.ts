import { ApprovalItem, ApprovalDependencyEdge, UploadedDocument } from '../../types/index.js';

export type RoadmapStageKey =
  | 'business_profile'
  | 'project_land'
  | 'environmental'
  | 'factory_operational'
  | 'fire_safety'
  | 'utility'
  | 'operational_compliance';

export type VisualGraphStatus =
  | 'completed'          // GREEN = Completed
  | 'in_progress'        // BLUE = In Progress
  | 'attention_required' // YELLOW = Attention Required
  | 'blocked'            // RED = Blocked
  | 'not_started';       // GREY = Not Started

export interface RoadmapStageMeta {
  key: RoadmapStageKey;
  order: number;
  label: string;
  shortLabel: string;
  description: string;
  accentColor: string;
}

export const ROADMAP_STAGES: RoadmapStageMeta[] = [
  {
    key: 'business_profile',
    order: 1,
    label: '1. Business Profile',
    shortLabel: 'Profile & KYC',
    description: 'Master investor registration, Udyam MSME, and national single-window baseline identity.',
    accentColor: 'indigo',
  },
  {
    key: 'project_land',
    order: 2,
    label: '2. Project/Land Information',
    shortLabel: 'Land & Zoning',
    description: 'Industrial plot allotment deed, possession demarcation, or non-agricultural CLU conversion.',
    accentColor: 'blue',
  },
  {
    key: 'environmental',
    order: 3,
    label: '3. Environmental Readiness',
    shortLabel: 'Pollution & EC',
    description: 'State PCB Consent to Establish (CTE), EIA clearance, and CGWA groundwater extraction NOC.',
    accentColor: 'teal',
  },
  {
    key: 'factory_operational',
    order: 4,
    label: '4. Factory/Operational Readiness',
    shortLabel: 'Factory Plans',
    description: 'DISH factory building layouts, structural stability safety, and PESO storage sanctions.',
    accentColor: 'cyan',
  },
  {
    key: 'fire_safety',
    order: 5,
    label: '5. Fire/Safety Readiness',
    shortLabel: 'Fire Clearances',
    description: 'Provisional building fire scheme sanction and final life safety compliance certification.',
    accentColor: 'amber',
  },
  {
    key: 'utility',
    order: 6,
    label: '6. Utility Readiness',
    shortLabel: 'Power & Water',
    description: 'HT grid power load sanction, piped industrial water tapping, CEIG transformer inspect, and DG set.',
    accentColor: 'violet',
  },
  {
    key: 'operational_compliance',
    order: 7,
    label: '7. Operational Compliance',
    shortLabel: 'Operating Licenses',
    description: 'Consent to Operate (CTO), boiler hydrostatic signoff, FSSAI manufacturing license & Form 4 Factory License.',
    accentColor: 'emerald',
  },
];

export interface EvaluatedGraphNode {
  approval: ApprovalItem;
  stageKey: RoadmapStageKey;
  stageMeta: RoadmapStageMeta;
  visualStatus: VisualGraphStatus;
  statusLabel: string;
  isBlocked: boolean;
  blockedByCodes: string[];
  blockedByNames: string[];
  blockingReasons: string[];
  incompletePrereqs: { code: string; name: string; status: string }[];
  clearedPrereqs: { code: string; name: string; status: string }[];
  outgoingDependents: { code: string; name: string; status: string; isLockedByThis: boolean }[];
  canRunParallel: boolean;
  parallelSiblings: string[];
  uploadedDocsCount: number;
  totalRequiredDocsCount: number;
  missingMandatoryDocsCount: number;
}

/**
 * Data-driven categorization of any ApprovalItem into the 7 requested Roadmap Stages
 */
export function categorizeApprovalToRoadmapStage(item: ApprovalItem): RoadmapStageKey {
  const code = (item.code || '').toUpperCase();
  const category = (item.category || '').toLowerCase();
  const title = (item.title || item.name || '').toLowerCase();

  // 1. Business Profile
  if (
    code.includes('NSWS') ||
    code.includes('UDYAM') ||
    code.includes('ESIC_EPFO') ||
    category.includes('identity') ||
    category.includes('taxation') ||
    category.includes('trade') ||
    title.includes('single window system') ||
    title.includes('incorporation')
  ) {
    return 'business_profile';
  }

  // 2. Project/Land Information
  if (
    code.includes('LAND') ||
    code.includes('NON_AGRI') ||
    code.includes('CLU') ||
    category.includes('land') ||
    category.includes('zoning') ||
    title.includes('allotment') ||
    title.includes('conversion') ||
    title.includes('possession')
  ) {
    return 'project_land';
  }

  // 3. Environmental Readiness
  if (
    code.includes('CTE') ||
    code.includes('MOEF') ||
    code.includes('CGWA') ||
    code.includes('EIA') ||
    category.includes('pollution') ||
    category.includes('environmental') ||
    title.includes('consent to establish') ||
    title.includes('groundwater') ||
    title.includes('environmental clearance')
  ) {
    return 'environmental';
  }

  // 5. Fire/Safety Readiness (check before factory_operational if fire specific)
  if (
    code.includes('FIRE') ||
    title.includes('fire') ||
    category.includes('fire')
  ) {
    return 'fire_safety';
  }

  // 4. Factory/Operational Readiness
  if (
    code.includes('FACTORY_PLAN') ||
    code.includes('PESO') ||
    code.includes('METROLOGY') ||
    category.includes('civil layout') ||
    category.includes('safety, fire & labour') ||
    title.includes('plan approval') ||
    title.includes('explosives') ||
    title.includes('stability')
  ) {
    return 'factory_operational';
  }

  // 6. Utility Readiness
  if (
    code.includes('POWER') ||
    code.includes('WATER') ||
    code.includes('CEIG') ||
    code.includes('DG_SET') ||
    code.includes('ELECTRICAL') ||
    category.includes('power') ||
    category.includes('utility') ||
    category.includes('electrical') ||
    title.includes('electricity') ||
    title.includes('water supply') ||
    title.includes('power sanction') ||
    title.includes('transformer')
  ) {
    return 'utility';
  }

  // 7. Operational Compliance
  if (
    code.includes('CTO') ||
    code.includes('BOILER') ||
    code.includes('FSSAI') ||
    code.includes('FACTORY_LICENSE') ||
    code.includes('EPR') ||
    category.includes('license') ||
    category.includes('operating') ||
    title.includes('consent to operate') ||
    title.includes('boiler') ||
    title.includes('food safety') ||
    title.includes('factory license')
  ) {
    return 'operational_compliance';
  }

  // Fallback by project stage
  if (item.stage === 'pre_establishment') return 'project_land';
  if (item.stage === 'pre_construction') return 'factory_operational';
  return 'operational_compliance';
}

/**
 * Data-driven evaluation of all approval nodes, their statuses, blocked conditions, and parallel branches
 */
export function evaluateRoadmapGraph(
  approvals: ApprovalItem[],
  dependencyEdges: ApprovalDependencyEdge[],
  documents: UploadedDocument[]
): EvaluatedGraphNode[] {
  const approvalMap = new Map<string, ApprovalItem>(approvals.map((a) => [a.code, a]));

  // Pre-calculate ancestry to accurately detect parallel independent branches
  const prereqMap = new Map<string, Set<string>>();
  approvals.forEach((a) => {
    const rawPrereqs = a.dependencies || a.prerequisites || [];
    // Also merge incoming edges from dependencyEdges
    const edgePrereqs = dependencyEdges.filter((e) => e.to === a.code).map((e) => e.from);
    const combined = Array.from(new Set([...rawPrereqs, ...edgePrereqs]));
    prereqMap.set(a.code, new Set(combined));
  });

  // Calculate full recursive ancestors
  const ancestorMap = new Map<string, Set<string>>();
  function getAncestors(code: string, visited = new Set<string>()): Set<string> {
    if (ancestorMap.has(code)) return ancestorMap.get(code)!;
    if (visited.has(code)) return new Set();
    visited.add(code);

    const direct = prereqMap.get(code) || new Set();
    const all = new Set(direct);
    direct.forEach((p) => {
      getAncestors(p, new Set(visited)).forEach((ancestor) => all.add(ancestor));
    });
    ancestorMap.set(code, all);
    return all;
  }

  approvals.forEach((a) => getAncestors(a.code));

  return approvals.map((item) => {
    const stageKey = categorizeApprovalToRoadmapStage(item);
    const stageMeta = ROADMAP_STAGES.find((s) => s.key === stageKey) || ROADMAP_STAGES[0];

    const directPrereqCodes = Array.from(prereqMap.get(item.code) || []);
    
    // Check which prerequisite approvals are incomplete
    const incompletePrereqs: { code: string; name: string; status: string }[] = [];
    const clearedPrereqs: { code: string; name: string; status: string }[] = [];

    directPrereqCodes.forEach((code) => {
      const p = approvalMap.get(code);
      if (p) {
        if (p.status === 'approved') {
          clearedPrereqs.push({ code, name: p.name || p.title || code, status: p.status });
        } else {
          incompletePrereqs.push({ code, name: p.name || p.title || code, status: p.status });
        }
      }
    });

    const isCompleted = item.status === 'approved';
    // Downstream approval is BLOCKED if any upstream prerequisite is not completed
    const isBlocked = !isCompleted && incompletePrereqs.length > 0;

    // Check mandatory uploaded documents
    const requiredDocs = item.requiredDocuments || [];
    const uploadedForThis = documents.filter((d) => d.approvalCode === item.code);
    const missingMandatoryDocsCount = Math.max(0, requiredDocs.length - uploadedForThis.length);

    // Compute downstream nodes that are locked/dependent on this node
    const outgoingEdges = dependencyEdges.filter((e) => e.from === item.code);
    const outgoingCodes = Array.from(
      new Set([
        ...outgoingEdges.map((e) => e.to),
        ...approvals
          .filter((a) => (a.dependencies || a.prerequisites || []).includes(item.code))
          .map((a) => a.code),
      ])
    );

    const outgoingDependents = outgoingCodes.map((code) => {
      const dep = approvalMap.get(code);
      return {
        code,
        name: dep?.name || dep?.title || code,
        status: dep?.status || 'not_started',
        isLockedByThis: !isCompleted && (dep?.status !== 'approved'),
      };
    });

    // Compute Visual Status
    let visualStatus: VisualGraphStatus;
    let statusLabel: string;

    if (isCompleted) {
      visualStatus = 'completed'; // GREEN
      statusLabel = 'Completed';
    } else if (isBlocked) {
      visualStatus = 'blocked'; // RED
      statusLabel = 'Blocked';
    } else if (item.status === 'in_review') {
      visualStatus = 'in_progress'; // BLUE
      statusLabel = 'In Progress';
    } else if (item.status === 'query_raised') {
      visualStatus = 'attention_required'; // YELLOW
      statusLabel = 'Attention Required (Query)';
    } else if (item.status === 'documents_pending') {
      visualStatus = 'attention_required'; // YELLOW
      statusLabel = 'Attention Required (Dossier)';
    } else {
      // not_started and all prerequisites are cleared
      visualStatus = 'not_started'; // GREY
      statusLabel = 'Not Started';
    }

    const blockedByCodes = incompletePrereqs.map((p) => p.code);
    const blockedByNames = incompletePrereqs.map((p) => p.name);
    const blockingReasons = incompletePrereqs.map(
      (p) => `Requires clearance of "${p.name}" (Status: ${p.status.replace(/_/g, ' ')})`
    );

    // Parallel identification: other approvals at the same stage/tier that don't depend on each other
    const myAncestors = ancestorMap.get(item.code) || new Set();
    const parallelSiblings = approvals
      .filter((other) => {
        if (other.code === item.code) return false;
        const otherAncestors = ancestorMap.get(other.code) || new Set();
        // Neither is an ancestor of the other
        const noDirectAncestor = !myAncestors.has(other.code) && !otherAncestors.has(item.code);
        // Categorized in same stage or same project stage
        const sameStage = categorizeApprovalToRoadmapStage(other) === stageKey;
        return noDirectAncestor && sameStage;
      })
      .map((other) => other.code);

    const canRunParallel = parallelSiblings.length > 0;

    return {
      approval: item,
      stageKey,
      stageMeta,
      visualStatus,
      statusLabel,
      isBlocked,
      blockedByCodes,
      blockedByNames,
      blockingReasons,
      incompletePrereqs,
      clearedPrereqs,
      outgoingDependents,
      canRunParallel,
      parallelSiblings,
      uploadedDocsCount: uploadedForThis.length,
      totalRequiredDocsCount: requiredDocs.length,
      missingMandatoryDocsCount,
    };
  });
}
