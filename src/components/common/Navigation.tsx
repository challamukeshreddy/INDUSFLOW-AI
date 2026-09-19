import React, { useState, useRef, useEffect } from 'react';
import { useApp, AppTab } from '../../context/AppContext.js';
import {
  LayoutDashboard,
  Building2,
  Network,
  FileCheck,
  Clock3,
  Landmark,
  Award,
  ChevronDown,
  CheckSquare,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';

interface PrimaryNavItem {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  badgeColor?: string;
}

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, approvals, alerts, documents } = useApp();

  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Close "More" dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highAlertsCount = alerts.filter((a) => a.severity === 'high').length;
  const docsWithIssuesCount = documents.filter(
    (d) => d.status === 'NEEDS CORRECTION' || d.status === 'UNDER REVIEW'
  ).length;
  const activeQueriesCount = approvals.filter((a) => a.status === 'query_raised').length;

  // The 7 clean primary navigation items requested by the user:
  // Dashboard, Business Profile, Approval Roadmap, Document Hub, Application Tracker, Department View, Government Schemes
  const primaryNavItems: PrimaryNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'profile',
      label: 'Business Profile',
      icon: Building2,
    },
    {
      id: 'dependencies',
      label: 'Approval Roadmap',
      icon: Network,
    },
    {
      id: 'documents',
      label: 'Document Hub',
      icon: FileCheck,
      badgeCount: docsWithIssuesCount > 0 ? docsWithIssuesCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      id: 'tracker',
      label: 'Application Tracker',
      icon: Clock3,
      badgeCount: activeQueriesCount > 0 ? activeQueriesCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'department',
      label: 'Department View',
      icon: Landmark,
    },
    {
      id: 'schemes',
      label: 'Government Schemes',
      icon: Award,
    },
  ];

  // Secondary preserved views to ensure zero deletion of existing functionality
  const isSecondaryActive =
    activeTab === 'approvals' || activeTab === 'risks' || activeTab === 'onboarding';

  const getSecondaryActiveLabel = () => {
    if (activeTab === 'approvals') return 'Approval Matrix';
    if (activeTab === 'risks') return 'Bottlenecks & Risk';
    if (activeTab === 'onboarding') return 'New Onboarding';
    return 'More Views';
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[77px] z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* 7 Clean Primary Navigation Items */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.badgeCount !== undefined && (
                    <span
                      className={`ml-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                        item.badgeColor ||
                        (isActive
                          ? 'bg-teal-200 text-teal-900 border-teal-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200')
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary Preserved Views (Matrix, Bottlenecks, Onboarding) */}
          <div className="relative shrink-0 ml-2" ref={moreDropdownRef}>
            <button
              id="nav-tab-more"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSecondaryActive
                  ? 'bg-teal-50 text-teal-900 border-teal-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 bg-slate-50/60'
              }`}
              title="Additional views: Approval Matrix, Bottlenecks & Risk, New Onboarding"
            >
              <span>{isSecondaryActive ? getSecondaryActiveLabel() : 'More'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
              {!isSecondaryActive && (highAlertsCount > 0 || approvals.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Preserved Specialized Views
                </div>

                <button
                  onClick={() => {
                    setActiveTab('approvals');
                    setIsMoreOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === 'approvals' ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                    <span>Approval Matrix</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {approvals.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('risks');
                    setIsMoreOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === 'risks' ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Bottlenecks &amp; Risk</span>
                  </div>
                  {highAlertsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                      {highAlertsCount}
                    </span>
                  )}
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    setActiveTab('onboarding');
                    setIsMoreOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'onboarding' ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
                  <span>+ New Business Onboarding</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
