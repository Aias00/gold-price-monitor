// background.js

const ALARM_NAME = 'checkPrice';
const STORAGE_KEY = 'gold_price_data';
const CACHE_TTL_MS = 60 * 1000;
const HISTORY_LIMIT = 60;

const SECID = '118.AU9999';
const EASTMONEY_UT = 'fa5fd1943c7b386f172d6893dbfba10b';
const SGE_CONTRACT = 'Au99.99';
const DATA_SOURCE = 'Realtime: Eastmoney AU9999, History: SGE Au99.99';

function getQuoteUrl() {
  const fields = 'f58,f43,f44,f45,f46,f60,f86';
  return `https://push2.eastmoney.com/api/qt/stock/get?secid=${SECID}&ut=${EASTMONEY_UT}&fields=${fields}`;
}

function getSgeDailyUrl(startDate, endDate) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    inst_ids: SGE_CONTRACT
  });

  return `https://www.sge.com.cn/sjzx/quotation_daily_new?${params.toString()}`;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Gold Price Monitor installed');
  ensureAlarm();
  checkPrice({ forceRefresh: true }).catch(console.error);
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  checkPrice({ forceRefresh: false }).catch(console.error);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkPrice({ forceRefresh: true }).catch(console.error);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'GET_GOLD_PRICE_DATA') {
    return false;
  }

  getGoldPriceData({ forceRefresh: Boolean(message.forceRefresh) })
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

function ensureAlarm() {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: 60
  });
}

