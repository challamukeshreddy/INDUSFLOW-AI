import { BusinessProfile, ApprovalItem, UploadedDocument, ChatMessage } from '../src/types/index.js';
import { evaluateApplicableApprovals } from './rulesEngine.js';

export interface BusinessPreset {
  id: string;
  name: string;
  sectorLabel: string;
  location: string;
  investment: string;
  workforce: number;
  stage: string;
  cpcbCategory: string;
  profile: BusinessProfile;
  approvalStates: [string, Partial<ApprovalItem>][];
  documents: UploadedDocument[];
  initialChat: ChatMessage[];
}

export class IndusflowDataStore {
  private profile: BusinessProfile;
  private approvalsState: Map<string, Partial<ApprovalItem>> = new Map();
  private documents: UploadedDocument[] = [];
  private chatHistory: ChatMessage[] = [];
  private currentPresetId: string = 'abc_foods';

  private presets: Record<string, BusinessPreset> = {
    abc_foods: {
      id: 'abc_foods',
      name: 'ABC Foods Manufacturing',
      sectorLabel: 'Food Manufacturing (Processing)',
      location: 'Pune, Maharashtra',
      investment: '₹10.0 Crore',
      workforce: 75,
      stage: 'Pre-establishment',
      cpcbCategory: 'Orange',
      profile: {
        id: 'proj_abc_foods_01',
        companyName: 'ABC Foods Manufacturing',
        cinOrUdyam: 'U15400MH2024PTC221940',
        pan: 'AAACB4912L',
        gstin: '27AAACB4912L1Z8',
        sector: 'food_processing',
        industry: 'Food Manufacturing',
        subIndustry: 'Processed Foods, Fruit Pulp & Packaged Snacks',
        state: 'Maharashtra',
        district: 'Pune',
        city: 'Pune',
        industrialArea: 'Chakan Industrial Area, MIDC Phase II',
        landType: 'designated_industrial_estate',
        landStatus: 'Industrial Land',
        landAreaAcres: 3.2,
        builtUpAreaSqMeters: 3500,
        investmentScale: 'medium',
        investmentInrCrores: 10.0,
        cpcbCategory: 'Orange',
        workforceCount: 75,
        powerRequirementKVA: 200,
        waterRequirementKLD: 35,
        waterSource: 'industrial_pipe',
        hasBoiler: true,
        boilerCapacityTph: 2,
        hasHazardousChemicals: false,
        hazardousDetails: 'No hazardous chemicals. Food grade sanitizing agents stored safely.',
        hasEffluentDischarge: true,
        effluentQuantityKLD: 22,
        dgSetCapacityKVA: 250,
        projectStage: 'pre_establishment',
        targetCommissioningDate: '2027-04-30',
        unitType: 'New Unit',
        projectType: 'Greenfield (New Unit)',
        manufacturingActivity: 'Processing, pasteurization, and aseptic packaging of ready-to-eat fruit pulp, baked extruded snacks, and processed food products.',
        isDemoData: true,
      },
      approvalStates: [
        ['SIDC_LAND_ALLOTMENT', { status: 'approved', daysElapsed: 18, submissionDate: '2026-08-01', approvedDate: '2026-08-19' }],
        ['SPCB_CTE', {
          status: 'query_raised',
          daysElapsed: 28,
          submissionDate: '2026-08-20',
          queryDetails: {
            queryText: 'Discrepancy detected between Water Balance Diagram in DPR (35 KLD) and ETP hydraulic capacity in application form (22 KLD wash water vs 30 KLD ETP). Please clarify grease trap sizing and RO permeate recycling ratio.',
            raisedDate: '2026-09-06',
            deadlineDate: '2026-09-28',
            departmentOfficer: 'Shri R. Kulkarni (Sub-Regional Officer, MPCB Pune-II)',
            urgency: 'critical',
          },
        }],
        ['DISCOM_POWER_SANCTION', { status: 'in_review', daysElapsed: 14, submissionDate: '2026-09-02' }],
        ['FIRE_NOC_PROVISIONAL', { status: 'documents_pending', daysElapsed: 6, submissionDate: '2026-09-10' }],
        ['FACTORY_PLAN_APPROVAL', { status: 'not_started', daysElapsed: 0 }],
        ['FSSAI_CENTRAL_LIC', { status: 'not_started', daysElapsed: 0 }],
        ['BOILER_REGISTRATION', { status: 'not_started', daysElapsed: 0 }],
        ['SPCB_CTO', { status: 'not_started', daysElapsed: 0 }],
        ['FACTORY_LICENSE', { status: 'not_started', daysElapsed: 0 }],
        ['FIRE_NOC_FINAL', { status: 'not_started', daysElapsed: 0 }],
      ],
      documents: [
        {
          id: 'doc_abc_01',
          approvalCode: 'SIDC_LAND_ALLOTMENT',
          approvalTitle: 'Industrial Land Allotment & Possession Certificate',
          documentTypeCode: 'COMPANY_ID',
          documentName: 'Certificate of Incorporation & Udyam Registration',
          fileName: 'ABCFoods_ROC_Udyam_MH.pdf',
          fileSizeKb: 1120,
          uploadedAt: '2026-08-10 11:15',
          status: 'VERIFIED',
          expiryDate: 'N/A (Perpetual)',
          issues: [],
          validationStatus: 'passed',
          validationResult: {
            score: 96,
            status: 'passed',
            verifiedFields: [
              { field: 'Company Name', extractedValue: 'ABC Foods Manufacturing', profileValue: 'ABC Foods Manufacturing', isMatch: true },
              { field: 'Registered Location', extractedValue: 'Plot 42-B, Chakan MIDC, Pune', profileValue: 'Chakan Industrial Area, MIDC Phase II', isMatch: true },
              { field: 'Industry Sector', extractedValue: 'Food Processing (NIC Code 10)', profileValue: 'Food Manufacturing', isMatch: true },
            ],
            criticalDiscrepancies: [],
            advisoryNotes: ['Corporate identity and registered office in Pune verified against MCA and Udyam databases.'],
            geminiValidated: true,
            scanTimestamp: '2026-08-10 11:18',
          },
        },
        {
          id: 'doc_abc_02',
          approvalCode: 'SPCB_CTE',
          approvalTitle: 'Consent to Establish (CTE / NOC)',
          documentTypeCode: 'WATER_BALANCE',
          documentName: 'Water Balance & Food Effluent Treatment Plan',
          fileName: 'ABCFoods_ETP_Scheme_Draft.pdf',
          fileSizeKb: 2150,
          uploadedAt: '2026-09-08 16:20',
          status: 'NEEDS CORRECTION',
          expiryDate: '2027-09-08',
          issues: [
            'Discrepancy: Fresh water intake listed as 35 KLD, but wash water effluent shows 22 KLD with unspecified CIP recovery.',
            'Oil & grease trap design requires explicit retention time calculation for bakery and dairy lines per CPCB norms.',
          ],
          validationStatus: 'mismatch',
          validationResult: {
            score: 64,
            status: 'mismatch',
            verifiedFields: [
              { field: 'Unit Location', extractedValue: 'Chakan MIDC Phase II, Pune', profileValue: 'Chakan Industrial Area, MIDC Phase II', isMatch: true },
              { field: 'Fresh Water Intake', extractedValue: '35.0 KLD', profileValue: '35.0 KLD', isMatch: true },
              { field: 'Industrial Effluent Generation', extractedValue: '22.0 KLD', profileValue: '22.0 KLD', isMatch: true },
              { field: 'CPCB Pollution Category', extractedValue: 'Orange Category (Food Processing)', profileValue: 'Orange', isMatch: true },
            ],
            criticalDiscrepancies: [
              'Discrepancy: Fresh water intake listed as 35 KLD, but wash water effluent shows 22 KLD with unspecified CIP recovery.',
              'Oil & grease trap design requires explicit retention time calculation for bakery and dairy lines per CPCB norms.',
            ],
            advisoryNotes: [
              'Update hydraulic mass balance with separate clean-in-place (CIP) neutralization stream before resubmission to MPCB.',
            ],
            geminiValidated: true,
            scanTimestamp: '2026-09-08 16:25',
          },
        },
        {
          id: 'doc_abc_03',
          approvalCode: 'FACTORY_PLAN_APPROVAL',
          approvalTitle: 'Factory Building Plan Approval (DISH)',
          documentTypeCode: 'FACTORY_LAYOUT',
          documentName: 'Factory Machine Layout & Architectural Plan',
          fileName: 'ABCFoods_Plant_Layout_75workers.pdf',
          fileSizeKb: 3450,
          uploadedAt: '2026-09-12 14:10',
          status: 'UPLOADED',
          expiryDate: '2029-09-12',
          issues: [],
          validationStatus: 'unvalidated',
        },
      ],
      initialChat: [
        {
          id: 'msg_abc_welcome',
          sender: 'assistant',
          text: 'Welcome to INDUSFLOW AI! I am actively tracking compliance for **ABC Foods Manufacturing** (Food Processing unit in Pune, Maharashtra).\n\n**Immediate Priority:** MPCB has raised a clarification query on your **Consent to Establish (CTE)** regarding water balance and grease trap sizing (Deadline: September 28). Resolving this unblocks your Provisional Fire NOC and Factory Plan Approval.',
          timestamp: new Date().toISOString(),
          recommendations: [
            'Respond to MPCB Query on Water Balance & ETP Design before Sep 28',
            'Run AI Pre-Validation on your Factory Machine Layout Plan',
            'Submit Provisional Fire Safety NOC dossier to MIDC Fire Brigade',
          ],
          relevantApprovals: ['SPCB_CTE', 'FIRE_NOC_PROVISIONAL', 'FACTORY_PLAN_APPROVAL'],
        },
      ],
    },

    sunrise_agro: {
      id: 'sunrise_agro',
      name: 'Sunrise Agro Products',
      sectorLabel: 'Agro Processing & Dehydration',
      location: 'Nashik, Maharashtra',
      investment: '₹3.5 Crore',
      workforce: 30,
      stage: 'Pre-construction',
      cpcbCategory: 'Green',
      profile: {
        id: 'proj_sunrise_agro_02',
        companyName: 'Sunrise Agro Products',
        cinOrUdyam: 'UDYAM-MH-26-0048192',
        pan: 'AAACS6123M',
        gstin: '27AAACS6123M1Z2',
        sector: 'food_processing',
        industry: 'Agro Processing Unit',
        subIndustry: 'Solar Dehydrated Fruits, Spices & Grain Cleaning',
        state: 'Maharashtra',
        district: 'Nashik',
        city: 'Nashik',
        industrialArea: 'MIDC Ambad Industrial Estate',
        landType: 'designated_industrial_estate',
        landStatus: 'Industrial Land',
        landAreaAcres: 1.5,
        builtUpAreaSqMeters: 1400,
        investmentScale: 'small',
        investmentInrCrores: 3.5,
        cpcbCategory: 'Green',
        workforceCount: 30,
        powerRequirementKVA: 85,
        waterRequirementKLD: 8,
        waterSource: 'industrial_pipe',
        hasBoiler: false,
        hasHazardousChemicals: false,
        hasEffluentDischarge: false,
        effluentQuantityKLD: 0,
        dgSetCapacityKVA: 65,
        projectStage: 'pre_construction',
        targetCommissioningDate: '2026-12-15',
        unitType: 'New Unit',
        projectType: 'Greenfield',
        isDemoData: false,
      },
      approvalStates: [
        ['SIDC_LAND_ALLOTMENT', { status: 'approved', daysElapsed: 15 }],
        ['SPCB_CTE', { status: 'approved', daysElapsed: 22 }],
        ['DISCOM_POWER_SANCTION', { status: 'approved', daysElapsed: 19 }],
        ['FACTORY_PLAN_APPROVAL', { status: 'in_review', daysElapsed: 12 }],
        ['FSSAI_CENTRAL_LIC', { status: 'not_started', daysElapsed: 0 }],
        ['FACTORY_LICENSE', { status: 'not_started', daysElapsed: 0 }],
      ],
      documents: [
        {
          id: 'doc_sun_01',
          approvalCode: 'SPCB_CTE',
          approvalTitle: 'Consent to Establish (CTE)',
          documentTypeCode: 'PROCESS_FLOW',
          documentName: 'Green Category Dry Processing Scheme',
          fileName: 'Sunrise_Process_Flow.pdf',
          fileSizeKb: 890,
          uploadedAt: '2026-07-15 10:00',
          status: 'VERIFIED',
          validationStatus: 'passed',
        },
      ],
      initialChat: [
        {
          id: 'msg_sun_01',
          sender: 'assistant',
          text: 'Active project: **Sunrise Agro Products** (Green Category unit in Nashik). Your CTE is approved and Factory Plan Approval is under review with DISH Nashik.',
          timestamp: new Date().toISOString(),
          recommendations: ['Follow up with DISH on Factory Plan Approval', 'Prepare FSSAI State License application'],
        },
      ],
    },

    vortexa_chem: {
      id: 'vortexa_chem',
      name: 'Vortexa Chemicals',
      sectorLabel: 'Specialty Chemicals & Polymers',
      location: 'Dahej, Gujarat',
      investment: '₹45.0 Crore',
      workforce: 180,
      stage: 'Pre-establishment',
      cpcbCategory: 'Red',
      profile: {
        id: 'proj_vortexa_chem_03',
        companyName: 'Vortexa Chemicals',
        cinOrUdyam: 'U24100GJ2023PLC091823',
        pan: 'AAACV7712N',
        gstin: '24AAACV7712N1Z4',
        sector: 'chemicals',
        industry: 'Chemical Manufacturing',
        subIndustry: 'Organic Specialty Polymers & Resin Formulations',
        state: 'Gujarat',
        district: 'Bharuch',
        city: 'Dahej',
        industrialArea: 'GIDC Dahej Chemical Zone (PCPIR)',
        landType: 'designated_industrial_estate',
        landStatus: 'Industrial Land',
        landAreaAcres: 8.0,
        builtUpAreaSqMeters: 8500,
        investmentScale: 'medium',
        investmentInrCrores: 45.0,
        cpcbCategory: 'Red',
        workforceCount: 180,
        powerRequirementKVA: 800,
        waterRequirementKLD: 120,
        waterSource: 'industrial_pipe',
        hasBoiler: true,
        boilerCapacityTph: 6,
        hasHazardousChemicals: true,
        hazardousDetails: 'Benzene, Ethylene Dichloride, Styrene Monomer',
        hasEffluentDischarge: true,
        effluentQuantityKLD: 75,
        dgSetCapacityKVA: 1000,
        projectStage: 'pre_establishment',
        targetCommissioningDate: '2027-08-31',
        unitType: 'New Unit',
        projectType: 'Greenfield',
        isDemoData: false,
      },
      approvalStates: [
        ['SIDC_LAND_ALLOTMENT', { status: 'approved', daysElapsed: 30 }],
        ['MOEF_EC', { status: 'in_review', daysElapsed: 75 }],
        ['SPCB_CTE', { status: 'documents_pending', daysElapsed: 10 }],
        ['PESO_EXPLOSIVES_LIC', { status: 'in_review', daysElapsed: 40 }],
        ['FIRE_NOC_PROVISIONAL', { status: 'in_review', daysElapsed: 25 }],
      ],
      documents: [
        {
          id: 'doc_vor_01',
          approvalCode: 'MOEF_EC',
          approvalTitle: 'Prior Environmental Clearance (EC)',
          documentTypeCode: 'EIA_REPORT',
          documentName: 'EIA Baseline Monitoring & EMP Study',
          fileName: 'Vortexa_EIA_Report_Dahej.pdf',
          fileSizeKb: 8500,
          uploadedAt: '2026-06-20 14:00',
          status: 'VERIFIED',
          validationStatus: 'passed',
        },
      ],
      initialChat: [
        {
          id: 'msg_vor_01',
          sender: 'assistant',
          text: 'Active project: **Vortexa Chemicals** (Red Category chemical manufacturing in GIDC Dahej, Gujarat). Prior Environmental Clearance (MoEF&CC) is currently on Day 75 of 105 SLA.',
          timestamp: new Date().toISOString(),
          recommendations: ['Track SEAC scrutiny meeting date for EC', 'Complete HAZOP study documentation for PESO'],
        },
      ],
    },

    apex_biopharma: {
      id: 'apex_biopharma',
      name: 'Apex BioPharma & Fine Chemicals',
      sectorLabel: 'Active Pharmaceutical Ingredients (API)',
      location: 'Palghar, Maharashtra',
      investment: '₹38.5 Crore',
      workforce: 85,
      stage: 'Pre-construction',
      cpcbCategory: 'Red',
      profile: {
        id: 'proj_apex_biopharma_01',
        companyName: 'Apex BioPharma & Fine Chemicals',
        cinOrUdyam: 'U24232MH2024PLC389120',
        pan: 'AAACA9812K',
        gstin: '27AAACA9812K1Z5',
        sector: 'pharma',
        state: 'Maharashtra',
        district: 'Palghar',
        industrialArea: 'MIDC Tarapur Chemical Zone',
        landType: 'designated_industrial_estate',
        landAreaAcres: 5.5,
        builtUpAreaSqMeters: 6200,
        investmentScale: 'medium',
        investmentInrCrores: 38.5,
        cpcbCategory: 'Red',
        workforceCount: 85,
        powerRequirementKVA: 450,
        waterRequirementKLD: 65,
        waterSource: 'industrial_pipe',
        hasBoiler: true,
        boilerCapacityTph: 4,
        hasHazardousChemicals: true,
        hazardousDetails: 'Toluene, Isopropanol, Dichloromethane (DCM), Hydrogen Gas Cylinders',
        hasEffluentDischarge: true,
        effluentQuantityKLD: 42,
        dgSetCapacityKVA: 500,
        projectStage: 'pre_construction',
        targetCommissioningDate: '2026-11-30',
        isDemoData: false,
      },
      approvalStates: [
        ['SIDC_LAND_ALLOTMENT', { status: 'approved', daysElapsed: 22 }],
        ['MOEF_EC', { status: 'in_review', daysElapsed: 88 }],
        ['SPCB_CTE', {
          status: 'query_raised',
          daysElapsed: 44,
          queryDetails: {
            queryText: 'Discrepancy observed between Water Balance Diagram in DPR (45 KLD) and ZLD ETP capacity in application form (65 KLD). Provide revised Zero Liquid Discharge (ZLD) treatment design.',
            raisedDate: '2026-08-28',
            deadlineDate: '2026-09-22',
            departmentOfficer: 'Shri R. V. Kulkarni, Sub-Regional Officer (MPCB Tarapur)',
            urgency: 'critical',
          },
        }],
        ['FIRE_NOC_PROVISIONAL', { status: 'documents_pending', daysElapsed: 12 }],
      ],
      documents: [
        {
          id: 'doc_apex_01',
          approvalCode: 'SIDC_LAND_ALLOTMENT',
          approvalTitle: 'Industrial Land Allotment',
          documentTypeCode: 'COMPANY_ID',
          documentName: 'Certificate of Incorporation & GSTIN',
          fileName: 'ApexBio_ROC_GSTIN_Verified.pdf',
          fileSizeKb: 1420,
          uploadedAt: '2026-06-12 10:30',
          status: 'VERIFIED',
          validationStatus: 'passed',
        },
      ],
      initialChat: [
        {
          id: 'msg_apex_01',
          sender: 'assistant',
          text: 'Active project: **Apex BioPharma** in MIDC Tarapur. High priority query on Consent to Establish (CTE) water balance due September 22.',
          timestamp: new Date().toISOString(),
          recommendations: ['Submit revised ZLD ETP design to MPCB', 'Complete Fire Escape plan for Provisional Fire NOC'],
        },
      ],
    },
  };

