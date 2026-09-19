import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  Building2,
  Layers,
  Activity,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Factory,
  RotateCcw,
  Zap,
  Droplets,
  Flame,
  FileCheck2,
  Info,
  Calendar,
  Users,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { BusinessProfile, IndustrySector, CpcbCategory, LandType, WaterSource, InvestmentScale, ApprovalStage } from '../../types/index.js';

interface FormState {
  // Step 1: Business Details
  companyName: string;
  businessType: string;
  industry: string;
  subIndustry: string;
  state: string;
  district: string;
  city: string;
  projectType: string;

  // Step 2: Project Details
  unitType: 'New Unit' | 'Expansion';
  investmentInrCrores: string;
  landStatus: string;
  builtUpAreaSqMeters: string;
  workforceCount: string;
  productionType: string;
  projectStage: ApprovalStage;

  // Step 3: Operational Details
  manufacturingActivity: string;
  powerRequirementKVA: string;
  waterRequirementKLD: string;
  wasteGeneration: string;
  fuelUsage: string;
  hasHazardousChemicals: boolean;
  hazardousDetails: string;
  targetCommissioningDate: string;

  // Metadata
  isDemoData: boolean;
}

const DEMO_COMPANY: FormState = {
  // Step 1: Business Details
  companyName: 'ABC Foods Manufacturing',
  businessType: 'Private Limited Company',
  industry: 'Food Manufacturing',
  subIndustry: 'Processed Foods, Fruit Pulp & Packaged Snacks',
  state: 'Maharashtra',
  district: 'Pune',
  city: 'Pune',
  projectType: 'Greenfield (New Unit)',

  // Step 2: Project Details
  unitType: 'New Unit',
  investmentInrCrores: '10.0',
  landStatus: 'Industrial Land',
  builtUpAreaSqMeters: '3500',
  workforceCount: '75',
  productionType: 'Continuous & Automated Packaging Lines',
  projectStage: 'pre_establishment',

  // Step 3: Operational Details
  manufacturingActivity:
    'Processing, pasteurization, and aseptic packaging of ready-to-eat fruit pulp, baked extruded snacks, and processed food products.',
  powerRequirementKVA: '200',
  waterRequirementKLD: '35',
  wasteGeneration:
    'Biodegradable organic solid waste (3.5 MT/month, composted off-site); wash water effluent (22 KLD treated in on-site ETP to meet irrigation norms); packaging scraps (0.8 MT/month).',
  fuelUsage: 'Piped Natural Gas (PNG) for clean baking & boilers; standby HSD for acoustic DG set.',
  hasHazardousChemicals: false,
  hazardousDetails:
    'No hazardous industrial chemicals. Food grade CIP sanitizing agents (Peracetic acid, Caustic soda) stored in bunded chemical store.',
  targetCommissioningDate: '2027-04-30',

  isDemoData: true,
};

const INITIAL_FORM_STATE: FormState = {
  companyName: '',
  businessType: '',
  industry: '',
  subIndustry: '',
  state: 'Maharashtra',
  district: '',
  city: '',
  projectType: 'New Unit',

  unitType: 'New Unit',
  investmentInrCrores: '',
  landStatus: 'Industrial Land',
  builtUpAreaSqMeters: '',
  workforceCount: '',
  productionType: '',
  projectStage: 'pre_establishment',

  manufacturingActivity: '',
  powerRequirementKVA: '',
  waterRequirementKLD: '',
  wasteGeneration: '',
  fuelUsage: '',
  hasHazardousChemicals: false,
  hazardousDetails: '',
  targetCommissioningDate: '',

  isDemoData: false,
};

const INDIAN_STATES = [
  'Maharashtra',
  'Gujarat',
  'Tamil Nadu',
  'Karnataka',
  'Telangana',
  'Andhra Pradesh',
  'Uttar Pradesh',
  'Rajasthan',
  'Haryana',
  'Madhya Pradesh',
  'West Bengal',
  'Punjab',
  'Odisha',
  'Uttarakhand',
];

const BUSINESS_TYPES = [
  'Private Limited Company',
  'Public Limited Company',
  'Limited Liability Partnership (LLP)',
  'Partnership Firm',
  'Sole Proprietorship',
  'One Person Company (OPC)',
  'Joint Venture (JV)',
];

