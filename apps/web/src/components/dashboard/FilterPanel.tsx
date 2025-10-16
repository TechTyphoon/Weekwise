import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FilterState, Chain, AlertType, Severity } from "@/types/dashboard";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FilterPanelProps {
	filters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
	onReset: () => void;
}

const chains: { value: Chain; label: string; emoji: string }[] = [
	{ value: 'ethereum', label: 'Ethereum', emoji: '⟠' },
	{ value: 'bsc', label: 'BSC', emoji: '⬢' },
	{ value: 'polygon', label: 'Polygon', emoji: '◆' },
	{ value: 'arbitrum', label: 'Arbitrum', emoji: '◉' },
	{ value: 'optimism', label: 'Optimism', emoji: '◯' },
	{ value: 'avalanche', label: 'Avalanche', emoji: '▲' },
];

const alertTypes: { value: AlertType; label: string }[] = [
	{ value: 'whale_buy', label: 'Whale Buy' },
	{ value: 'whale_sell', label: 'Whale Sell' },
	{ value: 'dump', label: 'Dump' },
	{ value: 'pump', label: 'Pump' },
	{ value: 'large_transfer', label: 'Large Transfer' },
	{ value: 'liquidity_add', label: 'Liquidity Add' },
	{ value: 'liquidity_remove', label: 'Liquidity Remove' },
];

const severities: { value: Severity; label: string; color: string }[] = [
	{ value: 'critical', label: 'Critical', color: 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20 dark:text-red-400' },
	{ value: 'high', label: 'High', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30 hover:bg-orange-500/20 dark:text-orange-400' },
	{ value: 'medium', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20 dark:text-yellow-400' },
	{ value: 'low', label: 'Low', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20 dark:text-blue-400' },
];

export function FilterPanel({ filters, onFiltersChange, onReset }: FilterPanelProps) {
	const [isExpanded, setIsExpanded] = useState(true);

	const toggleChain = (chain: Chain) => {
		const newChains = filters.chains.includes(chain)
			? filters.chains.filter(c => c !== chain)
			: [...filters.chains, chain];
		onFiltersChange({ ...filters, chains: newChains });
	};

	const toggleAlertType = (type: AlertType) => {
		const newTypes = filters.alertTypes.includes(type)
			? filters.alertTypes.filter(t => t !== type)
			: [...filters.alertTypes, type];
		onFiltersChange({ ...filters, alertTypes: newTypes });
	};

	const toggleSeverity = (severity: Severity) => {
		const newSeverities = filters.severity.includes(severity)
			? filters.severity.filter(s => s !== severity)
			: [...filters.severity, severity];
		onFiltersChange({ ...filters, severity: newSeverities });
	};

	const hasActiveFilters = 
		filters.chains.length > 0 ||
		filters.alertTypes.length > 0 ||
		filters.severity.length > 0 ||
		filters.searchQuery.length > 0;

	return (
		<div className="space-y-4 bg-card rounded-xl border p-6 shadow-sm">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Filter className="h-5 w-5 text-primary" />
					<h3 className="font-semibold text-lg">Filters</h3>
					{hasActiveFilters && (
						<span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
							Active
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{hasActiveFilters && (
						<Button
							size="sm"
							variant="ghost"
							onClick={onReset}
							className="text-muted-foreground"
						>
							<X className="h-4 w-4 mr-1" />
							Clear All
						</Button>
					)}
					<Button
						size="sm"
						variant="ghost"
						onClick={() => setIsExpanded(!isExpanded)}
					>
						{isExpanded ? 'Collapse' : 'Expand'}
					</Button>
				</div>
			</div>

			{isExpanded && (
				<>
					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							Search Tokens
						</label>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search by symbol, name, or tx hash..."
								value={filters.searchQuery}
								onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
								className="pl-10"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							Chains ({filters.chains.length} selected)
						</label>
						<div className="flex flex-wrap gap-2">
							{chains.map((chain) => (
								<Button
									key={chain.value}
									size="sm"
									variant={filters.chains.includes(chain.value) ? 'default' : 'outline'}
									onClick={() => toggleChain(chain.value)}
									className="transition-all"
								>
									<span className="mr-1.5">{chain.emoji}</span>
									{chain.label}
								</Button>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							Alert Types ({filters.alertTypes.length} selected)
						</label>
						<div className="flex flex-wrap gap-2">
							{alertTypes.map((type) => (
								<Button
									key={type.value}
									size="sm"
									variant={filters.alertTypes.includes(type.value) ? 'default' : 'outline'}
									onClick={() => toggleAlertType(type.value)}
									className="transition-all"
								>
									{type.label}
								</Button>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							Severity ({filters.severity.length} selected)
						</label>
						<div className="flex flex-wrap gap-2">
							{severities.map((severity) => (
								<button
									key={severity.value}
									onClick={() => toggleSeverity(severity.value)}
									className={cn(
										'px-3 py-1.5 text-sm font-medium rounded-full border transition-all',
										filters.severity.includes(severity.value)
											? severity.color
											: 'bg-background border-border hover:bg-muted text-muted-foreground'
									)}
								>
									{severity.label}
								</button>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