  constructor() {
    this.loadPreset('abc_foods');
  }

  public getPresetList() {
    return Object.values(this.presets).map((p) => ({
      id: p.id,
      name: p.name,
      sectorLabel: p.sectorLabel,
      location: p.location,
      investment: p.investment,
      workforce: p.workforce,
      stage: p.stage,
      cpcbCategory: p.cpcbCategory,
    }));
  }

  public getCurrentPresetId(): string {
    return this.currentPresetId;
  }

  public loadPreset(presetId: string): boolean {
    const preset = this.presets[presetId];
    if (!preset) return false;

    this.currentPresetId = presetId;
    this.profile = { ...preset.profile };
    this.approvalsState.clear();
    for (const [code, state] of preset.approvalStates) {
      this.approvalsState.set(code, { ...state });
    }
    this.documents = JSON.parse(JSON.stringify(preset.documents));
    this.chatHistory = JSON.parse(JSON.stringify(preset.initialChat));
    return true;
  }

  public getProfile(): BusinessProfile {
    return { ...this.profile };
  }

  public updateProfile(newProfile: Partial<BusinessProfile>): BusinessProfile {
    const isChangingCompany = newProfile.companyName && newProfile.companyName !== this.profile.companyName;
    this.profile = { ...this.profile, ...newProfile };

    if (isChangingCompany && newProfile.isDemoData) {
      // Re-seed approval statuses suitable for the demo company (Pre-establishment / New Unit)
      this.approvalsState.clear();
      this.approvalsState.set('SIDC_LAND_ALLOTMENT', {
        status: 'approved',
        daysElapsed: 18,
        submissionDate: '2026-08-01',
        approvedDate: '2026-08-19',
      });
      this.approvalsState.set('SPCB_CTE', {
        status: 'documents_pending',
        daysElapsed: 5,
        submissionDate: '2026-09-08',
      });
      this.approvalsState.set('DISCOM_POWER_SANCTION', {
        status: 'not_started',
        daysElapsed: 0,
      });
      this.approvalsState.set('FIRE_NOC_PROVISIONAL', {
        status: 'not_started',
        daysElapsed: 0,
      });
      this.approvalsState.set('FACTORY_PLAN_APPROVAL', {
        status: 'not_started',
        daysElapsed: 0,
      });
      this.approvalsState.set('FSSAI_CENTRAL_LIC', {
        status: 'not_started',
        daysElapsed: 0,
      });
      this.approvalsState.set('SPCB_CTO', {
        status: 'not_started',
        daysElapsed: 0,
      });
      this.approvalsState.set('FACTORY_LICENSE', {
        status: 'not_started',
        daysElapsed: 0,
      });
      this.approvalsState.set('FIRE_NOC_FINAL', {
        status: 'not_started',
        daysElapsed: 0,
      });

      // Update documents for ABC Foods
      this.documents = [
        {
          id: 'doc_abc_01',
          approvalCode: 'SIDC_LAND_ALLOTMENT',
          approvalTitle: 'Industrial Land Allotment & Possession Certificate',
          documentTypeCode: 'COMPANY_ID',
          documentName: 'Certificate of Incorporation & Udyam Registration',
          fileName: 'ABCFoods_ROC_Udyam_MH.pdf',
          fileSizeKb: 1120,
          uploadedAt: '2026-08-10 11:15',
          validationStatus: 'passed',
          validationResult: {
            score: 96,
            status: 'passed',
            verifiedFields: [
              { field: 'Company Name', extractedValue: 'ABC Foods Manufacturing', profileValue: 'ABC Foods Manufacturing', isMatch: true },
              { field: 'Location', extractedValue: 'Pune, Maharashtra', profileValue: 'Pune, Maharashtra', isMatch: true },
              { field: 'Industry', extractedValue: 'Food Manufacturing (Processing)', profileValue: 'Food Manufacturing', isMatch: true },
            ],
            criticalDiscrepancies: [],
            advisoryNotes: ['Corporate identity and registered office in Pune verified.'],
            geminiValidated: true,
            scanTimestamp: '2026-08-10 11:18',
          },
        },
        {
          id: 'doc_abc_02',
          approvalCode: 'SPCB_CTE',
          approvalTitle: 'Consent to Establish (CTE / NOC)',
          documentTypeCode: 'WATER_BALANCE',
          documentName: 'Water Balance & Food Effluent Treatment Plan',
          fileName: 'ABCFoods_ETP_Scheme_Draft.pdf',
          fileSizeKb: 2150,
          uploadedAt: '2026-09-08 16:20',
          validationStatus: 'warning',
          validationResult: {
            score: 82,
            status: 'warning',
            verifiedFields: [
              { field: 'Fresh Water Intake', extractedValue: '35.0 KLD', profileValue: '35.0 KLD', isMatch: true },
              { field: 'Effluent Generation', extractedValue: '22.0 KLD', profileValue: '22.0 KLD', isMatch: true },
              { field: 'BOD/COD Treatment Standard', extractedValue: 'Aerobic biological ETP designed for BOD < 30 mg/l', profileValue: 'Orange Category CPCB norm', isMatch: true },
            ],
            criticalDiscrepancies: [],
            advisoryNotes: ['Ensure oil and grease trap design is explicitly demarcated in bakery and processing wastewater lines.'],
            geminiValidated: true,
            scanTimestamp: '2026-09-08 16:25',
          },
        },
      ];

      // Update initial assistant message for ABC Foods
      this.chatHistory = [
        {
          id: `msg_abc_${Date.now()}`,
          sender: 'assistant',
          text: 'Welcome ABC Foods Manufacturing! I have generated your customized industrial approval roadmap for your new Food Processing unit in Pune, Maharashtra.\n\nKey Highlights:\n- Categorized under CPCB Orange Category.\n- Land Allotment in Industrial Land is secured.\n- Critical next milestones: Apply for MPCB Consent to Establish (CTE), Provisional Fire Safety NOC, and FSSAI Central Manufacturing License.',
          timestamp: new Date().toISOString(),
          recommendations: [
            'Submit CTE application to Maharashtra Pollution Control Board (MPCB)',
            'Prepare Factory Building Layout Plan for DISH approval (75 workers)',
            'Initiate FSSAI Central License dossier on FoSCoS portal',
          ],
          relevantApprovals: ['SPCB_CTE', 'FACTORY_PLAN_APPROVAL', 'FSSAI_CENTRAL_LIC'],
        },
      ];
    }

    return { ...this.profile };
  }

