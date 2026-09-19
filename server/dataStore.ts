import { BusinessProfile, ApprovalItem, UploadedDocument, ChatMessage } from '../src/types/index.js';
import { evaluateApplicableApprovals } from './rulesEngine.js';

export class IndusflowDataStore {
  private profile: BusinessProfile;
  private approvalsState: Map<string, Partial<ApprovalItem>> = new Map();
  private documents: UploadedDocument[] = [];
  private chatHistory: ChatMessage[] = [];

  constructor() {
    // Realistic prototype profile: Active pharmaceutical ingredient (API) unit
    this.profile = {
      id: 'proj_apex_biopharma_01',
      companyName: 'Apex BioPharma & Fine Chemicals Ltd.',
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
    };

    // Seed realistic statuses across lifecycle
    this.approvalsState.set('SIDC_LAND_ALLOTMENT', {
      status: 'approved',
      daysElapsed: 22,
      submissionDate: '2026-06-10',
      approvedDate: '2026-07-02',
    });

    this.approvalsState.set('MOEF_EC', {
      status: 'in_review',
      daysElapsed: 88,
      submissionDate: '2026-07-08',
    });

    this.approvalsState.set('SPCB_CTE', {
      status: 'query_raised',
      daysElapsed: 44,
      submissionDate: '2026-07-20',
      queryDetails: {
        queryText: 'Discrepancy observed between Water Balance Diagram in DPR (45 KLD) and ZLD ETP capacity in application form (65 KLD). Provide revised Zero Liquid Discharge (ZLD) treatment design and RO permeate recycling schematic.',
        raisedDate: '2026-08-28',
        deadlineDate: '2026-09-22',
        departmentOfficer: 'Er. V. Deshmukh (Sub-Regional Officer, MPCB Palghar)',
        urgency: 'critical',
      },
    });

    this.approvalsState.set('FIRE_NOC_PROVISIONAL', {
      status: 'documents_pending',
      daysElapsed: 12,
      submissionDate: '2026-08-15',
    });

    this.approvalsState.set('FACTORY_PLAN_APPROVAL', {
      status: 'not_started',
      daysElapsed: 0,
    });

    this.approvalsState.set('DISCOM_POWER_SANCTION', {
      status: 'in_review',
      daysElapsed: 38,
      submissionDate: '2026-08-01',
    });

    this.approvalsState.set('BOILER_REGISTRATION', {
      status: 'not_started',
      daysElapsed: 0,
    });

    this.approvalsState.set('PESO_EXPLOSIVES_LIC', {
      status: 'not_started',
      daysElapsed: 0,
    });

    this.approvalsState.set('FIRE_NOC_FINAL', {
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

    // Seed sample uploaded documents with validation results
    this.documents = [
      {
        id: 'doc_up_01',
        approvalCode: 'SIDC_LAND_ALLOTMENT',
        approvalTitle: 'Industrial Land Allotment & Possession Certificate',
        documentTypeCode: 'COMPANY_ID',
        documentName: 'Certificate of Incorporation & GSTIN',
        fileName: 'ApexBio_ROC_GSTIN_Verified.pdf',
        fileSizeKb: 1420,
        uploadedAt: '2026-06-12 10:30',
        status: 'VERIFIED',
        expiryDate: 'N/A (Perpetual)',
        issues: [],
        validationStatus: 'passed',
        validationResult: {
          score: 98,
          status: 'passed',
          verifiedFields: [
            { field: 'Company Name', extractedValue: 'Apex BioPharma & Fine Chemicals Ltd.', profileValue: 'Apex BioPharma & Fine Chemicals Ltd.', isMatch: true },
            { field: 'CIN', extractedValue: 'U24232MH2024PLC389120', profileValue: 'U24232MH2024PLC389120', isMatch: true },
            { field: 'GSTIN', extractedValue: '27AAACA9812K1Z5', profileValue: '27AAACA9812K1Z5', isMatch: true },
            { field: 'State Jurisdiction', extractedValue: 'Maharashtra (Code 27)', profileValue: 'Maharashtra', isMatch: true },
          ],
          criticalDiscrepancies: [],
          advisoryNotes: ['All corporate identity credentials match profile with 100% accuracy.'],
          geminiValidated: true,
          scanTimestamp: '2026-06-12 10:32',
        },
      },
      {
        id: 'doc_up_02',
        approvalCode: 'SPCB_CTE',
        approvalTitle: 'Consent to Establish (CTE / NOC)',
        documentTypeCode: 'WATER_BALANCE',
        documentName: 'Water Balance Diagram & Effluent Treatment Scheme',
        fileName: 'Apex_Water_Balance_Draft_v1.pdf',
        fileSizeKb: 2840,
        uploadedAt: '2026-08-25 14:15',
        status: 'NEEDS CORRECTION',
        expiryDate: '2027-08-25',
        issues: [
          'Total water demand stated in document is 45 KLD, whereas business profile registers 65 KLD (+20 KLD deviation).',
          'Effluent generation stated as 28.5 KLD does not account for the additional 4 TPH steam boiler blowdown specified in profile.',
        ],
        validationStatus: 'mismatch',
        validationResult: {
          score: 62,
          status: 'mismatch',
          verifiedFields: [
            { field: 'Unit Location', extractedValue: 'Plot W-42, MIDC Tarapur', profileValue: 'MIDC Tarapur Chemical Zone', isMatch: true },
            { field: 'Total Fresh Water Intake', extractedValue: '45.0 KLD', profileValue: '65.0 KLD', isMatch: false },
            { field: 'Industrial Effluent Generation', extractedValue: '28.5 KLD', profileValue: '42.0 KLD', isMatch: false },
            { field: 'CPCB Pollution Category', extractedValue: 'Red Category (Synthetic Pharma)', profileValue: 'Red', isMatch: true },
          ],
          criticalDiscrepancies: [
            'Total water demand stated in document is 45 KLD, whereas business profile registers 65 KLD (+20 KLD deviation).',
            'Effluent generation stated as 28.5 KLD does not account for the additional 4 TPH steam boiler blowdown specified in profile.',
          ],
          advisoryNotes: [
            'Revise hydraulic load calculations to include boiler feed water requirements before resubmitting to SPCB.',
          ],
          geminiValidated: true,
          scanTimestamp: '2026-08-25 14:18',
        },
      },
      {
        id: 'doc_up_03',
        approvalCode: 'SPCB_CTE',
        approvalTitle: 'Consent to Establish (CTE / NOC)',
        documentTypeCode: 'PROCESS_FLOW',
        documentName: 'Manufacturing Process Flow Diagram',
        fileName: 'Apex_Pharma_Process_Flow_Synthesis.pdf',
        fileSizeKb: 3950,
        uploadedAt: '2026-08-26 11:20',
        status: 'VERIFIED',
        expiryDate: 'N/A (Process Spec)',
        issues: [],
        validationStatus: 'passed',
        validationResult: {
          score: 94,
          status: 'passed',
          verifiedFields: [
            { field: 'Solvents Listed', extractedValue: 'Toluene, Isopropanol, DCM', profileValue: 'Toluene, Isopropanol, Dichloromethane (DCM)', isMatch: true },
            { field: 'Solvent Recovery Efficiency', extractedValue: '96.5% Recovery in Closed Loop', profileValue: 'Expected >95%', isMatch: true },
            { field: 'Scrubber Configuration', extractedValue: 'Two-stage packed bed alkali scrubbers', profileValue: 'Red Category Requirement', isMatch: true },
          ],
          criticalDiscrepancies: [],
          advisoryNotes: [
            'Vapour recovery condenser specs align with CPCB clean technology guidelines.',
          ],
          geminiValidated: true,
          scanTimestamp: '2026-08-26 11:24',
        },
      },
      {
        id: 'doc_up_04',
        approvalCode: 'DISCOM_POWER_SANCTION',
        approvalTitle: 'High Tension (HT) Power Sanction & Grid Interconnection NOC',
        documentTypeCode: 'LOAD_CHART',
        documentName: 'Connected Load List & Single Line Diagram (SLD)',
        fileName: 'Apex_Electrical_SLD_ContractorSigned.pdf',
        fileSizeKb: 1890,
        uploadedAt: '2026-07-28 09:40',
        status: 'UNDER REVIEW',
        expiryDate: '2028-07-28',
        issues: [],
        validationStatus: 'passed',
        validationResult: {
          score: 92,
          status: 'passed',
          verifiedFields: [
            { field: 'Connected Load (kVA)', extractedValue: '450 kVA HT (11 kV Supply)', profileValue: '450 kVA', isMatch: true },
            { field: 'Standby DG Set', extractedValue: '500 kVA Acoustic Enclosed', profileValue: '500 kVA', isMatch: true },
            { field: 'Electrical Contractor License', extractedValue: 'Class A License No. MH-EL-8891', profileValue: 'Valid', isMatch: true },
          ],
          criticalDiscrepancies: [],
          advisoryNotes: [
            'Harmonic filter installation mentioned for VFD pumps conforms to CEIG norms.',
          ],
          geminiValidated: true,
          scanTimestamp: '2026-07-28 09:45',
        },
      },
      {
        id: 'doc_up_05',
        approvalCode: 'FIRE_NOC_PROVISIONAL',
        approvalTitle: 'Provisional Fire Safety NOC & Building Scheme Approval',
        documentTypeCode: 'FIRE_LAYOUT',
        documentName: 'Provisional Fire Escape & Evacuation Plan',
        fileName: 'Apex_Fire_Evacuation_Scheme_Draft.png',
        fileSizeKb: 2450,
        uploadedAt: '2026-09-02 15:45',
        status: 'UPLOADED',
        expiryDate: '2027-09-01',
        issues: [],
        validationStatus: 'unvalidated',
      },
      {
        id: 'doc_up_06',
        approvalCode: 'BOILER_REGISTRATION',
        approvalTitle: 'Boiler Registration & Pressure Vessel Certificate (IBR 1950)',
        documentTypeCode: 'BOILER_SPECS',
        documentName: 'Boiler Manufacturer Drawing & Material Test Folder',
        fileName: 'Thermax_4TPH_IBR_Design_Folder.pdf',
        fileSizeKb: 4120,
        uploadedAt: '2026-09-05 10:15',
        status: 'UPLOADED',
        expiryDate: '2029-09-05',
        issues: [],
        validationStatus: 'unvalidated',
      },
    ];

    // Initial assistant greeting
    this.chatHistory = [
      {
        id: 'msg_welcome',
        sender: 'assistant',
        text: 'Greetings. I am INDUSFLOW AI, your compliance orchestrator for SIH26130. I have analyzed your project profile ("Apex BioPharma", Red Category API manufacturing in MIDC Tarapur). \n\nYour immediate highest priority is responding to the MPCB query on your Consent to Establish (CTE) before the September 22 deadline regarding water balance calculations.',
        timestamp: new Date().toISOString(),
        recommendations: [
          'Address MPCB Query on Effluent Treatment & Water Balance (due Sep 22)',
          'Complete Fire Escape Layout submission for Provisional Fire NOC',
          'Follow up on Environmental Clearance (MoEF&CC) day 88 of 105 SLA',
        ],
        relevantApprovals: ['SPCB_CTE', 'FIRE_NOC_PROVISIONAL', 'MOEF_EC'],
      },
    ];
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
              { field: 'Company Name', extractedValue: 'ABC Foods Manufacturing Pvt. Ltd.', profileValue: 'ABC Foods Manufacturing Pvt. Ltd.', isMatch: true },
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
          text: 'Welcome ABC Foods Manufacturing Pvt. Ltd.! I have generated your customized industrial approval roadmap for your new Food Processing unit in Pune, Maharashtra.\n\nKey Highlights:\n- Categorized under CPCB Orange Category.\n- Land Allotment in Industrial Land is secured.\n- Critical next milestones: Apply for MPCB Consent to Establish (CTE), Provisional Fire Safety NOC, and FSSAI Central Manufacturing License.',
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
