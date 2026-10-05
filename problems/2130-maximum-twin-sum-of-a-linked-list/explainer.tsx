import { Canvas, Cell, ColumnMarker, RowLabel, SubLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface ListInput {
	values: number[];
}

type Phase = 'start' | 'find' | 'found' | 'flip' | 'reversed' | 'init' | 'pair' | 'done';

interface TwinStep extends Step {
	phase: Phase;
	slow: number;
	fast: number;
	reversed: number;
	pair: number;
	bestPair: number;
}

type TwinSceneProps = SceneProps<ListInput, TwinStep>;

const MAX_NODES = 10;
const MAX_VALUE = 999;
const FRONT_TOP = 60;
const BACK_TOP = 210;
const NONE = -1;

const LINE_INIT_POINTERS = 8;
const LINE_WHILE_FAST = 9;
const LINES_STEP_POINTERS = [10, 11];
const LINE_INIT_PREV = 13;
const LINE_WHILE_SLOW = 14;
const LINES_FLIP = [15, 16, 17, 18];
const LINES_INIT_SUM = [20, 21];
const LINE_WHILE_BACK = 22;
const LINES_SUM = [23, 24, 25];
const LINE_RETURN = 26;

const isSummingPhase = (phase: Phase) => phase === 'init' || phase === 'pair' || phase === 'done';
const isFindingPhase = (phase: Phase) => phase === 'start' || phase === 'find' || phase === 'found';

function buildSteps({ values }: ListInput): TwinStep[] {
	const steps: TwinStep[] = [];
	const n = values.length;
	const half = n / 2;
	const twinSum = (index: number) => values[index] + values[n - 1 - index];
	let slow = 0;
	let fast = 0;
	let reversed = 0;
	let best = 0;
	let bestPair = NONE;

	const snapshot = (phase: Phase, pair: number, highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			slow,
			fast,
			reversed,
			pair,
			bestPair,
			readout: { 'twin sum': pair === NONE ? '–' : twinSum(pair), best: isSummingPhase(phase) ? best : '–' },
			highlightedLines,
			narration,
		});

	snapshot('start', NONE, [LINE_INIT_POINTERS], `n = ${n}, so node i's twin is node ${n - 1} − i. <code>slow</code> and <code>fast</code> both start at the head to find where the second half begins.`);

	while (fast < n) {
		slow += 1;
		fast += 2;
		snapshot('find', NONE, [LINE_WHILE_FAST, ...LINES_STEP_POINTERS], `<code>slow</code> moves one node, to index ${slow}, and <code>fast</code> two, to ${fast >= n ? 'None' : `index ${fast}`}.`);
	}
	snapshot('found', NONE, [LINE_WHILE_FAST], `<code>fast</code> is None, so <code>slow</code> is at index ${half}, the first node of the second half.`);

	for (let index = half; index < n; index++) {
		reversed += 1;
		slow = index + 1;
		const target = index === half ? 'None' : `the ${values[index - 1]}`;
		snapshot(
			'flip',
			NONE,
			[...(reversed === 1 ? [LINE_INIT_PREV] : []), LINE_WHILE_SLOW, ...LINES_FLIP],
			`The ${values[index]} flips to point to ${target} and drops into the reversed half, under its twin, the ${values[n - 1 - index]}. <code>prev</code> moves to it, and <code>slow</code> moves on.`,
		);
	}
	snapshot('reversed', NONE, [LINE_WHILE_SLOW], `<code>slow</code> is None, so the second half is reversed. <code>prev</code> is the old last node, and every node now sits under its twin.`);

	snapshot('init', NONE, LINES_INIT_SUM, `<code>front</code> starts at the head and <code>back</code> at <code>prev</code>. They are twins, and stay twins as both move one node per turn.`);

	for (let pair = 0; pair < half; pair++) {
		const sum = twinSum(pair);
		const improved = sum > best;
		if (improved) {
			best = sum;
			bestPair = pair;
		}
		snapshot(
			'pair',
			pair,
			[LINE_WHILE_BACK, ...LINES_SUM],
			`${values[pair]} + ${values[n - 1 - pair]} = ${sum}. ${improved ? `That is a new best.` : `The best stays ${best}.`} <code>front</code> and <code>back</code> move ${pair === half - 1 ? 'on, and <code>back</code> reaches None' : 'to the next pair'}.`,
		);
	}

	snapshot('done', NONE, [LINE_WHILE_BACK, LINE_RETURN], `<code>back</code> is None after ${half} ${half === 1 ? 'pair' : 'pairs'}, so the function returns <b>${best}</b>.`);
	return steps;
}