  public getApprovals(): ApprovalItem[] {
    return evaluateApplicableApprovals(this.profile, this.approvalsState);
  }

  public updateApproval(code: string, updates: Partial<ApprovalItem>): ApprovalItem | undefined {
    const existing = this.approvalsState.get(code) || {};
    this.approvalsState.set(code, { ...existing, ...updates });
    const all = this.getApprovals();
    return all.find((a) => a.code === code);
  }

  public getDocuments(): UploadedDocument[] {
    return [...this.documents];
  }

  public addDocument(doc: Omit<UploadedDocument, 'id' | 'uploadedAt' | 'validationStatus'>): UploadedDocument {
    const newDoc: UploadedDocument = {
      ...doc,
      id: `doc_up_${Date.now()}`,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      validationStatus: 'unvalidated',
    };
    this.documents.unshift(newDoc);
    return newDoc;
  }

  public updateDocumentValidation(id: string, result: UploadedDocument['validationResult']): UploadedDocument | undefined {
    const doc = this.documents.find((d) => d.id === id);
    if (doc) {
      doc.validationResult = result;
      doc.validationStatus = result ? result.status : 'unvalidated';
      if (result) {
        if (result.status === 'passed' && result.criticalDiscrepancies.length === 0) {
          doc.status = 'VERIFIED';
          doc.issues = [];
        } else if (result.status === 'mismatch' || result.criticalDiscrepancies.length > 0) {
          doc.status = 'NEEDS CORRECTION';
          doc.issues = result.criticalDiscrepancies;
        } else if (result.status === 'warning') {
          doc.status = 'UNDER REVIEW';
          doc.issues = result.criticalDiscrepancies.length > 0 ? result.criticalDiscrepancies : result.advisoryNotes;
        }
      }
    }
    return doc;
  }

  public updateDocument(id: string, updates: Partial<UploadedDocument>): UploadedDocument | undefined {
    const doc = this.documents.find((d) => d.id === id);
    if (doc) {
      Object.assign(doc, updates);
    }
    return doc;
  }

  public getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  public clearChatHistory(): void {
    this.chatHistory = [];
  }

  public addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.chatHistory.push(newMsg);
    return newMsg;
  }
}

export const dataStore = new IndusflowDataStore();
