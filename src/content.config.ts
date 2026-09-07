import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const hero = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/hero' }),
  schema: z.object({
    headline: z.string(),
    subtitle: z.string(),
    cta_text: z.string(),
  }),
});

const contatti = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/contatti' }),
  schema: z.object({
    address: z.string(),
    phones: z.array(z.string()),
    email: z.string().email(),
    hours: z.array(z.object({ days: z.string(), time: z.string() })),
  }),
});

const servizi = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/servizi' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    order: z.number(),
  }),
});

export const collections = { hero, contatti, servizi, team };
