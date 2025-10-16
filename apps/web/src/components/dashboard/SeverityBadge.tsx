import { cn } from "@/lib/utils";
import type { Severity } from "@/types/dashboard";
import { AlertTriangle, AlertCircle, Info, Shield } from "lucide-react";

interface SeverityBadgeProps {
	severity: Severity;
	showIcon?: boolean;
	size?: 'sm' | 'md' | 'lg';
}

const severityConfig = {
	critical: {
		label: 'Critical',
		className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400',
		icon: AlertTriangle,
	},
	high: {
		label: 'High',
		className: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400',
		icon: AlertCircle,
	},
	medium: {
		label: 'Medium',
		className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400',
		icon: Info,
	},
	low: {
		label: 'Low',
		className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400',
		icon: Shield,
	},
};

const sizeClasses = {
	sm: 'text-xs px-2 py-0.5',
	md: 'text-sm px-2.5 py-1',
	lg: 'text-base px-3 py-1.5',
};

export function SeverityBadge({ severity, showIcon = true, size = 'md' }: SeverityBadgeProps) {
	const config = severityConfig[severity];
	const Icon = config.icon;

	return (
		<span
			className={cn(
				'inline-flex items-center gap-1.5 rounded-full border font-medium',
				config.className,
				sizeClasses[size]
			)}
		>
			{showIcon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />}
			{config.label}
		</span>
	);
}
