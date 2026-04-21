import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useGetDocument, useGetChatHistory, useSendChatMessage, getGetDocumentQueryKey, getGetChatHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Send, User, BrainCircuit, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Chat() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();

  const { data: document, isLoading: docLoading } = useGetDocument(id, {
    query: { enabled: !!id, queryKey: getGetDocumentQueryKey(id) }
  });

  const { data: history, isLoading: historyLoading } = useGetChatHistory(id, {
    query: { enabled: !!id, queryKey: getGetChatHistoryQueryKey(id) }
  });

  const sendMsg = useSendChatMessage();

  // Extract session ID from history if it exists
  const sessionId = history && history.length > 0 ? history[0].sessionId : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, sendMsg.isPending]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || sendMsg.isPending) return;

    const currentMsg = message;
    setMessage("");

    sendMsg.mutate({
      data: {
        documentId: id,
        message: currentMsg,
        sessionId: sessionId
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey(id) });
      },
      onError: () => {
        // Simple rollback mechanism could be implemented here
        setMessage(currentMsg);
      }
    });
  };

  if (docLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-serif font-bold">Document Not Found</h2>
        <Link href="/documents">
          <Button variant="outline">Back to Documents</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/documents/${id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
              LexAI Chat <Badge variant="secondary" className="text-[10px] font-mono tracking-widest ml-2">BETA</Badge>
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <FileText className="w-3 h-3" />
              Discussing: <span className="font-medium text-foreground">{document.title}</span>
            </p>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm shadow-xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {historyLoading ? (
            <div className="space-y-6">
              <div className="flex gap-4 w-[80%]">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="h-20 w-full rounded-2xl rounded-tl-sm" />
              </div>
            </div>
          ) : history && history.length > 0 ? (
            history.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={cn("flex gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isUser ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                  )}>
                    {isUser ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed",
                    isUser 
                      ? "bg-muted text-foreground rounded-tr-sm" 
                      : "bg-primary/10 border border-primary/20 text-foreground font-serif rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-primary" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-serif font-bold text-foreground mb-2">How can I help with this document?</h3>
                <p className="text-sm leading-relaxed">
                  You can ask me to summarize specific sections, explain legal precedents, check for clauses, or analyze potential risks within this document.
                </p>
              </div>
            </div>
          )}

          {sendMsg.isPending && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4 text-primary-foreground animate-pulse" />
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-sm px-5 py-3.5 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-background border-t border-border/40">
          <form onSubmit={handleSend} className="relative flex items-center">
            <Input 
              placeholder="Ask a question about the document..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pr-12 py-6 bg-muted/50 border-border/40 rounded-xl"
              disabled={sendMsg.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-2 w-8 h-8 rounded-lg"
              disabled={!message.trim() || sendMsg.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">LexAI can make mistakes. Verify important legal information.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Keep a small component locally to avoid creating another file
function Badge({ className, variant, children, ...props }: any) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "secondary" ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80" : "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
      className
    )} {...props}>
      {children}
    </div>
  )
}
