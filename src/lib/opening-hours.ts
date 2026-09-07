type HourRange = { days: string; time: string };

const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

function dayMatches(daysLabel: string, dayName: string): boolean {
  const normalized = daysLabel.toLowerCase();
  if (normalized.includes(' - ')) {
    const [startLabel, endLabel] = normalized.split(' - ').map((s) => s.trim());
    const startIdx = DAY_NAMES.indexOf(startLabel);
    const endIdx = DAY_NAMES.indexOf(endLabel);
    const dayIdx = DAY_NAMES.indexOf(dayName);
    if (startIdx === -1 || endIdx === -1 || dayIdx === -1) return false;
    // Only supports non-wrapping ranges (e.g. lunedì - venerdì), which covers this studio's hours.
    return dayIdx >= startIdx && dayIdx <= endIdx;
  }
  return normalized.includes(dayName);
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isStudioOpen(hours: HourRange[], now: Date): boolean {
  const dayName = DAY_NAMES[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return hours.some((range) => {
    if (!dayMatches(range.days, dayName)) return false;
    const [startLabel, endLabel] = range.time.split(' - ').map((s) => s.trim());
    const start = timeToMinutes(startLabel);
    const end = timeToMinutes(endLabel);
    return nowMinutes >= start && nowMinutes < end;
  });
}