const INDUSTRIES = [
  { label: 'Food Manufacturing', sector: 'food_processing', cpcb: 'Orange' },
  { label: 'Pharmaceuticals & Fine Chemicals', sector: 'pharma', cpcb: 'Red' },
  { label: 'Chemicals & Petrochemicals', sector: 'chemicals', cpcb: 'Red' },
  { label: 'Electronics & Hardware Equipment', sector: 'electronics', cpcb: 'Green' },
  { label: 'Textiles, Garments & Apparel', sector: 'textiles', cpcb: 'Orange' },
  { label: 'Automobile & Auto Components', sector: 'automobile', cpcb: 'Orange' },
  { label: 'Metallurgy & Metal Fabrication', sector: 'metallurgy', cpcb: 'Red' },
  { label: 'Renewable Energy & CleanTech', sector: 'renewable_energy', cpcb: 'White' },
];

const LAND_STATUS_OPTIONS = [
  'Industrial Land',
  'Allocated Industrial Park / Estate Plot (MIDC/GIDC/RIICO)',
  'Private Industrial Land (Converted / Non-Agri)',
  'Agricultural Land (Conversion / CLU in progress)',
  'Special Economic Zone (SEZ) Allotment',
];

const PRODUCTION_TYPES = [
  'Continuous Manufacturing Process',
  'Batch Processing',
  'Assembly Line & Integration',
  'Continuous & Automated Packaging Lines',
  'Job Work & Precision Fabrication',
];

const PROJECT_STAGES: { id: ApprovalStage; label: string; desc: string }[] = [
  {
    id: 'pre_establishment',
    label: 'Pre-establishment / New Unit',
    desc: 'Planning, land acquisition, site surveys, and statutory permits prior to construction.',
  },
  {
    id: 'pre_construction',
    label: 'Pre-construction / Land Acquired',
    desc: 'Land in possession. Preparing DPR, architectural drawings, and civil approvals.',
  },
  {
    id: 'pre_operation',
    label: 'Pre-operation / Commissioning',
    desc: 'Civil plant constructed, machinery erected, applying for operating permits (CTO/License).',
  },
];

const FUEL_OPTIONS = [
  'Piped Natural Gas (PNG)',
  'Biomass & Agricultural Briquettes',
  'High Speed Diesel (HSD)',
  'Furnace Oil (LDO/FO)',
  'Liquified Petroleum Gas (LPG)',
  'Grid Electricity Only (No Combustion Fuel)',
];

