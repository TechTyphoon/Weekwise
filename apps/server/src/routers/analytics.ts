import { router, publicProcedure } from "../lib/trpc";
import { z } from "zod";

type EntityType = "whale" | "exchange";

const timeframeSchema = z.enum(["5m", "1h", "24h", "7d"]);
type Timeframe = z.infer<typeof timeframeSchema>;

type WalletEntity = {
  id: string;
  address: string;
  label: string;
  type: EntityType;
  chain: string;
  balanceUSD: number;
  tags: string[];
};

type NetworkEvent = {
  id: string;
  from: string;
  to: string;
  amountUSD: number;
  token: string;
  chain: string;
  timestamp: string;
};

type TopTokenStat = {
  symbol: string;
  volumeUSD: number;
  changePercent: number;
  dominantChain: string;
  direction: "inflow" | "outflow";
  uniqueWallets: number;
};

type RollingVolumeWindow = "5m" | "1h" | "24h";

type RollingVolumeStat = {
  window: RollingVolumeWindow;
  totalUSD: number;
  changePercent: number;
};

type ChainSummary = {
  chain: string;
  totalVolumeUSD: number;
  dominantToken: string;
  whaleCount: number;
  exchangeCount: number;
  netFlowUSD: number;
};

type TrendingWallet = {
  id: string;
  label: string;
  chain: string;
  type: EntityType;
  netFlowUSD: number;
  balanceUSD: number;
  activityScore: number;
};

type EnrichedWalletEntity = WalletEntity & {
  netFlowUSD: number;
  activityScore: number;
  lastActive: string;
};

export type NetworkSnapshot = {
  timeframe: Timeframe;
  walletEntities: EnrichedWalletEntity[];
  events: NetworkEvent[];
  analytics: {
    topTokens: TopTokenStat[];
    rollingVolumes: RollingVolumeStat[];
    aiInsight: string;
    trendingWallets: TrendingWallet[];
    chainSummaries: ChainSummary[];
  };
  selectionVolumeUSD: number;
  lastUpdated: string;
};

type WalletBlueprint = WalletEntity & {
  baselineActivityScore: number;
  baselineLastActiveMinutes: number;
};

type EventTemplate = {
  id: string;
  from: string;
  to: string;
  amountUSD: number;
  token: string;
  chain: string;
  offsetMinutes: number;
};

const walletBlueprints: WalletBlueprint[] = [
  {
    id: "whale-1",
    address: "0x8e1f4cA9E1bCd0912Ce55B70b3bF1a1144aF27c1",
    label: "Orca Fund",
    type: "whale",
    chain: "Ethereum",
    balanceUSD: 820_000_000,
    tags: ["defi-native", "lido"],
    baselineActivityScore: 68,
    baselineLastActiveMinutes: 18,
  },
  {
    id: "whale-2",
    address: "H7s1JX3k8dMgLx92VNq1sGfMP9aZ4V7xw",
    label: "Sunbound Whale",
    type: "whale",
    chain: "Solana",
    balanceUSD: 610_000_000,
    tags: ["validator", "liquidity"],
    baselineActivityScore: 62,
    baselineLastActiveMinutes: 42,
  },
  {
    id: "whale-3",
    address: "0x7f3629C6DdB8E4f90B67f09A5C4Ce873BBF79A11",
    label: "LayerZero OG",
    type: "whale",
    chain: "Arbitrum",
    balanceUSD: 455_000_000,
    tags: ["airdrop-hunter", "bridge"],
    baselineActivityScore: 58,
    baselineLastActiveMinutes: 75,
  },
  {
    id: "whale-4",
    address: "0x4BaSeBEE71394cF818193f452a0a3C09Ff3abA77",
    label: "Base Leviathan",
    type: "whale",
    chain: "Base",
    balanceUSD: 380_000_000,
    tags: ["restaking", "stable-arb"],
    baselineActivityScore: 55,
    baselineLastActiveMinutes: 110,
  },
  {
    id: "exchange-1",
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    label: "Binance Hot Wallet 12",
    type: "exchange",
    chain: "Ethereum",
    balanceUSD: 6_100_000_000,
    tags: ["centralized", "market-maker"],
    baselineActivityScore: 72,
    baselineLastActiveMinutes: 3,
  },
  {
    id: "exchange-2",
    address: "37xuFgaFnkX4Ckv1BqB71VQrF7UxHrTtQZ",
    label: "Coinbase Prime Vault",
    type: "exchange",
    chain: "Bitcoin",
    balanceUSD: 9_450_000_000,
    tags: ["institutional", "custody"],
    baselineActivityScore: 64,
    baselineLastActiveMinutes: 58,
  },
  {
    id: "exchange-3",
    address: "8ZsGAkjkq5P3kT9jW4Mm34xR8PL7mqYQKQ",
    label: "OKX Sol Router",
    type: "exchange",
    chain: "Solana",
    balanceUSD: 2_950_000_000,
    tags: ["router", "mm"],
    baselineActivityScore: 66,
    baselineLastActiveMinutes: 21,
  },
];

