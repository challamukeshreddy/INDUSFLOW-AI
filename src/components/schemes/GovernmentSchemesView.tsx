import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  MatchedDemonstrationScheme,
  SchemeApplicationStatus,
  IndustrySector,
} from '../../types/index.js';
import { matchDemonstrationSchemes } from './schemeMatchingEngine.js';
import {
  Award,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ExternalLink,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  FileCheck2,
  FileX,
  FileText,
  Info,
  ChevronRight,
  Landmark,
  FileUp,
} from 'lucide-react';

const STATUS_LABELS: Record<SchemeApplicationStatus, { label: string; color: string; bg: string }> = {
  not_started: {
    label: 'Not Started',
    color: 'text-slate-700',
    bg: 'bg-slate-100 border-slate-300',
  },
  prerequisites_pending: {
    label: 'Prerequisites Pending',
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-300',
  },
  preparing_documents: {
    label: 'Preparing Documents',
    color: 'text-blue-800',
    bg: 'bg-blue-50 border-blue-300',
  },
  ready_for_submission: {
    label: 'Ready for Submission',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50 border-emerald-300',
  },
  under_review: {
    label: 'Under Authority Review',
    color: 'text-indigo-800',
    bg: 'bg-indigo-50 border-indigo-300',
  },
  sanctioned: {
    label: 'Sanctioned / Approved',
    color: 'text-teal-800',
    bg: 'bg-teal-50 border-teal-300',
  },
};

