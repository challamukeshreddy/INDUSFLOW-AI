import React from 'react';
import {
  X,
  Award,
  CheckCircle2,
  ExternalLink,
  Building2,
  ShieldCheck,
  AlertCircle,
  FileText,
  DollarSign,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { MatchedScheme } from './governmentSchemes.js';
import { ApprovalItem } from '../../types/index.js';

interface GovernmentSchemeModalProps {
  scheme: MatchedScheme | null;
  approvals: ApprovalItem[];
  onClose: () => void;
  onNavigateApprovals: () => void;
}

export const GovernmentSchemeModal: React.FC<GovernmentSchemeModalProps> = ({
  scheme,
  approvals,
  onClose,
  onNavigateApprovals,
}) => {
  if (!scheme) return null;

  const approvedCodeSet = new Set(
    approvals.filter((a) => a.status === 'approved').map((a) => a.code)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30 uppercase tracking-wider">
                  {scheme.level} Scheme
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  DEMONSTRATION DATA
                </span>
                <span className="text-xs text-slate-300 font-medium font-mono">
                  {scheme.matchPercentage}% Potential Match
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1 leading-snug">
                {scheme.shortName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Sponsoring Authority & Benefit Box */}
          <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                  Sponsoring Ministry / Department
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {scheme.sponsoringBody}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-600 text-white shadow-2xs">
                {scheme.benefitType}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-teal-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                Estimated Maximum Financial Benefit / Subsidy
              </span>
              <span className="text-base font-bold text-teal-950 mt-0.5 block">
                {scheme.maxBenefit}
              </span>
            </div>
          </div>

          {/* Scheme Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Scheme Overview
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {scheme.description}
            </p>
          </div>

          {/* Key Financial & Statutory Benefits */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <span>Key Policy Incentives & Subsidies</span>
            </h3>
            <div className="space-y-1.5">
              {scheme.keyBenefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Eligibility Conditions</span>
            </h3>
            <div className="space-y-1.5">
              {scheme.eligibilityHighlights.map((cond, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  <span>{cond}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Required Clearances Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Statutory Clearances Required Before Disbursement</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-600">
                {scheme.prerequisitesMetCount} / {scheme.prerequisitesTotalCount} Cleared
              </span>
            </div>

            <div className="space-y-2">
              {scheme.requiredClearances.map((code) => {
                const isCleared = approvedCodeSet.has(code);
                const apprItem = approvals.find((a) => a.code === code);
                return (
                  <div
                    key={code}
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                      isCleared
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50/60 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isCleared ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold block">
                          {apprItem?.name || code}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {apprItem?.issuingAuthority || 'Statutory Department'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCleared
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {isCleared ? 'Cleared' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Demonstration Notice */}
          <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-300 text-[11px] text-amber-950 leading-relaxed space-y-1">
            <span className="font-bold text-amber-900 block uppercase tracking-wider text-[10px]">
              Demonstration Scheme Record
            </span>
            <p className="font-semibold text-amber-900">
              Potentially relevant based on prototype criteria.
            </p>
            <p className="text-amber-800">
              Verify eligibility with the concerned authority. Never state that the company is definitely eligible until formal statutory review.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onNavigateApprovals();
            }}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>View Required Approvals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <a
            href={scheme.officialPortal}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Visit Official Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
