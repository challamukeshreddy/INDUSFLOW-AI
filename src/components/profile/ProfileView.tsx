import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { BusinessProfile, IndustrySector, CpcbCategory, LandType, WaterSource, InvestmentScale } from '../../types/index.js';
import {
  Building,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  Factory,
  Zap,
  Droplets,
  Flame,
  Users,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { profile, updateProfile, isEvaluating, setActiveTab } = useApp();

  const [formData, setFormData] = useState<BusinessProfile>(
    profile || {
      id: 'proj_new',
      companyName: '',
      cinOrUdyam: '',
      pan: '',
      gstin: '',
      sector: 'pharma',
      state: 'Maharashtra',
      district: 'Palghar',
      industrialArea: 'MIDC Tarapur Chemical Zone',
      landType: 'designated_industrial_estate',
      landAreaAcres: 5.0,
      builtUpAreaSqMeters: 5000,
      investmentScale: 'medium',
      investmentInrCrores: 35.0,
      cpcbCategory: 'Red',
      workforceCount: 75,
      powerRequirementKVA: 400,
      waterRequirementKLD: 50,
      waterSource: 'industrial_pipe',
      hasBoiler: true,
      boilerCapacityTph: 4,
      hasHazardousChemicals: true,
      hazardousDetails: 'Industrial solvents and flammable liquids',
      hasEffluentDischarge: true,
      effluentQuantityKLD: 35,
      dgSetCapacityKVA: 500,
      projectStage: 'pre_construction',
      targetCommissioningDate: '2026-12-31',
    }
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field: keyof BusinessProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Preset loaders for demonstration
  const applyPreset = (presetName: 'pharma' | 'electronics' | 'food' | 'chemical') => {
    if (presetName === 'pharma') {
      setFormData((prev) => ({
        ...prev,
        companyName: 'Apex BioPharma & Fine Chemicals Ltd.',
        sector: 'pharma',
        cpcbCategory: 'Red',
        investmentInrCrores: 38.5,
        investmentScale: 'medium',
        waterRequirementKLD: 65,
        waterSource: 'industrial_pipe',
        hasBoiler: true,
        boilerCapacityTph: 4,
        hasHazardousChemicals: true,
        hazardousDetails: 'Toluene, Isopropanol, Dichloromethane (DCM)',
        hasEffluentDischarge: true,
        effluentQuantityKLD: 42,
      }));
    } else if (presetName === 'electronics') {
      setFormData((prev) => ({
        ...prev,
        companyName: 'NexGen Microtronics India Pvt Ltd',
        sector: 'electronics',
        cpcbCategory: 'Green',
        investmentInrCrores: 18.0,
        investmentScale: 'small',
        waterRequirementKLD: 12,
        waterSource: 'industrial_pipe',
        hasBoiler: false,
        boilerCapacityTph: 0,
        hasHazardousChemicals: false,
        hazardousDetails: '',
        hasEffluentDischarge: false,
        effluentQuantityKLD: 0,
      }));
    } else if (presetName === 'food') {
      setFormData((prev) => ({
        ...prev,
        companyName: 'Kaveri AgroFoods Processing Cluster',
        sector: 'food_processing',
        cpcbCategory: 'Orange',
        investmentInrCrores: 24.0,
        investmentScale: 'medium',
        waterRequirementKLD: 80,
        waterSource: 'borewell',
        hasBoiler: true,
        boilerCapacityTph: 2,
        hasHazardousChemicals: false,
        hazardousDetails: '',
        hasEffluentDischarge: true,
        effluentQuantityKLD: 60,
      }));
    } else if (presetName === 'chemical') {
      setFormData((prev) => ({
        ...prev,
        companyName: 'Synthetica Speciality Polymers LLP',
        sector: 'chemicals',
        cpcbCategory: 'Red',
        investmentInrCrores: 65.0,
        investmentScale: 'large',
        waterRequirementKLD: 120,
        waterSource: 'borewell',
        hasBoiler: true,
        boilerCapacityTph: 6,
        hasHazardousChemicals: true,
        hazardousDetails: 'Monomers, Benzene, Caustic Soda, Hydrogen',
        hasEffluentDischarge: true,
        effluentQuantityKLD: 90,
      }));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header card with rules engine notice */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Business &amp; Industrial Project Profile
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Modifying these technical parameters dynamically recalculates statutory approvals, CPCB requirements, CGWA ground water clearance, and dependency flows.
            </p>
          </div>

          {/* Demonstration Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">SIH Demo Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('pharma')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
            >
              Pharma (Red)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('electronics')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
            >
              Electronics (Green)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('food')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
            >
              AgroFood (Orange)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('chemical')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
            >
              Chemical (Red/Large)
            </button>
          </div>
        </div>

        {/* Onboarding Wizard shortcut banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>Need to register a fresh enterprise from scratch? Use the guided 4-step onboarding wizard.</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('onboarding')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors self-start sm:self-auto flex-shrink-0"
          >
            <span>Open Business Onboarding Wizard</span>
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Enterprise Identity & Registration */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">1</span>
              <span>Enterprise Identity &amp; Corporate Credentials</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company / Manufacturing Unit Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Identification (CIN / Udyam Registration No.) *
              </label>
              <input
                type="text"
                required
                value={formData.cinOrUdyam}
                onChange={(e) => handleChange('cinOrUdyam', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => handleChange('pan', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Goods and Services Tax Identification Number (GSTIN)
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Sector & CPCB Environmental Categorization */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">2</span>
              <span>Industrial Sector &amp; CPCB Pollution Classification</span>
            </h3>
            <span className="text-[11px] text-slate-400">Rules under Environment (Protection) Act, 1986</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry Sector *
              </label>
              <select
                value={formData.sector}
                onChange={(e) => handleChange('sector', e.target.value as IndustrySector)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="pharma">Pharmaceuticals &amp; Active Ingredients (API)</option>
                <option value="chemicals">Chemicals, Dyes &amp; Resins</option>
                <option value="food_processing">Food &amp; Agro Processing</option>
                <option value="textiles">Textiles &amp; Yarn Processing</option>
                <option value="automobile">Automobile &amp; EV Component Engineering</option>
                <option value="electronics">Electronics &amp; Semiconductor Assembly</option>
                <option value="metallurgy">Metallurgy, Casting &amp; Forging</option>
                <option value="renewable_energy">Renewable Solar / Wind Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CPCB Pollution Category (Central PCB) *
              </label>
              <select
                value={formData.cpcbCategory}
                onChange={(e) => handleChange('cpcbCategory', e.target.value as CpcbCategory)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-semibold"
              >
                <option value="Red">Red Category (Pollution Index &ge; 60 - Heavy Clearances)</option>
                <option value="Orange">Orange Category (Pollution Index 41 to 59 - Moderate)</option>
                <option value="Green">Green Category (Pollution Index 21 to 40 - Light)</option>
                <option value="White">White Category (Pollution Index &le; 20 - Exempt CTE/CTO)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Investment Scale (MSMED Act 2020)
              </label>
              <select
                value={formData.investmentScale}
                onChange={(e) => handleChange('investmentScale', e.target.value as InvestmentScale)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="micro">Micro (Plant &amp; Machinery &le; ₹1 Cr)</option>
                <option value="small">Small (Plant &amp; Machinery &le; ₹10 Cr)</option>
                <option value="medium">Medium (Plant &amp; Machinery &le; ₹50 Cr)</option>
                <option value="large">Large Enterprise (&gt; ₹50 Cr)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Capital Outlay / Investment (in ₹ Crores)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.investmentInrCrores}
                onChange={(e) => handleChange('investmentInrCrores', parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Projected Workforce (Labor &amp; Staff) *
              </label>
              <input
                type="number"
                value={formData.workforceCount}
                onChange={(e) => handleChange('workforceCount', parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                &ge; 10 workers triggers Section 6 of Factories Act (Factory Building Plan &amp; License).
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Geographic Location & Land Footprint */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">3</span>
              <span>Geographic Location &amp; Industrial Land Footprint</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State / Union Territory *
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Maharashtra">Maharashtra (MIDC / MPCB)</option>
                <option value="Gujarat">Gujarat (GIDC / GPCB)</option>
                <option value="Tamil Nadu">Tamil Nadu (SIPCOT / TNPCB)</option>
                <option value="Karnataka">Karnataka (KIADB / KSPCB)</option>
                <option value="Telangana">Telangana (TSIIC / TSPCB)</option>
                <option value="Uttar Pradesh">Uttar Pradesh (UPSIDA / UPPCB)</option>
                <option value="Rajasthan">Rajasthan (RIICO / RSPCB)</option>
                <option value="Andhra Pradesh">Andhra Pradesh (APIIC / APPCB)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                District / Revenue Jurisdiction
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industrial Estate / Notified Area
              </label>
              <input
                type="text"
                value={formData.industrialArea}
                onChange={(e) => handleChange('industrialArea', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Land Tenure / Zone Type
              </label>
              <select
                value={formData.landType}
                onChange={(e) => handleChange('landType', e.target.value as LandType)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="designated_industrial_estate">Designated Industrial Estate (MIDC/GIDC)</option>
                <option value="private_industrial_land">Private Non-Agricultural (NA) Land</option>
                <option value="agricultural_conversion">Requires Agricultural Conversion (CLU)</option>
                <option value="eco_sensitive_proximity">Proximity to Eco-Sensitive / Forest Zone</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plot Land Area (in Acres)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.landAreaAcres}
                onChange={(e) => handleChange('landAreaAcres', parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Covered Built-up Area (sq. meters)
              </label>
              <input
                type="number"
                value={formData.builtUpAreaSqMeters}
                onChange={(e) => handleChange('builtUpAreaSqMeters', parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                &ge; 500 sq.m triggers Fire Department Provisional NOC.
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Utilities, Boilers, and Environmental Footprint */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">4</span>
              <span>Utilities, Boilers, Chemicals &amp; Emission Rules</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Power Sanction Demand (kVA)</span>
              </label>
              <input
                type="number"
                value={formData.powerRequirementKVA}
                onChange={(e) => handleChange('powerRequirementKVA', parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">&ge; 50 kVA requires HT clearance.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>Water Requirement (KLD - KL/Day)</span>
              </label>
              <input
                type="number"
                value={formData.waterRequirementKLD}
                onChange={(e) => handleChange('waterRequirementKLD', parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Water Supply Source
              </label>
              <select
                value={formData.waterSource}
                onChange={(e) => handleChange('waterSource', e.target.value as WaterSource)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="industrial_pipe">Industrial Estate Piped Supply (MIDC/GIDC)</option>
                <option value="borewell">Ground Water Borewell (Triggers CGWA NOC)</option>
                <option value="river_canal">Surface Water / River Intake</option>
                <option value="tanker_supply">Commercial Water Tankers</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasBoiler}
                    onChange={(e) => handleChange('hasBoiler', e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>Industrial Steam Boiler Installed</span>
                </label>
                {formData.hasBoiler && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                    Indian Boilers Act Applies
                  </span>
                )}
              </div>
              {formData.hasBoiler && (
                <div className="pt-2">
                  <label className="block text-xs text-slate-600 mb-1">
                    Boiler Steam Generation Capacity (TPH - Tonnes Per Hour)
                  </label>
                  <input
                    type="number"
                    value={formData.boilerCapacityTph || 4}
                    onChange={(e) => handleChange('boilerCapacityTph', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasHazardousChemicals}
                    onChange={(e) => handleChange('hasHazardousChemicals', e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>Hazardous / Flammable Chemicals Handled</span>
                </label>
                {formData.hasHazardousChemicals && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-semibold">
                    PESO Clearance Applies
                  </span>
                )}
              </div>
              {formData.hasHazardousChemicals && (
                <div className="pt-2">
                  <label className="block text-xs text-slate-600 mb-1">
                    Specific Solvents / Gases / Combustibles Inventory
                  </label>
                  <input
                    type="text"
                    value={formData.hazardousDetails || ''}
                    onChange={(e) => handleChange('hazardousDetails', e.target.value)}
                    placeholder="e.g. Toluene, Acetone, Hydrogen Cylinders"
                    className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit & Live Re-evaluation Action Bar */}
        <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-lg border border-slate-800 z-20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <div>
              <h4 className="text-xs font-bold text-white">
                Deterministic Statutory Re-evaluation
              </h4>
              <p className="text-[11px] text-slate-400">
                Saves parameters and recalculates required approvals, deadlines, and critical dependencies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-4 h-4" /> Clearances Re-evaluated!
              </span>
            )}
            <button
              type="submit"
              disabled={isEvaluating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEvaluating ? 'Re-evaluating Rules...' : 'Save & Re-evaluate Clearances'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
