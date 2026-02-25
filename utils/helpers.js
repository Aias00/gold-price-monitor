export function formatCurrency(value) {
  if (value === undefined || value === null) return '--';
  return '¥' + parseFloat(value).toFixed(2);
}

export function formatChange(value) {
  if (value === undefined || value === null) return '--';
  const num = parseFloat(value);
  const sign = num > 0 ? '+' : (num < 0 ? '-' : '');
  const abs = Math.abs(num);
  return `${sign}${abs.toFixed(2)}`;
}

export function formatPercent(value) {
  if (value === undefined || value === null) return '--';
  const num = parseFloat(value);
  const sign = num > 0 ? '+' : (num < 0 ? '-' : '');
  const abs = Math.abs(num);
  return `${sign}${abs.toFixed(2)}%`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '--';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}
