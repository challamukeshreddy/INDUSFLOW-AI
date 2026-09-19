import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  ShieldAlert,
  Factory,
  ChevronDown,
  Sparkles,
  Play,
  RotateCcw,
  Building2,
  Check,
  Plus,
  Compass,
  ArrowRight,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { ProjectSwitcherModal } from './ProjectSwitcherModal.js';

export const Header: React.FC = () => {
  const {
    profile,
    setActiveTab,
    alerts,
    companies,
    currentCompanyId,
    switchCompany,
    toggleDemoGuide,
    isDemoGuideOpen,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCpcbBadge = (cat?: string) => {
    switch (cat) {
      case 'Red':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Orange':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Green':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'White':
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const attentionAlerts = alerts.filter((a) => a.severity === 'high');

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xs">
        {/* Official National Single-Window Portal Top Strip */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-1 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-950 text-teal-400 border border-teal-800">
              NATIONAL SINGLE WINDOW SYSTEM
            </span>
            <span className="hidden sm:inline text-slate-400 text-[11px]">
              Industrial Approvals, Regulatory Compliance &amp; Support Services Portal
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Services Online</span>
            </span>
            <span className="text-slate-600 hidden md:inline">&bull;</span>
            <span className="hidden md:inline text-slate-400">
              Department Integration: Connected
            </span>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-600 to-slate-900 flex items-center justify-center shadow-md shadow-teal-500/20 border border-teal-400/40 shrink-0 group-hover:scale-105 transition-transform">
                  <Factory className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-base tracking-tight text-white font-mono">
                      INDUSFLOW<span className="text-teal-400">.AI</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      v2.4
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-none">
                    Industrial Clearance &amp; Compliance Operations Platform
                  </p>
                </div>
              </button>
            </div>

            {/* Center/Right: Project Switcher & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Active Enterprise / Project Switcher Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  id="business-switcher-dropdown-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 cursor-pointer transition-colors max-w-[280px] sm:max-w-[320px]"
                  title="Switch active enterprise or project dossier"
                >
                  <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <div className="flex flex-col text-left truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-100 truncate text-[11px]">
                        {profile?.companyName || 'Select Enterprise'}
                      </span>
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-mono font-semibold tracking-wider shrink-0">
                        DEMO PROJECT
                      </span>
                      {profile?.cpcbCategory && (
                        <span className={`text-[9px] px-1 rounded border shrink-0 ${getCpcbBadge(profile.cpcbCategory)}`}>
                          {profile.cpcbCategory}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">
                      {profile?.sector?.toUpperCase()} &bull; {profile?.district}, {profile?.state}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-84 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn">
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                      <span>Select Enterprise Project</span>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsModalOpen(true);
                        }}
                        className="text-teal-400 hover:text-teal-300 font-mono text-[10px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Manage All</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-800/60">
                      {companies.map((comp) => {
                        const isSelected = comp.id === currentCompanyId;
                        return (
                          <button
                            key={comp.id}
                            onClick={async () => {
                              await switchCompany(comp.id);
                              setIsDropdownOpen(false);
                              setActiveTab('dashboard');
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-teal-950/70 text-white border-l-2 border-teal-400'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="w-4 h-4 mt-0.5 rounded-full flex items-center justify-center shrink-0">
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-teal-400 font-bold" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold truncate text-[11px] text-slate-100">
                                  {comp.name}
                                </span>
                                <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-mono font-semibold tracking-wider shrink-0">
                                  DEMO PROJECT
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {comp.sectorLabel} &bull; {comp.location}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500">
                                <span>{comp.investment}</span>
                                <span>&bull;</span>
                                <span>{comp.workforce} workers</span>
                                <span>&bull;</span>
                                <span className={`px-1 rounded border ${getCpcbBadge(comp.cpcbCategory)}`}>
                                  {comp.cpcbCategory}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-1.5 border-t border-slate-800 space-y-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setActiveTab('onboarding');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-teal-900/60 hover:bg-teal-800/60 text-teal-200 text-xs font-semibold transition-colors cursor-pointer border border-teal-700/50"
                      >
                        <Plus className="w-3.5 h-3.5 text-teal-300" />
                        <span>+ Register New Industrial Project</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Guided Platform Walkthrough Button */}
              <button
                id="toggle-demo-guide-btn"
                onClick={toggleDemoGuide}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isDemoGuideOpen
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                }`}
                title="Guided walkthrough of end-to-end compliance operations"
              >
                <Compass className={`w-3.5 h-3.5 ${isDemoGuideOpen ? 'text-slate-950' : 'text-teal-400'}`} />
                <span>Guided Walkthrough</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full Project Switcher Modal */}
      <ProjectSwitcherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