export const GovernmentSchemesView: React.FC = () => {
  const {
    profile,
    approvals,
    documents,
    setActiveTab,
    schemeApplicationStatuses,
    updateSchemeApplicationStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [relevanceFilter, setRelevanceFilter] = useState<'all' | 'High' | 'Moderate' | 'Conditional'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'Central' | 'State'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});
  const [selectedSchemeForModal, setSelectedSchemeForModal] = useState<MatchedDemonstrationScheme | null>(null);

  // Simulation mode overrides for evaluating different parameter matches
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSector, setSimulatedSector] = useState<IndustrySector>(profile?.sector || 'pharma');
  const [simulatedState, setSimulatedState] = useState(profile?.state || 'Maharashtra');
  const [simulatedInvestment, setSimulatedInvestment] = useState<number>(profile?.investmentInrCrores || 38.5);
  const [simulatedProjectType, setSimulatedProjectType] = useState(profile?.projectType || 'Greenfield Manufacturing Unit');
  const [simulatedBusinessType, setSimulatedBusinessType] = useState(profile?.businessType || 'Private Limited Company');

  const effectiveProfile = useMemo(() => {
    if (!profile) return null;
    if (!isSimulating) return profile;
    return {
      ...profile,
      sector: simulatedSector,
      state: simulatedState,
      investmentInrCrores: simulatedInvestment,
      projectType: simulatedProjectType,
      businessType: simulatedBusinessType,
    };
  }, [profile, isSimulating, simulatedSector, simulatedState, simulatedInvestment, simulatedProjectType, simulatedBusinessType]);

  const matchedSchemes = useMemo(() => {
    if (!effectiveProfile) return [];
    return matchDemonstrationSchemes(
      effectiveProfile,
      approvals,
      documents,
      schemeApplicationStatuses
    );
  }, [effectiveProfile, approvals, documents, schemeApplicationStatuses]);

  // Filter schemes
  const filteredSchemes = useMemo(() => {
    return matchedSchemes.filter((scheme) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          scheme.name.toLowerCase().includes(q) ||
          scheme.shortName.toLowerCase().includes(q) ||
          scheme.sponsoringBody.toLowerCase().includes(q) ||
          scheme.description.toLowerCase().includes(q) ||
          scheme.benefitType.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      // Relevance filter
      if (relevanceFilter !== 'all' && scheme.potentialRelevance !== relevanceFilter) {
        return false;
      }

      // Level filter
      if (levelFilter !== 'all' && scheme.level !== levelFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && scheme.applicationStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [matchedSchemes, searchQuery, relevanceFilter, levelFilter, statusFilter]);

  const stats = useMemo(() => {
    const highMatches = matchedSchemes.filter((s) => s.potentialRelevance === 'High').length;
    const moderateMatches = matchedSchemes.filter((s) => s.potentialRelevance === 'Moderate').length;
    const inProgress = matchedSchemes.filter(
      (s) => s.applicationStatus === 'preparing_documents' || s.applicationStatus === 'under_review'
    ).length;
    return {
      total: matchedSchemes.length,
      highMatches,
      moderateMatches,
      inProgress,
    };
  }, [matchedSchemes]);

  const toggleWhy = (schemeId: string) => {
    setExpandedWhy((prev) => ({
      ...prev,
      [schemeId]: !prev[schemeId],
    }));
  };

  const handleStatusChange = (schemeId: string, newStatus: SchemeApplicationStatus) => {
    updateSchemeApplicationStatus(schemeId, newStatus);
  };

  const resetSimulation = () => {
    if (profile) {
      setSimulatedSector(profile.sector || 'pharma');
      setSimulatedState(profile.state || 'Maharashtra');
      setSimulatedInvestment(profile.investmentInrCrores || 38.5);
      setSimulatedProjectType(profile.projectType || 'Greenfield Manufacturing Unit');
      setSimulatedBusinessType(profile.businessType || 'Private Limited Company');
    }
    setIsSimulating(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header & Demonstration Disclaimer */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Government Support &amp; Schemes
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    Demonstration Module
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Potentially relevant financial incentives, capital subsidies, and production linked schemes matched to your industrial parameters.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                isSimulating
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Active Parameter Sandbox' : 'Simulate Parameters'}</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Document Hub</span>
            </button>
          </div>
        </div>

        {/* Prominent Demonstration Disclaimer Banner */}
        <div className="mt-5 p-4 rounded-xl bg-amber-50/70 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-amber-900">
                DEMONSTRATION SCHEME DATA &bull; PROTOTYPE SIMULATION
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-amber-900">
              All government incentive records, subsidies, and prerequisite checklists displayed in this module are <strong>demonstration records</strong> curated for prototype evaluation. INDUSFLOW never guarantees or certifies official government sanction or legal eligibility.
            </p>
            <p className="text-[12px] font-semibold text-amber-950 pt-0.5">
              &bull; <em>Potentially relevant based on prototype criteria. Verify eligibility with the concerned authority.</em>
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Active Grounded Matching Criteria Pills */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Evaluated Matching Criteria (5 Parameters)</span>
            </span>
            {isSimulating && (
              <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulation Sandbox Mode Active</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* 1. Industry */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                1. Industry
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                {(effectiveProfile?.sector || 'pharma').toUpperCase()} &bull; {effectiveProfile?.companyName?.includes('BioPharma') ? 'API / Pharma' : 'Mfg'}
              </span>
            </div>

            {/* 2. Location */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                2. Location
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                {effectiveProfile?.state || 'Maharashtra'} &bull; {effectiveProfile?.district || 'Palghar'}
              </span>
            </div>

            {/* 3. Project Type */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                3. Project Type
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                {effectiveProfile?.projectType || 'Greenfield Unit'}
              </span>
            </div>

            {/* 4. Investment */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                4. Investment
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                ₹{effectiveProfile?.investmentInrCrores || 38.5} Cr ({effectiveProfile?.investmentScale || 'Medium'})
              </span>
            </div>

            {/* 5. Business Type */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                5. Business Type
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                {effectiveProfile?.businessType || 'Private Limited'}
              </span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Optional Simulation Drawer */}
        {/* ------------------------------------------------------------- */}
        {isSimulating && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-700" />
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Demonstration Sandbox: Tweak Criteria to Test Dynamic Matching
                </span>
              </div>
              <button
                onClick={resetSimulation}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Business Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-bold text-indigo-900 block mb-1">
                  Sector (Industry)
                </label>
                <select
                  value={simulatedSector}
                  onChange={(e) => setSimulatedSector(e.target.value as IndustrySector)}
                  className="w-full text-xs p-2 rounded-lg border border-indigo-300 bg-white font-medium"
                >
                  <option value="pharma">Pharma &amp; Bulk Drugs</option>
                  <option value="food_processing">Food Processing</option>
                  <option value="automobile">Automobile &amp; Auto Components</option>
                  <option value="electronics">Electronics &amp; Hardware</option>
                  <option value="chemicals">Specialty Chemicals</option>
                  <option value="textiles">Textiles &amp; Garments</option>
                  <option value="metallurgy">Metallurgy</option>
                  <option value="renewable_energy">Renewable Energy</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-indigo-900 block mb-1">
                  Location (State)
                </label>
                <select
                  value={simulatedState}
                  onChange={(e) => setSimulatedState(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-indigo-300 bg-white font-medium"
                >
                  <option value="Maharashtra">Maharashtra (MIDC)</option>
                  <option value="Gujarat">Gujarat (GIDC)</option>
                  <option value="Tamil Nadu">Tamil Nadu (SIPCOT)</option>
                  <option value="Karnataka">Karnataka (KIADB)</option>
                  <option value="Telangana">Telangana (TSIIC)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-indigo-900 block mb-1">
                  Project Type
                </label>
                <select
                  value={simulatedProjectType}
                  onChange={(e) => setSimulatedProjectType(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-indigo-300 bg-white font-medium"
                >
                  <option value="Greenfield Manufacturing Unit">Greenfield Manufacturing Unit</option>
                  <option value="Expansion / Brownfield">Expansion / Brownfield</option>
                  <option value="Modernization">Modernization</option>
                  <option value="Clean Tech / Green Transition">Clean Tech / Green Transition</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-indigo-900 block mb-1">
                  Investment (₹ Crores): {simulatedInvestment} Cr
                </label>
                <input
                  type="range"
                  min="1"
                  max="150"
                  step="2"
                  value={simulatedInvestment}
                  onChange={(e) => setSimulatedInvestment(Number(e.target.value))}
                  className="w-full accent-indigo-600 mt-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-indigo-900 block mb-1">
                  Business Type
                </label>
                <select
                  value={simulatedBusinessType}
                  onChange={(e) => setSimulatedBusinessType(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-indigo-300 bg-white font-medium"
                >
                  <option value="Private Limited Company">Private Limited Company</option>
                  <option value="Public Limited Company">Public Limited Company</option>
                  <option value="Limited Liability Partnership (LLP)">LLP</option>
                  <option value="MSME / Udyam Enterprise">MSME / Udyam Enterprise</option>
                  <option value="Partnership Firm">Partnership Firm</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Key Metrics Strip */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Demonstration Records
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">Curated Policies</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Central &amp; State demonstration catalog</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-200 bg-teal-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
              High Potential Matches
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-300">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-teal-950">{stats.highMatches}</span>
            <span className="text-xs text-teal-800 font-semibold bg-teal-100 px-1.5 py-0.5 rounded border border-teal-200">
              &ge;80% Alignment
            </span>
          </div>
          <p className="text-[11px] text-teal-700 mt-1">Potentially relevant based on prototype criteria</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Moderate Matches
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-slate-900">{stats.moderateMatches}</span>
            <span className="text-xs text-slate-500 font-medium">55% - 79% Match</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Conditional on sector/size expansion</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Active Dossiers
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-slate-900">{stats.inProgress}</span>
            <span className="text-xs text-indigo-700 font-medium">In Prep / Review</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tracked in application workflow</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Search & Filter Bar */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search schemes by name, ministry, or incentive type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Relevance Filter */}
          <select
            value={relevanceFilter}
            onChange={(e) => setRelevanceFilter(e.target.value as any)}
            className="text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Potential Relevance</option>
            <option value="High">High Potential Relevance</option>
            <option value="Moderate">Moderate Potential Relevance</option>
            <option value="Conditional">Conditional Relevance</option>
          </select>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">Central &amp; State Schemes</option>
            <option value="Central">Central Govt Only</option>
            <option value="State">State Govt Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Application Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="prerequisites_pending">Prerequisites Pending</option>
            <option value="preparing_documents">Preparing Documents</option>
            <option value="ready_for_submission">Ready for Submission</option>
            <option value="under_review">Under Authority Review</option>
            <option value="sanctioned">Sanctioned</option>
          </select>

          {(searchQuery || relevanceFilter !== 'all' || levelFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRelevanceFilter('all');
                setLevelFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Schemes List / Cards */}
      {/* ------------------------------------------------------------- */}
      {filteredSchemes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">No Matching Demonstration Schemes</h3>
          <p className="text-xs text-slate-500">
            No demonstration records matched your current query or active filter settings. Try clearing the filters or tweaking parameters in the simulation sandbox.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setRelevanceFilter('all');
              setLevelFilter('all');
              setStatusFilter('all');
            }}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSchemes.map((scheme) => {
            const isWhyOpen = !!expandedWhy[scheme.id];
            const statusConfig = STATUS_LABELS[scheme.applicationStatus];

            return (
              <div
                key={scheme.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
              >
                {/* Demonstration Header Bar */}
                <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      DEMONSTRATION RECORD
                    </span>
                    <span className="text-slate-500 font-semibold">
                      {scheme.level} Scheme &bull; {scheme.nodalAgency}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Application Status:</span>
                    <select
                      value={scheme.applicationStatus}
                      onChange={(e) => handleStatusChange(scheme.id, e.target.value as SchemeApplicationStatus)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border cursor-pointer ${statusConfig.bg} ${statusConfig.color}`}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="prerequisites_pending">Prerequisites Pending</option>
                      <option value="preparing_documents">Preparing Documents</option>
                      <option value="ready_for_submission">Ready for Submission</option>
                      <option value="under_review">Under Authority Review</option>
                      <option value="sanctioned">Sanctioned</option>
                    </select>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="p-6 space-y-4">
                  {/* Top Row: Title, Authority, Potential Relevance */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                          {scheme.benefitType}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {scheme.sponsoringBody}
                        </span>
                      </div>

                      {/* Scheme Name */}
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                        {scheme.name}
                      </h2>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                        {scheme.description}
                      </p>
                    </div>

                    {/* Potential Relevance Box */}
                    <div className="lg:w-72 shrink-0 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Potential Relevance
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            scheme.potentialRelevance === 'High'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : scheme.potentialRelevance === 'Moderate'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {scheme.potentialRelevance} ({scheme.potentialRelevanceScore}%)
                        </span>
                      </div>

                      {/* Mandatory Disclaimer Text */}
                      <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700 leading-tight space-y-1">
                        <p className="font-semibold text-slate-800">
                          &bull; {scheme.potentialRelevanceDisclaimer}
                        </p>
                        <p className="text-slate-500 italic">
                          &bull; {scheme.authorityVerificationNotice}
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
                        <span>Max Benefit Envelope:</span>
                        <span className="font-bold text-slate-900 font-mono text-[11px]">
                          {scheme.maxBenefit.split('(')[0].trim()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* Why It May Be Relevant (Structured 5-Point Matching) */}
                  {/* ------------------------------------------------------------- */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
                    <button
                      onClick={() => toggleWhy(scheme.id)}
                      className="w-full px-4 py-2.5 bg-slate-100/70 hover:bg-slate-100 text-left flex items-center justify-between text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-teal-700" />
                        <span>Why It May Be Relevant (Matching Breakdown Across 5 Parameters)</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-teal-800 font-semibold">
                        <span>{isWhyOpen ? 'Hide Criteria Match' : 'View Criteria Match'}</span>
                        {isWhyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </button>

                    {isWhyOpen && (
                      <div className="p-4 space-y-3 text-xs bg-white animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* 1. Industry Why */}
                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                              <Building2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Industry Match</span>
                            </div>
                            <p className="text-slate-700 text-xs leading-relaxed">
                              {scheme.whyItMayBeRelevant.industryWhy}
                            </p>
                          </div>

                          {/* 2. Location Why */}
                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5 text-rose-600" />
                              <span>Location Match</span>
                            </div>
                            <p className="text-slate-700 text-xs leading-relaxed">
                              {scheme.whyItMayBeRelevant.locationWhy}
                            </p>
                          </div>

                          {/* 3. Project Type Why */}
                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                              <Layers className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Project Type Match</span>
                            </div>
                            <p className="text-slate-700 text-xs leading-relaxed">
                              {scheme.whyItMayBeRelevant.projectTypeWhy}
                            </p>
                          </div>

                          {/* 4. Investment Why */}
                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Investment Match</span>
                            </div>
                            <p className="text-slate-700 text-xs leading-relaxed">
                              {scheme.whyItMayBeRelevant.investmentWhy}
                            </p>
                          </div>
                        </div>

                        {/* 5. Business Type Why */}
                        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                            <span>Business Type Match</span>
                          </div>
                          <p className="text-slate-700 text-xs leading-relaxed">
                            {scheme.whyItMayBeRelevant.businessTypeWhy}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* Required Documents Checklist */}
                  {/* ------------------------------------------------------------- */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-teal-700" />
                        <span>Required Documents Checklist</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {scheme.uploadedDocumentsCount} of {scheme.requiredDocumentsCount} ready in Document Hub
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {scheme.documentsStatus.map((docItem) => (
                        <div
                          key={docItem.docId}
                          className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                            docItem.isUploaded
                              ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            {docItem.isUploaded ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <Clock3 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <span className="font-semibold block truncate text-[11px]">
                                {docItem.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {docItem.mandatory ? 'Mandatory Attachment' : 'Optional / Supplementary'}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                              docItem.isUploaded
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {docItem.isUploaded ? 'In Hub' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* Card Footer: Prerequisite Clearances & Action Links */}
                  {/* ------------------------------------------------------------- */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                      <span className="font-semibold text-slate-800">Prerequisites:</span>
                      <span>
                        {scheme.prerequisitesMetCount} / {scheme.prerequisitesTotalCount} Clearances Sanctioned
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="font-semibold text-slate-800">Application Status:</span>
                      <span className={`font-bold ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSchemeForModal(scheme)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Full Scheme Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={scheme.officialPortal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. Detailed Scheme Dossier Modal */}
      {/* ------------------------------------------------------------- */}
      {selectedSchemeForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      DEMONSTRATION RECORD
                    </span>
                    <span className="text-xs text-teal-300 font-semibold">
                      {selectedSchemeForModal.potentialRelevance} ({selectedSchemeForModal.potentialRelevanceScore}% Match)
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1 leading-snug">
                    {selectedSchemeForModal.name}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedSchemeForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Mandatory Prototype Disclaimer Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Demonstration Notice</span>
                </div>
                <p className="font-semibold text-[12px]">
                  &bull; {selectedSchemeForModal.potentialRelevanceDisclaimer}
                </p>
                <p className="text-slate-600">
                  &bull; {selectedSchemeForModal.authorityVerificationNotice}
                </p>
              </div>

              {/* Sponsoring Authority & Benefits */}
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                      Sponsoring Ministry &bull; Nodal Agency
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      {selectedSchemeForModal.sponsoringBody}
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Operational Agency: {selectedSchemeForModal.nodalAgency}
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-md text-xs font-semibold bg-teal-700 text-white shadow-2xs self-start">
                    {selectedSchemeForModal.benefitType}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-teal-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                    Estimated Maximum Financial Benefit Envelope
                  </span>
                  <span className="text-base font-bold text-teal-950 mt-0.5 block">
                    {selectedSchemeForModal.maxBenefit}
                  </span>
                </div>
              </div>

              {/* Key Scheme Benefits */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                  <span>Key Policy Subsidies &amp; Fiscal Incentives</span>
                </h3>
                <div className="space-y-1.5">
                  {selectedSchemeForModal.keyBenefits.map((b, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility Highlights */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Statutory Eligibility Requirements</span>
                </h3>
                <div className="space-y-1.5">
                  {selectedSchemeForModal.eligibilityConditions.map((cond, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      <span>{cond}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Documents Detailed List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Document Dossier Checklist</span>
                </h3>
                <div className="space-y-2">
                  {selectedSchemeForModal.requiredDocuments.map((doc) => {
                    const status = selectedSchemeForModal.documentsStatus.find((d) => d.docId === doc.id);
                    return (
                      <div
                        key={doc.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{doc.name}</span>
                          <p className="text-[11px] text-slate-500">{doc.description}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            status?.isUploaded
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {status?.isUploaded ? 'Ready in Hub' : 'Pending Upload'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clearances Checklist */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Statutory Clearances Required Before Disbursement
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSchemeForModal.requiredClearances.map((c) => {
                    const isApproved = approvals.some((a) => a.code === c && a.status === 'approved');
                    return (
                      <span
                        key={c}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border ${
                          isApproved
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{c}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setSelectedSchemeForModal(null);
                  setActiveTab('documents');
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Upload Documents in Hub</span>
                <FileUp className="w-3.5 h-3.5" />
              </button>

              <a
                href={selectedSchemeForModal.officialPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Open Government Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
