import { useState, useMemo } from "react";
import { AlertCard } from "./AlertCard";
import { FilterPanel } from "./FilterPanel";
import { DashboardStats } from "./DashboardStats";
import { AlertDetailModal } from "./AlertDetailModal";
import { useAlerts } from "@/hooks/useAlerts";
import type { FilterState, Alert } from "@/types/dashboard";
import { Activity, Loader2, Grid3x3, List, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Dashboard() {
	const [filters, setFilters] = useState<FilterState>({
		chains: [],
		alertTypes: [],
		severity: [],
		searchQuery: '',
	});
	
	const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

	const { alerts, isLoading, isConnected, error } = useAlerts(filters);

	const stats = useMemo(() => {
		return {
			totalAlerts: alerts.length,
			criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
			totalVolume24h: alerts.reduce((sum, a) => sum + a.token.volume24h, 0),
			activeChains: new Set(alerts.map(a => a.chain)).size,
			avgResponseTime: 245,
		};
	}, [alerts]);

	const handleResetFilters = () => {
		setFilters({
			chains: [],
			alertTypes: [],
			severity: [],
			searchQuery: '',
		});
	};

	return (
		<div className="container mx-auto px-4 py-6 space-y-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
						Whale & Dump Dashboard
					</h1>
					<p className="text-muted-foreground mt-1">
						Real-time crypto alerts powered by AI analysis
					</p>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card">
						<div
							className={cn(
								'h-2 w-2 rounded-full',
								isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
							)}
						/>
						<span className="text-sm font-medium">
							{isLoading ? 'Connecting...' : isConnected ? 'Live' : 'Offline'}
						</span>
					</div>
					<div className="flex items-center gap-1 rounded-lg border bg-card p-1">
						<Button
							size="sm"
							variant={viewMode === 'grid' ? 'default' : 'ghost'}
							onClick={() => setViewMode('grid')}
							className="h-7 w-7 p-0"
						>
							<Grid3x3 className="h-4 w-4" />
						</Button>
						<Button
							size="sm"
							variant={viewMode === 'list' ? 'default' : 'ghost'}
							onClick={() => setViewMode('list')}
							className="h-7 w-7 p-0"
						>
							<List className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			<DashboardStats stats={stats} isLoading={isLoading} />

			<FilterPanel
				filters={filters}
				onFiltersChange={setFilters}
				onReset={handleResetFilters}
			/>

			{error && !isConnected && (
				<div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
					<AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
					<div>
						<p className="font-medium text-orange-600 dark:text-orange-400">
							Firestore Connection Failed
						</p>
						<p className="text-sm text-muted-foreground mt-1">
							Showing mock data. Please check your Firebase configuration.
						</p>
					</div>
				</div>
			)}

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Activity className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold">
							Active Alerts
						</h2>
						<span className="text-sm text-muted-foreground">
							({alerts.length} total)
						</span>
					</div>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="text-center space-y-3">
							<Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
							<p className="text-muted-foreground">Loading alerts...</p>
						</div>
					</div>
				) : alerts.length === 0 ? (
					<div className="flex items-center justify-center py-12">
						<div className="text-center space-y-3">
							<Activity className="h-12 w-12 text-muted-foreground/50 mx-auto" />
							<div>
								<p className="text-lg font-medium text-muted-foreground">
									No alerts found
								</p>
								<p className="text-sm text-muted-foreground">
									Try adjusting your filters or wait for new alerts
								</p>
							</div>
							{(filters.chains.length > 0 || filters.alertTypes.length > 0 || filters.severity.length > 0 || filters.searchQuery) && (
								<Button variant="outline" onClick={handleResetFilters}>
									Clear Filters
								</Button>
							)}
						</div>
					</div>
				) : (
					<div
						className={cn(
							viewMode === 'grid'
								? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
								: 'space-y-4'
						)}
					>
						{alerts.map((alert) => (
							<AlertCard
								key={alert.id}
								alert={alert}
								onViewDetails={setSelectedAlert}
							/>
						))}
					</div>
				)}
			</div>

			<AlertDetailModal
				alert={selectedAlert!}
				isOpen={!!selectedAlert}
				onClose={() => setSelectedAlert(null)}
			/>
		</div>
	);
}
