import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCcw, Filter, ChevronRight } from "lucide-react";
import type { NetworkSnapshot } from "../../../server/src/routers/analytics";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import NetworkGraph from "@/components/network-graph";
import AnalyticsWidgets from "@/components/analytics-widgets";
import { formatPercent, formatRelativeTimeFromNow, formatSignedUSD, formatUSD } from "@/utils/formatters";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

type Timeframe = NetworkSnapshot["timeframe"];

type TopToken = NetworkSnapshot["analytics"]["topTokens"][number];
type NetworkEvent = NetworkSnapshot["events"][number];
type WalletEntity = NetworkSnapshot["walletEntities"][number];

const timeframeOptions: Timeframe[] = ["5m", "1h", "24h", "7d"];

const timeframeLabelMap: Record<Timeframe, string> = {
  "5m": "5 minutes",
  "1h": "1 hour",
  "24h": "24 hours",
  "7d": "7 days",
};

const buildSelectionTokens = (
  events: NetworkEvent[],
  wallets: WalletEntity[],
  baselineTokens: TopToken[],
): TopToken[] => {
  if (!events.length) return [];

  const walletTypeMap = new Map(wallets.map((wallet) => [wallet.id, wallet.type]));
  const changeLookup = new Map(baselineTokens.map((token) => [token.symbol, token.changePercent]));

  const aggregate = events.reduce(
    (acc, event) => {
      const entry = acc.get(event.token) ?? {
        volume: 0,
        chainVolume: new Map<string, number>(),
        walletIds: new Set<string>(),
        netFlow: 0,
      };

      entry.volume += event.amountUSD;
      entry.chainVolume.set(
        event.chain,
        (entry.chainVolume.get(event.chain) ?? 0) + event.amountUSD,
      );
      entry.walletIds.add(event.from);
      entry.walletIds.add(event.to);

      const fromType = walletTypeMap.get(event.from);
      const toType = walletTypeMap.get(event.to);
      if (toType === "exchange" && fromType === "whale") {
        entry.netFlow += event.amountUSD;
      } else if (fromType === "exchange" && toType === "whale") {
        entry.netFlow -= event.amountUSD;
      }

      acc.set(event.token, entry);
      return acc;
    },
    new Map<
      string,
      {
        volume: number;
        chainVolume: Map<string, number>;
        walletIds: Set<string>;
        netFlow: number;
      }
    >(),
  );

  return Array.from(aggregate.entries())
    .map(([symbol, stats]) => {
      const dominantChainEntry = Array.from(stats.chainVolume.entries()).sort((a, b) => b[1] - a[1])[0];
      return {
        symbol,
        volumeUSD: Number(stats.volume.toFixed(2)),
        changePercent: Number((changeLookup.get(symbol) ?? 0).toFixed(2)),
        dominantChain: dominantChainEntry?.[0] ?? "Multi-chain",
        direction: stats.netFlow >= 0 ? "inflow" : "outflow",
        uniqueWallets: stats.walletIds.size,
      } satisfies TopToken;
    })
    .sort((a, b) => b.volumeUSD - a.volumeUSD)
    .slice(0, 5);
};

const DashboardEmptyState = () => {
  return (
    <Card className="border-slate-800/60 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
      <p>No analytics data is available yet. Adjust the filters or try a broader timeframe.</p>
    </Card>
  );
};

