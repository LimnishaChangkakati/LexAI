import { ai } from "@workspace/integrations-gemini-ai";

const IPC_CORPUS: Record<string, { section: string; act: string; title: string; keywords: string[]; excerpt: string }[]> = {
  murder: [
    { section: "302", act: "IPC", title: "Punishment for murder", keywords: ["murder", "killed", "death", "homicide"], excerpt: "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine." },
    { section: "304", act: "IPC", title: "Culpable homicide not amounting to murder", keywords: ["culpable homicide", "manslaughter", "death"], excerpt: "Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life, or imprisonment for ten years." },
  ],
  theft: [
    { section: "378", act: "IPC", title: "Theft", keywords: ["theft", "stolen", "dishonestly", "movable property"], excerpt: "Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, is said to commit theft." },
    { section: "379", act: "IPC", title: "Punishment for theft", keywords: ["theft", "punishment"], excerpt: "Whoever commits theft shall be punished with imprisonment for a term which may extend to three years, or with fine, or with both." },
  ],
  assault: [
    { section: "351", act: "IPC", title: "Assault", keywords: ["assault", "attack", "violence", "force"], excerpt: "Whoever makes any gesture, or any preparation intending or knowing it to be likely that such gesture or preparation will cause any person present to apprehend that he who makes that gesture or preparation is about to use criminal force to that person, is said to commit an assault." },
    { section: "352", act: "IPC", title: "Punishment for assault", keywords: ["assault", "punishment"], excerpt: "Whoever commits assault or criminal force otherwise than on grave and sudden provocation given by the person assaulted or subjected to criminal force, shall be punished with imprisonment for a term which may extend to three months, or with fine." },
  ],
  fraud: [
    { section: "420", act: "IPC", title: "Cheating and dishonestly inducing delivery of property", keywords: ["fraud", "cheating", "dishonest", "deceive", "property"], excerpt: "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, shall be punished with imprisonment for a term which may extend to seven years, and shall also be liable to fine." },
    { section: "415", act: "IPC", title: "Cheating", keywords: ["cheat", "deceive", "fraud", "misrepresentation"], excerpt: "Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, is said to 'cheat'." },
  ],
  rape: [
    { section: "376", act: "IPC", title: "Punishment for rape", keywords: ["rape", "sexual assault", "non-consensual"], excerpt: "Whoever commits rape shall be punished with rigorous imprisonment of either description for a term which shall not be less than ten years but which may extend to imprisonment for life, and shall also be liable to fine." },
    { section: "354", act: "IPC", title: "Assault or criminal force to woman with intent to outrage her modesty", keywords: ["modesty", "woman", "assault", "outrage"], excerpt: "Whoever assaults or uses criminal force to any woman, intending to outrage or knowing it to be likely that he will thereby outrage her modesty, shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both." },
  ],
  corruption: [
    { section: "7", act: "Prevention of Corruption Act", title: "Offences relating to public servant being bribed", keywords: ["bribery", "corruption", "public servant", "gratification"], excerpt: "A public servant who obtains or accepts any valuable thing or pecuniary advantage as a motive for doing or forbearing to do any official act commits an offence under this section." },
    { section: "11", act: "Prevention of Corruption Act", title: "Obtaining valuable thing without consideration", keywords: ["bribe", "gratification", "public servant"], excerpt: "Any public servant who accepts or obtains any valuable thing for themselves in their official capacity without adequate consideration." },
  ],
  defamation: [
    { section: "499", act: "IPC", title: "Defamation", keywords: ["defamation", "libel", "slander", "reputation", "imputation"], excerpt: "Whoever, by words either spoken or intended to be read, or by signs or by visible representations, makes or publishes any imputation concerning any person intending to harm, or knowing or having reason to believe that such imputation will harm, the reputation of such person, is said to defame that person." },
    { section: "500", act: "IPC", title: "Punishment for defamation", keywords: ["defamation", "punishment"], excerpt: "Whoever defames another shall be punished with simple imprisonment for a term which may extend to two years, or with fine, or with both." },
  ],
  contract: [
    { section: "10", act: "Indian Contract Act", title: "What agreements are contracts", keywords: ["contract", "agreement", "consideration", "offer", "acceptance"], excerpt: "All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void." },
    { section: "73", act: "Indian Contract Act", title: "Compensation for loss or damage caused by breach", keywords: ["breach", "contract", "damages", "compensation"], excerpt: "When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken it, compensation for any loss or damage caused to him thereby." },
  ],
};