async function checkPrice({ forceRefresh = false } = {}) {
  try {
    const data = await getGoldPriceData({ forceRefresh });
    const records = [...(data.records || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = records[0];

    if (latest) {
      updateBadge(latest.price, latest.change);
    }
  } catch (error) {
    console.error('Error fetching price:', error);
  }
}

async function getGoldPriceData({ forceRefresh = false } = {}) {
  const cached = await chrome.storage.local.get(STORAGE_KEY);
  const cachedValue = cached?.[STORAGE_KEY];
  const hasValidCache = cachedValue?.symbol === SECID && cachedValue?.data;

  if (
    !forceRefresh &&
    hasValidCache &&
    cachedValue?.fetchedAt &&
    Date.now() - cachedValue.fetchedAt < CACHE_TTL_MS
  ) {
    return cachedValue.data;
  }

  const baseRecords = hasValidCache ? cachedValue.data.records : [];

  try {
    const freshData = await fetchLiveGoldData(baseRecords);
    await chrome.storage.local.set({
      [STORAGE_KEY]: {
        fetchedAt: Date.now(),
        symbol: SECID,
        data: freshData
      }
    });
    return freshData;
  } catch (error) {
    if (hasValidCache) {
      return cachedValue.data;
    }
    throw error;
  }
}

async function fetchLiveGoldData(baseRecords = []) {
  const quotePayload = await fetchJson(getQuoteUrl());
  const quoteData = parseQuoteData(quotePayload);

  let historyRecords = [];
  try {
    const { startDate, endDate } = getRecentRange(30);
    const dailyHtml = await fetchText(getSgeDailyUrl(startDate, endDate));
    historyRecords = parseSgeDailyRecords(dailyHtml, SGE_CONTRACT);
  } catch (error) {
    // Keep popup usable when SGE history is temporarily unavailable.
    console.warn('History data fetch failed, fallback to cached/quote-only mode:', error);
  }

  const records = buildRecords(quoteData, historyRecords, baseRecords);
  if (records.length === 0) {
    throw new Error('No gold price records available from live source');
  }

  const latest = records[records.length - 1];
  return {
    records,
    unit: 'CNY/克',
    source: DATA_SOURCE,
    last_update: latest.timestamp
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'text/html,application/xhtml+xml,*/*'
    }
  });

  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }

  const text = await response.text();
  if (!text) {
    throw new Error(`Empty response for ${url}`);
  }

  return text;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json,text/plain,*/*'
    }
  });

  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }

  const text = await response.text();
  if (!text) {
    throw new Error(`Empty response for ${url}`);
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    throw new Error(`Invalid JSON response for ${url}`);
  }
}

function parseQuoteData(payload) {
  const data = payload?.data;
  if (!data) {
    throw new Error('Quote payload does not include data');
  }

  const currentPrice = toPrice(data.f43);
  if (!Number.isFinite(currentPrice)) {
    throw new Error('Invalid current price in quote payload');
  }

  const prevClose = toPrice(data.f60);
  const timestamp = formatChinaDateTime(data.f86) || `${formatChinaDate(new Date())} 15:00:00`;

  return {
    name: data.f58 || '黄金9999',
    currentPrice,
    prevClose: Number.isFinite(prevClose) ? prevClose : null,
    date: timestamp.slice(0, 10),
    timestamp
  };
}

function parseSgeDailyRecords(html, contract) {
  if (!html || !contract) return [];

  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  const recordsByDate = new Map();

  for (const rowMatch of rowMatches) {
    const rowHtml = rowMatch[1];
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      cleanHtmlText(cell[1])
    );

    if (cells.length < 7) continue;

    const contractIndex = cells.findIndex((cell) => cell === contract);
    if (contractIndex <= 0) continue;

    const date = normalizeDate(cells[contractIndex - 1]);
    const closePrice = toNumber(cells[contractIndex + 4]);
    if (!date || !Number.isFinite(closePrice) || closePrice <= 0) continue;

    recordsByDate.set(date, {
      date,
      price: roundTo(closePrice, 2),
      timestamp: `${date} 15:00:00`
    });
  }

  return Array.from(recordsByDate.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function cleanHtmlText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function getRecentRange(days) {
  const safeDays = Number.isFinite(days) ? Math.max(1, Math.floor(days)) : 30;
  const endDate = formatChinaDate(new Date());
  let startDate = endDate;

  for (let i = 0; i < safeDays; i += 1) {
    const previous = getPreviousDate(startDate);
    if (!previous) break;
    startDate = previous;
  }

  return { startDate, endDate };
}

function buildRecords(quoteData, historyRecords, baseRecords = []) {
  const records =
    historyRecords.length > 0
      ? [...historyRecords]
      : (baseRecords || [])
          .map((row) => ({
            date: row?.date,
            price: toNumber(row?.price),
            timestamp: row?.timestamp || `${row?.date || ''} 15:00:00`
          }))
          .filter((row) => row.date && Number.isFinite(row.price));

  const liveRecord = {
    date: quoteData.date,
    price: quoteData.currentPrice,
    timestamp: quoteData.timestamp
  };

  if (records.length > 0) {
    const existingIndex = records.findIndex((row) => row.date === liveRecord.date);
    if (existingIndex >= 0) {
      records[existingIndex] = liveRecord;
    } else {
      records.push(liveRecord);
    }
  } else {
    if (Number.isFinite(quoteData.prevClose)) {
      const previousDate = getPreviousDate(quoteData.date);
      if (previousDate) {
        records.push({
          date: previousDate,
          price: quoteData.prevClose,
          timestamp: `${previousDate} 15:00:00`
        });
      }
    }

    records.push(liveRecord);
  }

  records.sort((a, b) => new Date(a.date) - new Date(b.date));
  const trimmedRecords = records.slice(-HISTORY_LIMIT);

  return trimmedRecords.map((row, index) => {
    if (index === 0) {
      return { ...row, change: 0, change_percent: 0 };
    }

    const prev = trimmedRecords[index - 1];
    const change = row.price - prev.price;
    const changePercent = prev.price ? (change / prev.price) * 100 : 0;

    return {
      ...row,
      change: roundTo(change, 2),
      change_percent: roundTo(changePercent, 2)
    };
  });
}

function toPrice(value) {
  const n = Number.parseFloat(String(value).replace(/,/g, ''));
  if (!Number.isFinite(n)) return NaN;
  return n / 100;
}

function toNumber(value) {
  const n = Number.parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

function formatChinaDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(date);
}

function formatChinaDateTime(unixSeconds) {
  const seconds = Number.parseInt(unixSeconds, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  const date = new Date(seconds * 1000);
  const datePart = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

  const timePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);

  return `${datePart} ${timePart}`;
}

function getPreviousDate(dateStr) {
  if (!dateStr) return null;

  const parts = dateStr.split('-').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function roundTo(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function updateBadge(price, change) {
  if (!price) return;

  const text = Math.round(price).toString();
  chrome.action.setBadgeText({ text });

  let color = '#9CA3AF';
  if (change > 0) color = '#10B981';
  if (change < 0) color = '#EF4444';

  chrome.action.setBadgeBackgroundColor({ color });
}
