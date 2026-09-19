import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dataStore } from './server/dataStore.js';
import { filterActiveDependencies, detectBottlenecks, generateNextActions } from './server/rulesEngine.js';
import { preValidateDocumentWithAI, askComplianceAssistant } from './server/geminiService.js';
import { askIndusflowCopilot } from './server/copilotEngine.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // ----------------------------------------------------
  // API Endpoints
  // ----------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'INDUSFLOW AI Backend',
      problemStatement: 'SIH26130',
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Business Profile
  app.get('/api/profile', (req, res) => {
    res.json({ success: true, profile: dataStore.getProfile() });
  });

  app.put('/api/profile', (req, res) => {
    try {
      const updated = dataStore.updateProfile(req.body);
      res.json({ success: true, profile: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Approvals & Knowledge Base evaluation
  app.get('/api/approvals', (req, res) => {
    const approvals = dataStore.getApprovals();
    res.json({ success: true, approvals });
  });

  // Generate Approval Plan action evaluating business profile against prototype rules
  app.post('/api/approvals/generate-plan', (req, res) => {
    try {
      if (req.body && Object.keys(req.body).length > 0) {
        dataStore.updateProfile(req.body);
      }
      const profile = dataStore.getProfile();
      const approvals = dataStore.getApprovals();
      const documents = dataStore.getDocuments();
      const bottlenecks = detectBottlenecks(approvals, profile, documents);
      const nextActions = generateNextActions(approvals, bottlenecks, profile);
      const dependencyEdges = filterActiveDependencies(approvals);

      const criticalCount = approvals.filter((a) => a.isCriticalPath).length;
      const authoritiesSet = new Set(approvals.map((a) => a.authority));
      const totalSlaDays = approvals
        .filter((a) => a.isCriticalPath)
        .reduce((sum, a) => sum + (a.slaDays || 30), 0);

      res.json({
        success: true,
        plan: {
          generatedAt: new Date().toISOString(),
          isPrototype: true,
          disclaimer: 'These are prototype demonstration records and must NOT be presented as legally authoritative.',
          profile,
          approvals,
          totalApprovals: approvals.length,
          criticalPathCount: criticalCount,
          authoritiesCount: authoritiesSet.size,
          authorities: Array.from(authoritiesSet),
          estimatedTimelineDays: totalSlaDays,
          bottlenecks,
          nextActions,
          dependencyEdges,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/approvals/:code', (req, res) => {
    const { code } = req.params;
    const updated = dataStore.updateApproval(code, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: `Approval code ${code} not found` });
    }
    res.json({ success: true, approval: updated });
  });

  // Dependencies Graph
  app.get('/api/dependencies', (req, res) => {
    const approvals = dataStore.getApprovals();
    const edges = filterActiveDependencies(approvals);
    res.json({
      success: true,
      nodes: approvals.map((a) => ({
        id: a.code,
        label: a.title,
        authority: a.issuingAuthority,
        stage: a.stage,
        status: a.status,
        slaDays: a.slaDays,
        daysElapsed: a.daysElapsed,
        isCriticalPath: a.isCriticalPath,
      })),
      edges,
    });
  });

  // Documents & Pre-validation
  app.get('/api/documents', (req, res) => {
    res.json({ success: true, documents: dataStore.getDocuments() });
  });

  app.post('/api/documents/upload', (req, res) => {
    const {
      approvalCode,
      documentTypeCode,
      documentName,
      fileName,
      fileSizeKb,
      status,
      expiryDate,
      issues,
      mockContentSnippet,
      fileDataUrl,
    } = req.body;
    const approvals = dataStore.getApprovals();
    const approval = approvals.find((a) => a.code === approvalCode);

    const newDoc = dataStore.addDocument({
      approvalCode: approvalCode || 'GENERAL',
      approvalTitle: approval?.title || 'General Compliance Dossier',
      documentTypeCode: documentTypeCode || 'GEN_DOC',
      documentName: documentName || 'Uploaded File',
      fileName: fileName || 'document.pdf',
      fileSizeKb: fileSizeKb || 1024,
      status: status || 'UPLOADED',
      expiryDate: expiryDate || null,
      issues: issues || [],
      mockContentSnippet: mockContentSnippet || undefined,
      fileDataUrl: fileDataUrl || undefined,
    });

    res.json({ success: true, document: newDoc });
  });

  app.patch('/api/documents/:id', (req, res) => {
    const { id } = req.params;
    const updated = dataStore.updateDocument(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, document: updated });
  });

  app.post('/api/documents/validate/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const documents = dataStore.getDocuments();
      const doc = documents.find((d) => d.id === id);

      if (!doc) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      const profile = dataStore.getProfile();
      const approvals = dataStore.getApprovals();
      const approval = approvals.find((a) => a.code === doc.approvalCode);

      const result = await preValidateDocumentWithAI({
        profile,
        documentMetadata: {
          id: doc.id,
          name: doc.documentName,
          documentType: doc.documentTypeCode,
          relatedApproval: doc.approvalTitle,
          approvalCode: doc.approvalCode,
          fileName: doc.fileName,
          fileSizeKb: doc.fileSizeKb,
          uploadedAt: doc.uploadedAt,
          expiryDate: doc.expiryDate,
          currentStatus: doc.status,
        },
        extractedContent: req.body.snippet || doc.mockContentSnippet,
        fileDataUrl: req.body.fileDataUrl || doc.fileDataUrl,
        approvalKnowledge: approval,
      });

      const updated = dataStore.updateDocumentValidation(id, result);
      res.json({ success: true, document: updated, validation: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/documents/validate-all', async (req, res) => {
    try {
      const documents = dataStore.getDocuments();
      const profile = dataStore.getProfile();
      const approvals = dataStore.getApprovals();
      const results = [];

      for (const doc of documents) {
        if (doc.status !== 'VERIFIED') {
          const approval = approvals.find((a) => a.code === doc.approvalCode);
          const result = await preValidateDocumentWithAI({
            profile,
            documentMetadata: {
              id: doc.id,
              name: doc.documentName,
              documentType: doc.documentTypeCode,
              relatedApproval: doc.approvalTitle,
              approvalCode: doc.approvalCode,
              fileName: doc.fileName,
              fileSizeKb: doc.fileSizeKb,
              uploadedAt: doc.uploadedAt,
              expiryDate: doc.expiryDate,
              currentStatus: doc.status,
            },
            extractedContent: doc.mockContentSnippet,
            fileDataUrl: doc.fileDataUrl,
            approvalKnowledge: approval,
          });
          const updated = dataStore.updateDocumentValidation(doc.id, result);
          if (updated) results.push(updated);
        }
      }

      res.json({ success: true, documents: dataStore.getDocuments(), count: results.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Bottlenecks & Risks
  app.get('/api/risks', (req, res) => {
    const profile = dataStore.getProfile();
    const approvals = dataStore.getApprovals();
    const documents = dataStore.getDocuments();
    const alerts = detectBottlenecks(approvals, profile, documents);
    res.json({ success: true, alerts });
  });

  // Next Best Actions
  app.get('/api/next-actions', (req, res) => {
    const profile = dataStore.getProfile();
    const approvals = dataStore.getApprovals();
    const documents = dataStore.getDocuments();
    const alerts = detectBottlenecks(approvals, profile, documents);
    const actions = generateNextActions(approvals, alerts, profile, documents);
    res.json({ success: true, actions });
  });

  // AI Compliance Assistant Chat
  app.get('/api/assistant/history', (req, res) => {
    res.json({ success: true, history: dataStore.getChatHistory() });
  });

  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      // Record user message
      dataStore.addChatMessage({
        sender: 'user',
        text: message,
      });

      const profile = dataStore.getProfile();
      const approvals = dataStore.getApprovals();
      const documents = dataStore.getDocuments();
      const alerts = detectBottlenecks(approvals, profile, documents);
      const nextActions = generateNextActions(approvals, alerts, profile, documents);

      const copilotResponse = await askIndusflowCopilot(message, {
        profile,
        approvals,
        documents,
        alerts,
        nextActions,
      });

      const assistantMsg = dataStore.addChatMessage({
        sender: 'assistant',
        text: copilotResponse.answer,
        recommendations: [copilotResponse.recommendedAction],
        relevantApprovals: copilotResponse.relevantRecord ? [copilotResponse.relevantRecord] : [],
        structured: copilotResponse,
        suggestedActionTab: copilotResponse.suggestedTab,
        suggestedActionLabel: copilotResponse.suggestedActionLabel,
      });

      res.json({ success: true, message: assistantMsg, copilotResponse });
    } catch (err: any) {
      console.error('[INDUSFLOW Copilot] Error handling query:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // Vite Integration (Dev vs Prod)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[INDUSFLOW AI] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
