export type IndustrySector =
  | 'pharma'
  | 'chemicals'
  | 'food_processing'
  | 'textiles'
  | 'automobile'
  | 'electronics'
  | 'metallurgy'
  | 'renewable_energy';

export type CpcbCategory = 'Red' | 'Orange' | 'Green' | 'White';

export type InvestmentScale = 'micro' | 'small' | 'medium' | 'large';

export type LandType =
  | 'designated_industrial_estate'
  | 'private_industrial_land'
  | 'agricultural_conversion'
  | 'eco_sensitive_proximity';

export type WaterSource =
  | 'borewell'
  | 'industrial_pipe'
  | 'river_canal'
  | 'tanker_supply';

export type ApprovalStage =
  | 'pre_establishment'
  | 'pre_construction'
  | 'pre_operation'
  | 'post_operation';

export type ApprovalStatus =
  | 'not_started'
  | 'documents_pending'
  | 'in_review'
  | 'query_raised'
  | 'approved'
  | 'rejected';

export interface BusinessProfile {
  id: string;
  companyName: string;
  cinOrUdyam: string;
  pan: string;
  gstin: string;
  sector: IndustrySector;
  state: string;
  district: string;
  industrialArea: string;
  landType: LandType;
  landAreaAcres: number;
  builtUpAreaSqMeters: number;
  investmentScale: InvestmentScale;
  investmentInrCrores: number;
  cpcbCategory: CpcbCategory;
  workforceCount: number;
  powerRequirementKVA: number;
  waterRequirementKLD: number;
  waterSource: WaterSource;
  hasBoiler: boolean;
  boilerCapacityTph?: number;
  hasHazardousChemicals: boolean;
  hazardousDetails?: string;
  hasEffluentDischarge: boolean;
  effluentQuantityKLD?: number;
  dgSetCapacityKVA: number;
  projectStage: ApprovalStage;
  targetCommissioningDate: string;

  // Onboarding & project attributes
  businessType?: string;
  industry?: string;
  subIndustry?: string;
  city?: string;
  projectType?: string;
  unitType?: 'New Unit' | 'Expansion';
  landStatus?: string;
  productionType?: string;
  manufacturingActivity?: string;
  wasteGeneration?: string;
  fuelUsage?: string;
  isDemoData?: boolean;
}

export interface RequiredDocumentDef {
  id: string;
  code: string;
  name: string;
  required: boolean;
  format: string;
  description: string;
}

export interface ApprovalItem {
  id: string;
  code: string;
  name: string;
  title: string;
  authority: string;
  issuingAuthority: string;
  category: string;
  description: string;
  whyApplicable: string;
  applicabilityReason: string;
  requiredDocuments: RequiredDocumentDef[];
  dependencies: string[]; // Names/codes of prerequisite approvals
  prerequisites: string[]; // Equivalent to dependencies
  demoProcessingTime: string;
  status: ApprovalStatus;
  risk: 'high' | 'medium' | 'low';
  nextAction: string;

  // Metadata & regulatory attributes
  portalName: string;
  level: 'Central' | 'State' | 'Local';
  stage: ApprovalStage;
  slaDays: number;
  daysElapsed: number;
  estimatedFeeInr: number;
  legalBasis: string;
  isCriticalPath: boolean;
  submissionDate?: string;
  approvedDate?: string;
  queryDetails?: {
    queryText: string;
    raisedDate: string;
    deadlineDate: string;
    departmentOfficer: string;
    urgency: 'critical' | 'medium';
  };
}

export interface ApprovalDependencyEdge {
  from: string; // approval code
  to: string;   // approval code
  type: 'hard_prerequisite' | 'recommended_parallel' | 'post_clearance';
  label: string;
}

export interface ExtractedDocumentFields {
  companyName: string | null;
  address: string | null;
  dates: string[] | null;
  visibleRegistrationNumbers: string[] | null;
  importantFields: Record<string, any>;
  possibleExpiryDate: string | null;
}

