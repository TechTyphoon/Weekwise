export type Chain = 'ethereum' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche';

export type AlertType = 'whale_buy' | 'whale_sell' | 'dump' | 'pump' | 'large_transfer' | 'liquidity_add' | 'liquidity_remove';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface TokenStats {
	symbol: string;
	name: string;
	price: number;
	priceChange24h: number;
	volume24h: number;
	marketCap: number;
	holders: number;
}

export interface WalletInfo {
	address: string;
	balance: number;
	label?: string;
	isContract: boolean;
	txCount: number;
}

export interface TransactionMetadata {
	hash: string;
	timestamp: number;
	from: WalletInfo;
	to: WalletInfo;
	value: number;
	valueUsd: number;
	gasUsed: number;
	blockNumber: number;
}

export interface Alert {
	id: string;
	type: AlertType;
	severity: Severity;
	chain: Chain;
	token: TokenStats;
	transaction: TransactionMetadata;
	aiSummary: string;
	detectedAt: number;
	tags: string[];
	historicalContext?: {
		similarAlertsCount: number;
		walletPreviousActivity: number;
		timeframe: string;
	};
}

export interface FilterState {
	chains: Chain[];
	alertTypes: AlertType[];
	severity: Severity[];
	searchQuery: string;
	dateRange?: {
		start: Date;
		end: Date;
	};
}

export interface DashboardStats {
	totalAlerts: number;
	criticalAlerts: number;
	totalVolume24h: number;
	activeChains: number;
	avgResponseTime: number;
}
