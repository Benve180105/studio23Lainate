import { describe, it, expect } from 'vitest';
import { isStudioOpen } from './opening-hours';

const hours = [
  { days: 'Lunedì - Venerdì', time: '16:00 - 20:00' },
  { days: 'Sabato', time: '08:00 - 12:00' },
];

describe('isStudioOpen', () => {
  it('is open on a weekday afternoon within range', () => {
    const wed5pm = new Date('2026-09-09T17:00:00'); // Wednesday
    expect(isStudioOpen(hours, wed5pm)).toBe(true);
  });

  it('is closed on a weekday morning', () => {
    const wed10am = new Date('2026-09-09T10:00:00');
    expect(isStudioOpen(hours, wed10am)).toBe(false);
  });

  it('is open on Saturday morning within range', () => {
    const sat9am = new Date('2026-09-12T09:00:00'); // Saturday
    expect(isStudioOpen(hours, sat9am)).toBe(true);
  });

  it('is closed on Sunday regardless of time', () => {
    const sun5pm = new Date('2026-09-13T17:00:00'); // Sunday
    expect(isStudioOpen(hours, sun5pm)).toBe(false);
  });
});
