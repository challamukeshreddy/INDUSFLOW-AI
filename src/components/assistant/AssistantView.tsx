import React, { useState, useRef, useEffect } from 'react';
import { useApp, AppTab } from '../../context/AppContext.js';
import {
  Bot,
  Send,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Layers,
  FileQuestion,
  Ban,
  Compass,
  GitPullRequest,
  Award,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, CopilotStructuredResponse } from '../../types/index.js';

const SUPPORTED_QUESTIONS = [
  {
    label: 'What approvals may apply to my project?',
    icon: Layers,
    badge: 'Approvals',
  },
  {
    label: 'Why may this approval apply?',
    icon: HelpCircle,
    badge: 'Legal Basis',
  },
  {
    label: 'What documents are missing?',
    icon: FileQuestion,
    badge: 'Documents',
  },
  {
    label: 'Why is my application blocked?',
    icon: Ban,
    badge: 'Bottlenecks',
  },
  {
    label: 'What should I do next?',
    icon: Compass,
    badge: 'Next Action',
  },
  {
    label: 'Which approvals are blocking my project?',
    icon: GitPullRequest,
    badge: 'Dependencies',
  },
  {
    label: 'What documents have problems?',
    icon: AlertTriangle,
    badge: 'Validation',
  },
  {
    label: 'What deadlines are approaching?',
    icon: Clock,
    badge: 'Deadlines',
  },
  {
    label: 'What support schemes may be relevant?',
    icon: Award,
    badge: 'Schemes',
  },
];