export interface DocumentPreValidationCheck {
  check: string;
  status: 'pass' | 'fail' | 'warning' | 'inconclusive';
  details: string;
}

export interface GeminiDocumentPreValidation {
  documentType: string;
  extractedFields: ExtractedDocumentFields;
  checks: DocumentPreValidationCheck[];
  warnings: string[];
  missingInformation: string[];
  inconsistencies: string[];
  readinessScore: number;
  recommendedAction: string;
  disclaimer: string;
  scanTimestamp?: string;
  geminiValidated?: boolean;
}

export interface DocumentValidationResult {
  score: number;
  status: 'passed' | 'warning' | 'mismatch';
  verifiedFields: {
    field: string;
    extractedValue: string;
    profileValue: string;
    isMatch: boolean;
  }[];
  criticalDiscrepancies: string[];
  advisoryNotes: string[];
  geminiValidated: boolean;
  scanTimestamp: string;
  aiPreValidation?: GeminiDocumentPreValidation;
}

export type DocumentStatus =
  | 'NOT UPLOADED'
  | 'UPLOADED'
  | 'UNDER REVIEW'
  | 'VERIFIED'
  | 'NEEDS CORRECTION';

export interface ComplianceDocumentRecord {
  id: string;
  name: string;
  documentType: string;
  relatedApproval: string;
  relatedApprovalCode?: string;
  status: DocumentStatus;
  uploadDate?: string | null;
  validationStatus: string;
  issues: string[];
  expiryDate?: string | null;

  // Additional technical and preview metadata
  fileName?: string;
  fileSizeKb?: number;
  fileType?: string; // 'application/pdf' | 'image/png' | 'image/jpeg'
  fileDataUrl?: string; // Base64 data for image preview
  isRequired?: boolean;
  format?: string;
  description?: string;
  extractedSnippet?: string;
  validationScore?: number;
  advisoryNotes?: string[];
  verifiedFields?: {
    field: string;
    extractedValue: string;
    profileValue: string;
    isMatch: boolean;
  }[];
  geminiValidated?: boolean;
  aiPreValidation?: GeminiDocumentPreValidation;
}

export interface UploadedDocument {
  id: string;
  approvalCode: string;
  approvalTitle: string;
  documentTypeCode: string;
  documentName: string;
  fileName: string;
  fileSizeKb: number;
  uploadedAt: string;
  validationStatus: 'unvalidated' | 'validating' | 'passed' | 'warning' | 'mismatch';
  validationResult?: DocumentValidationResult;
  aiPreValidation?: GeminiDocumentPreValidation;
  status?: DocumentStatus;
  expiryDate?: string | null;
  issues?: string[];
  fileDataUrl?: string;
  mockContentSnippet?: string;
}

export type RiskSeverity =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type BottleneckCategory =
  | 'missing_documents'
  | 'overdue_applications'
  | 'unresolved_queries'
  | 'blocked_dependencies'
  | 'upcoming_deadlines'
  | 'document_inconsistencies';

export interface BottleneckAlert {
  id: string;
  severity: RiskSeverity;
  category: BottleneckCategory;
  issue: string;
  affectedApproval: string;
  approvalCode: string;
  approvalTitle: string;
  downstreamImpact: string;
  recommendedAction: string;
  impactOnCommercialDateDays: number;
  dueDate?: string;
  routeTab?: string;
  detectedAt?: string;

  // Backwards compatibility aliases
  title?: string;
  description?: string;
  suggestedAction?: string;
  mitigationRecommendation?: string;
  type?: string;
}

