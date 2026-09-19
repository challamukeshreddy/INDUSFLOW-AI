import React from 'react';
import { AppProvider, useApp } from './context/AppContext.js';
import { Header } from './components/common/Header.js';
import { Navigation } from './components/common/Navigation.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { BusinessOnboardingView } from './components/onboarding/BusinessOnboardingView.js';
import { ProfileView } from './components/profile/ProfileView.js';
import { ApprovalListView } from './components/approvals/ApprovalListView.js';
import { DependencyMapView } from './components/dependencies/DependencyMapView.js';
import { DocumentHubView } from './components/documents/DocumentHubView.js';
import { ApplicationTrackerView } from './components/tracker/ApplicationTrackerView.js';
import { BottleneckRadarView } from './components/risks/BottleneckRadarView.js';
import { AssistantView } from './components/assistant/AssistantView.js';
import { GovernmentSchemesView } from './components/schemes/GovernmentSchemesView.js';
import { DepartmentAnalyticsView } from './components/department/DepartmentAnalyticsView.js';
import { ShieldAlert, Sparkles, Building2, HelpCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 text-center max-w-sm w-full space-y-3">
          <div className="w-10 h-10 rounded-full border-3 border-teal-500 border-t-transparent animate-spin mx-auto" />
          <h3 className="font-bold text-sm text-slate-900">Loading INDUSFLOW AI</h3>
          <p className="text-xs text-slate-500">
            Initializing statutory knowledge base and compliance rules...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      <Header />
      <Navigation />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'onboarding' && <BusinessOnboardingView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'approvals' && <ApprovalListView />}
        {activeTab === 'dependencies' && <DependencyMapView />}
        {activeTab === 'documents' && <DocumentHubView />}
        {activeTab === 'tracker' && <ApplicationTrackerView />}
        {activeTab === 'risks' && <BottleneckRadarView />}
        {activeTab === 'schemes' && <GovernmentSchemesView />}
        {activeTab === 'department' && <DepartmentAnalyticsView />}
        {activeTab === 'assistant' && <AssistantView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-800 font-semibold">
              <span>INDUSFLOW AI</span>
              <span>&bull;</span>
              <span className="text-slate-500 font-normal">SIH 2026 Problem Statement SIH26130</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-xl">
              Efficiency in streamlining industrial approvals, compliance processes, and access to government support services.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Demonstration MVP &bull; Not an official government portal</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
