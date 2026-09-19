import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Building2,
  FileText,
  AlertTriangle,
  LayoutDashboard,
  Bot,
  RotateCcw,
} from 'lucide-react';

interface WalkthroughStep {
  number: number;
  title: string;
  badge: string;
  actionText: string;
  description: string;
  targetTab?: string;
  execute: (context: any) => Promise<void> | void;
}

export const HackathonDemoGuide: React.FC = () => {
  const {
    isDemoGuideOpen,
    closeDemoGuide,
    setActiveTab,
    loadDemoCompany,
    generateApprovalPlan,
    preValidateDocument,
    documents,
    openCopilot,
    setSelectedDocument,
  } = useApp();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const steps: WalkthroughStep[] = [
    {
      number: 1,
      title: 'Industrial Enterprise Dossier',
      badge: 'Step 1/10',
      actionText: 'Inspect Enterprise Profile',
      description: 'Review ABC Foods Manufacturing profile (Food Processing, Chakan MIDC Pune, ₹10 Cr Outlay, 75 Workers, Orange Category).',
      targetTab: 'profile',
      execute: (ctx) => {
        ctx.setActiveTab('profile');
      },
    },
    {
      number: 2,
      title: 'Automated Regulatory Rules Engine',
      badge: 'Step 2/10',
      actionText: 'Execute Rules Engine',
      description: 'Evaluate business parameters through the rules engine to determine all applicable Central, State & Local clearances.',
      execute: async (ctx) => {
        await ctx.generateApprovalPlan();
        ctx.setActiveTab('approvals');
      },
    },
    {
      number: 3,
      title: 'Statutory Dependency & Critical Path',
      badge: 'Step 3/10',
      actionText: 'View Approval Roadmap',
      description: 'Analyze the statutory dependency graph (A → B) across Pre-Establishment, Pre-Construction, and Pre-Operation stages.',
      targetTab: 'dependencies',
      execute: (ctx) => {
        ctx.setActiveTab('dependencies');
      },
    },
    {
      number: 4,
      title: 'Compliance Document Repository',
      badge: 'Step 4/10',
      actionText: 'Open Document Hub',
      description: 'Inspect the document vault with verified statutory records, required checklists, and OCR metadata extraction.',
      targetTab: 'documents',
      execute: (ctx) => {
        ctx.setActiveTab('documents');
      },
    },
    {
      number: 5,
      title: 'AI Compliance Pre-Audit',
      badge: 'Step 5/10',
      actionText: 'Run AI Pre-Validation',
      description: 'Execute automated statutory pre-validation on the Water Balance & ETP Scheme document against declared project parameters.',
      execute: async (ctx) => {
        ctx.setActiveTab('documents');
        const etpDoc = ctx.documents.find((d: any) => d.id === 'doc_abc_02') || ctx.documents[1];
        if (etpDoc) {
          await ctx.preValidateDocument(etpDoc.id);
        }
      },
    },
    {
      number: 6,
      title: 'Statutory Discrepancy Detection',
      badge: 'Step 6/10',
      actionText: 'Inspect Audit Report',
      description: 'Review detected compliance risk: 35 KLD fresh water intake mismatch vs 22 KLD wash water before submitting to MPCB.',
      execute: (ctx) => {
        ctx.setActiveTab('documents');
        const etpDoc = ctx.documents.find((d: any) => d.id === 'doc_abc_02') || ctx.documents[1];
        if (etpDoc) {
          ctx.setSelectedDocument(etpDoc);
        }
      },
    },
    {
      number: 7,
      title: 'Executive Approvals Dashboard',
      badge: 'Step 7/10',
      actionText: 'Open Dashboard',
      description: 'Review single-view clearances matrix, pending deadlines, readiness score, and overall compliance posture.',
      targetTab: 'dashboard',
      execute: (ctx) => {
        ctx.setActiveTab('dashboard');
      },
    },
    {
      number: 8,
      title: 'Bottleneck & Query Resolution',
      badge: 'Step 8/10',
      actionText: 'Inspect Critical Roadblock',
      description: 'Review the pending MPCB CTE clarification notice and identify the 2 downstream clearances it is actively blocking.',
      targetTab: 'risks',
      execute: (ctx) => {
        ctx.setActiveTab('risks');
      },
    },
    {
      number: 9,
      title: 'Regulatory Decision Copilot',
      badge: 'Step 9/10',
      actionText: 'Consult AI Copilot',
      description: 'Open the persistent regulatory copilot to receive immediate, context-grounded statutory next steps and drafting guidance.',
      execute: (ctx) => {
        ctx.openCopilot('What should I do next?');
      },
    },
    {
      number: 10,
      title: 'Incentives & Scheme Discovery',
      badge: 'Step 10/10',
      actionText: 'Explore Government Schemes',
      description: 'Discover matched Maharashtra Package Scheme of Incentives (PSI 2019) providing up to 40% capital subsidy on qualifying assets.',
      targetTab: 'schemes',
      execute: (ctx) => {
        ctx.setActiveTab('schemes');
      },
    },
  ];

  if (!isDemoGuideOpen) return null;

  const currentStep = steps[currentStepIndex];

  const handleExecuteStep = async (stepIndex: number) => {
    setIsRunning(true);
    try {
      await steps[stepIndex].execute({
        setActiveTab,
        loadDemoCompany,
        generateApprovalPlan,
        preValidateDocument,
        documents,
        openCopilot,
        setSelectedDocument,
      });
      if (!completedSteps.includes(stepIndex)) {
        setCompletedSteps((prev) => [...prev, stepIndex]);
      }
      if (stepIndex < steps.length - 1) {
        setCurrentStepIndex(stepIndex + 1);
      }
    } catch (err) {
      console.error('Walkthrough step failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      id="platform-walkthrough-bar"
      className="bg-slate-900 border-b border-teal-500/40 text-white shadow-xl relative z-40 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Top bar controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Title & Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-tight text-white">
                  INDUSFLOW Platform Operations Walkthrough
                </span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.2 rounded font-mono">
                  Interactive Guided Tour
                </span>
              </div>
            </div>
          </div>

          {/* Quick Step Indicators */}
          <div className="hidden lg:flex items-center gap-1">
            {steps.map((s, idx) => {
              const isDone = completedSteps.includes(idx);
              const isCurrent = currentStepIndex === idx;
              return (
                <button
                  key={s.number}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-6 h-6 rounded-md text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? 'bg-teal-500 text-slate-950 ring-2 ring-teal-400'
                      : isDone
                      ? 'bg-emerald-800/80 text-emerald-200 border border-emerald-600/50'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={`${s.number}. ${s.title}`}
                >
                  {isDone ? '✓' : s.number}
                </button>
              );
            })}
          </div>

          {/* Controls: Minimize & Close */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
            >
              {isMinimized ? 'Expand' : 'Minimize'}
            </button>
            <button
              onClick={closeDemoGuide}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Walkthrough"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step details & interactive execute row */}
        {!isMinimized && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                {currentStep.number}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    {currentStep.title}
                  </h4>
                  <span className="text-[10px] text-teal-400 font-mono">
                    {currentStep.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                  {currentStep.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous Step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                id="execute-demo-step-btn"
                onClick={() => handleExecuteStep(currentStepIndex)}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg text-xs font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{currentStep.actionText} &rarr;</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
                disabled={currentStepIndex === steps.length - 1}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next Step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setCompletedSteps([]);
                  setCurrentStepIndex(0);
                }}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer ml-1"
                title="Reset Steps"
              >
                <RotateCcw className="w-3.5 h-3.5 inline" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
