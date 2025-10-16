import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendMeterProps {
	value: number;
	label?: string;
	showIcon?: boolean;
	size?: 'sm' | 'md' | 'lg';
}

export function TrendMeter({ value, label, showIcon = true, size = 'md' }: TrendMeterProps) {
	const isPositive = value > 0;
	const isNeutral = value === 0;
	
	const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
	
	const colorClass = isNeutral
		? 'text-muted-foreground'
		: isPositive
			? 'text-green-600 dark:text-green-400'
			: 'text-red-600 dark:text-red-400';

	const sizeClasses = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base',
	};

	const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';

	return (
		<div className={cn('inline-flex items-center gap-1 font-medium', colorClass, sizeClasses[size])}>
			{showIcon && <Icon className={iconSize} />}
			<span>
				{isPositive && '+'}
				{value.toFixed(2)}%
			</span>
			{label && <span className="text-muted-foreground ml-1">{label}</span>}
		</div>
	);
}