export const BusinessOnboardingView: React.FC = () => {
  const { updateProfile, generateApprovalPlan, setActiveTab } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDemoBanner, setShowDemoBanner] = useState<boolean>(false);

  // Field change handler
  const handleFieldChange = (field: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for that field
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Load Demo Company handler
  const handleLoadDemo = () => {
    setFormData({ ...DEMO_COMPANY });
    setErrors({});
    setShowDemoBanner(true);
  };

  // Reset Form handler
  const handleReset = () => {
    setFormData({ ...INITIAL_FORM_STATE });
    setErrors({});
    setShowDemoBanner(false);
    setCurrentStep(1);
  };

  // Step Validation Logic
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required.';
      } else if (formData.companyName.trim().length < 3) {
        newErrors.companyName = 'Company name must be at least 3 characters.';
      }
      if (!formData.businessType) {
        newErrors.businessType = 'Please select a business constitution / type.';
      }
      if (!formData.industry) {
        newErrors.industry = 'Please select an industry sector.';
      }
      if (!formData.subIndustry.trim()) {
        newErrors.subIndustry = 'Sub-industry / primary product group is required.';
      }
      if (!formData.state) {
        newErrors.state = 'Please select a state.';
      }
      if (!formData.district.trim()) {
        newErrors.district = 'District is required.';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City or industrial cluster is required.';
      }
      if (!formData.projectType) {
        newErrors.projectType = 'Please select project type.';
      }
    } else if (step === 2) {
      if (!formData.investmentInrCrores || isNaN(Number(formData.investmentInrCrores)) || Number(formData.investmentInrCrores) <= 0) {
        newErrors.investmentInrCrores = 'Enter a valid investment amount (in ₹ Crores).';
      }
      if (!formData.landStatus) {
        newErrors.landStatus = 'Please select land ownership status.';
      }
      if (!formData.builtUpAreaSqMeters || isNaN(Number(formData.builtUpAreaSqMeters)) || Number(formData.builtUpAreaSqMeters) <= 0) {
        newErrors.builtUpAreaSqMeters = 'Enter a valid built-up area in sq. meters.';
      }
      if (!formData.workforceCount || isNaN(Number(formData.workforceCount)) || Number(formData.workforceCount) <= 0) {
        newErrors.workforceCount = 'Enter projected employee / workforce count.';
      }
      if (!formData.productionType) {
        newErrors.productionType = 'Please select a production methodology.';
      }
      if (!formData.projectStage) {
        newErrors.projectStage = 'Please select the current project lifecycle stage.';
      }
    } else if (step === 3) {
      if (!formData.manufacturingActivity.trim()) {
        newErrors.manufacturingActivity = 'Please describe the proposed manufacturing / processing activity.';
      } else if (formData.manufacturingActivity.trim().length < 15) {
        newErrors.manufacturingActivity = 'Please provide a descriptive manufacturing activity (min 15 characters).';
      }
      if (!formData.powerRequirementKVA || isNaN(Number(formData.powerRequirementKVA)) || Number(formData.powerRequirementKVA) < 0) {
        newErrors.powerRequirementKVA = 'Enter expected power requirement in kVA.';
      }
      if (!formData.waterRequirementKLD || isNaN(Number(formData.waterRequirementKLD)) || Number(formData.waterRequirementKLD) < 0) {
        newErrors.waterRequirementKLD = 'Enter daily water requirement in KLD.';
      }
      if (!formData.wasteGeneration.trim()) {
        newErrors.wasteGeneration = 'Please outline solid, effluent, or hazardous waste generation.';
      }
      if (!formData.fuelUsage) {
        newErrors.fuelUsage = 'Please select primary fuel usage.';
      }
      if (formData.hasHazardousChemicals && !formData.hazardousDetails.trim()) {
        newErrors.hazardousDetails = 'Please provide details of hazardous chemicals or solvents used.';
      }
      if (!formData.targetCommissioningDate) {
        newErrors.targetCommissioningDate = 'Please select target operational / commissioning date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to map UI values to BusinessProfile
  const generateBusinessProfileData = (): Partial<BusinessProfile> => {
    const inv = Number(formData.investmentInrCrores) || 10;
    let investmentScale: InvestmentScale = 'small';
    if (inv < 1) investmentScale = 'micro';
    else if (inv <= 10) investmentScale = 'small';
    else if (inv <= 50) investmentScale = 'medium';
    else investmentScale = 'large';

    const industryObj = INDUSTRIES.find((i) => i.label === formData.industry);
    const sector: IndustrySector = (industryObj?.sector as IndustrySector) || 'food_processing';
    const cpcbCategory: CpcbCategory = (industryObj?.cpcb as CpcbCategory) || 'Orange';

    let landType: LandType = 'designated_industrial_estate';
    if (formData.landStatus.includes('Allocated') || formData.landStatus === 'Industrial Land') {
      landType = 'designated_industrial_estate';
    } else if (formData.landStatus.includes('Private')) {
      landType = 'private_industrial_land';
    } else if (formData.landStatus.includes('Agricultural')) {
      landType = 'agricultural_conversion';
    }

    const waterKLD = Number(formData.waterRequirementKLD) || 35;
    const waterSource: WaterSource = 'industrial_pipe';
    const hasEffluent = waterKLD > 5;
    const effluentKLD = hasEffluent ? Math.round(waterKLD * 0.65) : 0;

    return {
      companyName: formData.companyName.trim(),
      businessType: formData.businessType,
      industry: formData.industry,
      subIndustry: formData.subIndustry.trim(),
      state: formData.state,
      district: formData.district.trim(),
      city: formData.city.trim(),
      industrialArea: `${formData.city.trim()} Industrial Zone`,
      projectType: formData.projectType,
      unitType: formData.unitType,
      landStatus: formData.landStatus,
      landType,
      landAreaAcres: 3.5,
      builtUpAreaSqMeters: Number(formData.builtUpAreaSqMeters) || 3500,
      investmentScale,
      investmentInrCrores: inv,
      cpcbCategory,
      sector,
      workforceCount: Number(formData.workforceCount) || 75,
      powerRequirementKVA: Number(formData.powerRequirementKVA) || 200,
      waterRequirementKLD: waterKLD,
      waterSource,
      hasBoiler: formData.fuelUsage.includes('Boiler') || formData.fuelUsage.includes('PNG') || formData.fuelUsage.includes('Biomass'),
      boilerCapacityTph: 2,
      hasHazardousChemicals: formData.hasHazardousChemicals,
      hazardousDetails: formData.hazardousDetails.trim() || undefined,
      hasEffluentDischarge: hasEffluent,
      effluentQuantityKLD: effluentKLD,
      dgSetCapacityKVA: 160,
      projectStage: formData.projectStage,
      targetCommissioningDate: formData.targetCommissioningDate,
      productionType: formData.productionType,
      manufacturingActivity: formData.manufacturingActivity.trim(),
      wasteGeneration: formData.wasteGeneration.trim(),
      fuelUsage: formData.fuelUsage,
      isDemoData: formData.isDemoData,
    };
  };

  // Generate Approval Plan submission
  const handleGenerateApprovalPlan = async () => {
    setIsSubmitting(true);
    try {
      const profileUpdates = generateBusinessProfileData();
      await generateApprovalPlan(profileUpdates);
      // Navigate to Approval Intelligence
      setActiveTab('approvals');
    } catch (err) {
      console.error('Failed to generate approval plan:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                <Factory className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Business Onboarding &amp; Statutory Setup
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Register your enterprise identity, technical scope, and utilities to generate an automated statutory approval plan and dependency matrix.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLoadDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Demo Company</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              title="Reset all form fields"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Demo Company Loaded Notification Banner */}
        {showDemoBanner && (
          <div className="mt-4 p-3.5 rounded-lg bg-indigo-50/90 border border-indigo-200 text-xs text-indigo-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-indigo-950">
                  Prototype Demo Company Loaded: <span className="underline">ABC Foods Manufacturing</span>
                </p>
                <p className="text-indigo-800 text-[11px] mt-0.5">
                  Pre-populated with Food Processing (Pune, MH), ₹10 Cr investment, 75 employees, and pre-establishment parameters for SIH26130 demonstration.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded">
              SIH Prototype Data
            </span>
          </div>
        )}
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { step: 1, title: 'Step 1', subtitle: 'Business Details', icon: Building2 },
            { step: 2, title: 'Step 2', subtitle: 'Project Details', icon: Layers },
            { step: 3, title: 'Step 3', subtitle: 'Operational Details', icon: Activity },
            { step: 4, title: 'Step 4', subtitle: 'Review & Plan', icon: ClipboardCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isPassed = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  // Allow jumping back or clicking current
                  if (item.step < currentStep) {
                    setCurrentStep(item.step);
                  } else if (item.step === currentStep + 1 && validateStep(currentStep)) {
                    setCurrentStep(item.step);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all border ${
                  isCurrent
                    ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                    : isPassed
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    : 'bg-white border-transparent text-slate-400 cursor-not-allowed opacity-75'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                    isCurrent
                      ? 'bg-teal-600 text-white'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.title}
                  </div>
                  <div
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? 'text-teal-950 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: BUSINESS DETAILS */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <span>Step 1 — Enterprise Identity &amp; Location Coordinates</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter registered corporate identity, constitution type, and geographic industrial jurisdiction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Company Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Company / Enterprise Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                placeholder="e.g., ABC Foods Manufacturing"
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.companyName ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              />
              {errors.companyName && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.companyName}</span>
                </p>
              )}
            </div>

            {/* Business Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Business Constitution Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => handleFieldChange('businessType', e.target.value)}
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.businessType ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              >
                <option value="">-- Select Constitution Type --</option>
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
              {errors.businessType && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.businessType}</span>
                </p>
              )}
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Industry Sector <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.industry}
                onChange={(e) => {
                  const val = e.target.value;
                  handleFieldChange('industry', val);
                  // Set default sub-industry if blank
                  if (val === 'Food Manufacturing' && !formData.subIndustry) {
                    handleFieldChange('subIndustry', 'Processed Foods & Packaged Snacks');
                  }
                }}
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.industry ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              >
                <option value="">-- Select Industry Sector --</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind.label} value={ind.label}>
                    {ind.label} (CPCB {ind.cpcb} Cat)
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.industry}</span>
                </p>
              )}
            </div>

            {/* Sub-industry */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Sub-industry / Specific Product Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subIndustry}
                onChange={(e) => handleFieldChange('subIndustry', e.target.value)}
                placeholder="e.g., Bakery & Packaged Confectionery, Dairy Processing"
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.subIndustry ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              />
              {errors.subIndustry && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.subIndustry}</span>
                </p>
              )}
            </div>

            {/* Project Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Project Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => {
                  const val = e.target.value;
                  handleFieldChange('projectType', val);
                  handleFieldChange('unitType', val.includes('Expansion') ? 'Expansion' : 'New Unit');
                }}
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.projectType ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              >
                <option value="Greenfield (New Unit)">Greenfield (New Industrial Unit)</option>
                <option value="Brownfield (Expansion of Existing Unit)">Brownfield (Expansion of Existing Unit)</option>
                <option value="Diversification / Product Change">Diversification / Product Line Addition</option>
              </select>
              {errors.projectType && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.projectType}</span>
                </p>
              )}
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                State <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.state ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.state}</span>
                </p>
              )}
            </div>

            {/* District */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                District <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleFieldChange('district', e.target.value)}
                placeholder="e.g., Pune"
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.district ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              />
              {errors.district && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.district}</span>
                </p>
              )}
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                City / Industrial Cluster Area <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder="e.g., Pune (Chakan / Bhosari MIDC)"
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.city ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              />
              {errors.city && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.city}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Next: Project Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PROJECT DETAILS */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              <span>Step 2 — Project Scope, Investment Scale &amp; Land Status</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify plant investment, land classification, built-up footprint, and workforce scale for statutory threshold rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* New Unit / Expansion */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                New Unit vs. Expansion <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['New Unit', 'Expansion'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFieldChange('unitType', type as 'New Unit' | 'Expansion')}
                    className={`p-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                      formData.unitType === type
                        ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-2xs font-bold'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Investment Amount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Total Plant &amp; Machinery Investment (₹ in Crores) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.investmentInrCrores}
                  onChange={(e) => handleFieldChange('investmentInrCrores', e.target.value)}
                  placeholder="e.g., 10.0"
                  className={`w-full text-xs pl-7 pr-3 py-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                    errors.investmentInrCrores ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                MSME Scale: {Number(formData.investmentInrCrores) <= 10 ? 'Small Enterprise' : Number(formData.investmentInrCrores) <= 50 ? 'Medium Enterprise' : 'Large / Mega Project'}
              </p>
              {errors.investmentInrCrores && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.investmentInrCrores}</span>
                </p>
              )}
            </div>

            {/* Land Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Land Status &amp; Title <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.landStatus}
                onChange={(e) => handleFieldChange('landStatus', e.target.value)}
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.landStatus ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              >
                {LAND_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.landStatus && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.landStatus}</span>
                </p>
              )}
            </div>

            {/* Built-up Area */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Proposed Built-up Area (Sq. Meters) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="10"
                value={formData.builtUpAreaSqMeters}
                onChange={(e) => handleFieldChange('builtUpAreaSqMeters', e.target.value)}
                placeholder="e.g., 3500"
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.builtUpAreaSqMeters ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              />
              <p className="text-[11px] text-slate-400">
                Note: Built-up area &gt; 500 sq.m triggers mandatory Provisional Fire Safety NOC.
              </p>
              {errors.builtUpAreaSqMeters && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.builtUpAreaSqMeters}</span>
                </p>
              )}
            </div>

            {/* Employee Count */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Projected Employee / Workforce Count <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.workforceCount}
                onChange={(e) => handleFieldChange('workforceCount', e.target.value)}
                placeholder="e.g., 75"
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.workforceCount ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              />
              <p className="text-[11px] text-slate-400">
                Workforce &gt; 10 workers with electric power triggers Factories Act Section 6 plan approval.
              </p>
              {errors.workforceCount && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.workforceCount}</span>
                </p>
              )}
            </div>

            {/* Production Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Production Process Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.productionType}
                onChange={(e) => handleFieldChange('productionType', e.target.value)}
                className={`w-full text-xs p-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                  errors.productionType ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              >
                <option value="">-- Select Production Methodology --</option>
                {PRODUCTION_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
              {errors.productionType && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.productionType}</span>
                </p>
              )}
            </div>

            {/* Project Stage */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Current Project Lifecycle Stage <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PROJECT_STAGES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleFieldChange('projectStage', st.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.projectStage === st.id
                        ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-400'
                        : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">{st.label}</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{st.desc}</div>
                  </button>
                ))}
              </div>
              {errors.projectStage && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.projectStage}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: Business Details</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Next: Operational Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: OPERATIONAL DETAILS */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              <span>Step 3 — Operational Utilities &amp; Environmental Factors</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input water consumption, power demand, fuel types, and waste generation for SPCB pollution &amp; utility clearances.
            </p>
          </div>

          <div className="space-y-5">
            {/* Manufacturing Activity */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Manufacturing &amp; Processing Activity Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.manufacturingActivity}
                onChange={(e) => handleFieldChange('manufacturingActivity', e.target.value)}
                placeholder="Describe key manufacturing processes, raw materials, intermediate reactions, and finished goods..."
                className={`w-full text-xs p-3 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors leading-relaxed ${
                  errors.manufacturingActivity ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                }`}
              />
              {errors.manufacturingActivity && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.manufacturingActivity}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Electricity Requirement */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Electricity Connected Load Requirement (kVA) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Zap className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="0"
                    value={formData.powerRequirementKVA}
                    onChange={(e) => handleFieldChange('powerRequirementKVA', e.target.value)}
                    placeholder="e.g., 200"
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                      errors.powerRequirementKVA ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Loads &gt; 50 kVA require High Tension (HT) DISCOM grid sanction &amp; CEIG clearance.
                </p>
                {errors.powerRequirementKVA && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.powerRequirementKVA}</span>
                  </p>
                )}
              </div>

              {/* Water Requirement */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Daily Fresh Water Requirement (KLD - Kilo Litres/Day) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Droplets className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="0"
                    value={formData.waterRequirementKLD}
                    onChange={(e) => handleFieldChange('waterRequirementKLD', e.target.value)}
                    placeholder="e.g., 35"
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                      errors.waterRequirementKLD ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Triggers SPCB Water Balance validation and on-site Effluent Treatment Plant (ETP) capacity rules.
                </p>
                {errors.waterRequirementKLD && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.waterRequirementKLD}</span>
                  </p>
                )}
              </div>

              {/* Waste Generation */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Waste Generation &amp; Disposal Scheme <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.wasteGeneration}
                  onChange={(e) => handleFieldChange('wasteGeneration', e.target.value)}
                  placeholder="e.g., Organic solid waste (3 MT/mo), wash water effluent (20 KLD treated via ETP), non-hazardous scrap..."
                  className={`w-full text-xs p-3 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors leading-relaxed ${
                    errors.wasteGeneration ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                  }`}
                />
                {errors.wasteGeneration && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.wasteGeneration}</span>
                  </p>
                )}
              </div>

              {/* Fuel Usage */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Primary Fuel Usage / Heating Source <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Flame className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={formData.fuelUsage}
                    onChange={(e) => handleFieldChange('fuelUsage', e.target.value)}
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                      errors.fuelUsage ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                    }`}
                  >
                    <option value="">-- Select Fuel Usage --</option>
                    {FUEL_OPTIONS.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.fuelUsage && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.fuelUsage}</span>
                  </p>
                )}
              </div>

              {/* Expected Operational Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Expected Commercial Operation Date (COD) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={formData.targetCommissioningDate}
                    onChange={(e) => handleFieldChange('targetCommissioningDate', e.target.value)}
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                      errors.targetCommissioningDate ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-300' : 'border-slate-300 focus:border-teal-500'
                    }`}
                  />
                </div>
                {errors.targetCommissioningDate && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.targetCommissioningDate}</span>
                  </p>
                )}
              </div>

              {/* Hazardous Material Usage */}
              <div className="md:col-span-2 p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Hazardous Chemicals / Flammable Solvent Usage
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Does the facility handle or store bulk solvents, explosive gases, or toxic chemicals?
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('hasHazardousChemicals', false)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        !formData.hasHazardousChemicals
                          ? 'bg-white text-emerald-800 border-emerald-400 shadow-2xs font-bold'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      No (Non-Hazardous)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('hasHazardousChemicals', true)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        formData.hasHazardousChemicals
                          ? 'bg-rose-50 text-rose-800 border-rose-400 shadow-2xs font-bold'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      Yes (Triggers PESO / MSIHC)
                    </button>
                  </div>
                </div>

                {formData.hasHazardousChemicals && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-800">
                      Specify Hazardous Materials / Solvents <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.hazardousDetails}
                      onChange={(e) => handleFieldChange('hazardousDetails', e.target.value)}
                      placeholder="e.g., Toluene, Hexane, Hydrogen Cylinders (Triggers PESO license)"
                      className={`w-full text-xs p-2.5 rounded-lg border bg-white focus:outline-none transition-colors ${
                        errors.hazardousDetails ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-teal-500'
                      }`}
                    />
                    {errors.hazardousDetails && (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{errors.hazardousDetails}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: Project Details</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Next: Review &amp; Approval Plan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-teal-600" />
                  <span>Step 4 — Review Business Profile &amp; Generate Approval Plan</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm all entered parameters. Clicking &quot;Generate Approval Plan&quot; saves this profile and orchestrates your statutory clearance roadmap.
                </p>
              </div>

              {formData.isDemoData && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Prototype Demo Record
                </span>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Business Identity */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-200">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Enterprise Coordinates</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Company Legal Name</span>
                    <span className="font-bold text-slate-900">{formData.companyName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Constitution</span>
                    <span className="text-slate-700">{formData.businessType || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Industry &amp; Sub-industry</span>
                    <span className="text-slate-800 font-semibold">{formData.industry || '—'}</span>
                    <span className="text-slate-500 block text-[11px]">{formData.subIndustry || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                    <span className="text-slate-700">{formData.city}, {formData.district}, {formData.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Project Type</span>
                    <span className="text-slate-700">{formData.projectType || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Project Scope */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-200">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Investment &amp; Infrastructure</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Plant Investment</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      ₹{formData.investmentInrCrores || '0'} Crore
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Workforce Scale</span>
                    <span className="text-slate-800 font-semibold">{formData.workforceCount || '0'} Employees</span>
                    <span className="text-slate-400 block text-[10px]">Factories Act Section 6 applicable</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Built-up Footprint</span>
                    <span className="text-slate-700">{formData.builtUpAreaSqMeters || '0'} Sq. Meters</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Land Status</span>
                    <span className="text-slate-700">{formData.landStatus || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Project Stage</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 mt-0.5">
                      {formData.projectStage === 'pre_establishment' ? 'Pre-establishment / New Unit' : formData.projectStage}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Operational & Utilities */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-200">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Utilities &amp; Statutory Factors</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Connected Power Demand</span>
                    <span className="text-slate-800 font-semibold">{formData.powerRequirementKVA || '0'} kVA</span>
                    <span className="text-slate-400 block text-[10px]">High-Tension DISCOM Sanction</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Water Requirement</span>
                    <span className="text-slate-800 font-semibold">{formData.waterRequirementKLD || '0'} KLD</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Fuel</span>
                    <span className="text-slate-700">{formData.fuelUsage || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Hazardous Materials</span>
                    <span className={formData.hasHazardousChemicals ? 'text-rose-700 font-bold' : 'text-emerald-700 font-medium'}>
                      {formData.hasHazardousChemicals ? 'Yes (Special Storage Regs)' : 'None (Non-Hazardous)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Operational Date</span>
                    <span className="text-slate-900 font-semibold">{formData.targetCommissioningDate || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manufacturing Activity & Waste Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Manufacturing Activity &amp; Process Scope
                </h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {formData.manufacturingActivity || 'No description provided.'}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Waste Generation &amp; Environmental Treatment
                </h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {formData.wasteGeneration || 'Standard non-hazardous industrial waste.'}
                </p>
              </div>
            </div>

            {/* Expected Approvals Projection Notice */}
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 text-xs text-teal-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-700 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <div className="font-bold text-teal-950">
                  Ready to Synthesize Statutory Approvals Roadmap
                </div>
                <p className="text-teal-800 text-[11px] leading-relaxed">
                  Upon clicking &quot;Generate Approval Plan&quot;, INDUSFLOW AI&apos;s compliance rules engine will dynamically calculate applicable clearances (e.g. Land Allotment, MPCB Consent to Establish, Fire NOC, DISH Factory Plan Approval, and {formData.industry === 'Food Manufacturing' ? 'FSSAI Central Food Safety License' : 'applicable sector permits'}), prerequisite graphs, and estimated statutory SLAs.
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Operational Details</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateApprovalPlan}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Saving Profile &amp; Evaluating Approvals...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-teal-200" />
                    <span>Generate Approval Plan</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
