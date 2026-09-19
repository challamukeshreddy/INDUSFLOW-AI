import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  ApprovalItem,
  BottleneckAlert,
  UploadedDocument,
} from '../../types/index.js';
import {
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileQuestion,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Landmark,
  Layers,
  FileCheck,
  AlertOctagon,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Calendar,
  Zap,
  Flame,
  Droplets,
  HelpCircle,
  FileWarning,
} from 'lucide-react';

interface DepartmentSummary {
  name: string;
  shortCode: string;
  totalApplications: number;
  pendingCount: number;
  delayedCount: number;
  incompleteCount: number;
  highRiskCount: number;
  avgProcessingDays: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  applications: ApprovalItem[];
}

export const DepartmentAnalyticsView: React.FC = () => {
  const {
    profile,
    approvals,
    alerts,
    documents,
    setActiveTab,
    setSelectedApproval,
  } = useApp();

  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------
  // Map of Documents by Approval Code to evaluate completeness
  // -------------------------------------------------------------
  const docsByApprovalCode = useMemo(() => {
    const map = new Map<string, UploadedDocument[]>();
    documents.forEach((doc) => {
      const list = map.get(doc.approvalCode) || [];
      list.push(doc);
      map.set(doc.approvalCode, list);
    });
    return map;
  }, [documents]);

  // -------------------------------------------------------------
  // Calculate Application Incompleteness & Risk Flags
  // -------------------------------------------------------------
  const enrichedApplications = useMemo(() => {
    return approvals.map((appr) => {
      const appDocs = docsByApprovalCode.get(appr.code) || [];
      const hasMissingMandatory = appr.requiredDocuments?.some((reqDoc) => {
        const docSearchTerm = typeof reqDoc === 'string' ? reqDoc : reqDoc.name || reqDoc.code || '';
        return !appDocs.some((d) =>
          (d.documentName || d.documentTypeCode || '').toLowerCase().includes(docSearchTerm.toLowerCase().slice(0, 5))
        );
      });

      const hasFaultyDoc = appDocs.some(
        (d) =>
          d.status === 'NEEDS CORRECTION' ||
          d.validationStatus === 'mismatch' ||
          (d.issues && d.issues.length > 0)
      );

      const hasQuery = appr.status === 'query_raised';
      const isIncomplete = hasMissingMandatory || hasFaultyDoc || hasQuery;

      const isDelayed =
        appr.isDelayed ||
        appr.daysElapsed > appr.slaDays ||
        (hasQuery && appr.daysElapsed > Math.floor(appr.slaDays * 0.7));

      // Check if associated with high/critical bottleneck
      const highAlert = alerts.find(
        (al) =>
          al.approvalCode === appr.code &&
          (al.severity === 'CRITICAL' ||
            al.severity === 'HIGH' ||
            al.severity === 'critical' ||
            al.severity === 'high')
      );

      const isHighRisk = !!highAlert || (isDelayed && hasQuery);

      return {
        ...appr,
        isIncomplete,
        isDelayed,
        isHighRisk,
        highAlert,
        appDocsCount: appDocs.length,
        requiredDocsCount: appr.requiredDocuments?.length || 3,
      };
    });
  }, [approvals, docsByApprovalCode, alerts]);

  // -------------------------------------------------------------
  // Key Metrics
  // -------------------------------------------------------------
  const metrics = useMemo(() => {
    const total = enrichedApplications.length;
    const pending = enrichedApplications.filter(
      (a) => a.status === 'in_review' || a.status === 'query_raised' || a.status === 'documents_pending'
    ).length;
    const delayed = enrichedApplications.filter((a) => a.isDelayed).length;
    const incomplete = enrichedApplications.filter((a) => a.isIncomplete).length;
    const highRisk = enrichedApplications.filter((a) => a.isHighRisk).length;

    const totalDaysElapsed = enrichedApplications.reduce(
      (acc, a) => acc + (a.daysElapsed || 0),
      0
    );
    const avgProcessingDays = total > 0 ? (totalDaysElapsed / total).toFixed(1) : '0';

    return {
      total,
      pending,
      delayed,
      incomplete,
      highRisk,
      avgProcessingDays,
    };
  }, [enrichedApplications]);

  // -------------------------------------------------------------
  // Department Aggregations
  // -------------------------------------------------------------
  const departmentSummaries = useMemo(() => {
    const deptMap = new Map<string, ApprovalItem[]>();

    enrichedApplications.forEach((appr) => {
      const dept = appr.issuingAuthority || 'General Statutory Authority';
      const list = deptMap.get(dept) || [];
      list.push(appr);
      deptMap.set(dept, list);
    });

    const summaries: DepartmentSummary[] = [];

    deptMap.forEach((apps, deptName) => {
      const total = apps.length;
      const pending = apps.filter(
        (a) => a.status === 'in_review' || a.status === 'query_raised' || a.status === 'documents_pending'
      ).length;
      const delayed = apps.filter((a: any) => a.isDelayed).length;
      const incomplete = apps.filter((a: any) => a.isIncomplete).length;
      const highRisk = apps.filter((a: any) => a.isHighRisk).length;
      const avgDays = Math.round(
        apps.reduce((acc, a) => acc + (a.daysElapsed || 0), 0) / (total || 1)
      );

      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (highRisk > 0 || delayed >= 2) {
        healthStatus = 'critical';
      } else if (delayed > 0 || incomplete > 0) {
        healthStatus = 'warning';
      }

      // Short code heuristic
      let shortCode = 'DEPT';
      if (deptName.includes('Pollution')) shortCode = 'MPCB';
      else if (deptName.includes('Safety') || deptName.includes('Factories')) shortCode = 'DISH';
      else if (deptName.includes('Fire')) shortCode = 'FIRE';
      else if (deptName.includes('Electricity') || deptName.includes('MSEDCL')) shortCode = 'DISCOM';
      else if (deptName.includes('MIDC') || deptName.includes('Land')) shortCode = 'MIDC';
      else if (deptName.includes('Boiler')) shortCode = 'BOILERS';
      else if (deptName.includes('PESO')) shortCode = 'PESO';

      summaries.push({
        name: deptName,
        shortCode,
        totalApplications: total,
        pendingCount: pending,
        delayedCount: delayed,
        incompleteCount: incomplete,
        highRiskCount: highRisk,
        avgProcessingDays: avgDays,
        healthStatus,
        applications: apps,
      });
    });

    return summaries.sort((a, b) => b.delayedCount - a.delayedCount || b.highRiskCount - a.highRiskCount);
  }, [enrichedApplications]);

  // -------------------------------------------------------------
  // Filtered Applications Table
  // -------------------------------------------------------------
  const filteredApplications = useMemo(() => {
    return enrichedApplications.filter((appr) => {
      // Department filter
      if (selectedDepartment !== 'all' && appr.issuingAuthority !== selectedDepartment) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter === 'delayed' && !appr.isDelayed) return false;
      if (selectedStatusFilter === 'incomplete' && !appr.isIncomplete) return false;
      if (selectedStatusFilter === 'highRisk' && !appr.isHighRisk) return false;
      if (
        selectedStatusFilter === 'pending' &&
        appr.status !== 'in_review' &&
        appr.status !== 'query_raised' &&
        appr.status !== 'documents_pending'
      )
        return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          appr.name.toLowerCase().includes(q) ||
          appr.code.toLowerCase().includes(q) ||
          appr.issuingAuthority.toLowerCase().includes(q) ||
          appr.stage.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [enrichedApplications, selectedDepartment, selectedStatusFilter, searchQuery]);

  // Delayed Applications specifically
  const delayedApplications = useMemo(() => {
    return enrichedApplications.filter((a) => a.isDelayed);
  }, [enrichedApplications]);

  // Incomplete Applications specifically
  const incompleteApplications = useMemo(() => {
    return enrichedApplications.filter((a) => a.isIncomplete);
  }, [enrichedApplications]);

  return (
    <div className="space-y-6 pb-16">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header & Prototype Disclaimer */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Landmark className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Department Analytics &amp; Scrutiny View
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
                    Prototype View
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Institutional workflow monitoring, department SLA tracking, inter-agency bottlenecks, and pending scrutiny pipelines.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tracker')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Application Tracker</span>
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Bottleneck Radar</span>
            </button>
          </div>
        </div>

        {/* Mandatory Prototype Analytics Notice */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-900">
                PROTOTYPE ANALYTICS VIEW
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Simulation &amp; Decision-Support
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-700">
              This is a <strong>prototype analytics view</strong> designed to simulate department-side clearance workflows, processing durations, and inter-agency scrutiny.
            </p>
            <p className="text-[12px] font-semibold text-slate-900">
              &bull; <em>This prototype does not represent real government department data or authoritative departmental records.</em>
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Top 6 Primary KPIs */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Total Applications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Total Applications
            </span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-slate-900">{metrics.total}</span>
            <span className="text-[10px] text-slate-400 font-medium">dossiers</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Active clearances</p>
        </div>

        {/* 2. Pending */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
              Pending
            </span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-blue-950">{metrics.pending}</span>
            <span className="text-[10px] text-blue-700 font-medium">under desk review</span>
          </div>
          <p className="text-[10px] text-blue-700 mt-1 truncate">In-progress applications</p>
        </div>

        {/* 3. Delayed */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
              Delayed
            </span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-rose-950">{metrics.delayed}</span>
            <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-1 py-0.5 rounded">
              overdue
            </span>
          </div>
          <p className="text-[10px] text-rose-700 mt-1 truncate">Past SLA limit or query</p>
        </div>

        {/* 4. Incomplete */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              Incomplete
            </span>
            <FileQuestion className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-amber-950">{metrics.incomplete}</span>
            <span className="text-[10px] text-amber-700 font-medium">dossiers</span>
          </div>
          <p className="text-[10px] text-amber-700 mt-1 truncate">Missing files / queries</p>
        </div>

        {/* 5. High Risk */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-purple-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
              High Risk
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-purple-950">{metrics.highRisk}</span>
            <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-1 py-0.5 rounded">
              critical
            </span>
          </div>
          <p className="text-[10px] text-purple-700 mt-1 truncate">Critical path jeopardy</p>
        </div>

        {/* 6. Average Demo Processing Time */}
        <div className="bg-white p-4 rounded-xl border border-teal-200 bg-teal-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-teal-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900">
              Avg Processing
            </span>
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-teal-950">{metrics.avgProcessingDays}</span>
            <span className="text-[10px] text-teal-700 font-medium">Days (demo)</span>
          </div>
          <p className="text-[10px] text-teal-700 mt-1 truncate">vs 45-day statutory SLA</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Delayed Applications by Approval / Department */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Delayed Applications by Approval / Department
              </h2>
              <p className="text-xs text-slate-500">
                Approvals that have exceeded statutory Citizen&apos;s Charter SLA days or are stalled by active department clarification queries.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-rose-100 text-rose-900 border border-rose-300 self-start">
            {delayedApplications.length} Overdue Clearances
          </span>
        </div>

        {delayedApplications.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">No Delayed Applications</p>
            <p className="text-[11px] text-slate-500 mt-0.5">All statutory clearances are currently within their designated SLA periods.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {delayedApplications.map((appr) => {
              const overdueDays = Math.max(0, (appr.daysElapsed || 0) - appr.slaDays);
              const isQuery = appr.status === 'query_raised';

              return (
                <div
                  key={appr.code}
                  className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 hover:bg-rose-50/50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300">
                        {isQuery ? 'Query Raised &bull; Action Required' : `${overdueDays} Days Past SLA`}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {appr.daysElapsed} / {appr.slaDays} SLA Days
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {appr.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-semibold">{appr.issuingAuthority}</span>
                      </div>
                    </div>

                    {/* Delay Cause Box */}
                    <div className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                        Root Bottleneck / Reason for Delay:
                      </span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        {isQuery && appr.queryDetails
                          ? `Department Query: "${appr.queryDetails.queryText}" (Assigned to: ${appr.queryDetails.departmentOfficer || 'Desk Officer'}, Deadline: ${appr.queryDetails.deadlineDate})`
                          : `Application has been pending for ${appr.daysElapsed} days against ${appr.slaDays}-day timeline. Inter-agency site scrutiny or committee sign-off pending.`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Stage: <strong className="text-slate-800">{appr.stage}</strong>
                    </span>

                    <button
                      onClick={() => {
                        setSelectedApproval(appr);
                        setActiveTab('tracker');
                      }}
                      className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Resolve in Tracker</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Department Performance Matrix & Bottleneck Summary */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Breakdown Cards (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Issuing Department Workload &amp; Health
                </h2>
                <p className="text-xs text-slate-500">
                  Performance metrics aggregated across participating statutory authorities.
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono font-medium">
              {departmentSummaries.length} Departments
            </span>
          </div>

          <div className="space-y-3">
            {departmentSummaries.map((dept) => {
              const isSelected = selectedDepartment === dept.name;

              return (
                <div
                  key={dept.name}
                  onClick={() => setSelectedDepartment(isSelected ? 'all' : dept.name)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/30 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-1 rounded font-mono font-bold text-xs bg-slate-200 text-slate-800">
                        {dept.shortCode}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{dept.name}</h3>
                        <span className="text-[11px] text-slate-500">
                          {dept.totalApplications} Active Clearances in Pipeline
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 font-mono block">
                          ~{dept.avgProcessingDays} Days
                        </span>
                        <span className="text-[10px] text-slate-400 block">Avg Scrutiny</span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          dept.healthStatus === 'critical'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : dept.healthStatus === 'warning'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        {dept.healthStatus === 'critical'
                          ? 'Critical Delay'
                          : dept.healthStatus === 'warning'
                          ? 'Attention Needed'
                          : 'Healthy'}
                      </span>
                    </div>
                  </div>

                  {/* Micro stats strip */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total</span>
                      <strong className="font-mono text-slate-800">{dept.totalApplications}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pending</span>
                      <strong className="font-mono text-blue-700">{dept.pendingCount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Delayed</span>
                      <strong className="font-mono text-rose-700">{dept.delayedCount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Incomplete</span>
                      <strong className="font-mono text-amber-700">{dept.incompleteCount}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottleneck Count & Breakdown (1 column on lg) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bottleneck Count
                </h2>
                <p className="text-xs text-slate-500">Active institutional blockers</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  Total Active Bottlenecks
                </span>
                <span className="text-3xl font-black font-mono text-amber-950 mt-1 block">
                  {alerts.length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                !
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                Bottlenecks by Scrutiny Category:
              </span>

              {/* Technical Queries */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-medium text-slate-800">Department Clarification Notices</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {alerts.filter((a) => a.category === 'unresolved_queries').length || 1}
                </span>
              </div>

              {/* Document Inconsistencies */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-medium text-slate-800">Document Discrepancies</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {alerts.filter((a) => a.category === 'document_inconsistencies' || a.category === 'missing_documents').length || 1}
                </span>
              </div>

              {/* Dependency Blocks */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="font-medium text-slate-800">Inter-Agency Dependency Blocks</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {alerts.filter((a) => a.category === 'blocked_dependencies').length || 1}
                </span>
              </div>

              {/* Overdue Deadlines */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-medium text-slate-800">Approaching Statutory Deadlines</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {alerts.filter((a) => a.category === 'upcoming_deadlines' || a.category === 'overdue_applications').length || 1}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('risks')}
            className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>Open Comprehensive Bottleneck Radar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. Incomplete Application Count & Detailed Checklist */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <FileQuestion className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Incomplete Application Count: {incompleteApplications.length} Dossiers
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Applications lacking mandatory technical drawings, pending signatory stamps, or with active queries.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('documents')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer self-start"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Document Hub</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {incompleteApplications.map((appr) => {
            const hasQuery = appr.status === 'query_raised';

            return (
              <div
                key={appr.code}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 hover:bg-amber-50/40 transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-amber-900">{appr.code}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      {hasQuery ? 'Query Pending' : 'Missing Documents'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {appr.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {appr.issuingAuthority}
                  </p>

                  <div className="p-2 rounded bg-white border border-amber-200 text-[11px] text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider">
                      Deficiency Details:
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {hasQuery && appr.queryDetails
                        ? `Department Clarification: "${appr.queryDetails.queryText}"`
                        : `Mandatory attachments required: DPR / Layout / Land Possession agreement.`}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">
                    {appr.appDocsCount} / {appr.requiredDocsCount} files uploaded
                  </span>
                  <button
                    onClick={() => {
                      setSelectedApproval(appr);
                      setActiveTab('documents');
                    }}
                    className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Upload &amp; Fix</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. Risk Overview */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Risk Overview &amp; Scrutiny Severity
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                  Critical Impact Analysis
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Evaluation of potential delays on overall plant commissioning schedule and statutory compliance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
              High: {alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH' || a.severity === 'critical' || a.severity === 'high').length}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Medium: {alerts.filter((a) => a.severity === 'MEDIUM' || a.severity === 'medium').length}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
              Low: {alerts.filter((a) => a.severity === 'LOW' || a.severity === 'low').length}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => {
            const isHigh =
              alert.severity === 'CRITICAL' ||
              alert.severity === 'HIGH' ||
              alert.severity === 'critical' ||
              alert.severity === 'high';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isHigh
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isHigh
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {alert.severity} SEVERITY
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-700">
                      {alert.approvalCode} &bull; {alert.affectedApproval || alert.approvalTitle}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">
                    {alert.issue || alert.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                    {alert.downstreamImpact || alert.description}
                  </p>
                </div>

                <div className="md:w-64 shrink-0 p-3 rounded-lg bg-white border border-slate-200 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                    Recommended Mitigation:
                  </span>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    {alert.recommendedAction || alert.mitigationRecommendation || alert.suggestedAction}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Impact on COD:</span>
                    <span className="font-bold text-rose-700">+{alert.impactOnCommercialDateDays || 14} Days</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
