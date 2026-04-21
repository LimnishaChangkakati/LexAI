import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useGetDocument, useAnalyzeDocument, getGetDocumentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, BrainCircuit, ArrowRight, FileText, Clock, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DocumentDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: document, isLoading, error } = useGetDocument(id, {
    query: { enabled: !!id, queryKey: getGetDocumentQueryKey(id) }
  });

  const analyzeDoc = useAnalyzeDocument();

  const handleAnalyze = () => {
    analyzeDoc.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Analysis Complete", description: "Document analysis finished successfully." });
        queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
        // Automatically redirect to analysis results
        setLocation(`/analysis/${id}`);
      },
      onError: () => {
        toast({ title: "Analysis Failed", description: "There was an error analyzing the document.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="w-full h-[600px] rounded-lg" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-serif font-bold">Document not found</h2>
        <p className="text-muted-foreground">The document you are looking for does not exist or has been deleted.</p>
        <Link href="/documents">
          <Button variant="outline">Return to Documents</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "analyzed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1.5 py-1 px-3"><CheckCircle2 className="w-4 h-4" /> Analyzed</Badge>;
      case "analyzing":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1.5 py-1 px-3"><BrainCircuit className="w-4 h-4 animate-pulse" /> Analyzing</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 py-1 px-3"><Clock className="w-4 h-4" /> Pending Analysis</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1.5 py-1 px-3"><AlertTriangle className="w-4 h-4" /> Analysis Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/documents">
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground -ml-3">
                <ChevronLeft className="w-4 h-4" />
                Back to Documents
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold text-foreground">{document.title}</h1>
            {getStatusBadge(document.status)}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="capitalize px-2 py-0.5 rounded bg-muted/50 border border-border/40 font-medium">
              {document.fileType}
            </span>
            <span>Uploaded: {new Date(document.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 mt-4 sm:mt-0">
          {document.status === "analyzed" ? (
            <>
              <Link href={`/chat/${document.id}`}>
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Ask Questions
                </Button>
              </Link>
              <Link href={`/analysis/${document.id}`}>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                  View Results <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </>
          ) : (
            <Button 
              onClick={handleAnalyze} 
              disabled={document.status === "analyzing" || analyzeDoc.isPending}
              className="gap-2 shadow-lg shadow-primary/20 min-w-[160px]"
            >
              {analyzeDoc.isPending ? (
                <>
                  <BrainCircuit className="w-4 h-4 animate-pulse" />
                  Analyzing document...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  Run AI Analysis
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        <Card className="col-span-1 lg:col-span-3 border-border/40 bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/40 py-3 px-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Document Content
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="h-full w-full overflow-auto p-8 custom-scrollbar">
              <div className="prose prose-sm dark:prose-invert max-w-none font-serif leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {document.content}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-border/40 bg-card/50 backdrop-blur-sm flex flex-col h-full overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/40 py-3 px-4">
            <CardTitle className="text-sm font-medium">Status & Metadata</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Analysis State</h4>
              {document.status === "pending" && (
                <div className="rounded-md border border-border/40 p-4 bg-background/50 text-center space-y-3">
                  <BrainCircuit className="w-8 h-8 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Document is ready for AI analysis.</p>
                  <Button size="sm" className="w-full" onClick={handleAnalyze} disabled={analyzeDoc.isPending}>
                    {analyzeDoc.isPending ? "Processing..." : "Start Analysis"}
                  </Button>
                </div>
              )}
              {document.status === "analyzing" && (
                <div className="rounded-md border border-primary/20 p-4 bg-primary/5 text-center space-y-3">
                  <BrainCircuit className="w-8 h-8 mx-auto text-primary animate-pulse" />
                  <p className="text-sm font-medium text-primary">AI is extracting entities and precedents...</p>
                </div>
              )}
              {document.status === "analyzed" && (
                <div className="rounded-md border border-green-500/20 p-4 bg-green-500/5 text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-green-500" />
                  <p className="text-sm font-medium text-green-500">Analysis complete.</p>
                  <Link href={`/analysis/${document.id}`}>
                    <Button size="sm" variant="outline" className="w-full border-green-500/30 text-green-600 hover:bg-green-500/10">
                      View Insights
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Properties</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono">{document.id}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span className="text-muted-foreground">Length</span>
                  <span>{document.content.length.toLocaleString()} chars</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize">{document.fileType}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
