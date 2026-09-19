import express from 'express';
import path from 'path';
import { dataStore } from './server/dataStore.js';
import { filterActiveDependencies, detectBottlenecks, generateNextActions } from './server/rulesEngine.js';
import { preValidateDocumentWithAI, askComplianceAssistant } from './server/geminiService.js';
import { askIndusflowCopilot, formatCopilotText } from './server/copilotEngine.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Support Vercel serverless rewrite routing & preserve original requested path
  app.use((req, res, next) => {
    if (req.query && typeof req.query.__route === 'string') {
      const targetRoute = req.query.__route;
      delete req.query.__route;
      const queryParams = new URLSearchParams(req.query as Record<string, string>).toString();
      req.url = queryParams ? `${targetRoute}?${queryParams}` : targetRoute;
    } else if (req.url === '/server.ts' || req.url.startsWith('/server.ts?')) {
      const target = (req.headers['x-matched-path'] as string) ||
                     (req.headers['x-forwarded-uri'] as string) ||
                     (req.headers['x-original-url'] as string) ||
                     req.originalUrl;
      if (target && !target.startsWith('/server.ts')) {
        req.url = target;
      }
    }
    next();
  });

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
  // Companies & Multi-Business Presets
  app.get('/api/companies', (req, res) => {
    res.json({
      success: true,
      currentPresetId: dataStore.getCurrentPresetId(),
      companies: dataStore.getPresetList(),
    });
  });

  app.post('/api/profile/switch', (req, res) => {
    const { presetId } = req.body;
    const ok = dataStore.loadPreset(presetId);
    if (!ok) {
      return res.status(404).json({ success: false, error: `Company preset ${presetId} not found` });
    }
    const profile = dataStore.getProfile();
    const approvals = dataStore.getApprovals();
    const documents = dataStore.getDocuments();
    res.json({
      success: true,
      currentPresetId: dataStore.getCurrentPresetId(),
      profile,
      approvals,
      documents,
    });
  });

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

    // File validation: Size limit 10MB (10240 KB)
    if (fileSizeKb && fileSizeKb > 10240) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 10MB limit. Please compress or optimize your document before uploading.',
      });
    }

    // File validation: Allowed extensions
    const cleanFileName = fileName || 'document.pdf';
    const ext = cleanFileName.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    if (ext && !allowedExtensions.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported file format (.${ext}). Only PDF, PNG, and JPG/JPEG files are accepted for statutory compliance dossiers.`,
      });
    }

    const approvals = dataStore.getApprovals();
    const approval = approvals.find((a) => a.code === approvalCode);

    const newDoc = dataStore.addDocument({
      approvalCode: approvalCode || 'GENERAL',
      approvalTitle: approval?.title || 'General Compliance Dossier',
      documentTypeCode: documentTypeCode || 'GEN_DOC',
      documentName: documentName || 'Uploaded File',
      fileName: cleanFileName,
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

  app.post('/api/assistant/clear', (req, res) => {
    dataStore.clearChatHistory();
    res.json({ success: true });
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

      const formattedText = formatCopilotText(copilotResponse);

      const assistantMsg = dataStore.addChatMessage({
        sender: 'assistant',
        text: formattedText,
        recommendations: [copilotResponse.recommendedAction],
        relevantApprovals: copilotResponse.relevantRecord ? [copilotResponse.relevantRecord] : [],
        structured: copilotResponse,
        suggestedActionTab: copilotResponse.suggestedTab,
        suggestedActionLabel: copilotResponse.suggestedActionLabel,
      });

      res.json({ success: true, message: assistantMsg, copilotResponse });
    } catch {
      const fallbackResponse = {
        answer: 'I am tracking your project profile and active statutory clearances. You can review your roadmap, pending document uploads, and bottleneck alerts on the dashboard.',
        reason: 'All recommendations are grounded in statutory regulations and current project parameters.',
        relevantRecord: 'Enterprise Compliance Dossier',
        recommendedAction: 'Review active items on the compliance dashboard.',
        suggestedTab: 'dashboard',
        suggestedActionLabel: 'View Dashboard',
      };
      const assistantMsg = dataStore.addChatMessage({
        sender: 'assistant',
        text: formatCopilotText(fallbackResponse),
        recommendations: [fallbackResponse.recommendedAction],
        relevantApprovals: [],
        structured: fallbackResponse,
        suggestedActionTab: 'dashboard',
        suggestedActionLabel: 'View Dashboard',
      });
      res.json({ success: true, message: assistantMsg, copilotResponse: fallbackResponse });
    }
  });

  // ----------------------------------------------------
  // Vite Integration (Dev vs Prod)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      if (req.path.startsWith('/assets/')) {
        return res.status(404).type('text/plain').send('Asset not found');
      }
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(500).send('Application build files not found.');
        }
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[INDUSFLOW AI] Server listening on http://0.0.0.0:${PORT}`);
  });

  return app;
}

startServer();

export default app;
export { app };
