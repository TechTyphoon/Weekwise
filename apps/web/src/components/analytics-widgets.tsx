import { memo, useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";
import type { NetworkSnapshot } from "../../../server/src/routers/analytics";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPercent, formatSignedUSD, formatUSD } from "@/utils/formatters";

type TopToken = NetworkSnapshot["analytics"]["topTokens"][number];
type RollingVolume = NetworkSnapshot["analytics"]["rollingVolumes"][number];
type TrendingWallet = NetworkSnapshot["analytics"]["trendingWallets"][number];
type Timeframe = NetworkSnapshot["timeframe"]; 

type AnalyticsWidgetsProps = {
  topTokens: TopToken[];
  selectionTopTokens: TopToken[];
  rollingVolumes: RollingVolume[];
  aiInsight: string;
  selectedChain: string;
  timeframe: Timeframe;
  selectionVolumeUSD: number;
  trendingWallets: TrendingWallet[];
  highlightedWalletId: string | null;
  onWalletSelect?: (walletId: string) => void;
};

const timeframeLabelMap: Record<Timeframe, string> = {
  "5m": "5-minute",
  "1h": "1-hour",
  "24h": "24-hour",
  "7d": "7-day",
};

const AnalyticsWidgetsComponent = ({
  topTokens,
  selectionTopTokens,
  rollingVolumes,
  aiInsight,
  selectedChain,
  timeframe,
  selectionVolumeUSD,
  trendingWallets,
  highlightedWalletId,
  onWalletSelect,
}: AnalyticsWidgetsProps) => {
  const tokensToDisplay = useMemo(() => {
    if (selectedChain !== "all" && selectionTopTokens.length) {
      return selectionTopTokens;
    }
    return topTokens;
  }, [selectedChain, selectionTopTokens, topTokens]);

  const chainChip = selectedChain !== "all" ? `${selectedChain} focus` : "Multi-chain";

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="relative overflow-hidden border-slate-800/60 bg-slate-900/50 p-5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
            <TrendingUp className="h-4 w-4 text-primary" />
            Top moving tokens
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {chainChip}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {tokensToDisplay.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-700/60 bg-slate-900/40 p-4 text-sm text-slate-400">
              No token velocity detected for the current selection.
            </div>
          )}

          {tokensToDisplay.map((token) => {
            const positive = token.changePercent >= 0;
            return (
              <div
                key={token.symbol}
                className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/60 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">{token.symbol}</p>
                  <p className="text-xs text-slate-400">{token.dominantChain} · {token.uniqueWallets} wallets</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-100">{formatUSD(token.volumeUSD)}</p>
                  <div className="flex items-center justify-end gap-1 text-xs">
                    {positive ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                    )}
                    <span className={positive ? "text-emerald-300" : "text-rose-300"}>
                      {formatPercent(token.changePercent)}
                    </span>
                  </div>
                  <span className="mt-1 inline-flex items-center rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                    {token.direction}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="border-slate-800/60 bg-slate-900/50 p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-200">Rolling volume counters</span>
            <p className="text-xs text-slate-400">{timeframeLabelMap[timeframe]} snapshot</p>
          </div>
          <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
            {formatUSD(selectionVolumeUSD)}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {rollingVolumes.map((window) => {
            const positive = window.changePercent >= 0;
            return (
              <div
                key={window.window}
                className="rounded-lg border border-slate-800/60 bg-slate-950/60 px-3 py-3"
              >
                <p className="text-xs uppercase tracking-wide text-slate-400">{window.window}</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{formatUSD(window.totalUSD)}</p>
                <p className={cn("text-xs", positive ? "text-emerald-300" : "text-rose-300")}>{formatPercent(window.changePercent)}</p>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Selection volume represents the total notional value flowing through the highlighted scope.
        </p>
      </Card>

      <Card className="relative overflow-hidden border-slate-800/60 bg-gradient-to-br from-primary/10 via-slate-900/70 to-slate-950 p-5">
        <div className="relative space-y-5 text-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            AI insight
          </div>
          <p className="text-sm leading-relaxed text-slate-200/90">{aiInsight}</p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300/80">Trending wallets</p>
            <div className="mt-3 space-y-2">
              {trendingWallets.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-700/60 bg-slate-900/40 p-3 text-xs text-slate-300">
                  No standout wallets for this scope yet.
                </div>
              )}

              {trendingWallets.map((wallet) => {
                const positive = wallet.netFlowUSD >= 0;
                return (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => onWalletSelect?.(wallet.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition",
                      highlightedWalletId === wallet.id
                        ? "border-primary/70 bg-primary/10 text-primary-foreground"
                        : "border-slate-800/60 bg-slate-900/60 text-slate-200 hover:border-primary/60 hover:bg-primary/10 hover:text-primary-foreground",
                    )}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{wallet.label}</p>
                      <p className="text-[11px] text-slate-300/80">{wallet.chain} · {wallet.type}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", positive ? "text-emerald-300" : "text-rose-300")}>{formatSignedUSD(wallet.netFlowUSD)}</p>
                      <p className="text-[11px] text-slate-300/80">Score {wallet.activityScore}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const AnalyticsWidgets = memo(AnalyticsWidgetsComponent);
export default AnalyticsWidgets;