function retrieveLegalProvisions(content: string): { section: string; act: string; title: string; relevanceScore: number; excerpt: string }[] {
  const contentLower = content.toLowerCase();
  const results: { section: string; act: string; title: string; relevanceScore: number; excerpt: string }[] = [];

  for (const [category, provisions] of Object.entries(IPC_CORPUS)) {
    for (const provision of provisions) {
      let score = 0;
      for (const keyword of provision.keywords) {
        if (contentLower.includes(keyword)) {
          score += 1;
        }
      }
      if (score > 0) {
        results.push({
          section: provision.section,
          act: provision.act,
          title: provision.title,
          relevanceScore: Math.min(score / provision.keywords.length, 1),
          excerpt: provision.excerpt,
        });
      }
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 6);
}

export interface AnalysisOutput {
  summary: string;
  entities: { type: string; value: string; confidence: number }[];
  legalProvisions: { section: string; act: string; title: string; relevanceScore: number; excerpt: string }[];
  outcomeClassification: string;
  bailClassification: string;
  caseType: string;
  verdictConfidence: number;
  keyFindings: string[];
  citedCases: string[];
}

export async function analyzeDocument(content: string, title: string): Promise<AnalysisOutput> {
  const ragProvisions = retrieveLegalProvisions(content);

  const prompt = `You are an expert Indian legal analyst. Analyze the following legal document and provide a structured JSON response.

Document Title: ${title}

Document Content:
${content.slice(0, 8000)}

Relevant Legal Provisions Retrieved (RAG):
${ragProvisions.map((p) => `- Section ${p.section} ${p.act}: ${p.title}`).join("\n")}

Provide your analysis in the following JSON format (respond with ONLY valid JSON, no markdown):
{
  "summary": "A comprehensive 3-4 paragraph summary of the case",
  "entities": [
    {"type": "JUDGE", "value": "name", "confidence": 0.95},
    {"type": "PETITIONER", "value": "name", "confidence": 0.9},
    {"type": "RESPONDENT", "value": "name", "confidence": 0.9},
    {"type": "DATE", "value": "date", "confidence": 0.85},
    {"type": "CASE_NUMBER", "value": "number", "confidence": 0.9},
    {"type": "COURT", "value": "court name", "confidence": 0.95}
  ],
  "outcomeClassification": "one of: acquittal, conviction, appeal_allowed, appeal_dismissed, settlement, remanded, unknown",
  "bailClassification": "one of: bailable, non_bailable, unknown",
  "caseType": "one of: civil, criminal, constitutional, family, commercial, unknown",
  "verdictConfidence": 0.85,
  "keyFindings": ["finding 1", "finding 2", "finding 3", "finding 4", "finding 5"],
  "citedCases": ["Case name 1 vs Case name 2 (Year)", "..."]
}

Rules:
- Extract real entities from the document. If not found, omit that entity type.
- verdictConfidence is a number between 0 and 1
- keyFindings should be 4-6 important legal findings
- citedCases should be cases mentioned in the document
- Be accurate and based on the actual document content`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192 },
  });

  const rawText = response.text ?? "{}";
  const cleanedText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  
  let parsed: Partial<AnalysisOutput> = {};
  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    parsed = {
      summary: rawText.slice(0, 500),
      entities: [],
      outcomeClassification: "unknown",
      bailClassification: "unknown",
      caseType: "unknown",
      verdictConfidence: 0,
      keyFindings: [],
      citedCases: [],
    };
  }

  return {
    summary: parsed.summary ?? "Unable to generate summary.",
    entities: parsed.entities ?? [],
    legalProvisions: ragProvisions,
    outcomeClassification: parsed.outcomeClassification ?? "unknown",
    bailClassification: parsed.bailClassification ?? "unknown",
    caseType: parsed.caseType ?? "unknown",
    verdictConfidence: typeof parsed.verdictConfidence === "number" ? parsed.verdictConfidence : 0,
    keyFindings: parsed.keyFindings ?? [],
    citedCases: parsed.citedCases ?? [],
  };
}

export async function crossReferenceDocuments(documents: { id: number; title: string; content: string; analysis?: AnalysisOutput }[]): Promise<{
  crossReferences: { type: string; description: string; documentIds: number[]; severity: string }[];
  commonProvisions: string[];
  overallSummary: string;
}> {
  const summaries = documents.map((d) => `Document ${d.id} (${d.title}): ${d.content.slice(0, 1000)}`).join("\n\n");

  const prompt = `You are an expert Indian legal analyst. Cross-reference the following legal documents and identify contradictions, patterns, and precedent relationships.

${summaries}

Respond with ONLY valid JSON in this format:
{
  "crossReferences": [
    {
      "type": "contradiction",
      "description": "Document 1 states X while Document 2 states Y",
      "documentIds": [1, 2],
      "severity": "high"
    }
  ],
  "commonProvisions": ["Section 302 IPC", "Section 420 IPC"],
  "overallSummary": "Summary of how these documents relate to each other"
}

Types: contradiction, pattern, precedent, shared_provision
Severity: low, medium, high`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192 },
  });

  const rawText = response.text ?? "{}";
  const cleanedText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleanedText);
  } catch {
    return {
      crossReferences: [],
      commonProvisions: [],
      overallSummary: "Unable to cross-reference documents at this time.",
    };
  }
}

export async function chatWithDocument(
  documentContent: string,
  documentTitle: string,
  analysis: AnalysisOutput | null,
  chatHistory: { role: string; content: string }[],
  userMessage: string
): Promise<string> {
  const systemContext = `You are an expert Indian legal assistant helping analyze the document "${documentTitle}".

Document Content:
${documentContent.slice(0, 4000)}

${analysis ? `
Key Analysis:
- Case Type: ${analysis.caseType}
- Outcome: ${analysis.outcomeClassification}
- Key Findings: ${analysis.keyFindings.join("; ")}
- Relevant Provisions: ${analysis.legalProvisions.map((p) => `Section ${p.section} ${p.act}`).join(", ")}
` : ""}

Answer questions about this legal document with precision and clarity. Reference specific sections of the IPC and other acts when relevant.`;

  const messages = [
    { role: "user" as const, parts: [{ text: systemContext }] },
    { role: "model" as const, parts: [{ text: "I understand. I'm ready to help you analyze this legal document. What would you like to know?" }] },
    ...chatHistory.map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: m.content }],
    })),
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: messages,
    config: { maxOutputTokens: 8192 },
  });

  return response.text ?? "I'm unable to respond at this time. Please try again.";
}
