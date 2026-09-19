import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  Building2,
  Check,
  Plus,
  X,
  Sparkles,
  ArrowRight,
  Factory,
  Search,
  MapPin,
  Users,
  IndianRupee,
  Layers,
} from 'lucide-react';

interface ProjectSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSwitcherModal: React.FC<ProjectSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    companies,
    currentCompanyId,
    switchCompany,
    setActiveTab,
    profile,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sectorLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cpcbCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = async (companyId: string) => {
    if (companyId === currentCompanyId) {
      onClose();
      return;
    }
    setIsSwitching(true);
    try {
      await switchCompany(companyId);
      setActiveTab('dashboard');
      onClose();
    } catch (err) {
      console.error('Error switching company:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const getCpcbBadge = (cat?: string) => {
    switch (cat) {
      case 'Red':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Orange':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Green':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'White':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Switch Business / Project</h2>
              <p className="text-xs text-slate-500">Select an industrial dossier preset or create a new project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Presets Info */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company name, industry, location, or CPCB category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="px-6 py-3 overflow-y-auto space-y-3 flex-1">
          {filteredCompanies.map((comp) => {
            const isSelected = comp.id === currentCompanyId;

            return (
              <div
                key={comp.id}
                onClick={() => !isSwitching && handleSelect(comp.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500 shadow-xs'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/80 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{comp.name}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        DEMO PROJECT
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCpcbBadge(
                          comp.cpcbCategory
                        )}`}
                      >
                        {comp.cpcbCategory} Category
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {comp.sectorLabel}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{comp.location}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                        <span>{comp.investment} Investment</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{comp.workforce} Workers</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{comp.stage}</span>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {isSelected ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-100/80 px-2.5 py-1 rounded-lg border border-teal-200">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-teal-600 hover:text-white rounded-lg transition-colors border border-slate-200"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCompanies.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No matching business profiles found for &ldquo;{searchQuery}&rdquo;.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              setActiveTab('onboarding');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600" />
            <span>+ Onboard New Business Project</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
