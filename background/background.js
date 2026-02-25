// background.js

const ALARM_NAME = 'checkPrice';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Gold Price Monitor installed');
  
  // Set up alarm for periodic updates (every 60 minutes)
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: 60
  });
  
  // Initial check
  checkPrice().catch(console.error);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkPrice().catch(console.error);
  }
});

async function checkPrice() {
  try {
    const url = chrome.runtime.getURL('data/gold_price_history.json');
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.records && data.records.length > 0) {
      // Sort to find latest
      const records = data.records.sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = records[0];
      
      updateBadge(latest.price, latest.change);
    }
  } catch (error) {
    console.error('Error fetching price:', error);
  }
}

function updateBadge(price, change) {
  if (!price) return;
  
  const text = Math.round(price).toString();
  chrome.action.setBadgeText({ text });
  
  // Color based on change (Green for up, Red for down, Gray for neutral)
  let color = '#9CA3AF';
  if (change > 0) color = '#10B981';
  if (change < 0) color = '#EF4444';
  
  chrome.action.setBadgeBackgroundColor({ color });
}