export const AssistantView: React.FC = () => {
  const {
    profile,
    approvals,
    documents,
    alerts,
    chatHistory,
    sendChatMessage,
    setActiveTab,
  } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showContextDetails, setShowContextDetails] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Local fallback messages list if chatHistory is empty
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  // Initial welcome message configured with strict system persona
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setLocalMessages(chatHistory);
    } else {
      const welcome: ChatMessage = {
        id: 'msg_welcome',
        sender: 'assistant',
        text: `Welcome! I am **INDUSFLOW Copilot**, an industrial approval and compliance decision-support assistant. I am actively tracking your project context for **${
          profile?.companyName || 'ABC Foods Manufacturing'
        }** (${profile?.cpcbCategory || 'Orange'} Category, ${profile?.sector || 'Food Processing'} manufacturing).`,
        timestamp: new Date().toISOString(),
        structured: {
          answer: `I am INDUSFLOW Copilot, your context-aware compliance assistant. I evaluate your active clearances, documents, bottlenecks, validation results, and statutory deadlines against the prototype industrial compliance knowledge base.`,
          reason: `Statutory requirements are grounded in the Water & Air Acts, Factories Act 1948, Maharashtra Fire Prevention Act, and Single Window RTS regulations for your project parameters.`,
          relevantRecord: `Profile: ${profile?.companyName || 'Apex BioPharma'} | Investment: ₹${
            profile?.investmentInrCrores || 42
          } Cr | Approvals: ${approvals.length} Tracked`,
          recommendedAction: `Ask any of the 9 supported questions or click a quick prompt below to inspect your application status.`,
          suggestedTab: 'dashboard',
          suggestedActionLabel: 'Explore Dashboard',
        },
      };
      setLocalMessages([welcome]);
    }
  }, [chatHistory, profile, approvals.length]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isSending]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const queryText = text.trim();
    setInputQuery('');
    setIsSending(true);

    const tempUserMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await sendChatMessage(queryText);
      if (result) {
        setLocalMessages((prev) => {
          // Replace or append
          const filtered = prev.filter((m) => m.id !== result.id);
          return [...filtered, result];
        });
      }
    } catch (error) {
      const fallbackMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: "I don't have verified information for this requirement in the current prototype knowledge base.",
        timestamp: new Date().toISOString(),
        structured: {
          answer: "I don't have verified information for this requirement in the current prototype knowledge base.",
          reason: 'The system only provides advice based on the supplied prototype knowledge base and current business context.',
          relevantRecord: 'Prototype Scope Boundary',
          recommendedAction: 'Consult the state single-window portal or liaison department for unmapped legal requirements.',
          isUnavailable: true,
        },
      };
      setLocalMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleNavigate = (tab?: string) => {
    if (tab) {
      setActiveTab(tab as AppTab);
    }
  };

  // Helper to render formatted text with basic Markdown bolding
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      if (!line.trim()) return <div key={lIdx} className="h-1.5" />;
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={lIdx} className="leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  // Count active stats for context indicator
  const queryCount = approvals.filter((a) => a.status === 'query_raised').length;
  const missingDocsCount = documents.filter((d) => d.status === 'NEEDS CORRECTION').length;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">
                  INDUSFLOW Copilot
                </h1>
                <span className="text-[11px] bg-teal-50 text-teal-700 border border-teal-200 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  Context-Aware Gemini AI
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-full">
                  Decision Support
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Industrial approval and compliance decision-support grounded strictly in your project profile and prototype knowledge base.
              </p>
            </div>
          </div>

          {/* Context toggle */}
          <button
            onClick={() => setShowContextDetails((prev) => !prev)}
            className="self-start md:self-auto text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-teal-600" />
            <span>{showContextDetails ? 'Hide Live Context' : 'View Live Context'}</span>
            {showContextDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Live Context Card (Collapsible) */}
        {showContextDetails && (
          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 p-5 rounded-b-2xl">
            <div className="text-xs font-semibold text-slate-800 mb-2 flex items-center justify-between">
              <span>ACTIVE SYSTEM CONTEXT GROUNDING:</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Fed to Gemini AI System Instructions
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Enterprise</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {profile?.companyName || 'Apex BioPharma'}
                </span>
                <span className="text-[10px] text-teal-700 font-medium">
                  {profile?.cpcbCategory || 'Red'} Category • {profile?.sector}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Statutory Scope</span>
                <span className="font-semibold text-slate-800">
                  {approvals.length} Approvals Tracked
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {queryCount} Queries Raised
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Documents & Checks</span>
                <span className="font-semibold text-slate-800">
                  {documents.length} Uploaded Files
                </span>
                <span className="text-[10px] text-amber-700 font-medium block">
                  {missingDocsCount} Issues Flagged
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Bottlenecks & SLA</span>
                <span className="font-semibold text-slate-800">
                  {alerts.length} Active Bottlenecks
                </span>
                <span className="text-[10px] text-red-600 font-medium block">
                  Due: 2026-09-22
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supported Questions Shelf */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Supported Prototype Queries
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Click any question to ask Copilot
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SUPPORTED_QUESTIONS.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.label)}
                disabled={isSending}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-teal-50/60 hover:border-teal-300 hover:text-teal-900 transition-all flex items-start gap-2.5 text-xs group cursor-pointer disabled:opacity-50"
              >
                <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:border-teal-300 group-hover:bg-teal-100/50">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-800 group-hover:text-teal-950 block leading-snug">
                    {q.label}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-teal-700">
                    {q.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[540px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {localMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            const structured = msg.structured;

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl text-xs ${
                    isUser
                      ? 'bg-slate-900 text-white p-4 rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-800 p-4 rounded-tl-none space-y-3'
                  }`}
                >
                  {/* Message header */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold text-slate-500">
                      {isUser ? 'Applicant / Industrial User' : 'INDUSFLOW Copilot'}
                    </span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* If user message: simple text */}
                  {isUser && (
                    <div className="text-xs font-medium leading-relaxed">
                      {msg.text}
                    </div>
                  )}

                  {/* If assistant message with structured response */}
                  {!isUser && structured && (
                    <div className="space-y-3">
                      {/* Section 1: Answer */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-teal-800 tracking-wider uppercase block">
                          ANSWER
                        </span>
                        <div className="text-xs font-medium text-slate-900 leading-relaxed">
                          {renderFormattedMarkdown(structured.answer)}
                        </div>
                      </div>

                      {/* Section 2: Reason */}
                      {structured.reason && (
                        <div className="pt-2 border-t border-slate-200/70 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">
                            REASON
                          </span>
                          <div className="text-xs text-slate-700 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                            {renderFormattedMarkdown(structured.reason)}
                          </div>
                        </div>
                      )}

                      {/* Section 3: Relevant Record */}
                      {structured.relevantRecord && (
                        <div className="pt-2 border-t border-slate-200/70 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">
                            RELEVANT RECORD
                          </span>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-slate-800 font-mono text-[11px]">
                            <span>{structured.relevantRecord}</span>
                          </div>
                        </div>
                      )}

                      {/* Section 4: Recommended Action */}
                      {structured.recommendedAction && (
                        <div className="pt-2.5 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-teal-800 tracking-wider uppercase block">
                              RECOMMENDED ACTION
                            </span>
                            <span className="text-xs font-semibold text-teal-950 block">
                              {structured.recommendedAction}
                            </span>
                          </div>

                          {structured.suggestedTab && (
                            <button
                              onClick={() => handleNavigate(structured.suggestedTab)}
                              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer flex-shrink-0"
                            >
                              <span>{structured.suggestedActionLabel || 'Resolve Now'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Scope disclaimer */}
                      <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Prototype Decision Support</span>
                        <span>Never claims official government validity</span>
                      </div>
                    </div>
                  )}

                  {/* If assistant message without structured object (fallback) */}
                  {!isUser && !structured && (
                    <div className="space-y-2">
                      <div className="text-xs leading-relaxed text-slate-800">
                        {renderFormattedMarkdown(msg.text)}
                      </div>
                      {msg.suggestedActionTab && (
                        <div className="pt-2 border-t border-slate-200 flex justify-end">
                          <button
                            onClick={() => handleNavigate(msg.suggestedActionTab)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-white px-2.5 py-1 rounded-md border border-teal-200 shadow-2xs"
                          >
                            <span>{msg.suggestedActionLabel || 'Navigate'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isSending && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
                <span>
                  INDUSFLOW Copilot is evaluating business parameters, statutory rules, and bottleneck records...
                </span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a question (e.g. 'What approvals may apply?', 'What documents are missing?', 'What should I do next?')..."
              disabled={isSending}
              className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-900"
            />
            <button
              type="submit"
              disabled={isSending || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span>Ask Copilot</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Mandatory Compliance Disclaimers */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
            <span>
              <strong>System rule:</strong> Answers using only supplied prototype knowledge base & business context. Never invents legal requirements.
            </span>
            <span>Non-authoritative decision support</span>
          </div>
        </div>
      </div>
    </div>
  );
};
