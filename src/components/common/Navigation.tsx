import React from 'react';
import { useApp, AppTab } from '../../context/AppContext.js';
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Network,
  FileCheck,
  Clock3,
  AlertTriangle,
  BotMessageSquare,
  UserPlus,
  Award,
  Landmark,
} from 'lucide-react';

interface NavItem {
  id: AppTab;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  badgeVariant?: 'danger' | 'warning' | 'neutral';
}

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, approvals, alerts, documents } = useApp();

  const highAlertsCount = alerts.filter((a) => a.severity === 'high').length;
  const docsPendingScan = documents.filter((d) => d.validationStatus === 'unvalidated' || d.validationStatus === 'mismatch').length;
  const activeQueriesCount = approvals.filter((a) => a.status === 'query_raised').length;

  const navItems: NavItem[] = [
    {
      id: 'onboarding',
      label: 'Onboarding',
      sublabel: 'New Business Form',
      icon: UserPlus,
    },
    {
      id: 'dashboard',
      label: 'Executive Pulse',
      sublabel: 'Readiness & KPIs',
      icon: LayoutDashboard,
    },
    {
      id: 'profile',
      label: 'Project Details',
      sublabel: 'Parameters & CPCB',
      icon: Building2,
    },
    {
      id: 'approvals',
      label: 'Approval Matrix',
      sublabel: 'Rules Knowledge Base',
      icon: CheckSquare,
      badgeCount: approvals.length,
      badgeVariant: 'neutral',
    },
    {
      id: 'dependencies',
      label: 'Approval Roadmap',
      sublabel: 'Dependency Graph',
      icon: Network,
    },
    {
      id: 'documents',
      label: 'Document Hub',
      sublabel: 'AI Pre-validation',
      icon: FileCheck,
      badgeCount: docsPendingScan > 0 ? docsPendingScan : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'tracker',
      label: 'Application Tracker',
      sublabel: 'SLAs & Queries',
      icon: Clock3,
      badgeCount: activeQueriesCount > 0 ? activeQueriesCount : undefined,
      badgeVariant: 'danger',
    },
    {
      id: 'risks',
      label: 'Bottlenecks & Risk',
      sublabel: 'Delay Detection',
      icon: AlertTriangle,
      badgeCount: highAlertsCount > 0 ? highAlertsCount : alerts.length,
      badgeVariant: highAlertsCount > 0 ? 'danger' : 'warning',
    },
    {
      id: 'schemes',
      label: 'Govt Schemes',
      sublabel: 'Support & Subsidies',
      icon: Award,
    },
    {
      id: 'department',
      label: 'Department View',
      sublabel: 'Prototype Analytics',
      icon: Landmark,
    },
    {
      id: 'assistant',
      label: 'AI Copilot',
      sublabel: 'Next Action Advice',
      icon: BotMessageSquare,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[73px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 relative ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-teal-400' : 'text-slate-400'
                  }`}
                />
                <div className="flex flex-col text-left">
                  <span className="font-semibold leading-tight">{item.label}</span>
                  <span
                    className={`text-[10px] hidden md:block leading-none ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {item.sublabel}
                  </span>
                </div>

                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-teal-400 text-slate-950'
                        : item.badgeVariant === 'danger'
                        ? 'bg-rose-100 text-rose-700'
                        : item.badgeVariant === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
