import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, type Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Alert, FilterState } from '@/types/dashboard';

export function useAlerts(filters: FilterState) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        try {
            let alertsQuery: Query = query(
                collection(db, 'alerts'),
                orderBy('detectedAt', 'desc'),
                limit(100)
            );

            if (filters.chains.length > 0) {
                alertsQuery = query(alertsQuery, where('chain', 'in', filters.chains));
            }

            if (filters.severity.length > 0) {
                alertsQuery = query(alertsQuery, where('severity', 'in', filters.severity));
            }

            const unsubscribe = onSnapshot(
                alertsQuery,
                (snapshot) => {
                    const alertsData: Alert[] = [];
                    snapshot.forEach((doc) => {
                        alertsData.push({ id: doc.id, ...doc.data() } as Alert);
                    });
                    setAlerts(alertsData);
                    setIsLoading(false);
                    setIsConnected(true);
                },
                (err) => {
                    console.error('Firestore listener error:', err);
                    setError(err as Error);
                    setIsLoading(false);
                    setIsConnected(false);
                    setAlerts(getMockAlerts());
                }
            );

            return () => unsubscribe();
        } catch (err) {
            console.error('Failed to set up Firestore listener:', err);
            setError(err as Error);
            setIsLoading(false);
            setIsConnected(false);
            setAlerts(getMockAlerts());
        }
    }, [filters.chains, filters.severity, filters.alertTypes]);

    const filteredAlerts = useMemo(() => {
        let filtered = alerts;

        if (filters.alertTypes.length > 0) {
            filtered = filtered.filter(alert => filters.alertTypes.includes(alert.type));
        }

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(alert =>
                alert.token.symbol.toLowerCase().includes(query) ||
                alert.token.name.toLowerCase().includes(query) ||
                alert.transaction.hash.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [alerts, filters.alertTypes, filters.searchQuery]);

    return {
        alerts: filteredAlerts,
        isLoading,
        isConnected,
        error,
    };
}

function getMockAlerts(): Alert[] {
    return [
        {
            id: '1',
            type: 'whale_buy',
            severity: 'critical',
            chain: 'ethereum',
            token: {
                symbol: 'WETH',
                name: 'Wrapped Ethereum',
                price: 3245.67,
                priceChange24h: 2.34,
                volume24h: 1234567890,
                marketCap: 98765432100,
                holders: 500000,
            },
            transaction: {
                hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                timestamp: Date.now() - 300000,
                from: {
                    address: '0xabcd1234567890abcdef1234567890abcdef1234',
                    balance: 1000000,
                    label: 'Whale Wallet #1',
                    isContract: false,
                    txCount: 543,
                },
                to: {
                    address: '0xdef1234567890abcdef1234567890abcdef12345',
                    balance: 500000,
                    isContract: true,
                    txCount: 10234,
                },
                value: 500,
                valueUsd: 1622835,
                gasUsed: 21000,
                blockNumber: 19234567,
            },
            aiSummary: 'Large whale accumulation detected. Historical analysis shows this wallet typically holds for 30+ days before selling. Pattern suggests bullish sentiment.',
            detectedAt: Date.now() - 300000,
            tags: ['whale', 'accumulation', 'bullish'],
            historicalContext: {
                similarAlertsCount: 3,
                walletPreviousActivity: 12,
                timeframe: 'Last 7 days',
            },
        },
        {
            id: '2',
            type: 'dump',
            severity: 'high',
            chain: 'bsc',
            token: {
                symbol: 'CAKE',
                name: 'PancakeSwap Token',
                price: 2.45,
                priceChange24h: -12.5,
                volume24h: 45678901,
                marketCap: 456789012,
                holders: 250000,
            },
            transaction: {
                hash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
                timestamp: Date.now() - 600000,
                from: {
                    address: '0x9876543210fedcba9876543210fedcba98765432',
                    balance: 2000000,
                    label: 'Early Investor',
                    isContract: false,
                    txCount: 234,
                },
                to: {
                    address: '0x5432109876fedcba5432109876fedcba54321098',
                    balance: 1000000,
                    isContract: true,
                    txCount: 50000,
                },
                value: 1000000,
                valueUsd: 2450000,
                gasUsed: 45000,
                blockNumber: 35678901,
            },
            aiSummary: 'Significant sell-off detected from early investor wallet. Price impact of -2.3% observed. Similar patterns historically preceded further downward momentum.',
            detectedAt: Date.now() - 600000,
            tags: ['dump', 'sell-off', 'bearish', 'high-impact'],
            historicalContext: {
                similarAlertsCount: 5,
                walletPreviousActivity: 8,
                timeframe: 'Last 30 days',
            },
        },
        {
            id: '3',
            type: 'liquidity_add',
            severity: 'medium',
            chain: 'polygon',
            token: {
                symbol: 'MATIC',
                name: 'Polygon',
                price: 0.85,
                priceChange24h: 5.2,
                volume24h: 234567890,
                marketCap: 7890123456,
                holders: 750000,
            },
            transaction: {
                hash: '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
                timestamp: Date.now() - 900000,
                from: {
                    address: '0x1234abcd1234abcd1234abcd1234abcd1234abcd',
                    balance: 500000,
                    label: 'Liquidity Provider',
                    isContract: false,
                    txCount: 678,
                },
                to: {
                    address: '0xabcd1234abcd1234abcd1234abcd1234abcd1234',
                    balance: 10000000,
                    isContract: true,
                    txCount: 150000,
                },
                value: 250000,
                valueUsd: 212500,
                gasUsed: 120000,
                blockNumber: 52345678,
            },
            aiSummary: 'Major liquidity addition to MATIC/USDC pool. Reduced slippage expected for large trades. Positive signal for market stability.',
            detectedAt: Date.now() - 900000,
            tags: ['liquidity', 'positive', 'stability'],
            historicalContext: {
                similarAlertsCount: 15,
                walletPreviousActivity: 45,
                timeframe: 'Last 14 days',
            },
        },
    ];
}
