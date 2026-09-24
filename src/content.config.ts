import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Each problem lives in problems/<id>-<slug>/index.md, next to its solution file(s).
const problems = defineCollection({
	loader: glob({
		base: './problems',
		pattern: '*/index.md',
		generateId: ({ entry }) => entry.split('/')[0],
	}),
	schema: z.object({
		id: z.number().int().positive(),
		title: z.string(),
		description: z.string().optional(),
		link: z.url(),
		difficulty: z.enum(['Easy', 'Medium', 'Hard']),
		tags: z.array(z.string()).default([]),
		solved: z.coerce.date(),
		complexity: z
			.object({
				time: z.string(),
				space: z.string(),
			})
			.optional(),
	}),
});

// Each utility lives in utilities/<slug>/index.md: a problem-agnostic concept, next to its code file(s).
const utilities = defineCollection({
	loader: glob({
		base: './utilities',
		pattern: '*/index.md',
		generateId: ({ entry }) => entry.split('/')[0],
	}),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		tags: z.array(z.string()).default([]),
	}),
});

export const collections = { problems, utilities };
