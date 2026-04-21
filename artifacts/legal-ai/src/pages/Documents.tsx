import { useState } from "wouter"; // wait wouter doesn't have useState, use react
import { useState as ReactUseState } from "react";
import { Link, useLocation } from "wouter";
import { useListDocuments, useCreateDocument, useDeleteDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Search, Trash2, Loader2, ArrowRight, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Documents() {
  const [searchTerm, setSearchTerm] = ReactUseState("");
  const [isUploadOpen, setIsUploadOpen] = ReactUseState(false);
  const [title, setTitle] = ReactUseState("");
  const [content, setContent] = ReactUseState("");
  const [fileType, setFileType] = ReactUseState("petition");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: documents, isLoading } = useListDocuments();
  
  const createDoc = useCreateDocument();
  const deleteDoc = useDeleteDocument();

  const filteredDocs = documents?.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.fileType.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleUpload = () => {
    if (!title || !content) {
      toast({ title: "Error", description: "Title and content are required.", variant: "destructive" });
      return;
    }

    createDoc.mutate({
      data: { title, content, fileType }
    }, {
      onSuccess: (newDoc) => {
        toast({ title: "Success", description: "Document uploaded successfully." });
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        setIsUploadOpen(false);
        setTitle("");
        setContent("");
        setLocation(`/documents/${newDoc.id}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to upload document.", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this document?")) return;

    deleteDoc.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Document has been removed." });
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "analyzed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1.5"><CheckCircle2 className="w-3 h-3" /> Analyzed</Badge>;
      case "analyzing":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Analyzing</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5"><Clock className="w-3 h-3" /> Pending</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1.5"><AlertTriangle className="w-3 h-3" /> Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Document Library</h1>
          <p className="text-muted-foreground mt-1">Manage and analyze your legal documents.</p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border-border/40 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Upload Legal Document</DialogTitle>
              <DialogDescription>
                Paste the text of your document below for AI analysis.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g., State vs. Sharma (Bail Application)" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petition">Petition / Plaint</SelectItem>
                    <SelectItem value="affidavit">Affidavit</SelectItem>
                    <SelectItem value="judgment">Judgment / Order</SelectItem>
                    <SelectItem value="contract">Contract / Agreement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Document Content</Label>
                <Textarea 
                  id="content" 
                  placeholder="Paste the full text of the legal document here..." 
                  className="min-h-[250px] font-mono text-sm bg-background/50 resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={createDoc.isPending} className="gap-2">
                {createDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {createDoc.isPending ? "Uploading..." : "Upload & Continue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center gap-4 bg-muted/10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search documents by title or type..." 
              className="pl-9 bg-background/50 border-border/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40">
              <TableHead className="w-[400px]">Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date Uploaded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell><div className="flex items-center gap-3"><Skeleton className="w-8 h-8 rounded" /><Skeleton className="h-4 w-48" /></div></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-muted-foreground/50" />
                    <p>No documents found.</p>
                    {searchTerm && <p className="text-sm">Try adjusting your search query.</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow 
                  key={doc.id} 
                  className="border-border/40 cursor-pointer hover:bg-muted/30 transition-colors group"
                  onClick={() => setLocation(`/documents/${doc.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-medium font-serif line-clamp-1">{doc.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm text-muted-foreground">{doc.fileType}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(doc.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {doc.status === "analyzed" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/analysis/${doc.id}`);
                          }}
                          title="View Analysis"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={(e) => handleDelete(doc.id, e)}
                        disabled={deleteDoc.isPending}
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Upload({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
}
