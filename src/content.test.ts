import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

function readFrontmatter(relPath: string) {
  const full = path.join(process.cwd(), relPath);
  const raw = fs.readFileSync(full, 'utf-8');
  return matter(raw).data;
}

describe('content frontmatter', () => {
  it('hero has headline, subtitle, cta_text', () => {
    const fm = readFrontmatter('src/content/hero/hero.md');
    expect(fm.headline).toBeTypeOf('string');
    expect(fm.subtitle).toBeTypeOf('string');
    expect(fm.cta_text).toBeTypeOf('string');
  });

  it('contatti has address, phones, email, hours', () => {
    const fm = readFrontmatter('src/content/contatti/info.md');
    expect(fm.address).toBeTypeOf('string');
    expect(fm.email).toBeTypeOf('string');
    expect(Array.isArray(fm.phones)).toBe(true);
    expect(Array.isArray(fm.hours)).toBe(true);
    expect(fm.hours[0]).toHaveProperty('days');
    expect(fm.hours[0]).toHaveProperty('time');
  });

  it.each(['fisioterapia', 'nutrizione'])('servizio %s has title, description, order', (slug) => {
    const fm = readFrontmatter(`src/content/servizi/${slug}.md`);
    expect(fm.title).toBeTypeOf('string');
    expect(fm.description).toBeTypeOf('string');
    expect(fm.order).toBeTypeOf('number');
  });

  it.each(['alessandro-lanza', 'vanessa-bernardo'])('team member %s has name, role, bio, order', (slug) => {
    const fm = readFrontmatter(`src/content/team/${slug}.md`);
    expect(fm.name).toBeTypeOf('string');
    expect(fm.role).toBeTypeOf('string');
    expect(fm.bio).toBeTypeOf('string');
    expect(fm.order).toBeTypeOf('number');
  });
});
