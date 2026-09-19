import React, { useState, useEffect, useRef } from 'react';
import { useApp, AppTab } from '../../context/AppContext.js';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage } from '../../types/index.js';

interface ParsedCopilotSections {
  answer: string;
  why?: string;
  nextAction?: string;
  sourceNote?: string;
}

function parseCopilotMessageText(text: string): ParsedCopilotSections | null {
  if (!text) return null;

  const hasAnswer = text.includes('ANSWER');
  const hasWhy = text.includes('WHY');
  const hasNextAction = text.includes('NEXT ACTION');

  if (!hasAnswer || !hasWhy || !hasNextAction) {
    return null;
  }

  try {
    let answer = '';
    let why = '';
    let nextAction = '';
    let sourceNote = '';

    const whyIndex = text.indexOf('\nWHY\n');
    const nextActionIndex = text.indexOf('\nNEXT ACTION\n');
    const sourceIndex = text.indexOf('\nSOURCE / NOTE\n');

    if (whyIndex !== -1 && nextActionIndex !== -1) {
      answer = text.substring(text.indexOf('ANSWER\n') + 7, whyIndex).trim();
      why = text.substring(whyIndex + 5, nextActionIndex).trim();

      if (sourceIndex !== -1) {
        nextAction = text.substring(nextActionIndex + 13, sourceIndex).trim();
        sourceNote = text.substring(sourceIndex + 15).trim();
      } else {
        nextAction = text.substring(nextActionIndex + 13).trim();
      }

      return { answer, why, nextAction, sourceNote };
    }
  } catch {
    return null;
  }

  return null;
}

const QUICK_QUESTIONS = [
  'What approvals apply to my project?',
  'What is blocking my project?',
  'Which document is missing?',
  'What should I do next?',
  'What deadlines are approaching?',
  'Which government schemes may be relevant?',
];

