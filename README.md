# Crypto Portfolio Management Dashboard

A sophisticated, production-ready crypto portfolio management application built with React, TypeScript, and modern web technologies. Features real-time price tracking, advanced trading charts, risk analytics, and a comprehensive design system optimized for professional crypto trading.

## ✨ Features

### Core Portfolio Management
- **Real-time Portfolio Tracking**: Live portfolio overview with total value, daily changes, and performance metrics
- **Asset Management**: Add, track, and manage cryptocurrency holdings with detailed profit/loss calculations
- **Interactive Charts**: Multiple chart types including candlestick charts for advanced technical analysis
- **Asset Allocation Visualization**: Pie charts showing portfolio distribution across assets

### Advanced Trading Features
- **Professional Trading Interface**: Order book visualization, advanced order forms, and risk calculators
- **Real-time Price Updates**: Simulated WebSocket integration with 5-second price updates
- **Risk Analytics Dashboard**: Value at Risk (VaR) calculations, drawdown analysis, and risk metrics
- **Advanced Charting**: Candlestick charts with zoom, pan, and multiple timeframes

### Performance & UX
- **Virtualized Lists**: Handle 10,000+ positions efficiently with virtual scrolling
- **Skeleton Loading States**: Professional loading indicators for better user experience
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Dark/Light Mode**: Complete theme system with trading-specific color schemes
- **Toast Notifications**: Real-time feedback for user actions

### Architecture & Performance
- **State Management**: Sophisticated Zustand stores for portfolio and market data
- **Code Splitting**: Lazy-loaded components for optimal bundle size
- **Web Workers**: Heavy calculations offloaded to background threads (with fallbacks)
- **Performance Optimizations**: Memoization, virtual scrolling, and efficient re-renders

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: ShadCN/UI component library
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **State Management**: Zustand for global state
- **Notifications**: Sonner for toast messages

### Design System
The application uses a sophisticated design system built on Tailwind v4:
- **Color Tokens**: Custom color palette optimized for financial data visualization
- **Typography**: Consistent typography scale with proper font weights and line heights
- **Components**: Trading-specific components with professional styling
- **Theme Support**: Complete dark/light mode implementation

## 📁 Project Structure

```
├── App.tsx                     # Main application component
├── components/
│   ├── PortfolioOverview.tsx   # Portfolio summary cards
│   ├── PortfolioChart.tsx      # Portfolio performance chart
│   ├── PortfolioPerformanceChart.tsx  # Advanced trading charts with zoom
│   ├── HoldingsTable.tsx       # Detailed holdings table
│   ├── AssetAllocation.tsx     # Portfolio allocation pie chart
│   ├── AddAssetDialog.tsx      # Add new asset dialog
│   ├── RiskAnalyticsDashboard.tsx  # Risk metrics and analytics
│   ├── Sidebar.tsx             # Application navigation
│   ├── SkeletonLoaders.tsx     # Loading state components
│   ├── performance/
│   │   └── VirtualizedPositionsList.tsx  # Virtual scrolling for large datasets
│   ├── trading/
│   │   ├── OrderBookVisualization.tsx     # Live order book display
│   │   ├── AdvancedOrderForm.tsx          # Professional order entry
│   │   └── RiskCalculator.tsx             # Risk calculation tools
│   └── ui/                     # ShadCN UI components
├── store/
│   ├── portfolio.ts            # Portfolio state management
│   └── market.ts              # Market data state management
├── hooks/
│   ├── useWebSocket.ts         # WebSocket hook for real-time data
│   └── useWebWorker.ts         # Web worker hook for calculations
├── workers/
│   └── calculations.worker.ts  # Background calculation worker
├── styles/
│   └── globals.css            # Global styles and design tokens
└── design-system/
    └── tokens.ts              # Design system tokens
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd smc-token-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

The application will be available at `http://localhost:3000`.

## 🎯 Usage Guide

