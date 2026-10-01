import { Canvas, Cell, RowLabel, SubLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface AsteroidsInput {
	asteroids: number[];
}

type Phase = 'start' | 'push' | 'equal' | 'bigger' | 'smaller' | 'done';
type Row = 'input' | 'stack';

interface Place {
	row: Row;
	column: number;
}

interface CollisionStep extends Step {
	phase: Phase;
	current: number;
	stack: number[];
	places: Place[];
	destroyed: number[];
	destroyedNow: number[];
	opponent: number;
}

type CollisionSceneProps = SceneProps<AsteroidsInput, CollisionStep>;

const MAX_ASTEROIDS = 10;
const MAX_SIZE = 99;
const INPUT_TOP = 30;
const STACK_TOP = 140;

const LINE_STACK = 3;
const LINE_FOR = 5;
const LINE_ASSIGN = 6;
const LINE_WHILE = 7;
const LINE_EQUAL_CHECK = 8;
const LINE_EQUAL_IGNORE = 9;
const LINE_EQUAL_POP = 10;
const LINE_BIGGER_CHECK = 11;
const LINE_BIGGER_POP = 12;
const LINE_ELSE = 13;
const LINE_SMALLER_IGNORE = 14;
const LINE_SURVIVED_CHECK = 16;
const LINE_PUSH = 17;
const LINE_RETURN = 19;

const asteroidText = (value: number) => (value > 0 ? `${value}→` : `←${-value}`);
const stackText = (asteroids: number[], stack: number[]) => `[${stack.map((index) => asteroids[index]).join(', ')}]`;

function buildSteps({ asteroids }: AsteroidsInput): CollisionStep[] {
	const steps: CollisionStep[] = [];
	const stack: number[] = [];
	const places: Place[] = asteroids.map((_, column) => ({ row: 'input', column }));
	const destroyed: number[] = [];

	const snapshot = (phase: Phase, current: number, destroyedNow: number[], highlightedLines: number[], narration: string, opponent = -1) =>
		steps.push({
			phase,
			current,
			stack: [...stack],
			places: places.map((place) => ({ ...place })),
			destroyed: [...destroyed],
			destroyedNow,
			opponent,
			readout: { asteroid: current >= 0 && current < asteroids.length ? asteroidText(asteroids[current]) : '–', 'stack size': stack.length },
			highlightedLines,
			narration,
		});

	snapshot('start', -1, [], [LINE_STACK], `<code>stack</code> holds the survivors so far. Arrows show direction: 5→ moves right, ←5 moves left.`);

	asteroids.forEach((value, index) => {
		const name = asteroidText(value);
		let alive = true;
		let collided = false;
		while (value < 0 && stack.length > 0 && asteroids[stack[stack.length - 1]] > 0) {
			const entry = collided ? [LINE_WHILE] : [LINE_FOR, LINE_ASSIGN, LINE_WHILE];
			collided = true;
			const top = stack[stack.length - 1];
			const topValue = asteroids[top];
			places[index] = { row: 'stack', column: stack.length };
			if (-value === topValue) {
				stack.pop();
				destroyed.push(index, top);
				alive = false;
				snapshot('equal', index, [index, top], [...entry, LINE_EQUAL_CHECK, LINE_EQUAL_IGNORE, LINE_EQUAL_POP], `${name} meets ${asteroidText(topValue)}: same size, so both explode.`, top);
				break;
			}
			if (-value > topValue) {
				stack.pop();
				destroyed.push(top);
				snapshot(
					'bigger',
					index,
					[top],
					[...entry, LINE_EQUAL_CHECK, LINE_BIGGER_CHECK, LINE_BIGGER_POP],
					`${name} meets ${asteroidText(topValue)}: ${-value} is bigger than ${topValue}, so ${asteroidText(topValue)} explodes and ${name} keeps flying left.`,
					top,
				);
				continue;
			}
			destroyed.push(index);
			alive = false;
			snapshot(
				'smaller',
				index,
				[index],
				[...entry, LINE_EQUAL_CHECK, LINE_BIGGER_CHECK, LINE_ELSE, LINE_SMALLER_IGNORE],
				`${name} meets ${asteroidText(topValue)}: ${topValue} is bigger than ${-value}, so ${name} explodes and ${asteroidText(topValue)} stays.`,
				top,
			);
			break;
		}
		if (!alive) return;

		const topValue = stack.length > 0 ? asteroids[stack[stack.length - 1]] : undefined;
		const reason =
			value > 0
				? `${name} moves right. Nothing can hit it until a left-mover arrives, so it goes on the stack.`
				: topValue === undefined
					? `${name} moves left with nothing left of it${collided ? ' anymore' : ''}, so it flies away safely and goes on the stack.`
					: `${name} moves left, and so does the top, ${asteroidText(topValue)}. They never meet, so ${name} goes on the stack.`;
		places[index] = { row: 'stack', column: stack.length };
		stack.push(index);
		snapshot('push', index, [], collided ? [LINE_WHILE, LINE_SURVIVED_CHECK, LINE_PUSH] : [LINE_FOR, LINE_ASSIGN, LINE_WHILE, LINE_SURVIVED_CHECK, LINE_PUSH], reason);
	});

	snapshot(
		'done',
		asteroids.length,
		[],
		[LINE_RETURN],
		stack.length > 0 ? `Every collision is resolved. The survivors, left to right, are <b>${stackText(asteroids, stack)}</b>.` : `Every asteroid exploded, so the answer is <b>[]</b>.`,
	);
	return steps;
}

function CollisionScene({ input: { asteroids }, step }: CollisionSceneProps) {
	const { phase, current, stack, places, destroyed, destroyedNow, opponent } = step;
	const toneOf = (index: number) => {
		if (destroyedNow.includes(index)) return 'remove';
		if (phase === 'done') return 'focus';
		if (index === current) return phase === 'push' ? 'add' : 'focus';
		if (index === opponent) return 'focus';
		return 'plain';
	};

	return (
		<Canvas columns={asteroids.length} height={250}>
			{asteroids.map((_, index) => (
				<SubLabel key={`index-${index}`} column={index} top={INPUT_TOP - 22}>
					{index}
				</SubLabel>
			))}
			<RowLabel top={INPUT_TOP + 16}>
				<code>asteroids</code>
			</RowLabel>
			<RowLabel top={STACK_TOP + 16}>
				<code>stack</code>
			</RowLabel>
			{asteroids.map((value, index) => (
				<Cell
					key={`asteroid-${index}`}
					value={asteroidText(value)}
					column={places[index].column}
					top={places[index].row === 'input' ? INPUT_TOP : STACK_TOP}
					tone={toneOf(index)}
					hidden={destroyed.includes(index) && !destroyedNow.includes(index)}
				/>
			))}
			<Tag column={Math.max(0, stack.length - 1)} top={STACK_TOP + 66} tone="add" hidden={stack.length === 0 || phase === 'done'}>
				top
			</Tag>
		</Canvas>
	);
}

export default defineExplainer<AsteroidsInput, CollisionStep>({
	title: 'Left-movers work down a stack of right-movers',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'The survivors, as a stack',
			subtitle: 'Each asteroid drops from the row above toward the stack. Teal marks the two in a collision, red what explodes, green a push.',
			Scene: CollisionScene,
		},
	],
	examples: [
		{ input: { asteroids: [5, 10, -5] }, note: 'LeetCode example 1' },
		{ input: { asteroids: [8, -8] }, note: 'LeetCode example 2: equal sizes' },
		{ input: { asteroids: [10, 2, -5] }, note: 'LeetCode example 3: a chain of collisions' },
		{ input: { asteroids: [-2, -1, 1, 2] }, note: 'Moving apart: nothing collides' },
		{ input: { asteroids: [1, -2, -2, -2] }, note: 'One right-mover, then a flight of left-movers' },
	],
	fields: [{ name: 'asteroids', label: 'Your own asteroids', placeholder: 'e.g. 10, 2, -5' }],
	describe: ({ asteroids }) => `[${asteroids.join(', ')}]`,
	parse(values) {
		const parts = values.asteroids.split(/[\s,]+/).filter(Boolean);
		const asteroids = parts.map(Number);
		if (parts.length < 2) return { error: 'Enter at least two asteroids, separated by commas or spaces.' };
		if (asteroids.some((value) => !Number.isInteger(value) || value === 0 || Math.abs(value) > MAX_SIZE)) return { error: `Use non-zero whole numbers from −${MAX_SIZE} to ${MAX_SIZE}: positive moves right, negative moves left.` };
		if (asteroids.length > MAX_ASTEROIDS) return { error: `Use ${MAX_ASTEROIDS} asteroids or fewer so everything fits on screen.` };
		return { input: { asteroids } };
	},
	steps: buildSteps,
});
