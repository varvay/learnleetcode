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

const topicSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	tags: z.array(z.string()).default([]),
});

// Each concept lives in concepts/<slug>/index.md: an algorithm or technique, next to its code file(s).
const concepts = defineCollection({
	loader: glob({
		base: './concepts',
		pattern: '*/index.md',
		generateId: ({ entry }) => entry.split('/')[0],
	}),
	schema: topicSchema,
});

// Each utility lives in utilities/<slug>/index.md: how a language or library feature behaves, next to its code file(s).
const utilities = defineCollection({
	loader: glob({
		base: './utilities',
		pattern: '*/index.md',
		generateId: ({ entry }) => entry.split('/')[0],
	}),
	schema: topicSchema,
});

// Each approach box lives in <folder>/approach-*.md, next to the problem, concept or utility it reasons toward.
const approaches = defineCollection({
	loader: glob({
		base: '.',
		pattern: ['problems/*/approach-*.md', 'concepts/*/approach-*.md', 'utilities/*/approach-*.md'],
		generateId: ({ entry }) => entry,
	}),
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = { problems, concepts, utilities, approaches };