function DashboardRoute() {
  const [timeframe, setTimeframe] = useState<Timeframe>("24h");
  const [selectedChain, setSelectedChain] = useState<string>("all");
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [hoveredWalletId, setHoveredWalletId] = useState<string | null>(null);

  const query = trpc.analytics.getNetworkSnapshot.useQuery(
    { timeframe },
    {
      keepPreviousData: true,
    },
  );

  const { data, isLoading, isFetching, isError, refetch } = query;

  const highlightWalletId = hoveredWalletId ?? selectedWalletId;

  const chainSummaries = data?.analytics.chainSummaries ?? [];
  const chainOptions = useMemo(() => chainSummaries.map((summary) => summary.chain), [chainSummaries]);

  const filteredWallets = useMemo(() => {
    if (!data) return [];
    if (selectedChain === "all") return data.walletEntities;
    const walletsOnChain = data.walletEntities.filter((wallet) => wallet.chain === selectedChain);
    if (walletsOnChain.length > 0) return walletsOnChain;
    return data.walletEntities;
  }, [data, selectedChain]);

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    if (selectedChain === "all") return data.events;
    const walletIds = new Set(filteredWallets.map((wallet) => wallet.id));
    return data.events.filter(
      (event) =>
        event.chain === selectedChain || walletIds.has(event.from) || walletIds.has(event.to),
    );
  }, [data, filteredWallets, selectedChain]);

  const selectionTopTokens = useMemo(() => {
    if (!data) return [];
    return buildSelectionTokens(filteredEvents, data.walletEntities, data.analytics.topTokens);
  }, [filteredEvents, data]);

  const selectionVolumeUSD = useMemo(() => {
    return filteredEvents.reduce((sum, event) => sum + event.amountUSD, 0);
  }, [filteredEvents]);

  const trendingWallets = useMemo(() => {
    if (!data) return [];
    if (selectedChain === "all") return data.analytics.trendingWallets;
    const scoped = data.analytics.trendingWallets.filter((wallet) => wallet.chain === selectedChain);
    return scoped.length ? scoped : data.analytics.trendingWallets;
  }, [data, selectedChain]);

  const selectedWallet = useMemo(() => {
    if (!data || !selectedWalletId) return null;
    return data.walletEntities.find((wallet) => wallet.id === selectedWalletId) ?? null;
  }, [data, selectedWalletId]);

  const selectionInsight = useMemo(() => {
    if (!data) return "";
    if (selectedChain === "all" || !filteredEvents.length) {
      if (!filteredEvents.length && selectedChain !== "all") {
        return `No high-confidence signals surfaced on ${selectedChain} across the last ${timeframeLabelMap[timeframe]}.`;
      }
      return data.analytics.aiInsight;
    }

    const latestEvent = [...filteredEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];
    const leadingToken = selectionTopTokens[0] ?? data.analytics.topTokens.find((token) => token.dominantChain === selectedChain);
    const involvedWallet = data.walletEntities.find((wallet) => wallet.id === latestEvent.from) ?? data.walletEntities.find((wallet) => wallet.id === latestEvent.to);

    const tokenSymbol = leadingToken?.symbol ?? latestEvent.token;
    const tokenVolume = leadingToken?.volumeUSD ?? latestEvent.amountUSD;
    const walletLabel = involvedWallet?.label ?? "key actors";

    return `${selectedChain} spotlight: ${tokenSymbol} moved ${formatUSD(tokenVolume)} with ${walletLabel} at the center. Keep an eye on follow-through after the latest ${latestEvent.token} transfer.`;
  }, [data, filteredEvents, selectedChain, timeframe, selectionTopTokens]);

  const handleTimeframeChange = useCallback((nextTimeframe: Timeframe) => {
    setTimeframe(nextTimeframe);
  }, []);

  const handleChainSelect = useCallback((chain: string) => {
    setSelectedChain((current) => (current === chain ? "all" : chain));
    setSelectedWalletId(null);
  }, []);

  const handleWalletHover = useCallback((walletId: string | null) => {
    setHoveredWalletId(walletId);
  }, []);

  const handleWalletSelect = useCallback(
    (walletId: string | null) => {
      setSelectedWalletId(walletId);
      if (!walletId || !data) return;
      const wallet = data.walletEntities.find((entity) => entity.id === walletId);
      if (wallet) {
        setSelectedChain((current) => (current === "all" ? wallet.chain : current));
      }
    },
    [data],
  );

  const resetFilters = useCallback(() => {
    setSelectedChain("all");
    setSelectedWalletId(null);
    setHoveredWalletId(null);
  }, []);

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Network intelligence dashboard</h1>
          <p className="text-sm text-slate-400">
            Live visualization of whale and exchange flows paired with creative analytics extras.
          </p>
          {data && (
            <p className="mt-2 text-xs text-slate-500">
              Updated {formatRelativeTimeFromNow(data.lastUpdated)} · Scope: {timeframeLabelMap[timeframe]}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {timeframeOptions.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={option === timeframe ? "default" : "outline"}
              onClick={() => handleTimeframeChange(option)}
              className={option === timeframe ? "border-primary bg-primary text-primary-foreground" : "border-slate-700/60 bg-slate-900/40 text-slate-200"}
            >
              {option}
            </Button>
          ))}
          <Button
            size="icon"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-slate-700/60 bg-slate-900/50 text-slate-200"
          >
            <RefreshCcw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <Filter className="h-3.5 w-3.5" />
        <span>Chain focus:</span>
        <button
          type="button"
          onClick={() => handleChainSelect("all")}
          className={selectedChain === "all" ? "rounded-full bg-primary/20 px-2 py-0.5 text-primary-foreground" : "rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-200 hover:bg-primary/10 hover:text-primary-foreground"}
        >
          All chains
        </button>
        {chainOptions.map((chain) => (
          <button
            key={chain}
            type="button"
            onClick={() => handleChainSelect(chain)}
            className={selectedChain === chain ? "rounded-full bg-primary/20 px-2 py-0.5 text-primary-foreground" : "rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-200 hover:bg-primary/10 hover:text-primary-foreground"}
          >
            {chain}
          </button>
        ))}
        {(selectedChain !== "all" || selectedWalletId) && (
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-200 hover:bg-primary/10 hover:text-primary-foreground"
          >
            Clear selection
          </button>
        )}
      </div>

      {isLoading && (
        <div className="mt-8 space-y-6">
          <Skeleton className="h-96 w-full rounded-xl bg-slate-800/40" />
          <Skeleton className="h-64 w-full rounded-xl bg-slate-800/40" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48 rounded-xl bg-slate-800/40" />
            <Skeleton className="h-48 rounded-xl bg-slate-800/40" />
          </div>
        </div>
      )}

      {!isLoading && isError && (
        <DashboardEmptyState />
      )}

      {!isLoading && data && (
        <div className="mt-8 space-y-8">
          <Card className="border-slate-800/60 bg-slate-900/50 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Whale ⇄ exchange network</h2>
                <p className="text-sm text-slate-400">Drag to reposition, hover for quick stats, click to lock focus.</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>Total edges: {data.events.length}</p>
                <p>Selection volume: {formatUSD(selectionVolumeUSD)}</p>
              </div>
            </div>
            <NetworkGraph
              className="mt-4 min-h-[420px]"
              wallets={filteredWallets}
              events={filteredEvents}
              selectedChain={selectedChain}
              highlightedWalletId={highlightWalletId}
              onWalletHover={handleWalletHover}
              onWalletSelect={handleWalletSelect}
            />
          </Card>

          <AnalyticsWidgets
            topTokens={data.analytics.topTokens}
            selectionTopTokens={selectionTopTokens}
            rollingVolumes={data.analytics.rollingVolumes}
            aiInsight={selectionInsight}
            selectedChain={selectedChain}
            timeframe={timeframe}
            selectionVolumeUSD={selectionVolumeUSD}
            trendingWallets={trendingWallets}
            highlightedWalletId={highlightWalletId}
            onWalletSelect={(walletId) => handleWalletSelect(walletId)}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {(selectedChain === "all" ? chainSummaries : chainSummaries.filter((chain) => chain.chain === selectedChain)).map((summary) => {
              const active = selectedChain === summary.chain;
              return (
                <Card
                  key={summary.chain}
                  className={"cursor-pointer border transition " + (active ? "border-primary/70 bg-primary/10" : "border-slate-800/60 bg-slate-900/50 hover:border-primary/60 hover:bg-primary/10")}
                  onClick={() => handleChainSelect(summary.chain)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{summary.chain}</h3>
                      <p className="text-xs text-slate-400">Dominant: {summary.dominantToken}</p>
                    </div>
                    <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">{formatPercent(summary.totalVolumeUSD === 0 ? 0 : (summary.netFlowUSD / summary.totalVolumeUSD) * 100)}</span>
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Volume</p>
                      <p className="text-base font-semibold text-slate-100">{formatUSD(summary.totalVolumeUSD)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Net flow</p>
                      <p className={summary.netFlowUSD >= 0 ? "text-sm font-semibold text-emerald-300" : "text-sm font-semibold text-rose-300"}>
                        {formatSignedUSD(summary.netFlowUSD)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                    <span>Whales: {summary.whaleCount}</span>
                    <span>Exchanges: {summary.exchangeCount}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-slate-800/60 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100">AI insight breakdown</h3>
              <p className="mt-2 text-sm text-slate-300">{selectionInsight}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-400">
                <div>
                  <p>Timeframe</p>
                  <p className="text-slate-100">{timeframeLabelMap[timeframe]}</p>
                </div>
                <div>
                  <p>Scope volume</p>
                  <p className="text-slate-100">{formatUSD(selectionVolumeUSD)}</p>
                </div>
                <div>
                  <p>Active wallets</p>
                  <p className="text-slate-100">{filteredWallets.length}</p>
                </div>
                <div>
                  <p>Events counted</p>
                  <p className="text-slate-100">{filteredEvents.length}</p>
                </div>
              </div>
            </Card>

            <Card className="border-slate-800/60 bg-slate-900/50 p-6">
              {selectedWallet ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{selectedWallet.label}</h3>
                      <p className="text-xs text-slate-400">{selectedWallet.chain} · {selectedWallet.type}</p>
                    </div>
                    <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
                      Activity {selectedWallet.activityScore}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>Balance</span>
                      <span>{formatUSD(selectedWallet.balanceUSD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net flow</span>
                      <span className={selectedWallet.netFlowUSD >= 0 ? "text-emerald-300" : "text-rose-300"}>
                        {formatSignedUSD(selectedWallet.netFlowUSD)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last active</span>
                      <span>{formatRelativeTimeFromNow(selectedWallet.lastActive)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {selectedWallet.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-800/80 px-2 py-0.5 text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-700/60 bg-slate-900/60 text-slate-200"
                    onClick={() => setSelectedWalletId(null)}
                  >
                    Clear wallet focus
                  </Button>
                </div>
              ) : (
                <div className="flex h-full flex-col items-start justify-center gap-3 text-sm text-slate-400">
                  <p className="flex items-center gap-2 text-slate-300">
                    <ChevronRight className="h-4 w-4" />
                    Click a node or trending wallet to pin its analytics here.
                  </p>
                  <p>Hover the network graph for quick stats or pick a chain card to narrow the scope.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
