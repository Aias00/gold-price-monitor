# Gold Price Monitor - Chrome Extension

Chrome extension to monitor Chinese domestic gold prices in real-time.

## Features

- **Real-time Price Display**: Shows current gold price in the toolbar icon.
- **Price Trend Chart**: Interactive 7-day price trend chart.
- **Historical Data**: View detailed daily price history.
- **Gold Theme**: Elegant gold-themed UI.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" in the top right corner.
3. Click "Load unpacked".
4. Select the `gold-price-monitor` folder.

## Usage

- Click the extension icon in the toolbar to see current price and trend.
- Hover over the chart to see daily prices.
- Scroll down in the popup to view historical data.
- The extension automatically checks for price updates every hour.

## Data Source

Data is read from `data/gold_price_history.json`. To update prices, modify this file.
The extension supports hot-reloading of data (click the refresh button in the popup).

## File Structure

- `manifest.json`: Extension configuration.
- `popup/`: Popup UI logic and styles.
- `background/`: Background service worker.
- `data/`: JSON data file.
- `utils/`: Helper functions.
- `icons/`: Extension icons.

## License

MIT
