import { describe, it, expect } from 'vitest';
import { getActiveSection } from './scroll-utils';

const sections = [
  { id: 'home', top: 0 },
  { id: 'servizi', top: 800 },
  { id: 'team', top: 1600 },
  { id: 'contatti', top: 2400 },
];

describe('getActiveSection', () => {
  it('returns the first section at scrollY 0', () => {
    expect(getActiveSection(sections, 0)).toBe('home');
  });

  it('returns the section whose top is the closest one at or before scrollY', () => {
    expect(getActiveSection(sections, 850)).toBe('servizi');
  });

  it('returns the last section when scrolled past all tops', () => {
    expect(getActiveSection(sections, 5000)).toBe('contatti');
  });

  it('returns the first section id when sections list has one entry', () => {
    expect(getActiveSection([{ id: 'only', top: 0 }], 300)).toBe('only');
  });
});
