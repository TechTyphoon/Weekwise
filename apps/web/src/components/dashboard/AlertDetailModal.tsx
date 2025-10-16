import { Button } from "@/components/ui/button";
import { SeverityBadge } from "./SeverityBadge";
import { TrendMeter } from "./TrendMeter";
import type { Alert } from "@/types/dashboard";
import { 
	X, 
	ExternalLink, 
	Copy,
	Clock,
	DollarSign,
	Users,
	TrendingUp,
	Activity,
	Wallet,
	ArrowRight,
	History,
	Box,
	Zap,
} from "lucide-react";
import { formatDistanceToNow, formatAddress, formatNumber } from "@/utils/formatters";
import { toast } from "sonner";

interface AlertDetailModalProps {
	alert: Alert;
	isOpen: boolean;
	onClose: () => void;
}

const chainLogos: Record<string, string> = {
	ethereum: '⟠',
	bsc: '⬢',
	polygon: '◆',
	arbitrum: '◉',
	optimism: '◯',
	avalanche: '▲',
};

const chainExplorers: Record<string, string> = {
	ethereum: 'https://etherscan.io',
	bsc: 'https://bscscan.com',
	polygon: 'https://polygonscan.com',
	arbitrum: 'https://arbiscan.io',
	optimism: 'https://optimistic.etherscan.io',
	avalanche: 'https://snowtrace.io',
};

