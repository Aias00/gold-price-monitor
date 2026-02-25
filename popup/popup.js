import { formatCurrency, formatChange, formatPercent, formatDate } from '../utils/helpers.js';
import { GoldChart } from './chart.js';

document.addEventListener('DOMContentLoaded', async () => {
  const refreshBtn = document.getElementById('refreshBtn');
  const currentPriceEl = document.getElementById('currentPrice');
  const priceChangeEl = document.getElementById('priceChange');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  const historyBody = document.getElementById('historyBody');
  
  let chartInstance = null;

  try {
    chartInstance = new GoldChart('trendChart');
  } catch (e) {
    console.error('Failed to initialize chart:', e);
  }

  async function loadData() {
    try {
      // Show loading state
      currentPriceEl.textContent = 'Loading...';
      priceChangeEl.textContent = '--';
      
      const response = await chrome.runtime.sendMessage({
        type: 'GET_GOLD_PRICE_DATA',
        forceRefresh: true
      });

      if (!response?.ok || !response.data) {
        throw new Error(response?.error || 'Failed to load live data');
      }

      const data = response.data;
      renderData(data);
    } catch (error) {
      console.error('Error loading data:', error);
      currentPriceEl.textContent = 'Error';
    }
  }

  function renderData(data) {
    if (!data || !data.records || data.records.length === 0) {
      currentPriceEl.textContent = 'No Data';
      return;
    }

    // Sort records by date descending (newest first)
    // Create a copy to avoid mutation issues if any
    const records = [...data.records].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = records[0];

    // 1. Update Current Price Card
    currentPriceEl.textContent = formatCurrency(latest.price);
    
    // Change
    const changeVal = parseFloat(latest.change);
    const changeText = `${formatChange(latest.change)} (${formatPercent(latest.change_percent)})`;
    priceChangeEl.textContent = changeText;
    
    // Color
    let changeClass = 'neutral';
    if (changeVal > 0) changeClass = 'up';
    if (changeVal < 0) changeClass = 'down';
    priceChangeEl.className = 'price-change ' + changeClass;

    // Last Updated
    lastUpdatedEl.textContent = `Updated: ${latest.timestamp || latest.date}`;

    // 2. Render Chart (Last 7 days, chronological order)
    if (chartInstance) {
      // Get last 7 days from records (which are sorted desc)
      // We need to reverse them to be chronological for the chart
      const chartRecords = records.slice(0, 7).reverse();
      
      const chartData = chartRecords.map(record => ({
        label: formatDate(record.date),
        value: record.price,
        dateFull: record.date
      }));
      
      chartInstance.render(chartData);
      
      // Stats
      if (chartData.length > 0) {
        const prices = chartData.map(d => d.value);
        const max = Math.max(...prices);
        const min = Math.min(...prices);
        
        // Update stats UI
        const statsContainer = document.querySelector('.chart-stats');
        if (statsContainer) {
             statsContainer.innerHTML = `
            <span>High: <span style="color:#FFD700">${formatCurrency(max)}</span></span>
            <span>Low: <span style="color:#9CA3AF">${formatCurrency(min)}</span></span>
          `;
        }
      }
    }

    // 3. Render History Table
    historyBody.innerHTML = '';
    records.slice(0, 30).forEach(record => { // Show last 30 records
      const row = document.createElement('tr');
      const change = parseFloat(record.change);
      const changeColor = change > 0 ? '#10B981' : (change < 0 ? '#EF4444' : '#9CA3AF');
      
      row.innerHTML = `
        <td style="color:#9CA3AF">${formatDate(record.date)}</td>
        <td style="color:#FFD700; font-weight:bold;">${formatCurrency(record.price)}</td>
        <td style="color:${changeColor}">
            ${formatChange(record.change)} 
            <span class="change-percent" style="font-size:10px; opacity:0.8">(${formatPercent(record.change_percent)})</span>
        </td>
      `;
      historyBody.appendChild(row);
    });
    
    // Update Badge
    updateBadge(latest.price);
  }

  function updateBadge(price) {
    if (chrome.action) {
      chrome.action.setBadgeText({ text: Math.round(price).toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#FFD700' });
    }
  }

  refreshBtn.addEventListener('click', () => {
      // Add rotation animation
      refreshBtn.style.transform = 'rotate(360deg)';
      setTimeout(() => refreshBtn.style.transform = 'none', 500);
      loadData();
  });

  // Initial load
  loadData();
});