export interface NextBestAction {
  id: string;
  rank: number;
  actionTitle: string;
  whyExplanation: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category:
    | 'missing_document'
    | 'document_correction'
    | 'query_reply'
    | 'ready_to_apply'
    | 'sla_escalation'
    | 'unvalidated_document';
  affectedApprovalCode: string;
  affectedApprovalName: string;
  issuingAuthority: string;
  downstreamImpact: string;
  daysRemaining?: number;
  dueDate?: string;
  estimatedTime: string;
  actionRouteTab: 'documents' | 'tracker' | 'approvals' | 'dependencies';
  resolvePayload: {
    type: 'upload_document' | 'correct_document' | 'reply_query' | 'file_application' | 'escalate_sla';
    approvalCode: string;
    documentTypeCode?: string;
    documentId?: string;
    documentName?: string;
  };
  examinationSummary: {
    approvalStatus: string;
    documentStatus: string;
    dependencies: string;
    deadlines: string;
    bottlenecks: string;
    risk: string;
  };
  totalScore: number;
  scoreFactors: {
    statusScore: number;
    documentScore: number;
    dependencyScore: number;
    deadlineScore: number;
    bottleneckScore: number;
    riskScore: number;
  };
}

export interface NextActionStep {
  id: string;
  priority: 'immediate' | 'high' | 'medium';
  title: string;
  department: string;
  approvalCode: string;
  actionType: 'query_reply' | 'document_upload' | 'apply_approval' | 'track_sla';
  reason: string;
  estimatedTime: string;
  actionRouteTab: string;
  why?: string;
  actionTitle?: string;
  downstreamImpact?: string;
  score?: number;
  examinationSummary?: {
    approvalStatus: string;
    documentStatus: string;
    dependencies: string;
    deadlines: string;
    bottlenecks: string;
    risk: string;
  };
}

export interface CopilotStructuredResponse {
  answer: string;
  reason: string;
  relevantRecord: string;
  recommendedAction: string;
  suggestedTab?: string;
  suggestedActionLabel?: string;
  isUnavailable?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendations?: string[];
  relevantApprovals?: string[];
  structured?: CopilotStructuredResponse;
  suggestedActionTab?: string;
  suggestedActionLabel?: string;
}

export type SchemeApplicationStatus =
  | 'not_started'
  | 'prerequisites_pending'
  | 'preparing_documents'
  | 'ready_for_submission'
  | 'under_review'
  | 'sanctioned';

export interface DemonstrationScheme {
  id: string;
  name: string;
  shortName: string;
  sponsoringBody: string;
  level: 'Central' | 'State';
  applicableStates?: string[];
  applicableIndustries: (IndustrySector | 'all')[];
  applicableProjectTypes: string[];
  minInvestmentInrCrores: number;
  maxInvestmentInrCrores?: number;
  applicableBusinessTypes: string[];
  benefitType: 'Capital Subsidy' | 'Production Linked Incentive' | 'Tax & Duty Exemption' | 'Interest Subvention' | 'Green Technology Grant' | 'Infrastructure Assistance';
  maxBenefit: string;
  description: string;
  keyBenefits: string[];
  eligibilityConditions: string[];
  requiredDocuments: {
    id: string;
    code?: string;
    name: string;
    description: string;
    mandatory: boolean;
    matchingDocCode?: string;
  }[];
  requiredClearances: string[];
  officialPortal: string;
  nodalAgency: string;
  isDemonstration: boolean;
}

export interface MatchedDemonstrationScheme extends DemonstrationScheme {
  potentialRelevance: 'High' | 'Moderate' | 'Conditional';
  potentialRelevanceScore: number;
  potentialRelevanceDisclaimer: string; // "Potentially relevant based on prototype criteria."
  authorityVerificationNotice: string; // "Verify eligibility with the concerned authority."
  whyItMayBeRelevant: {
    industryWhy: string;
    locationWhy: string;
    projectTypeWhy: string;
    investmentWhy: string;
    businessTypeWhy: string;
    overallSummary: string;
  };
  documentsStatus: {
    docId: string;
    name: string;
    isUploaded: boolean;
    validationStatus?: string;
    mandatory: boolean;
  }[];
  requiredDocumentsCount: number;
  uploadedDocumentsCount: number;
  prerequisitesMetCount: number;
  prerequisitesTotalCount: number;
  applicationStatus: SchemeApplicationStatus;
}

