import { useState } from "react";
import { Link, useParams } from "wouter";
import { useGetDocument, useGetDocumentAnalysis, getGetDocumentQueryKey, getGetDocumentAnalysisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, BrainCircuit, Scale, Building2, Calendar, FileText, ArrowRight, AlertTriangle, BookOpen, ShieldAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AnalysisResults() {
  const params = useParams();
  const id = parseInt(params.id || "0");

  const { data: document, isLoading: docLoading } = useGetDocument(id, {
    query: { enabled: !!id, queryKey: getGetDocumentQueryKey(id) }
  });

  const { data: analysis, isLoading: analysisLoading, error } = useGetDocumentAnalysis(id, {
    query: { enabled: !!id, queryKey: getGetDocumentAnalysisQueryKey(id) }
  });

  const caseTypeColors: Record<string, string> = {
    criminal: "hsl(var(--chart-2))",
    civil: "hsl(var(--chart-3))",
    constitutional: "hsl(var(--chart-4))",
    family: "hsl(var(--chart-1))",
    commercial: "hsl(var(--chart-5))",
    unknown: "hsl(var(--muted-foreground))"
  };

  const outcomeColors: Record<string, string> = {
    acquittal: "hsl(var(--chart-5))",
    conviction: "hsl(var(--chart-2))",
    appeal_allowed: "hsl(var(--chart-3))",
    settlement: "hsl(var(--chart-1))",
    remanded: "hsl(var(--chart-4))",
    appeal_dismissed: "hsl(var(--muted-foreground))",
    unknown: "hsl(var(--muted-foreground))"
  };

  const getEntityIcon = (type: string) => {
    switch(type) {
      case "JUDGE": return <Scale className="w-3 h-3" />;
      case "COURT": return <Building2 className="w-3 h-3" />;
      case "DATE": return <Calendar className="w-3 h-3" />;
      case "CASE_NUMBER": return <FileText className="w-3 h-3" />;
      default: return <BrainCircuit className="w-3 h-3" />;
    }
  };

  if (docLoading || analysisLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-32 h-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="col-span-1 md:col-span-2 h-[400px]" />
          <Skeleton className="col-span-1 h-[400px]" />
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-serif font-bold">Analysis Not Found</h2>
        <p className="text-muted-foreground">The analysis for this document could not be loaded or hasn't completed yet.</p>
        <Link href={`/documents/${id}`}>
          <Button variant="outline">Back to Document</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Link href={`/documents/${id}`}>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground -ml-3">
                <ChevronLeft className="w-4 h-4" />
                Back to Document
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Analysis Results</h1>
          <p className="text-muted-foreground">
            Insights generated for <span className="font-medium text-foreground">{document?.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 mt-4 sm:mt-0">
          <Link href={`/chat/${id}`}>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <BrainCircuit className="w-4 h-4" />
              Chat with LexAI
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Insights Panel */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/20 border-b border-border/40 py-4">
              <CardTitle className="text-lg font-serif">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="leading-relaxed text-foreground/90 font-serif whitespace-pre-wrap">{analysis.summary}</p>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/20 border-b border-border/40 py-4">
              <CardTitle className="text-lg font-serif">Key Findings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {analysis.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <ArrowRight className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground/90 leading-relaxed">{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/20 border-b border-border/40 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-serif">Applicable Provisions</CardTitle>
                <CardDescription>Extracted sections and acts from the text</CardDescription>
              </div>
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {analysis.legalProvisions.map((prov, idx) => (
                  <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium font-serif">{prov.title}</div>
                      <Badge variant="outline" className="text-xs bg-background">Relevance: {(prov.relevanceScore * 100).toFixed(0)}%</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">{prov.act}</Badge>
                      <span className="font-mono">Sec. {prov.section}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{prov.excerpt}</p>
                  </div>
                ))}
                {analysis.legalProvisions.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No specific legal provisions identified.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Metadata Panel */}
        <div className="col-span-1 space-y-6">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/20 border-b border-border/40 py-4">
              <CardTitle className="text-lg font-serif">Case Classification</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Case Type</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: caseTypeColors[analysis.caseType] || caseTypeColors.unknown }} />
                  <span className="font-medium capitalize">{analysis.caseType.replace('_', ' ')}</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Predicted Outcome</div>
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: outcomeColors[analysis.outcomeClassification] || outcomeColors.unknown,
                    color: outcomeColors[analysis.outcomeClassification] || outcomeColors.unknown,
                    backgroundColor: `${outcomeColors[analysis.outcomeClassification] || outcomeColors.unknown}10`
                  }} 
                  className="uppercase tracking-wider px-3 py-1"
                >
                  {analysis.outcomeClassification.replace('_', ' ')}
                </Badge>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Verdict Confidence</div>
                  <span className="text-sm font-medium">{(analysis.verdictConfidence * 100).toFixed(1)}%</span>
                </div>
                <Progress value={analysis.verdictConfidence * 100} className="h-2" />
              </div>

              {analysis.caseType === 'criminal' && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Bail Classification</div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldAlert className={`w-4 h-4 ${analysis.bailClassification === 'non_bailable' ? 'text-destructive' : 'text-primary'}`} />
                    <span className="capitalize">{analysis.bailClassification.replace('_', '-')}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/20 border-b border-border/40 py-4">
              <CardTitle className="text-lg font-serif">Extracted Entities</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {analysis.entities.map((entity, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5 bg-muted/50 border-border/50">
                        {getEntityIcon(entity.type)}
                        <span className="font-medium text-foreground">{entity.value}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <span className="font-semibold text-muted-foreground uppercase tracking-wider">{entity.type}</span>
                        <div className="mt-1">Confidence: {(entity.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {analysis.entities.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm w-full py-4">
                    No specific entities found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/20 border-b border-border/40 py-4">
              <CardTitle className="text-lg font-serif">Cited Cases</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {analysis.citedCases.map((caseName, idx) => (
                  <div key={idx} className="p-3 text-sm flex items-start gap-2 hover:bg-muted/30 transition-colors">
                    <Scale className="w-3 h-3 mt-1 text-muted-foreground shrink-0" />
                    <span className="font-serif italic text-foreground/90">{caseName}</span>
                  </div>
                ))}
                {analysis.citedCases.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No citations found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
