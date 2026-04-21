import { useGetDashboardStats, useGetRecentAnalyses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Activity, MessageSquare, Scale, ArrowRight, Upload } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recent, isLoading: recentLoading } = useGetRecentAnalyses();

  const caseTypeColors: Record<string, string> = {
    criminal: "hsl(var(--chart-2))", // red
    civil: "hsl(var(--chart-3))", // blue
    constitutional: "hsl(var(--chart-4))", // purple
    family: "hsl(var(--chart-1))", // amber
    commercial: "hsl(var(--chart-5))", // green
    unknown: "hsl(var(--muted-foreground))"
  };

  const outcomeColors: Record<string, string> = {
    acquittal: "hsl(var(--chart-5))", // green
    conviction: "hsl(var(--chart-2))", // red
    appeal_allowed: "hsl(var(--chart-3))", // blue
    settlement: "hsl(var(--chart-1))", // amber
    remanded: "hsl(var(--chart-4))", // purple
    appeal_dismissed: "hsl(var(--muted-foreground))",
    unknown: "hsl(var(--muted-foreground))"
  };

  const caseTypeData = stats?.caseTypeBreakdown 
    ? Object.entries(stats.caseTypeBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const outcomeData = stats?.outcomeBreakdown
    ? Object.entries(stats.outcomeBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your legal analysis operations.</p>
        </div>
        <Link href="/documents">
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
        </Link>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
              <FileText className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-serif">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground mt-1">Processed in system</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Analyzed</CardTitle>
              <Activity className="w-4 h-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-serif">{stats.analyzedDocuments}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully analyzed</p>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Confidence</CardTitle>
              <Scale className="w-4 h-4 text-chart-5" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-serif">{(stats.avgVerdictConfidence * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Verdict prediction</p>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chat Sessions</CardTitle>
              <MessageSquare className="w-4 h-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-serif">{stats.totalChats}</div>
              <p className="text-xs text-muted-foreground mt-1">Document inquiries</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Case Outcome Distribution</CardTitle>
            <CardDescription>Breakdown of predicted verdicts across analyzed documents</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 h-[300px]">
            {statsLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="w-full h-[250px] ml-6" />
              </div>
            ) : outcomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outcomeData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={outcomeColors[entry.name] || outcomeColors.unknown} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Case Types</CardTitle>
            <CardDescription>Categorization of analyzed documents</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {statsLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="w-48 h-48 rounded-full" />
              </div>
            ) : caseTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseTypeData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {caseTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={caseTypeColors[entry.name] || caseTypeColors.unknown} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border/40 pb-4">
          <div>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription className="mt-1">Latest documents processed by LexAI</CardDescription>
          </div>
          <Link href="/documents">
            <Button variant="outline" size="sm" className="gap-2">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : recent && recent.length > 0 ? (
            <div className="divide-y divide-border/40">
              {recent.map((item) => (
                <Link key={item.documentId} href={`/analysis/${item.documentId}`}>
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mt-1 flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-serif font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{item.documentTitle}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: caseTypeColors[item.caseType] || caseTypeColors.unknown }} />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.caseType.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" style={{ 
                        borderColor: outcomeColors[item.outcomeClassification] || outcomeColors.unknown,
                        color: outcomeColors[item.outcomeClassification] || outcomeColors.unknown,
                        backgroundColor: `${outcomeColors[item.outcomeClassification] || outcomeColors.unknown}10`
                      }} className="uppercase tracking-wider text-[10px]">
                        {item.outcomeClassification.replace('_', ' ')}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity group-hover:translate-x-1 duration-200" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No recent analyses found. Upload a document to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
