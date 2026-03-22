import { useState, useEffect } from "react";

export interface ModelTokenData {
  modelId: string;
  provider: string;
  tokensUsed: number;
  tokensPerMinute: number;
  totalQuota: number;
  percentageUsed: number;
  cooldownSeconds: number;
  lastRefreshAt: Date;
}

export function useModelTokens() {
  const [tokens, setTokens] = useState<Record<string, ModelTokenData>>({});
  const [loading, setLoading] = useState(true);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch("/api/model-tokens");
        const data = await res.json();
        setTokens(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch token data:", error);
        setLoading(false);
      }
    };

    fetchTokens();
    const interval = setInterval(fetchTokens, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Countdown cooldown timers
  useEffect(() => {
    const timers = Object.entries(tokens).map(([modelId, data]) => {
      if (data.cooldownSeconds > 0) {
        setCooldowns(prev => ({
          ...prev,
          [modelId]: data.cooldownSeconds,
        }));

        const interval = setInterval(() => {
          setCooldowns(prev => ({
            ...prev,
            [modelId]: Math.max(0, (prev[modelId] || 0) - 1),
          }));
        }, 1000);

        return () => clearInterval(interval);
      }
      return () => {};
    });

    return () => timers.forEach(cleanup => cleanup());
  }, [tokens]);

  return { tokens, cooldowns, loading };
}