export const CopilotSidePanel: React.FC = () => {
  const {
    isCopilotOpen,
    closeCopilot,
    copilotInitialPrompt,
    chatHistory,
    sendChatMessage,
    clearChat,
    profile,
    approvals,
    setActiveTab,
    setSelectedApproval,
  } = useApp();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isCopilotOpen) {
      scrollToBottom();
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isCopilotOpen, chatHistory]);

  // Handle initial prompt passed to openCopilot
  useEffect(() => {
    if (copilotInitialPrompt && isCopilotOpen) {
      setInputMessage(copilotInitialPrompt);
    }
  }, [copilotInitialPrompt, isCopilotOpen]);

  if (!isCopilotOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSubmitting) return;

    setInputMessage('');
    setIsSubmitting(true);
    try {
      await sendChatMessage(text);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearChat = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await clearChat();
    } catch (err) {
      console.error('Failed to clear chat:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionNavigation = (tabName?: string, relevantRecord?: string) => {
    if (!tabName) return;

    const validTabs: AppTab[] = [
      'dashboard',
      'approvals',
      'dependencies',
      'documents',
      'tracker',
      'risks',
      'schemes',
    ];

    if (validTabs.includes(tabName as AppTab)) {
      setActiveTab(tabName as AppTab);

      // If specific clearance is mentioned, select it
      if (relevantRecord) {
        const found = approvals.find(
          (a) =>
            relevantRecord.includes(a.code) ||
            a.name.toLowerCase().includes(relevantRecord.toLowerCase())
        );
        if (found) {
          setSelectedApproval(found);
        }
      }

      closeCopilot();
    }
  };

  return (
    <div
      id="copilot-side-panel-container"
      className="fixed inset-0 z-50 overflow-hidden flex justify-end"
      aria-labelledby="copilot-drawer-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 transition-opacity duration-300"
        onClick={closeCopilot}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col z-10 border-l border-slate-200">
        {/* Fixed Header */}
        <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="copilot-drawer-title" className="text-sm font-bold text-white tracking-tight">
                  INDUSFLOW Copilot
                </h2>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono font-medium">
                  Context Aware
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[11px] text-slate-300 truncate max-w-[190px]">
                  {profile?.companyName || 'ABC Foods Manufacturing'}
                </p>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-semibold tracking-wider shrink-0">
                  DEMO PROJECT
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {chatHistory.length > 0 && (
              <button
                id="clear-copilot-chat-btn"
                onClick={handleClearChat}
                disabled={isClearing || isSubmitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                title="Clear Chat History"
                aria-label="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              id="close-copilot-drawer-btn"
              onClick={closeCopilot}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Assistant"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety & Authority Statement Banner */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-3.5 py-1.5 text-[11px] text-amber-900 flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <p className="leading-tight font-medium">
            AI provides guidance. Government authorities make final decisions.
          </p>
        </div>

        {/* Scrollable Message stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80 min-h-0">
          {chatHistory.length === 0 ? (
            <div className="text-center py-6 px-3">
              <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-2.5 text-teal-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Industrial Compliance Decision Support
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                Ask about statutory clearances, missing drawings, active query notices, or approaching deadlines for <strong>{profile?.companyName || 'your business'}</strong>.
              </p>

              <div className="mt-5 text-left">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                  Frequently Asked Questions
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {QUICK_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      disabled={isSubmitting}
                      className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 text-xs text-slate-800 hover:text-teal-950 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                    >
                      <span className="font-medium leading-snug">{q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            chatHistory.map((msg) => {
              const isAssistant = msg.sender === 'assistant';

              if (!isAssistant) {
                return (
                  <div key={msg.id} className="flex gap-2 items-start justify-end">
                    <div className="p-3 rounded-xl rounded-tr-none text-xs leading-relaxed bg-teal-800 text-white max-w-[85%] shadow-2xs font-medium">
                      {msg.text}
                    </div>
                    <div className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              }

              const parsed = parseCopilotMessageText(msg.text);
              const structured = msg.structured;
              const suggestedTab = structured?.suggestedTab || msg.suggestedActionTab;
              const suggestedLabel = structured?.suggestedActionLabel || msg.suggestedActionLabel;
              const relevantRecord = structured?.relevantRecord || (msg.relevantApprovals && msg.relevantApprovals[0]);

              return (
                <div key={msg.id} className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 rounded-md bg-teal-700 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>

                  <div className="space-y-2 flex-1 max-w-[92%]">
                    {parsed ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 shadow-2xs space-y-3">
                        {/* Section 1: ANSWER */}
                        <div>
                          <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block" />
                            <span>Answer</span>
                          </div>
                          <p className="text-slate-900 font-medium leading-relaxed">
                            {parsed.answer}
                          </p>
                        </div>

                        {/* Section 2: WHY */}
                        {parsed.why && (
                          <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-2.5">
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
                              Why
                            </div>
                            <p className="text-slate-700 text-[11px] leading-relaxed">
                              {parsed.why}
                            </p>
                          </div>
                        )}

                        {/* Section 3: NEXT ACTION */}
                        {parsed.nextAction && (
                          <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-2.5">
                            <div className="text-[10px] font-bold text-teal-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                              <span>Next Action</span>
                              <CheckCircle2 className="w-3 h-3 text-teal-700" />
                            </div>
                            <p className="text-teal-950 font-medium text-[11px] leading-relaxed mb-2">
                              {parsed.nextAction}
                            </p>
                            {suggestedTab && (
                              <button
                                onClick={() => handleActionNavigation(suggestedTab, relevantRecord)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-semibold transition-colors cursor-pointer shadow-2xs"
                              >
                                <span>{suggestedLabel || `Go to ${suggestedTab}`}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Section 4: SOURCE / NOTE */}
                        {parsed.sourceNote && (
                          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 leading-snug">
                            <span className="font-semibold text-slate-600">Note: </span>
                            {parsed.sourceNote}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 shadow-2xs space-y-2">
                        <div className="whitespace-pre-line leading-relaxed font-normal">
                          {msg.text}
                        </div>
                        {suggestedTab && (
                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => handleActionNavigation(suggestedTab, relevantRecord)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              <span>{suggestedLabel || `View ${suggestedTab}`}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isSubmitting && (
            <div className="flex items-center gap-2 text-xs text-teal-800 bg-teal-50/90 p-3 rounded-xl border border-teal-200 max-w-[85%]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700 shrink-0" />
              <span className="font-medium">Reading project dossier and clearance rules...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions Bar */}
        <div className="bg-white border-t border-slate-200 px-3 py-2 shrink-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Quick Questions</span>
            <Sparkles className="w-3 h-3 text-teal-600" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {QUICK_QUESTIONS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={isSubmitting}
                className="text-[11px] bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg px-2.5 py-1 transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 shrink-0 font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Fixed Input at Bottom */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              id="copilot-input-field"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about approvals, documents, deadlines..."
              disabled={isSubmitting}
              className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 disabled:bg-slate-50"
            />
            <button
              id="copilot-send-btn"
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isSubmitting}
              className="bg-teal-700 hover:bg-teal-800 text-white p-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
