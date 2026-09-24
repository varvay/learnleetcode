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

export const collections = { problems };
