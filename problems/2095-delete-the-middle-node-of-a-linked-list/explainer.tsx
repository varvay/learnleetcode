import { Canvas, Cell, RowLabel, SubLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface ListInput {
	values: number[];
}

type Phase = 'start' | 'init' | 'move' | 'stop' | 'unlink' | 'done';

interface PointerStep extends Step {
	phase: Phase;
	slow: number;
	fast: number;
}

type PointerSceneProps = SceneProps<ListInput, PointerStep>;

const MAX_NODES = 10;
const MAX_VALUE = 999;
const NODES_TOP = 40;
const REMOVED_TOP = 150;
const NO_POINTER = -1;

const LINE_GUARD = 8;
const LINE_EMPTY = 9;
const LINE_INIT = 11;
const LINE_WHILE = 12;
const LINES_MOVE = [13, 14];
const LINE_UNLINK = 16;
const LINE_RETURN = 17;

const isUnlinked = (phase: Phase) => phase === 'unlink' || phase === 'done';

function buildSteps({ values }: ListInput): PointerStep[] {
	const steps: PointerStep[] = [];
	const n = values.length;
	const middle = Math.floor(n / 2);
	const pointerText = (index: number) => (index === NO_POINTER ? '–' : index >= n ? 'None' : index);

	const snapshot = (phase: Phase, slow: number, fast: number, highlightedLines: number[], narration: string) =>
		steps.push({ phase, slow, fast, readout: { n, 'slow at': pointerText(slow), 'fast at': pointerText(fast) }, highlightedLines, narration });

	if (n === 1) {
		snapshot('start', NO_POINTER, NO_POINTER, [LINE_GUARD], `The list has one node, so the middle is index 1 // 2 = 0: the head itself.`);
		snapshot('unlink', NO_POINTER, NO_POINTER, [LINE_GUARD, LINE_EMPTY], `<code>head.next</code> is None, so no node comes before the middle. Deleting the only node leaves the empty list: return <b>None</b>.`);
		return steps;
	}

	snapshot(
		'start',
		NO_POINTER,
		NO_POINTER,
		[LINE_GUARD],
		`n = ${n}, so the middle is index ${n} // 2 = ${middle}, the ${values[middle]}. Deleting it means rewiring the node before it, index ${middle - 1}, so that is where <code>slow</code> has to stop.`,
	);

	let slow = 0;
	let fast = 2;
	snapshot(
		'init',
		slow,
		fast,
		[LINE_INIT],
		`<code>slow</code> starts at index 0 and <code>fast</code> two nodes ahead, at index 2${fast >= n ? ', which is past the end, so it is None' : ''}. <code>fast</code> stays at 2 × slow + 2 from now on.`,
	);

	while (fast < n && fast + 1 < n) {
		slow += 1;
		fast += 2;
		snapshot(
			'move',
			slow,
			fast,
			[LINE_WHILE, ...LINES_MOVE],
			`<code>fast</code> and <code>fast.next</code> both exist, so <code>slow</code> moves one node, to index ${slow}, and <code>fast</code> moves two, to ${fast >= n ? 'None' : `index ${fast}`}.`,
		);
	}

	const reason = fast >= n ? `<code>fast</code> is None, past the end` : `<code>fast</code> is the last node, so <code>fast.next</code> is None`;
	snapshot('stop', slow, fast, [LINE_WHILE], `${reason}, and the loop stops. <code>slow</code> is at index ${slow}, right before the middle.`);

	const after = middle + 1 < n ? `the ${values[middle + 1]}` : 'None';
	snapshot('unlink', slow, NO_POINTER, [LINE_UNLINK], `<code>slow.next = slow.next.next</code>: the ${values[slow]} now points past the ${values[middle]} to ${after}, so the middle drops out of the list.`);

	const remaining = values.filter((_, index) => index !== middle);
	snapshot('done', NO_POINTER, NO_POINTER, [LINE_RETURN], `The head is unchanged, so the function returns it: <b>[${remaining.join(', ')}]</b>.`);
	return steps;
}

function PointerScene({ input: { values }, step: { phase, slow, fast } }: PointerSceneProps) {
	const n = values.length;
	const middle = Math.floor(n / 2);
	const unlinked = isUnlinked(phase);
	const length = unlinked ? n - 1 : n;
	const columnOf = (index: number) => (unlinked && index > middle ? index - 1 : index);
	const toneOf = (index: number) => {
		if (unlinked && index === middle) return 'remove';
		if (phase === 'done') return 'focus';
		if (index === slow) return 'focus';
		return 'plain';
	};

	return (
		<Canvas columns={n + 1} height={230}>
			<RowLabel top={NODES_TOP + 16}>
				<code>head</code>
			</RowLabel>
			{values.map((_, index) => (
				<SubLabel key={`index-${index}`} column={index} top={NODES_TOP - 22} hidden={index >= length}>
					{index}
				</SubLabel>
			))}
			{values.map((value, index) => (
				<Cell
					key={`node-${index}`}
					value={value}
					column={unlinked && index === middle ? middle : columnOf(index)}
					top={unlinked && index === middle ? REMOVED_TOP : NODES_TOP}
					tone={toneOf(index)}
					dimmed={phase === 'done' && index === middle}
				/>
			))}
			<SubLabel column={length} top={NODES_TOP + 18}>
				None
			</SubLabel>
			<Tag column={Math.max(0, slow)} top={NODES_TOP + 66} tone="add" hidden={slow === NO_POINTER}>
				slow
			</Tag>
			<Tag column={Math.max(0, Math.min(fast, n))} top={NODES_TOP + 66} tone="add" hidden={fast === NO_POINTER}>
				fast
			</Tag>
		</Canvas>
	);
}

export default defineExplainer<ListInput, PointerStep>({
	title: 'Fast runs ahead, slow stops before the middle',
	codeFile: 'solution-2-clean.py',
	stages: [
		{
			title: 'Two pointers, one pass',
			subtitle: 'Each node points to the one on its right, and the last points to None. Teal is where slow is; red is the middle once it is unlinked.',
			Scene: PointerScene,
		},
	],
	examples: [
		{ input: { values: [1, 3, 4, 7, 1, 2, 6] }, note: 'LeetCode example 1: odd length' },
		{ input: { values: [1, 2, 3, 4] }, note: 'LeetCode example 2: even length' },
		{ input: { values: [2, 1] }, note: 'LeetCode example 3: fast starts at None' },
		{ input: { values: [5] }, note: 'One node: the list becomes empty' },
	],
	fields: [{ name: 'values', label: 'Your own list', placeholder: 'e.g. 1, 3, 4, 7, 1, 2, 6' }],
	describe: ({ values }) => `[${values.join(', ')}]`,
	parse(values) {
		const parts = values.values.split(/[\s,]+/).filter(Boolean);
		const nodes = parts.map(Number);
		if (!parts.length) return { error: 'Enter node values separated by commas or spaces.' };
		if (nodes.some((value) => !Number.isInteger(value) || value < 1 || value > MAX_VALUE)) return { error: `Use whole numbers from 1 to ${MAX_VALUE} so they fit on screen.` };
		if (nodes.length > MAX_NODES) return { error: `Use ${MAX_NODES} nodes or fewer so everything fits on screen.` };
		return { input: { values: nodes } };
	},
	steps: buildSteps,
});
