import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "./SeverityBadge";
import { TrendMeter } from "./TrendMeter";
import type { Alert } from "@/types/dashboard";
import { 
	TrendingUp, 
	TrendingDown, 
	ArrowRightLeft, 
	Droplets, 
	Zap,
	ExternalLink,
	Clock,
	DollarSign,
	Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/utils/formatters";

interface AlertCardProps {
	alert: Alert;
	onViewDetails: (alert: Alert) => void;
}

const alertTypeConfig = {
	whale_buy: {
		label: 'Whale Buy',
		icon: TrendingUp,
		color: 'text-green-600 dark:text-green-400',
		bgColor: 'bg-green-500/10',
	},
	whale_sell: {
		label: 'Whale Sell',
		icon: TrendingDown,
		color: 'text-red-600 dark:text-red-400',
		bgColor: 'bg-red-500/10',
	},
	dump: {
		label: 'Dump Alert',
		icon: TrendingDown,
		color: 'text-red-600 dark:text-red-400',
		bgColor: 'bg-red-500/10',
	},
	pump: {
		label: 'Pump Alert',
		icon: TrendingUp,
		color: 'text-green-600 dark:text-green-400',
		bgColor: 'bg-green-500/10',
	},
	large_transfer: {
		label: 'Large Transfer',
		icon: ArrowRightLeft,
		color: 'text-blue-600 dark:text-blue-400',
		bgColor: 'bg-blue-500/10',
	},
	liquidity_add: {
		label: 'Liquidity Added',
		icon: Droplets,
		color: 'text-cyan-600 dark:text-cyan-400',
		bgColor: 'bg-cyan-500/10',
	},
	liquidity_remove: {
		label: 'Liquidity Removed',
		icon: Zap,
		color: 'text-orange-600 dark:text-orange-400',
		bgColor: 'bg-orange-500/10',
	},
};

const chainLogos: Record<string, string> = {
	ethereum: '⟠',
	bsc: '⬢',
	polygon: '◆',
	arbitrum: '◉',
	optimism: '◯',
	avalanche: '▲',
};

export function AlertCard({ alert, onViewDetails }: AlertCardProps) {
	const typeConfig = alertTypeConfig[alert.type];
	const TypeIcon = typeConfig.icon;

	return (
		<Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/50">
			<CardHeader>
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className={`rounded-lg p-2.5 ${typeConfig.bgColor}`}>
							<TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
						</div>
						<div className="space-y-1">
							<CardTitle className="text-lg font-semibold">
								{alert.token.symbol} - {typeConfig.label}
							</CardTitle>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span className="text-lg">{chainLogos[alert.chain]}</span>
								<span className="capitalize">{alert.chain}</span>
								<span>•</span>
								<Clock className="h-3 w-3" />
								<span>{formatDistanceToNow(alert.detectedAt)}</span>
							</div>
						</div>
					</div>
					<SeverityBadge severity={alert.severity} size="sm" />
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Price</p>
						<p className="font-semibold">${alert.token.price.toLocaleString()}</p>
						<TrendMeter value={alert.token.priceChange24h} size="sm" />
					</div>
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Value</p>
						<p className="font-semibold flex items-center gap-1">
							<DollarSign className="h-3 w-3" />
							{(alert.transaction.valueUsd / 1000).toFixed(0)}K
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Volume 24h</p>
						<p className="font-semibold">
							${(alert.token.volume24h / 1000000).toFixed(1)}M
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Holders</p>
						<p className="font-semibold flex items-center gap-1">
							<Users className="h-3 w-3" />
							{(alert.token.holders / 1000).toFixed(0)}K
						</p>
					</div>
				</div>

				<div className="p-3 rounded-lg bg-muted/50 border border-border/50">
					<p className="text-sm text-muted-foreground mb-1 font-medium">AI Analysis</p>
					<p className="text-sm leading-relaxed">{alert.aiSummary}</p>
				</div>

				<div className="flex flex-wrap gap-2">
					{alert.tags.map((tag) => (
						<span
							key={tag}
							className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
						>
							#{tag}
						</span>
					))}
				</div>

				<div className="flex items-center justify-between pt-2 border-t">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>Tx: {alert.transaction.hash.slice(0, 10)}...{alert.transaction.hash.slice(-8)}</span>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() => onViewDetails(alert)}
						className="group"
					>
						View Details
						<ExternalLink className="h-3 w-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
