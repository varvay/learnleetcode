import { Canvas, Cell, RowLabel, SubLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface ListInput {
	values: number[];
}

type Phase = 'start' | 'init' | 'odd' | 'even' | 'stop' | 'link' | 'done';

interface ChainStep extends Step {
	phase: Phase;
	oddLinked: number;
	evenLinked: number;
	odd: number;
	even: number;
	moved: number;
}

type ChainSceneProps = SceneProps<ListInput, ChainStep>;

const MAX_NODES = 10;
const MAX_VALUE = 999;
const ODDS_TOP = 30;
const REST_TOP = 150;
const EVENS_TOP = 270;
const NONE = -1;

const LINE_GUARD = 8;
const LINE_EMPTY = 9;
const LINES_INIT = [11, 12];
const LINE_WHILE = 13;
const LINES_ODD = [14, 15];
const LINES_EVEN = [16, 17];
const LINE_LINK = 19;
const LINE_RETURN = 20;

const isOddPosition = (index: number) => index % 2 === 0;
const chainSlot = (index: number) => Math.floor(index / 2);
const isJoined = (phase: Phase) => phase === 'link' || phase === 'done';
const positionText = (index: number) => (index === NONE ? 'None' : `#${index + 1}`);

function buildSteps({ values }: ListInput): ChainStep[] {
	const steps: ChainStep[] = [];
	const n = values.length;
	const nodeText = (index: number) => `the ${values[index]} at ${positionText(index)}`;
	let oddLinked = 0;
	let evenLinked = 0;
	let odd = NONE;
	let even = NONE;

	const snapshot = (phase: Phase, moved: number, highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			oddLinked,
			evenLinked,
			odd,
			even,
			moved,
			readout: { n, odd: oddLinked === 0 ? '–' : positionText(odd), even: oddLinked === 0 ? '–' : positionText(even) },
			highlightedLines,
			narration,
		});

	if (n === 0) {
		snapshot('start', NONE, [LINE_GUARD, LINE_EMPTY], `The list is empty, so there is nothing to reorder: return <code>head</code>, which is None.`);
		return steps;
	}

	snapshot('start', NONE, [LINE_GUARD], `Positions count from 1 at the head. The odd positions, ${positionText(0)}, ${positionText(2)}, …, go first, then the even ones, each group in its original order.`);

	odd = 0;
	oddLinked = 1;
	if (n > 1) {
		even = 1;
		evenLinked = 1;
	}
	snapshot(
		'init',
		NONE,
		LINES_INIT,
		even === NONE
			? `<code>odd</code> starts at the head. There is no second node, so <code>even</code> and <code>even_start</code> are None.`
			: `<code>odd</code> starts at the head and <code>even</code> at the second node. <code>even_start</code> remembers ${nodeText(1)}, to attach after the odd chain at the end.`,
	);

	while (even !== NONE && even + 1 < n) {
		odd = even + 1;
		oddLinked += 1;
		snapshot('odd', odd, [LINE_WHILE, ...LINES_ODD], `<code>even.next</code> is ${nodeText(odd)}, the next odd node. <code>odd.next = even.next</code> adds it to the odd chain, and <code>odd</code> moves to it.`);

		const next = odd + 1 < n ? odd + 1 : NONE;
		even = next;
		if (next === NONE) {
			snapshot('even', NONE, LINES_EVEN, `<code>odd.next</code> is None: no nodes are left. <code>even.next = None</code> ends the even chain, and <code>even</code> becomes None.`);
		} else {
			evenLinked += 1;
			snapshot('even', next, LINES_EVEN, `Now <code>odd.next</code> is ${nodeText(next)}, the next even node. <code>even.next = odd.next</code> adds it to the even chain, and <code>even</code> moves to it.`);
		}
	}

	snapshot(
		'stop',
		NONE,
		[LINE_WHILE],
		even === NONE ? `<code>even</code> is None, so the loop stops. The odd chain ends at the last node.` : `<code>even.next</code> is None, so the loop stops. The even chain ends at the last node.`,
	);

	snapshot(
		'link',
		NONE,
		[LINE_LINK],
		n === 1
			? `<code>odd.next = even_start</code> sets the head's next to None, since there is no even chain.`
			: `<code>odd.next = even_start</code>: the odd tail now points to the head of the even chain, so the evens follow the odds.`,
	);

	const reordered = [...values.filter((_, index) => isOddPosition(index)), ...values.filter((_, index) => !isOddPosition(index))];
	snapshot('done', NONE, [LINE_RETURN], `The head never moved, so the function returns it: <b>[${reordered.join(', ')}]</b>.`);
	return steps;
}

