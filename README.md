# AggroSwap - Cross-Chain Liquidity Aggregator

A Base Mini App that provides optimal cross-chain swaps through liquidity aggregation across multiple DEXs and bridges.

## Features

- **Optimal Liquidity Aggregation**: Find the best rates across multiple DEXs
- **Cross-Chain Support**: Seamless swaps between EVM-compatible chains
- **Smart Account Integration**: Gas abstraction and relay support
- **Real-time Quotes**: Live pricing with minimal slippage
- **User-Friendly Interface**: Intuitive swap experience

## Supported Chains

- Base
- Ethereum
- Polygon
- Arbitrum

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

3. Add your API keys to `.env.local`:
```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key_here
NEXT_PUBLIC_MINIKIT_API_KEY=your_minikit_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Blockchain**: MiniKit + OnchainKit for Base integration
- **State Management**: React hooks with TypeScript

## Core Components

- `SwapForm`: Main swap interface with token/chain selection
- `AssetSelector`: Token selection dropdown
- `ChainSelector`: Blockchain network selector
- `TransactionStatusIndicator`: Real-time swap status updates

## Business Model

- 0.1% fee on successful swaps (minimum $0.50)
- Premium API access at $29/month
- Gas relay services for enhanced UX

## Development

The app follows a modular architecture with:

- Type-safe interfaces for all data models
- Responsive design with mobile-first approach
- Error handling and loading states
- Real-time quote fetching with debouncing
- Cross-chain transaction simulation

## License

MIT License - see LICENSE file for details.