const eventTemplates: EventTemplate[] = [
  {
    id: "evt-1",
    from: "whale-1",
    to: "exchange-1",
    amountUSD: 8_400_000,
    token: "ETH",
    chain: "Ethereum",
    offsetMinutes: 2,
  },
  {
    id: "evt-2",
    from: "whale-1",
    to: "whale-3",
    amountUSD: 1_150_000,
    token: "ARB",
    chain: "Arbitrum",
    offsetMinutes: 4,
  },
  {
    id: "evt-3",
    from: "exchange-1",
    to: "whale-3",
    amountUSD: 3_200_000,
    token: "USDC",
    chain: "Arbitrum",
    offsetMinutes: 12,
  },
  {
    id: "evt-4",
    from: "whale-2",
    to: "exchange-3",
    amountUSD: 12_500_000,
    token: "SOL",
    chain: "Solana",
    offsetMinutes: 35,
  },
  {
    id: "evt-5",
    from: "exchange-3",
    to: "whale-4",
    amountUSD: 5_600_000,
    token: "USDT",
    chain: "Base",
    offsetMinutes: 120,
  },
  {
    id: "evt-6",
    from: "whale-4",
    to: "exchange-2",
    amountUSD: 4_700_000,
    token: "USDC",
    chain: "Base",
    offsetMinutes: 360,
  },
  {
    id: "evt-7",
    from: "whale-3",
    to: "exchange-2",
    amountUSD: 3_900_000,
    token: "ARB",
    chain: "Arbitrum",
    offsetMinutes: 26 * 60,
  },
  {
    id: "evt-8",
    from: "exchange-2",
    to: "whale-1",
    amountUSD: 6_800_000,
    token: "BTC",
    chain: "Bitcoin",
    offsetMinutes: 6 * 24 * 60,
  },
  {
    id: "evt-9",
    from: "whale-2",
    to: "exchange-1",
    amountUSD: 4_900_000,
    token: "USDT",
    chain: "Solana",
    offsetMinutes: 18,
  },
  {
    id: "evt-10",
    from: "exchange-1",
    to: "exchange-2",
    amountUSD: 7_200_000,
    token: "ETH",
    chain: "Ethereum",
    offsetMinutes: 4 * 24 * 60,
  },
];