function ChainScene({ input: { values }, step: { phase, oddLinked, evenLinked, odd, even, moved } }: ChainSceneProps) {
	const joined = isJoined(phase);
	const placeOf = (index: number) => {
		const slot = chainSlot(index);
		if (isOddPosition(index) && slot < oddLinked) return { column: slot, top: ODDS_TOP };
		if (!isOddPosition(index) && slot < evenLinked) return joined ? { column: oddLinked + slot, top: ODDS_TOP } : { column: slot, top: EVENS_TOP };
		return { column: index, top: REST_TOP };
	};
	const toneOf = (index: number) => {
		if (phase === 'done') return 'focus';
		if (index === moved) return 'add';
		if (index === odd || index === even) return 'focus';
		return 'plain';
	};
	const tagged = !joined && phase !== 'start';

	return (
		<Canvas columns={Math.max(1, values.length)} height={EVENS_TOP + 100}>
			<RowLabel top={ODDS_TOP + 16}>{joined ? 'result' : 'odd chain'}</RowLabel>
			<RowLabel top={REST_TOP + 16} hidden={joined || phase === 'stop'}>
				not placed
			</RowLabel>
			<RowLabel top={EVENS_TOP + 16} hidden={joined}>
				even chain
			</RowLabel>
			{values.map((value, index) => {
				const { column, top } = placeOf(index);
				return [
					<SubLabel key={`position-${index}`} column={column} top={top - 22}>
						{positionText(index)}
					</SubLabel>,
					<Cell key={`node-${index}`} value={value} column={column} top={top} tone={toneOf(index)} />,
				];
			})}
			<Tag column={odd === NONE ? 0 : chainSlot(odd)} top={ODDS_TOP + 64} tone="add" hidden={!tagged || odd === NONE}>
				odd
			</Tag>
			<Tag column={even === NONE ? 0 : chainSlot(even)} top={EVENS_TOP + 64} tone="add" hidden={!tagged || even === NONE}>
				even
			</Tag>
		</Canvas>
	);
}

export default defineExplainer<ListInput, ChainStep>({
	title: 'Two tails take turns',
	codeFile: 'solution-2-clean.py',
	stages: [
		{
			title: 'Odd positions rise, even positions sink',
			subtitle: 'Each node keeps its position number above it. Green is the node just added to a chain, teal the two tails, odd and even.',
			Scene: ChainScene,
		},
	],
	examples: [
		{ input: { values: [1, 2, 3, 4, 5] }, note: 'LeetCode example 1: odd length' },
		{ input: { values: [2, 1, 3, 5, 6, 4, 7] }, note: 'Values differ from positions' },
		{ input: { values: [1, 2, 3, 4] }, note: 'Even length: attempt-3.py lost the 4' },
		{ input: { values: [1] }, note: 'One node: attempt-1.py made a cycle' },
		{ input: { values: [] }, note: 'Empty list' },
	],
	fields: [{ name: 'values', label: 'Your own list', placeholder: 'e.g. 2, 1, 3, 5, 6, 4, 7' }],
	describe: ({ values }) => `[${values.join(', ')}]`,
	parse(values) {
		const parts = values.values.split(/[\s,]+/).filter(Boolean);
		const nodes = parts.map(Number);
		if (nodes.some((value) => !Number.isInteger(value) || Math.abs(value) > MAX_VALUE)) return { error: `Use whole numbers from −${MAX_VALUE} to ${MAX_VALUE} so they fit on screen.` };
		if (nodes.length > MAX_NODES) return { error: `Use ${MAX_NODES} nodes or fewer so everything fits on screen.` };
		return { input: { values: nodes } };
	},
	steps: buildSteps,
});
