# Whale & Dump Dashboard

A real-time cryptocurrency monitoring dashboard featuring AI-powered alerts for whale activities, dumps, pumps, and liquidity changes across multiple blockchain networks.

## Features

### 🎯 Core Functionality
- **Real-time Alerts**: Live monitoring via Firestore listeners
- **Multi-chain Support**: Ethereum, BSC, Polygon, Arbitrum, Optimism, Avalanche
- **AI Analysis**: Contextual summaries for each alert
- **Advanced Filtering**: Filter by chain, alert type, severity, and search tokens
- **Responsive Design**: Adaptive grid/list views for desktop and mobile

### 🔍 Alert Types
- **Whale Buy/Sell**: Large wallet movements
- **Dump/Pump Alerts**: Sudden price impacts
- **Large Transfers**: Significant token movements
- **Liquidity Changes**: Pool additions/removals

### 🎨 UI Components

#### Core Components
- **AlertCard**: Displays alert summaries with key metrics
- **SeverityBadge**: Visual severity indicators (Critical, High, Medium, Low)
- **TrendMeter**: Price change visualization
- **FilterPanel**: Comprehensive filtering controls
- **AlertDetailModal**: Deep-dive view with transaction details
- **DashboardStats**: Overview metrics and statistics

### 📊 Data Structure

Alerts include:
- Token information (price, volume, market cap, holders)
- Transaction metadata (hash, value, gas, block number)
- Wallet information (addresses, labels, balances, transaction counts)
- AI-generated summaries and analysis
- Historical context and similar alert patterns
- Severity classification and tags

## Setup

### 1. Firebase Configuration

Create a Firebase project and enable Firestore. Add your Firebase credentials to `.env`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 2. Firestore Indexes

Create composite indexes for optimal query performance:

```
Collection: alerts
Fields: 
  - chain (Ascending) + detectedAt (Descending)
  - severity (Ascending) + detectedAt (Descending)
  - type (Ascending) + detectedAt (Descending)
```

### 3. Data Schema

Alerts collection structure:

```typescript
{
  type: 'whale_buy' | 'whale_sell' | 'dump' | 'pump' | 'large_transfer' | 'liquidity_add' | 'liquidity_remove',
  severity: 'critical' | 'high' | 'medium' | 'low',
  chain: 'ethereum' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche',
  token: {
    symbol: string,
    name: string,
    price: number,
    priceChange24h: number,
    volume24h: number,
    marketCap: number,
    holders: number
  },
  transaction: {
    hash: string,
    timestamp: number,
    from: WalletInfo,
    to: WalletInfo,
    value: number,
    valueUsd: number,
    gasUsed: number,
    blockNumber: number
  },
  aiSummary: string,
  detectedAt: number,
  tags: string[],
  historicalContext?: {
    similarAlertsCount: number,
    walletPreviousActivity: number,
    timeframe: string
  }
}
```

## Usage

### Filtering

The dashboard supports multiple filter combinations:
- **Chains**: Toggle specific blockchain networks
- **Alert Types**: Select alert categories
- **Severity**: Filter by impact level
- **Search**: Find by token symbol, name, or transaction hash

### View Modes

- **Grid View**: Card-based layout for desktop
- **List View**: Compact layout for scanning

### Alert Details

Click "View Details" on any alert to see:
- Complete transaction information
- Wallet details with labels
- Historical context and patterns
- Direct links to blockchain explorers
- One-click copy for addresses and hashes

## Offline Mode

If Firestore connection fails, the dashboard automatically:
- Shows mock data for demonstration
- Displays a connection status indicator
- Continues to function with local data

## Performance

- **Optimistic Updates**: Instant UI updates during filter changes
- **Efficient Queries**: Client-side filtering combined with Firestore indexes
- **Lazy Loading**: Components load on demand
- **Responsive Images**: Adaptive rendering for different screen sizes

## Development

### File Structure

```
src/
├── components/
│   └── dashboard/
│       ├── Dashboard.tsx           # Main dashboard container
│       ├── AlertCard.tsx          # Alert summary card
│       ├── AlertDetailModal.tsx   # Detailed alert view
│       ├── FilterPanel.tsx        # Filter controls
│       ├── SeverityBadge.tsx     # Severity indicator
│       ├── TrendMeter.tsx        # Price trend display
│       ├── DashboardStats.tsx    # Stats overview
│       └── index.ts              # Exports
├── hooks/
│   └── useAlerts.ts              # Firestore alerts hook
├── lib/
│   └── firebase.ts               # Firebase configuration
├── types/
│   └── dashboard.ts              # TypeScript types
└── utils/
    └── formatters.ts             # Utility functions
```

### Adding New Features

1. **New Alert Type**: Add to `AlertType` in `types/dashboard.ts` and update `alertTypeConfig` in `AlertCard.tsx`
2. **New Chain**: Add to `Chain` type and update `chains` array in `FilterPanel.tsx`
3. **New Metric**: Add to `DashboardStats` type and create stat card in `DashboardStats.tsx`

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast mode compatible
- Focus indicators on interactive elements
