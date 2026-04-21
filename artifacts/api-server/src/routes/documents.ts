import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, documentsTable, analysisResultsTable, chatMessagesTable } from "@workspace/db";
import {
  ListDocumentsResponse,
  GetDocumentResponse,
  CreateDocumentBody,
  GetDocumentParams,
  DeleteDocumentParams,
  AnalyzeDocumentParams,
  GetDocumentAnalysisResponse,
  GetChatHistoryParams,
  GetChatHistoryResponse,
  SendChatMessageBody,
  SendChatMessageResponse,
  MultiDocumentAnalysisBody,
  MultiDocumentAnalysisResponse,
  GetDashboardStatsResponse,
  GetRecentAnalysesResponse,
} from "@workspace/api-zod";
import { analyzeDocument, chatWithDocument, crossReferenceDocuments, type AnalysisOutput } from "../lib/legal-ai";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const documents = await db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt));
  res.json(ListDocumentsResponse.parse(documents.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }))));
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doc] = await db.insert(documentsTable).values({
    title: parsed.data.title,
    content: parsed.data.content,
    fileType: parsed.data.fileType,
    status: "pending",
  }).returning();

  res.status(201).json(GetDocumentResponse.parse({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }));
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json(GetDocumentResponse.parse({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }));
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db.delete(documentsTable).where(eq(documentsTable.id, params.data.id)).returning();
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/documents/:id/analyze", async (req, res): Promise<void> => {
  const params = AnalyzeDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  await db.update(documentsTable).set({ status: "analyzing" }).where(eq(documentsTable.id, doc.id));

  const analysis = await analyzeDocument(doc.content, doc.title);

  await db.delete(analysisResultsTable).where(eq(analysisResultsTable.documentId, doc.id));

  const [result] = await db.insert(analysisResultsTable).values({
    documentId: doc.id,
    summary: analysis.summary,
    entities: JSON.stringify(analysis.entities),
    legalProvisions: JSON.stringify(analysis.legalProvisions),
    outcomeClassification: analysis.outcomeClassification,
    bailClassification: analysis.bailClassification,
    caseType: analysis.caseType,
    verdictConfidence: analysis.verdictConfidence.toString(),
    keyFindings: JSON.stringify(analysis.keyFindings),
    citedCases: JSON.stringify(analysis.citedCases),
  }).returning();

  await db.update(documentsTable).set({ status: "analyzed" }).where(eq(documentsTable.id, doc.id));

  res.json(GetDocumentAnalysisResponse.parse({
    id: result.id,
    documentId: result.documentId,
    summary: result.summary,
    entities: JSON.parse(result.entities),
    legalProvisions: JSON.parse(result.legalProvisions),
    outcomeClassification: result.outcomeClassification,
    bailClassification: result.bailClassification,
    caseType: result.caseType,
    verdictConfidence: parseFloat(result.verdictConfidence),
    keyFindings: JSON.parse(result.keyFindings),
    citedCases: JSON.parse(result.citedCases),
    createdAt: result.createdAt.toISOString(),
  }));
});

router.get("/documents/:id/analysis", async (req, res): Promise<void> => {
  const params = GetDocumentAnalysisResponse.safeParse ? req.params : req.params;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid document ID" });
    return;
  }

  const [result] = await db.select().from(analysisResultsTable)
    .where(eq(analysisResultsTable.documentId, id))
    .orderBy(desc(analysisResultsTable.createdAt));

  if (!result) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(GetDocumentAnalysisResponse.parse({
    id: result.id,
    documentId: result.documentId,
    summary: result.summary,
    entities: JSON.parse(result.entities),
    legalProvisions: JSON.parse(result.legalProvisions),
    outcomeClassification: result.outcomeClassification,
    bailClassification: result.bailClassification,
    caseType: result.caseType,
    verdictConfidence: parseFloat(result.verdictConfidence),
    keyFindings: JSON.parse(result.keyFindings),
    citedCases: JSON.parse(result.citedCases),
    createdAt: result.createdAt.toISOString(),
  }));
});

router.post("/multi-document-analysis", async (req, res): Promise<void> => {
  const parsed = MultiDocumentAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const docs = await db.select().from(documentsTable)
    .where(sql`${documentsTable.id} = ANY(${parsed.data.documentIds})`);

  const analyses = await db.select().from(analysisResultsTable)
    .where(sql`${analysisResultsTable.documentId} = ANY(${parsed.data.documentIds})`);

  const docsWithAnalysis = docs.map((d) => {
    const a = analyses.find((ar) => ar.documentId === d.id);
    return {
      id: d.id,
      title: d.title,
      content: d.content,
      analysis: a ? {
        summary: a.summary,
        entities: JSON.parse(a.entities),
        legalProvisions: JSON.parse(a.legalProvisions),
        outcomeClassification: a.outcomeClassification,
        bailClassification: a.bailClassification,
        caseType: a.caseType,
        verdictConfidence: parseFloat(a.verdictConfidence),
        keyFindings: JSON.parse(a.keyFindings),
        citedCases: JSON.parse(a.citedCases),
      } as AnalysisOutput : undefined,
    };
  });

  const crossRef = await crossReferenceDocuments(docsWithAnalysis);

  res.json(MultiDocumentAnalysisResponse.parse({
    documentIds: parsed.data.documentIds,
    crossReferences: crossRef.crossReferences,
    commonProvisions: crossRef.commonProvisions,
    overallSummary: crossRef.overallSummary,
    createdAt: new Date().toISOString(),
  }));
});

