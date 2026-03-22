import { Tabs, TabList, TabContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const mockIssues = [
  {
    id: "context-overflow-20260321-001",
    type: "Context Window Overflow",
    severity: "CRITICAL",
    category: "critical",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    message: "FailoverError: context too small (4096 < 16000) in lmstudio/nemotron/nemotron-3-nano-4b",
    status: "auto-fixed",
    autoFix: "Model switched from nemotron-3-nano-4b to qwen/qwen3.5-9b fallback",
  },
  {
    id: "orphaned-messages-20260321-002",
    type: "Orphaned Messages",
    severity: "WARNING",
    category: "warning",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    message: "Discord message in #general stuck in pending state for 45 minutes",
    status: "cleared",
    autoFix: "Message cleared from Discord channel, session restarted",
  },
  {
    id: "tool-edit-failure-20260321-003",
    type: "Tool Edit Failure",
    severity: "ERROR",
    category: "error",
    timestamp: new Date(Date.now() - 21600000).toISOString(),
    message: "Failed to edit file C:\\Users\\abuck\\.openclaw\\workspace\\.apps\\mission-control\\components\\ModeScreen.tsx due to context overflow",
    status: "auto-fixed",
    autoFix: "Config reloaded, tool retry successful",
  },
  {
    id: "low-context-warning-20260321-004",
    type: "Low Context Window",
    severity: "WARNING",
    category: "warning",
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    message: "lmstudio/nemotron/nemotron-3-nano-4b approaching context limit (12000/4096 remaining)",
    status: "warning",
    autoFix: "Monitor closely, may require manual model switch if persists",
  },
  {
    id: "gateway-timeout-20260321-005",
    type: "Gateway Timeout",
    severity: "ERROR",
    category: "error",
    timestamp: new Date(Date.now() - 36000000).toISOString(),
    message: "Gateway timed out waiting for response from Claude Haiku API (timeout after 5s)",
    status: "recovered",
    autoFix: "Model switched to local fallback, recovered after 2 min",
  },
];

export default function MaintenancePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Maintenance Issues</h1>
          <p className="text-sm text-muted-foreground mt-1">
            OpenClaw error tracking and auto-remediation
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          System: Standard Mode
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Issues</CardTitle>
          <CardDescription>
            Last 24 hours • {mockIssues.length} issues detected and handled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabList>
              <TabContent value="all" className="text-sm font-medium">
                All Issues ({mockIssues.length})
              </TabContent>
              <TabContent value="critical" className="text-sm font-medium">
                Critical (3)
              </TabContent>
              <TabContent value="error" className="text-sm font-medium">
                Errors (2)
              </TabContent>
              <TabContent value="warning" className="text-sm font-medium">
                Warnings (2)
              </TabContent>
            </TabList>
            
            <div className="space-y-3">
              {mockIssues.map((issue) => (
                <Card key={issue.id} className="border border-slate-700 bg-slate-850/50 hover:bg-slate-850 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={issue.severity === "CRITICAL" ? "destructive" : issue.severity === "ERROR" ? "outline" : "secondary"}>
                            {issue.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            🕐 {new Date(issue.timestamp).toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {issue.type}
                          </span>
                        </div>

                        <p className="text-sm font-mono text-slate-300 bg-slate-950/50 p-2 rounded">
                          {issue.message}
                        </p>

                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant={issue.status === "auto-fixed" || issue.status === "cleared" ? "outline" : "secondary"} className="text-green-400 border-green-500/30 bg-green-500/10">
                            ✅ {issue.status.replace("-", " ").toUpperCase()}
                          </Badge>
                          <Badge variant={issue.severity === "CRITICAL" ? "destructive" : issue.severity === "ERROR" ? "outline" : "secondary"} className="text-blue-400 border-blue-500/30 bg-blue-500/10">
                            {issue.category}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-400">
                          🔧 {issue.autoFix}
                        </p>
                      </div>

                      {issue.status !== "resolved" && (
                        <Button variant="outline" size="sm" className="shrink-0 border-blue-500/30 hover:bg-blue-500/20">
                          Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {mockIssues.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>No issues found in the past 24 hours</p>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-950/30 to-purple-950/30 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-blue-400">Auto-Remediation Status</CardTitle>
          <CardDescription>
            Real-time error detection and automatic recovery actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Context Window Issues</span>
                <Badge variant="outline" className="text-green-400 bg-green-500/10 border-green-500/30">Auto-Fixed: 3/3</Badge>
              </div>
              <p className="text-xs text-slate-400">Nemotron overflow → Fallback to Qwen</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Orphaned Messages</span>
                <Badge variant="outline" className="text-green-400 bg-green-500/10 border-green-500/30">Auto-Fixed: 2/2</Badge>
              </div>
              <p className="text-xs text-slate-400">Discord cleanup + restart</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Tool Edit Failures</span>
                <Badge variant="outline" className="text-green-400 bg-green-500/10 border-green-500/30">Auto-Fixed: 2/2</Badge>
              </div>
              <p className="text-xs text-slate-400">Config reload + retry</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Gateway Timeouts</span>
                <Badge variant="outline" className="text-green-400 bg-green-500/10 border-green-500/30">Auto-Fixed: 1/1</Badge>
              </div>
              <p className="text-xs text-slate-400">Switch to local models</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Discord Reconnects</span>
                <Badge variant="outline" className="text-green-400 bg-green-500/10 border-green-500/30">Auto-Fixed: 0/0</Badge>
              </div>
              <p className="text-xs text-slate-400">Monitor connection health</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Model Timeouts</span>
                <Badge variant="outline" className="text-green-400 bg-green-500/10 border-green-500/30">Auto-Fixed: 0/0</Badge>
              </div>
              <p className="text-xs text-slate-400">Fallback chain active</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-950/30 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              🤖 <strong>Nightly Maintenance:</strong> Runs daily at 5:00 AM EDT, scanning past 24h logs and auto-fixing common issues. Next run: <span className="font-mono">Sunday 05:00</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-850/50 border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="text-2xl font-bold text-green-400">7</div>
            <div className="text-xs text-slate-300">Total Issues Handled</div>
            <div className="text-xs text-green-500/80 mt-1">✅ All Auto-Fixed</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-850/50 border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="text-2xl font-bold text-blue-400">3</div>
            <div className="text-xs text-slate-300">Critical Issues Fixed</div>
            <div className="text-xs text-blue-500/80 mt-1">🔧 Context Overflow</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-850/50 border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="text-2xl font-bold text-purple-400">5</div>
            <div className="text-xs text-slate-300">Fallback Attempts</div>
            <div className="text-xs text-purple-500/80 mt-1">🔄 All Successful</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
