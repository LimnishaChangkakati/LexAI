import { useState } from "react";
import { Link } from "wouter";
import { useListDocuments, useMultiDocumentAnalysis } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, SplitSquareHorizontal, BrainCircuit, ShieldAlert, BookOpen, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MultiAnalysis() {
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  
  const { data: documents, isLoading: docsLoading } = useListDocuments();
  const analyzeMulti = useMultiDocumentAnalysis();

  const handleToggleDoc = (id: number) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    );
  };

  const handleAnalyze = () => {
    if (selectedDocs.length < 2) return;
    
    analyzeMulti.mutate({
      data: { documentIds: selectedDocs }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const analyzedDocs = documents?.filter(d => d.status === 'analyzed') || [];
  const result = analyzeMulti.data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Cross-Reference Analysis</h1>
          <p className="text-muted-foreground mt-1">Compare multiple documents to find contradictions, patterns, and shared precedents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Sidebar */}
        <Card className="col-span-1 border-border/40 bg-card/50 backdrop-blur-sm flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
          <CardHeader className="bg-muted/20 border-b border-border/40 py-4">
            <CardTitle className="text-lg font-serif">Select Documents</CardTitle>
            <CardDescription>Choose at least 2 documents to compare</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {docsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-4 h-4 rounded" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : analyzedDocs.length < 2 ? (
                <div className="text-center text-muted-foreground p-6">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">You need at least 2 analyzed documents to perform cross-referencing.</p>
                  <Link href="/documents">
                    <Button variant="link" className="mt-2 text-primary">Go analyze documents</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {analyzedDocs.map((doc) => (
                    <label key={doc.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border/40 bg-background/50 hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox 
                        checked={selectedDocs.includes(doc.id)} 
                        onCheckedChange={() => handleToggleDoc(doc.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm line-clamp-1">{doc.title}</div>
                        <div className="text-xs text-muted-foreground capitalize mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] py-0">{doc.fileType}</Badge>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t border-border/40 bg-muted/10">
              <Button 
                className="w-full gap-2 shadow-lg shadow-primary/20" 
                disabled={selectedDocs.length < 2 || analyzeMulti.isPending}
                onClick={handleAnalyze}
              >
                {analyzeMulti.isPending ? (
                  <><BrainCircuit className="w-4 h-4 animate-pulse" /> Cross-Referencing...</>
                ) : (
                  <><SplitSquareHorizontal className="w-4 h-4" /> Run Cross-Reference</>
                )}
              </Button>
              {selectedDocs.length > 0 && selectedDocs.length < 2 && (
                <p className="text-xs text-center mt-2 text-muted-foreground">Select {2 - selectedDocs.length} more document(s)</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Area */}
        <div className="col-span-1 lg:col-span-2">
          {!result && !analyzeMulti.isPending ? (
            <Card className="h-full min-h-[500px] border-border/40 bg-card/20 border-dashed flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <SplitSquareHorizontal className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-serif font-medium text-foreground mb-2">Cross-Reference Results</h3>
              <p className="max-w-md">Select documents from the sidebar and run the analysis to find common legal provisions, precedents, and potential contradictions between the texts.</p>
            </Card>
          ) : analyzeMulti.isPending ? (
            <div className="space-y-6">
              <Skeleton className="w-full h-40 rounded-xl" />
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
            </div>
          ) : result && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
              <Card className="border-border/40 bg-card/50 backdrop-blur-sm border-t-4 border-t-primary">
                <CardHeader className="pb-4">
                  <CardTitle className="font-serif">Overall Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-foreground/90 font-serif">{result.overallSummary}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/40 bg-card/50 backdrop-blur-sm h-fit">
                  <CardHeader className="bg-muted/20 border-b border-border/40 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-serif">Cross-References</CardTitle>
                    <SplitSquareHorizontal className="w-5 h-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/40">
                      {result.crossReferences.map((cr, idx) => (
                        <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="capitalize text-xs font-mono tracking-wider">{cr.type.replace('_', ' ')}</Badge>
                            <Badge variant="outline" className={getSeverityColor(cr.severity)}>
                              {cr.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed mb-3">{cr.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {cr.documentIds.map(id => {
                              const doc = documents?.find(d => d.id === id);
                              return (
                                <Badge key={id} variant="secondary" className="text-[10px] font-normal bg-background border-border/50">
                                  {doc ? doc.title : `Doc #${id}`}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {result.crossReferences.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                          No significant cross-references identified.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-card/50 backdrop-blur-sm h-fit">
                  <CardHeader className="bg-muted/20 border-b border-border/40 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-serif">Common Provisions</CardTitle>
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-6">
                    <ul className="space-y-4">
                      {result.commonProvisions.map((prov, idx) => (
                        <li key={idx} className="flex gap-3 items-start">
                          <div className="mt-0.5 w-5 h-5 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <FileText className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm font-medium leading-relaxed">{prov}</span>
                        </li>
                      ))}
                      {result.commonProvisions.length === 0 && (
                        <li className="text-center text-muted-foreground text-sm py-4">
                          No common legal provisions found.
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
