import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  BusinessProfile,
  ApprovalItem,
  ApprovalDependencyEdge,
  UploadedDocument,
  BottleneckAlert,
  NextActionStep,
  ChatMessage,
  ApprovalStage,
  SchemeApplicationStatus,
} from '../types/index.js';

export type AppTab =
  | 'onboarding'
  | 'dashboard'
  | 'profile'
  | 'approvals'
  | 'dependencies'
  | 'documents'
  | 'tracker'
  | 'risks'
  | 'schemes'
  | 'department'
  | 'assistant';

export interface GeneratedApprovalPlan {
  generatedAt: string;
  isPrototype: boolean;
  disclaimer: string;
  profile: BusinessProfile;
  approvals: ApprovalItem[];
  totalApprovals: number;
  criticalPathCount: number;
  authoritiesCount: number;
  authorities: string[];
  estimatedTimelineDays: number;
  bottlenecks: BottleneckAlert[];
  nextActions: NextActionStep[];
  dependencyEdges: ApprovalDependencyEdge[];
}

interface AppContextType {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  profile: BusinessProfile | null;
  approvals: ApprovalItem[];
  dependencyEdges: ApprovalDependencyEdge[];
  documents: UploadedDocument[];
  alerts: BottleneckAlert[];
  nextActions: NextActionStep[];
  chatHistory: ChatMessage[];
  loading: boolean;
  isEvaluating: boolean;
  generatedPlan: GeneratedApprovalPlan | null;
  selectedApproval: ApprovalItem | null;
  setSelectedApproval: (approval: ApprovalItem | null) => void;
  selectedDocument: UploadedDocument | null;
  setSelectedDocument: (doc: UploadedDocument | null) => void;
  updateProfile: (updatedFields: Partial<BusinessProfile>) => Promise<void>;
  generateApprovalPlan: (profileUpdates?: Partial<BusinessProfile>) => Promise<GeneratedApprovalPlan | null>;
  updateApprovalStatus: (code: string, updates: Partial<ApprovalItem>) => Promise<void>;
  uploadDocument: (doc: {
    approvalCode: string;
    documentTypeCode: string;
    documentName: string;
    fileName: string;
    fileSizeKb: number;
    mockContentSnippet?: string;
    status?: any;
    expiryDate?: string | null;
    issues?: string[];
  }) => Promise<UploadedDocument | null>;
  updateDocumentStatus: (
    docId: string,
    updates: {
      status?: any;
      issues?: string[];
      expiryDate?: string | null;
      documentName?: string;
    }
  ) => Promise<void>;
  runBatchPreValidation: () => Promise<void>;
  preValidateDocument: (docId: string, snippet?: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<ChatMessage | null>;
  askAssistant: (message: string) => Promise<ChatMessage | null>;
  refreshAllData: () => Promise<void>;
  schemeApplicationStatuses: Record<string, SchemeApplicationStatus>;
  updateSchemeApplicationStatus: (schemeId: string, status: SchemeApplicationStatus) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [dependencyEdges, setDependencyEdges] = useState<ApprovalDependencyEdge[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [alerts, setAlerts] = useState<BottleneckAlert[]>([]);
  const [nextActions, setNextActions] = useState<NextActionStep[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedApprovalPlan | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const [schemeApplicationStatuses, setSchemeApplicationStatuses] = useState<Record<string, SchemeApplicationStatus>>(() => {
    try {
      const saved = localStorage.getItem('indusflow_scheme_statuses');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      demo_scheme_mh_psi: 'preparing_documents',
      demo_scheme_pli_pharma: 'prerequisites_pending',
      demo_scheme_zed_msme: 'ready_for_submission',
    };
  });

  const updateSchemeApplicationStatus = (schemeId: string, status: SchemeApplicationStatus) => {
    setSchemeApplicationStatuses((prev) => {
      const next = { ...prev, [schemeId]: status };
      try {
        localStorage.setItem('indusflow_scheme_statuses', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const refreshAllData = useCallback(async () => {
    try {
      const [profileRes, approvalsRes, depsRes, docsRes, risksRes, actionsRes, chatRes] =
        await Promise.all([
          fetch('/api/profile').then((r) => r.json()),
          fetch('/api/approvals').then((r) => r.json()),
          fetch('/api/dependencies').then((r) => r.json()),
          fetch('/api/documents').then((r) => r.json()),
          fetch('/api/risks').then((r) => r.json()),
          fetch('/api/next-actions').then((r) => r.json()),
          fetch('/api/assistant/history').then((r) => r.json()),
        ]);

      if (profileRes.success) setProfile(profileRes.profile);
      if (approvalsRes.success) setApprovals(approvalsRes.approvals);
      if (depsRes.success) setDependencyEdges(depsRes.edges);
      if (docsRes.success) setDocuments(docsRes.documents);
      if (risksRes.success) setAlerts(risksRes.alerts);
      if (actionsRes.success) setNextActions(actionsRes.actions);
      if (chatRes.success) setChatHistory(chatRes.history);
    } catch (err) {
      console.error('Failed to load INDUSFLOW data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const updateProfile = async (updatedFields: Partial<BusinessProfile>) => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        // Refresh approvals and calculated rules
        await refreshAllData();
      }
    } catch (err) {
      console.error('Failed to update business profile:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const generateApprovalPlan = async (
    profileUpdates?: Partial<BusinessProfile>
  ): Promise<GeneratedApprovalPlan | null> => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/approvals/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileUpdates || {}),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setGeneratedPlan(data.plan);
        if (data.plan.profile) setProfile(data.plan.profile);
        if (data.plan.approvals) setApprovals(data.plan.approvals);
        if (data.plan.bottlenecks) setAlerts(data.plan.bottlenecks);
        if (data.plan.nextActions) setNextActions(data.plan.nextActions);
        if (data.plan.dependencyEdges) setDependencyEdges(data.plan.dependencyEdges);
        return data.plan;
      }
    } catch (err) {
      console.error('Failed to generate approval plan:', err);
    } finally {
      setIsEvaluating(false);
    }
    return null;
  };

  const updateApprovalStatus = async (code: string, updates: Partial<ApprovalItem>) => {
    try {
      const res = await fetch(`/api/approvals/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
      }
    } catch (err) {
      console.error('Failed to update approval:', err);
    }
  };

  const uploadDocument = async (docData: {
    approvalCode: string;
    documentTypeCode: string;
    documentName: string;
    fileName: string;
    fileSizeKb: number;
    status?: any;
    expiryDate?: string | null;
    issues?: string[];
    mockContentSnippet?: string;
    fileDataUrl?: string;
  }): Promise<UploadedDocument | null> => {
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => [data.document, ...prev]);
        return data.document;
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    }
    return null;
  };

  const preValidateDocument = async (docId: string, snippet?: string, fileDataUrl?: string) => {
    try {
      // Mark as validating in local state
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, validationStatus: 'validating' } : d))
      );

      const res = await fetch(`/api/documents/validate/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippet, fileDataUrl }),
      });
      const data = await res.json();
      if (data.success && data.document) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? data.document : d))
        );
        if (selectedDocument?.id === docId) {
          setSelectedDocument(data.document);
        }
      } else {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, validationStatus: d.validationResult ? d.validationResult.status : 'unvalidated' } : d))
        );
      }
    } catch (err) {
      console.error('Failed to pre-validate document:', err);
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, validationStatus: d.validationResult ? d.validationResult.status : 'unvalidated' } : d))
      );
    }
  };

  const updateDocumentStatus = async (
    docId: string,
    updates: {
      status?: any;
      issues?: string[];
      expiryDate?: string | null;
      documentName?: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.document) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, ...data.document } : d))
        );
        if (selectedDocument?.id === docId) {
          setSelectedDocument({ ...selectedDocument, ...data.document });
        }
      }
    } catch (err) {
      console.error('Failed to update document status:', err);
    }
  };

  const runBatchPreValidation = async () => {
    try {
      const res = await fetch('/api/documents/validate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to run batch pre-validation:', err);
    }
  };

  const sendChatMessage = async (message: string): Promise<ChatMessage | null> => {
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setChatHistory((prev) => [...prev, data.message]);
        return data.message;
      }
      return null;
    } catch (err) {
      console.error('Failed to send message to assistant:', err);
      const fallbackMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to communicate with the compliance assistant backend at the moment. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, fallbackMsg]);
      return fallbackMsg;
    }
  };

  const askAssistant = async (message: string): Promise<ChatMessage | null> => {
    return sendChatMessage(message);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        profile,
        approvals,
        dependencyEdges,
        documents,
        alerts,
        nextActions,
        chatHistory,
        loading,
        isEvaluating,
        generatedPlan,
        selectedApproval,
        setSelectedApproval,
        selectedDocument,
        setSelectedDocument,
        updateProfile,
        generateApprovalPlan,
        updateApprovalStatus,
        uploadDocument,
        updateDocumentStatus,
        runBatchPreValidation,
        preValidateDocument,
        sendChatMessage,
        askAssistant,
        refreshAllData,
        schemeApplicationStatuses,
        updateSchemeApplicationStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
