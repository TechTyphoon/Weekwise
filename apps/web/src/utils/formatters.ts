export function formatDistanceToNow(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	const months = Math.floor(days / 30);
	return `${months}mo ago`;
}

export function formatNumber(num: number, decimals: number = 2): string {
	if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
	if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
	if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
	return num.toFixed(decimals);
}

export function formatAddress(address: string): string {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatHash(hash: string): string {
	return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}
