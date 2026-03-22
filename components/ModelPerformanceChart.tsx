"use client";

interface ModelUsageHistory {
  modelId: string;
  modelType: "local" | "api";
  tokensUsed: number;
  startTime: Date;
}

// Mock data - in prod, this would come from API
const mockModelUsage: ModelUsageHistory[] = [
  { modelId: "claude-haiku-5.4", modelType: "api", tokensUsed: 125000, startTime: new Date(Date.now() - 3600000) },
  { modelId: "lmstudio/qwen/qwen3.5-9b", modelType: "local", tokensUsed: 85000, startTime: new Date(Date.now() - 3500000) },
  { modelId: "lmstudio/qwen/qwen3-coder-30b", modelType: "local", tokensUsed: 62000, startTime: new Date(Date.now() - 3400000) },
  { modelId: "lmstudio/deepseek/deepseek-r1-0528-qwen3-8b", modelType: "local", tokensUsed: 45000, startTime: new Date(Date.now() - 3300000) },
  { modelId: "lmstudio/qwen/qwen3.5-9b", modelType: "local", tokensUsed: 42000, startTime: new Date(Date.now() - 3200000) },
];

interface ChartPoint {
  time: string;
  models: Record<string, number>;
}

function groupByTime(data: ModelUsageHistory[], intervalMs = 3600000): ChartPoint[] {
  const grouped: Record<string, Record<string, number>> = {};
  
  // Group by hour buckets
  const bucketCount = Math.ceil(data.length / 5);
  for (let i = 0; i < bucketCount; i++) {
    const index = Math.floor(i * 5);
    if (index < data.length) {
      const time = new Date(Math.floor(data[index].startTime.getTime() / intervalMs) * intervalMs);
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      
      if (!grouped[timeStr]) {
        grouped[timeStr] = {};
      }
      
      data[index].modelId.split('/').pop()?.replace(/[.-]/g, '') || modelIdFromName(data[index].modelId);
      if (!grouped[timeStr][data.index]) {
        grouped[timeStr][data.index] = 0;
      }
    }
  }
  
  return Object.entries(grouped).map(([time, models]) => ({ time, models }));
}

function modelIdFromName(id: string): string | null {
  try {
    const name = id.split('/').pop() || '';
    const clean = name.replace(/[.-]/g, '');
    return clean.length > 0 ? clean : null;
  } catch {
    return null;
  }
}

function getColorForModel(modelId: string): string {
  try {
    const clean = modelId.split('/').pop()?.replace(/[.-]/g, '') || '';
    const hash = clean.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const colors = [
      '#22c55e', '#84cc16', '#f59e0b', '#ef4444',
      '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
    ];
    return colors[hash % colors.length];
  } catch {
    return '#eab308';
  }
}

export default function ModelPerformanceChart() {
  const [data, setData] = useState<Record<string, number>>({});
  const [totalTokens, setTotalTokens] = useState(0);

  useEffect(() => {
    // Fetch real data from API or use mock for now
    const fetchData = async () => {
      try {
        const res = await fetch("/api/model-usage");
        const response = await res.json();
        setData(response.currentUsage || {});
      } catch (error) {
        console.error("Failed to fetch model usage:", error);
        
        // Fallback to mock data
        const total = mockModelUsage.reduce((sum, item) => sum + item.tokensUsed, 0);
        setTotalTokens(total);
        
        mockModelUsage.forEach(item => {
          if (!data[item.modelId]) {
            data[item.modelId] = 0;
          }
          setData(prev => ({
            ...prev,
            [item.modelId]: prev[item.modelId] + item.tokensUsed
          }));
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const total = Object.values(data).reduce((sum, val) => sum + val, 0) || totalTokens;

  return (
    <div style={{ padding: "12px 20px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--bg-tertiary)" }}>
      <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "bold", color: "var(--text-primary)" }}>
        Model Performance (Last Hour)
      </h4>

      {/* Stacked Bar Chart */}
      <div style={{ display: "flex", alignItems: "flex-end", height: "60px", gap: "6px", paddingBottom: "12px" }}>
        {Object.entries(data).slice(-3).map(([modelId, tokens]) => {
          const percentage = total > 0 ? (tokens / total) * 100 : 0;
          
          return (
            <div key={modelId} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              {/* Bar */}
              <div style={{
                height: percentage > 0 ? `${percentage}%` : '20%',
                minWidth: '14px',
                maxWidth: '14px',
                background: getColorForModel(modelId),
                borderRadius: '4px',
                opacity: 0.8,
                position: 'relative'
              }}>
                {/* Tooltip */}
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 50,
                  transform: 'translateX(-50%)',
                  background: '#18191b',
                  color: '#fff',
                  fontSize: '9px',
                  padding: '4px 6px',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                  zIndex: 10
                }}>
                  {modelId.split('/').pop()?.replace(/[.-]/g, '') || modelId}: ${percentage.toFixed(1)}%
                </div>
              </div>

              {/* Label */}
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {modelId.split('/').pop()?.replace(/[.-]/g, '') || modelId}
              </div>

              {/* Tokens */}
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                ${(tokens / 1000).toFixed(1)}K
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
        {Object.entries(data).slice(-3).map(([modelId, tokens]) => {
          const percentage = total > 0 ? (tokens / total) * 100 : 0;
          
          return (
            <div key={modelId} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: getColorForModel(modelId),
                borderRadius: '2px',
              }} />
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                {modelId.split('/').pop()?.replace(/[.-]/g, '') || modelId}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