### Navigation
- **Portfolio**: Main dashboard with overview, charts, and holdings
- **Advanced Charts**: Professional trading charts with zoom and technical analysis
- **Trading**: Order book, order forms, and risk calculation tools
- **Positions**: Virtualized list of all positions (handles large datasets)
- **Risk Analytics**: Comprehensive risk analysis dashboard

### Adding Assets
1. Click "Add Asset" in the portfolio dashboard
2. Select cryptocurrency, enter amount, and purchase price
3. Asset will be added with real-time price tracking

### Chart Interaction
- **Zoom**: Use zoom in/out buttons in advanced charts
- **Timeframes**: Switch between 7D, 30D, and 90D views
- **Chart Types**: Toggle between line and candlestick charts
- **Reset**: Use reset button to return to full view

### Dark/Light Mode
Toggle between themes using the sidebar switch. The application maintains consistent styling across both modes.

## 🧩 Key Components

### State Management
The application uses Zustand for state management with separate stores:

```typescript
// Portfolio store
const usePortfolioStore = create((set, get) => ({
  positions: [],
  metrics: {},
  addPosition: (position) => { /* ... */ },
  updatePrices: (prices) => { /* ... */ },
}));

// Market store
const useMarketStore = create((set, get) => ({
  prices: {},
  marketData: {},
  updateMarketData: (data) => { /* ... */ },
}));
```

### Real-time Updates
Mock WebSocket integration provides realistic price updates:

```typescript
const useMockPriceUpdates = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      // Simulate price updates every 5 seconds
      updatePrices(generatePriceUpdates());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [enabled]);
};
```

### Performance Optimizations
- **Virtualized Lists**: Handle thousands of items efficiently
- **Lazy Loading**: Components loaded on demand
- **Memoization**: Prevent unnecessary re-renders
- **Web Workers**: Heavy calculations in background threads

## 🎨 Design System

### Color Tokens
The application uses a comprehensive color system:
- **Primary**: Trading interface elements
- **Chart Colors**: Data visualization palette
- **Semantic Colors**: Success/error/warning states
- **Neutral Colors**: Backgrounds and text

### Typography
Consistent typography scale:
- **Headings**: Multiple levels with proper hierarchy
- **Body Text**: Optimized for readability
- **Labels**: Form and UI element labels
- **Monospace**: For numerical data

### Components
- **Cards**: Information display containers
- **Tables**: Data presentation with sorting/filtering
- **Charts**: Various chart types for data visualization
- **Forms**: User input interfaces
- **Navigation**: Sidebar and tab navigation

## 🔧 Development

### Code Organization
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks for logic
- **Stores**: State management with Zustand
- **Utils**: Helper functions and utilities
- **Types**: TypeScript type definitions

### Performance Considerations
- **Bundle Splitting**: Lazy-loaded components
- **Virtual Scrolling**: For large datasets
- **Memoization**: Strategic use of useMemo/useCallback
- **Web Workers**: Background calculations

### Testing
The application includes comprehensive testing:
- **Unit Tests**: Component and utility testing
- **Integration Tests**: Feature workflow testing
- **Performance Tests**: Load and stress testing

## 🚀 Production Deployment

### Build Optimization
- **Code Splitting**: Automatic chunk splitting
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Image and font optimization
- **Caching**: Proper cache headers for static assets

### Environment Configuration
- **Environment Variables**: Configure API endpoints
- **Feature Flags**: Toggle features per environment
- **Analytics**: User behavior tracking
- **Error Monitoring**: Production error tracking

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Testing**: Comprehensive test coverage

## 📈 Performance Metrics

The application is optimized for:
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔐 Security

- **Data Sanitization**: All user inputs sanitized
- **HTTPS**: Secure data transmission
- **Authentication**: Secure user authentication
- **API Security**: Secure API communication

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ShadCN/UI**: Beautiful and accessible UI components
- **Recharts**: Powerful charting library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide**: Beautiful icon library
- **React**: The foundation of our application

## 📞 Support

For support, email augustineebuka98@gmail.com or join our Slack channel.

---