export function AlertDetailModal({ alert, isOpen, onClose }: AlertDetailModalProps) {
	if (!isOpen) return null;

	const explorerUrl = chainExplorers[alert.chain];

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="bg-card border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
				<div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
					<div className="flex items-center gap-3">
						<span className="text-3xl">{chainLogos[alert.chain]}</span>
						<div>
							<h2 className="text-2xl font-bold">
								{alert.token.symbol} - {alert.token.name}
							</h2>
							<p className="text-sm text-muted-foreground capitalize">
								{alert.type.replace('_', ' ')} on {alert.chain}
							</p>
						</div>
					</div>
					<Button
						size="icon"
						variant="ghost"
						onClick={onClose}
						className="rounded-full"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>

				<div className="overflow-y-auto flex-1 p-6 space-y-6">
					<div className="flex items-center gap-3">
						<SeverityBadge severity={alert.severity} size="lg" />
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Clock className="h-4 w-4" />
							<span>Detected {formatDistanceToNow(alert.detectedAt)}</span>
						</div>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="p-4 rounded-lg bg-muted/50 border space-y-1">
							<p className="text-xs text-muted-foreground flex items-center gap-1">
								<DollarSign className="h-3 w-3" />
								Price
							</p>
							<p className="text-xl font-bold">${alert.token.price.toLocaleString()}</p>
							<TrendMeter value={alert.token.priceChange24h} size="sm" />
						</div>
						<div className="p-4 rounded-lg bg-muted/50 border space-y-1">
							<p className="text-xs text-muted-foreground flex items-center gap-1">
								<Activity className="h-3 w-3" />
								Volume 24h
							</p>
							<p className="text-xl font-bold">${formatNumber(alert.token.volume24h)}</p>
						</div>
						<div className="p-4 rounded-lg bg-muted/50 border space-y-1">
							<p className="text-xs text-muted-foreground flex items-center gap-1">
								<TrendingUp className="h-3 w-3" />
								Market Cap
							</p>
							<p className="text-xl font-bold">${formatNumber(alert.token.marketCap)}</p>
						</div>
						<div className="p-4 rounded-lg bg-muted/50 border space-y-1">
							<p className="text-xs text-muted-foreground flex items-center gap-1">
								<Users className="h-3 w-3" />
								Holders
							</p>
							<p className="text-xl font-bold">{formatNumber(alert.token.holders, 0)}</p>
						</div>
					</div>

					<div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
						<h3 className="font-semibold mb-2 flex items-center gap-2">
							<Zap className="h-4 w-4 text-primary" />
							AI Analysis
						</h3>
						<p className="text-sm leading-relaxed">{alert.aiSummary}</p>
					</div>

					<div className="space-y-3">
						<h3 className="font-semibold flex items-center gap-2">
							<Activity className="h-4 w-4" />
							Transaction Details
						</h3>
						<div className="grid gap-3">
							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
								<span className="text-sm text-muted-foreground">Transaction Hash</span>
								<div className="flex items-center gap-2">
									<code className="text-sm font-mono">{formatAddress(alert.transaction.hash)}</code>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => copyToClipboard(alert.transaction.hash, 'Transaction hash')}
									>
										<Copy className="h-3 w-3" />
									</Button>
									<a
										href={`${explorerUrl}/tx/${alert.transaction.hash}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Button size="sm" variant="ghost">
											<ExternalLink className="h-3 w-3" />
										</Button>
									</a>
								</div>
							</div>
							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
								<span className="text-sm text-muted-foreground">Value (USD)</span>
								<span className="font-semibold">${alert.transaction.valueUsd.toLocaleString()}</span>
							</div>
							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
								<span className="text-sm text-muted-foreground flex items-center gap-1">
									<Box className="h-3 w-3" />
									Block Number
								</span>
								<code className="text-sm font-mono">{alert.transaction.blockNumber.toLocaleString()}</code>
							</div>
						</div>
					</div>

					<div className="space-y-3">
						<h3 className="font-semibold flex items-center gap-2">
							<Wallet className="h-4 w-4" />
							Wallet Information
						</h3>
						<div className="grid md:grid-cols-2 gap-3">
							<div className="p-4 rounded-lg border bg-gradient-to-br from-green-500/5 to-transparent">
								<p className="text-xs text-muted-foreground mb-2">From Wallet</p>
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<code className="text-sm font-mono">{formatAddress(alert.transaction.from.address)}</code>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => copyToClipboard(alert.transaction.from.address, 'Address')}
										>
											<Copy className="h-3 w-3" />
										</Button>
									</div>
									{alert.transaction.from.label && (
										<p className="text-sm font-medium text-green-600 dark:text-green-400">
											{alert.transaction.from.label}
										</p>
									)}
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>Balance: {formatNumber(alert.transaction.from.balance)} {alert.token.symbol}</span>
										<span>{alert.transaction.from.txCount} txs</span>
									</div>
								</div>
							</div>
							<div className="p-4 rounded-lg border bg-gradient-to-br from-blue-500/5 to-transparent">
								<p className="text-xs text-muted-foreground mb-2">To Wallet</p>
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<code className="text-sm font-mono">{formatAddress(alert.transaction.to.address)}</code>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => copyToClipboard(alert.transaction.to.address, 'Address')}
										>
											<Copy className="h-3 w-3" />
										</Button>
									</div>
									{alert.transaction.to.isContract && (
										<p className="text-sm font-medium text-blue-600 dark:text-blue-400">
											Contract
										</p>
									)}
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>Balance: {formatNumber(alert.transaction.to.balance)} {alert.token.symbol}</span>
										<span>{alert.transaction.to.txCount} txs</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{alert.historicalContext && (
						<div className="space-y-3">
							<h3 className="font-semibold flex items-center gap-2">
								<History className="h-4 w-4" />
								Historical Context
							</h3>
							<div className="grid grid-cols-3 gap-3">
								<div className="p-3 rounded-lg bg-muted/50 border text-center">
									<p className="text-2xl font-bold text-primary">
										{alert.historicalContext.similarAlertsCount}
									</p>
									<p className="text-xs text-muted-foreground">Similar Alerts</p>
								</div>
								<div className="p-3 rounded-lg bg-muted/50 border text-center">
									<p className="text-2xl font-bold text-primary">
										{alert.historicalContext.walletPreviousActivity}
									</p>
									<p className="text-xs text-muted-foreground">Previous Activity</p>
								</div>
								<div className="p-3 rounded-lg bg-muted/50 border text-center">
									<p className="text-sm font-semibold text-primary">
										{alert.historicalContext.timeframe}
									</p>
									<p className="text-xs text-muted-foreground">Timeframe</p>
								</div>
							</div>
						</div>
					)}

					<div className="flex flex-wrap gap-2">
						{alert.tags.map((tag) => (
							<span
								key={tag}
								className="px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
							>
								#{tag}
							</span>
						))}
					</div>
				</div>

				<div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
					<Button variant="outline" onClick={onClose}>
						Close
					</Button>
					<a
						href={`${explorerUrl}/tx/${alert.transaction.hash}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button className="group">
							View on Explorer
							<ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
						</Button>
					</a>
				</div>
			</div>
		</div>
	);
}