const timeframeDurations: Record<Timeframe, number> = {
  "5m": 5 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

const rollingWindows: ReadonlyArray<{ window: RollingVolumeWindow; duration: number }> = [
  { window: "5m", duration: timeframeDurations["5m"] },
  { window: "1h", duration: timeframeDurations["1h"] },
  { window: "24h", duration: timeframeDurations["24h"] },
];

const timeframeLabels: Record<Timeframe, string> = {
  "5m": "5 minutes",
  "1h": "1 hour",
  "24h": "24 hours",
  "7d": "7 days",
};

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const buildEvents = (now: number): NetworkEvent[] =>
  eventTemplates.map((template) => ({
    id: template.id,
    from: template.from,
    to: template.to,
    amountUSD: template.amountUSD,
    token: template.token,
    chain: template.chain,
    timestamp: new Date(now - template.offsetMinutes * 60_000).toISOString(),
  }));

const aggregateTokenStats = (
  events: NetworkEvent[],
  walletTypeMap: Map<string, EntityType>,
) => {
  return events.reduce(
    (acc, event) => {
      const next = acc.get(event.token) ?? {
        volume: 0,
        chains: new Map<string, number>(),
        walletIds: new Set<string>(),
        netFlow: 0,
      };

      next.volume += event.amountUSD;
      next.walletIds.add(event.from);
      next.walletIds.add(event.to);
      next.chains.set(event.chain, (next.chains.get(event.chain) ?? 0) + event.amountUSD);

      const fromType = walletTypeMap.get(event.from);
      const toType = walletTypeMap.get(event.to);

      if (toType === "exchange" && fromType === "whale") {
        next.netFlow += event.amountUSD;
      } else if (fromType === "exchange" && toType === "whale") {
        next.netFlow -= event.amountUSD;
      }

      acc.set(event.token, next);
      return acc;
    },
    new Map<
      string,
      {
        volume: number;
        chains: Map<string, number>;
        walletIds: Set<string>;
        netFlow: number;
      }
    >(),
  );
};

const computeSnapshot = (timeframe: Timeframe): NetworkSnapshot => {
  const now = Date.now();
  const allEvents = buildEvents(now).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const duration = timeframeDurations[timeframe];

  const filteredEvents = allEvents.filter(
    (event) => now - new Date(event.timestamp).getTime() <= duration,
  );

  const prevWindowEvents = allEvents.filter((event) => {
    const diff = now - new Date(event.timestamp).getTime();
    return diff > duration && diff <= duration * 2;
  });

  const walletTypeMap = new Map<string, EntityType>(
    walletBlueprints.map((wallet) => [wallet.id, wallet.type]),
  );

  const netFlowMap = new Map<string, number>();
  const activityCounts = new Map<string, number>();
  const lastActiveMap = new Map<string, number>();

  filteredEvents.forEach((event) => {
    const eventTimestamp = new Date(event.timestamp).getTime();
    netFlowMap.set(event.from, (netFlowMap.get(event.from) ?? 0) - event.amountUSD);
    netFlowMap.set(event.to, (netFlowMap.get(event.to) ?? 0) + event.amountUSD);
    activityCounts.set(event.from, (activityCounts.get(event.from) ?? 0) + 1);
    activityCounts.set(event.to, (activityCounts.get(event.to) ?? 0) + 1);
    lastActiveMap.set(
      event.from,
      Math.max(lastActiveMap.get(event.from) ?? 0, eventTimestamp),
    );
    lastActiveMap.set(
      event.to,
      Math.max(lastActiveMap.get(event.to) ?? 0, eventTimestamp),
    );
  });

  const enrichedWallets: EnrichedWalletEntity[] = walletBlueprints.map((wallet) => {
    const netFlow = netFlowMap.get(wallet.id) ?? 0;
    const activityBoost = (activityCounts.get(wallet.id) ?? 0) * 9;
    const activityScore = Math.min(100, Math.round(wallet.baselineActivityScore + activityBoost));
    const fallbackLastActive = now - wallet.baselineLastActiveMinutes * 60_000;
    const lastActiveEpoch = lastActiveMap.get(wallet.id) ?? fallbackLastActive;

    return {
      id: wallet.id,
      address: wallet.address,
      label: wallet.label,
      type: wallet.type,
      chain: wallet.chain,
      balanceUSD: wallet.balanceUSD,
      tags: wallet.tags,
      netFlowUSD: Number(netFlow.toFixed(2)),
      activityScore,
      lastActive: new Date(lastActiveEpoch).toISOString(),
    };
  });

  const tokenStatsCurrent = aggregateTokenStats(filteredEvents, walletTypeMap);
  const tokenStatsPrevious = aggregateTokenStats(prevWindowEvents, walletTypeMap);

  const topTokens: TopTokenStat[] = Array.from(tokenStatsCurrent.entries())
    .map(([symbol, stats]) => {
      const previousVolume = tokenStatsPrevious.get(symbol)?.volume ?? 0;
      const changePercent = previousVolume === 0
        ? 100
        : ((stats.volume - previousVolume) / previousVolume) * 100;
      const dominantChainEntry = Array.from(stats.chains.entries()).sort((a, b) => b[1] - a[1])[0];

      return {
        symbol,
        volumeUSD: Number(stats.volume.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        dominantChain: dominantChainEntry?.[0] ?? "Multi-chain",
        direction: stats.netFlow >= 0 ? "inflow" : "outflow",
        uniqueWallets: stats.walletIds.size,
      };
    })
    .sort((a, b) => b.volumeUSD - a.volumeUSD)
    .slice(0, 5);

  const rollingVolumes: RollingVolumeStat[] = rollingWindows.map(({ window, duration: windowDuration }) => {
    const total = allEvents
      .filter((event) => now - new Date(event.timestamp).getTime() <= windowDuration)
      .reduce((sum, event) => sum + event.amountUSD, 0);

    const prevTotal = allEvents
      .filter((event) => {
        const diff = now - new Date(event.timestamp).getTime();
        return diff > windowDuration && diff <= windowDuration * 2;
      })
      .reduce((sum, event) => sum + event.amountUSD, 0);

    const changePercent = prevTotal === 0
      ? 100
      : ((total - prevTotal) / prevTotal) * 100;

    return {
      window,
      totalUSD: Number(total.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
    };
  });

  const chainStats = filteredEvents.reduce(
    (acc, event) => {
      const existing = acc.get(event.chain) ?? {
        volume: 0,
        tokenVolume: new Map<string, number>(),
        whales: new Set<string>(),
        exchanges: new Set<string>(),
      };

      existing.volume += event.amountUSD;
      existing.tokenVolume.set(
        event.token,
        (existing.tokenVolume.get(event.token) ?? 0) + event.amountUSD,
      );

      const fromType = walletTypeMap.get(event.from);
      const toType = walletTypeMap.get(event.to);

      if (fromType === "whale") existing.whales.add(event.from);
      if (toType === "whale") existing.whales.add(event.to);
      if (fromType === "exchange") existing.exchanges.add(event.from);
      if (toType === "exchange") existing.exchanges.add(event.to);

      acc.set(event.chain, existing);
      return acc;
    },
    new Map<
      string,
      {
        volume: number;
        tokenVolume: Map<string, number>;
        whales: Set<string>;
        exchanges: Set<string>;
      }
    >(),
  );

  const chainNetFlows = enrichedWallets.reduce((acc, wallet) => {
    acc.set(wallet.chain, (acc.get(wallet.chain) ?? 0) + wallet.netFlowUSD);
    return acc;
  }, new Map<string, number>());

  const chainSummaries: ChainSummary[] = Array.from(chainStats.entries())
    .map(([chain, stats]) => {
      const dominantTokenEntry = Array.from(stats.tokenVolume.entries()).sort((a, b) => b[1] - a[1])[0];
      return {
        chain,
        totalVolumeUSD: Number(stats.volume.toFixed(2)),
        dominantToken: dominantTokenEntry?.[0] ?? "Mixed",
        whaleCount: stats.whales.size,
        exchangeCount: stats.exchanges.size,
        netFlowUSD: Number((chainNetFlows.get(chain) ?? 0).toFixed(2)),
      };
    })
    .sort((a, b) => b.totalVolumeUSD - a.totalVolumeUSD);

  const trendingWallets: TrendingWallet[] = enrichedWallets
    .filter((wallet) => Math.abs(wallet.netFlowUSD) > 200_000)
    .sort((a, b) => Math.abs(b.netFlowUSD) - Math.abs(a.netFlowUSD))
    .slice(0, 5)
    .map((wallet) => ({
      id: wallet.id,
      label: wallet.label,
      chain: wallet.chain,
      type: wallet.type,
      netFlowUSD: Number(wallet.netFlowUSD.toFixed(2)),
      balanceUSD: wallet.balanceUSD,
      activityScore: wallet.activityScore,
    }));

  const selectionVolumeUSD = filteredEvents.reduce(
    (sum, event) => sum + event.amountUSD,
    0,
  );

  const aiInsight = (() => {
    const topToken = topTokens[0];
    const topChain = chainSummaries[0];
    const topWallet = trendingWallets[0];

    if (!topToken || !topChain || !topWallet) {
      return `Flows stayed muted in the last ${timeframeLabels[timeframe]}. Monitoring for fresh movements.`;
    }

    const netFlowWord = topWallet.netFlowUSD >= 0 ? "inflows" : "outflows";
    return `AI notes ${topToken.symbol} leading ${timeframeLabels[timeframe]} activity with ${compactCurrency.format(topToken.volumeUSD)} mostly routed via ${topChain.chain}. ${topWallet.label} drove ${compactCurrency.format(Math.abs(topWallet.netFlowUSD))} ${netFlowWord}, keeping ${topWallet.chain} on watch.`;
  })();

  return {
    timeframe,
    walletEntities: enrichedWallets,
    events: filteredEvents,
    analytics: {
      topTokens,
      rollingVolumes,
      aiInsight,
      trendingWallets,
      chainSummaries,
    },
    selectionVolumeUSD: Number(selectionVolumeUSD.toFixed(2)),
    lastUpdated: new Date(now).toISOString(),
  };
};

export const analyticsRouter = router({
  getNetworkSnapshot: publicProcedure
    .input(z.object({ timeframe: timeframeSchema }).optional())
    .query(({ input }) => {
      const timeframe = input?.timeframe ?? "24h";
      return computeSnapshot(timeframe);
    }),
});
