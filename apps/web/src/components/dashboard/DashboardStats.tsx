import { Card } from "@/components/ui/card";
import { AlertTriangle, Activity, DollarSign, Globe, Clock } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import type { DashboardStats as StatsType } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
	stats: StatsType;
	isLoading?: boolean;
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
	const statCards = [
		{
			label: 'Total Alerts',
			value: stats.totalAlerts,
			icon: Activity,
			color: 'text-blue-600 dark:text-blue-400',
			bgColor: 'bg-blue-500/10',
		},
		{
			label: 'Critical Alerts',
			value: stats.criticalAlerts,
			icon: AlertTriangle,
			color: 'text-red-600 dark:text-red-400',
			bgColor: 'bg-red-500/10',
		},
		{
			label: 'Total Volume 24h',
			value: `$${formatNumber(stats.totalVolume24h)}`,
			icon: DollarSign,
			color: 'text-green-600 dark:text-green-400',
			bgColor: 'bg-green-500/10',
		},
		{
			label: 'Active Chains',
			value: stats.activeChains,
			icon: Globe,
			color: 'text-purple-600 dark:text-purple-400',
			bgColor: 'bg-purple-500/10',
		},
		{
			label: 'Avg Response Time',
			value: `${stats.avgResponseTime}ms`,
			icon: Clock,
			color: 'text-orange-600 dark:text-orange-400',
			bgColor: 'bg-orange-500/10',
		},
	];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
			{statCards.map((stat) => {
				const Icon = stat.icon;
				return (
					<Card
						key={stat.label}
						className={cn(
							'p-4 hover:shadow-md transition-all',
							isLoading && 'animate-pulse'
						)}
					>
						<div className="flex items-center gap-3">
							<div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
								<Icon className={`h-5 w-5 ${stat.color}`} />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{stat.label}</p>
								<p className="text-xl font-bold">
									{isLoading ? '...' : stat.value}
								</p>
							</div>
						</div>
					</Card>
				);
			})}
		</div>
	);
}
