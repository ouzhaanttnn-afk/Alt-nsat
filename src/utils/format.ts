export function formatTl(value: number): string {
  return `${Math.round(value).toLocaleString('tr-TR')}₺`;
}

export function formatGram(value: number): string {
  return `${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} g`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '↑' : '↓';
  return `${sign} %${Math.abs(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
}

export function formatGameTime(minuteOfDay: number): string {
  const totalMinutes = Math.floor(minuteOfDay);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