function TwinScene({ input: { values }, step: { phase, slow, fast, reversed, pair, bestPair } }: TwinSceneProps) {
	const n = values.length;
	const half = n / 2;
	const isReversed = (index: number) => index >= half && index < half + reversed;
	const columnOf = (index: number) => (isReversed(index) ? n - 1 - index : index);
	const pairOf = (index: number) => Math.min(index, n - 1 - index);
	const justFlipped = phase === 'flip' ? half + reversed - 1 : NONE;
	const toneOf = (index: number) => {
		if (index === justFlipped) return 'add';
		if (phase === 'pair' && pairOf(index) === pair) return 'focus';
		if (phase === 'done' && pairOf(index) === bestPair) return 'focus';
		return 'plain';
	};
	const finding = isFindingPhase(phase);
	const reversing = phase === 'flip' || phase === 'reversed';
	const summing = phase === 'init' || phase === 'pair';
	const prevColumn = half - reversed;

	return (
		<Canvas columns={n + 1} height={BACK_TOP + 110}>
			<RowLabel top={FRONT_TOP + 16}>
				<code>head</code>
			</RowLabel>
			<RowLabel top={BACK_TOP + 16} hidden={reversed === 0}>
				reversed
			</RowLabel>
			{values.map((_, index) => (
				<SubLabel key={`index-${index}`} column={columnOf(index)} top={(isReversed(index) ? BACK_TOP : FRONT_TOP) - 22}>
					{index}
				</SubLabel>
			))}
			{values.map((value, index) => (
				<Cell key={`node-${index}`} value={value} column={columnOf(index)} top={isReversed(index) ? BACK_TOP : FRONT_TOP} tone={toneOf(index)} />
			))}
			<SubLabel column={n} top={FRONT_TOP + 18} hidden={!finding}>
				None
			</SubLabel>
			<ColumnMarker column={Math.max(0, pair)} top={FRONT_TOP - 30} height={BACK_TOP - FRONT_TOP + 92} label="twins" hidden={phase !== 'pair'} />
			<Tag column={Math.min(slow, n)} top={FRONT_TOP + 64} tone="add" hidden={!(finding || (reversing && slow < n))}>
				slow
			</Tag>
			<Tag column={Math.min(fast, n)} top={FRONT_TOP + 88} tone="add" hidden={!finding}>
				fast
			</Tag>
			<Tag column={Math.max(0, prevColumn)} top={BACK_TOP + 64} tone="add" hidden={!reversing}>
				prev
			</Tag>
			<Tag column={Math.max(0, pair)} top={FRONT_TOP + 64} tone="add" hidden={!summing}>
				front
			</Tag>
			<Tag column={Math.max(0, pair)} top={BACK_TOP + 64} tone="add" hidden={!summing}>
				back
			</Tag>
		</Canvas>
	);
}

export default defineExplainer<ListInput, TwinStep>({
	title: 'Fold the list, then sum straight down',
	codeFile: 'solution-3-reverse-half.py',
	stages: [
		{
			title: 'Find the middle, reverse the second half, walk both halves',
			subtitle: 'Numbers above the nodes are their original indices. Green is a node just flipped into the reversed half; teal marks the twins being summed, and at the end the best pair.',
			Scene: TwinScene,
		},
	],
	examples: [
		{ input: { values: [5, 4, 2, 1] }, note: 'LeetCode example 1' },
		{ input: { values: [4, 2, 2, 3] }, note: 'LeetCode example 2' },
		{ input: { values: [3, 1, 4, 1, 5, 9, 2, 6] }, note: 'Eight nodes' },
	],
	fields: [{ name: 'values', label: 'Your own list', placeholder: 'e.g. 5, 4, 2, 1' }],
	describe: ({ values }) => `[${values.join(', ')}]`,
	parse(values) {
		const parts = values.values.split(/[\s,]+/).filter(Boolean);
		const nodes = parts.map(Number);
		if (nodes.length < 2 || nodes.length % 2 !== 0) return { error: 'Enter an even number of node values, at least two, as LeetCode guarantees.' };
		if (nodes.some((value) => !Number.isInteger(value) || value < 1 || value > MAX_VALUE)) return { error: `Use whole numbers from 1 to ${MAX_VALUE} so they fit on screen.` };
		if (nodes.length > MAX_NODES) return { error: `Use ${MAX_NODES} nodes or fewer so everything fits on screen.` };
		return { input: { values: nodes } };
	},
	steps: buildSteps,
});