router.get("/chat/:documentId/history", async (req, res): Promise<void> => {
  const params = GetChatHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.documentId, params.data.documentId))
    .orderBy(chatMessagesTable.createdAt);

  res.json(GetChatHistoryResponse.parse(messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))));
});

router.post("/chat", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, parsed.data.documentId));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const sessionId = parsed.data.sessionId ?? randomUUID();

  const [analysis] = await db.select().from(analysisResultsTable)
    .where(eq(analysisResultsTable.documentId, doc.id))
    .orderBy(desc(analysisResultsTable.createdAt));

  const history = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.documentId, doc.id))
    .orderBy(chatMessagesTable.createdAt);

  await db.insert(chatMessagesTable).values({
    documentId: doc.id,
    role: "user",
    content: parsed.data.message,
    sessionId,
  });

  const analysisOutput: AnalysisOutput | null = analysis ? {
    summary: analysis.summary,
    entities: JSON.parse(analysis.entities),
    legalProvisions: JSON.parse(analysis.legalProvisions),
    outcomeClassification: analysis.outcomeClassification,
    bailClassification: analysis.bailClassification,
    caseType: analysis.caseType,
    verdictConfidence: parseFloat(analysis.verdictConfidence),
    keyFindings: JSON.parse(analysis.keyFindings),
    citedCases: JSON.parse(analysis.citedCases),
  } : null;

  const aiResponse = await chatWithDocument(
    doc.content,
    doc.title,
    analysisOutput,
    history.map((m) => ({ role: m.role, content: m.content })),
    parsed.data.message
  );

  const [savedMessage] = await db.insert(chatMessagesTable).values({
    documentId: doc.id,
    role: "assistant",
    content: aiResponse,
    sessionId,
  }).returning();

  res.json(SendChatMessageResponse.parse({
    id: savedMessage.id,
    documentId: savedMessage.documentId,
    role: savedMessage.role,
    content: savedMessage.content,
    sessionId: savedMessage.sessionId,
    createdAt: savedMessage.createdAt.toISOString(),
  }));
});

router.get("/stats/dashboard", async (_req, res): Promise<void> => {
  const totalDocs = await db.select({ count: sql<number>`count(*)` }).from(documentsTable);
  const analyzedDocs = await db.select({ count: sql<number>`count(*)` }).from(documentsTable)
    .where(eq(documentsTable.status, "analyzed"));
  const totalChats = await db.select({ count: sql<number>`count(*)` }).from(chatMessagesTable);

  const caseTypes = await db.select({
    caseType: analysisResultsTable.caseType,
    count: sql<number>`count(*)`,
  }).from(analysisResultsTable).groupBy(analysisResultsTable.caseType);

  const outcomes = await db.select({
    outcome: analysisResultsTable.outcomeClassification,
    count: sql<number>`count(*)`,
  }).from(analysisResultsTable).groupBy(analysisResultsTable.outcomeClassification);

  const avgConfidence = await db.select({
    avg: sql<number>`avg(cast(verdict_confidence as decimal))`,
  }).from(analysisResultsTable);

  const caseTypeBreakdown: Record<string, number> = {};
  for (const ct of caseTypes) {
    caseTypeBreakdown[ct.caseType] = Number(ct.count);
  }

  const outcomeBreakdown: Record<string, number> = {};
  for (const o of outcomes) {
    outcomeBreakdown[o.outcome] = Number(o.count);
  }

  res.json(GetDashboardStatsResponse.parse({
    totalDocuments: Number(totalDocs[0]?.count ?? 0),
    analyzedDocuments: Number(analyzedDocs[0]?.count ?? 0),
    totalChats: Number(totalChats[0]?.count ?? 0),
    caseTypeBreakdown,
    outcomeBreakdown,
    avgVerdictConfidence: parseFloat((avgConfidence[0]?.avg ?? 0).toString()) || 0,
  }));
});

router.get("/stats/recent-analyses", async (_req, res): Promise<void> => {
  const recent = await db.select({
    documentId: analysisResultsTable.documentId,
    documentTitle: documentsTable.title,
    outcomeClassification: analysisResultsTable.outcomeClassification,
    caseType: analysisResultsTable.caseType,
    createdAt: analysisResultsTable.createdAt,
  })
    .from(analysisResultsTable)
    .innerJoin(documentsTable, eq(analysisResultsTable.documentId, documentsTable.id))
    .orderBy(desc(analysisResultsTable.createdAt))
    .limit(10);

  res.json(GetRecentAnalysesResponse.parse(recent.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))));
});

export default router;
