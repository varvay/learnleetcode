import { Canvas, Cell, RowLabel, SubLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface ListInput {
	values: number[];
}

type Phase = 'start' | 'save' | 'flip' | 'done';

interface FlipStep extends Step {
	phase: Phase;
	moved: number;
}

type FlipSceneProps = SceneProps<ListInput, FlipStep>;

const MAX_NODES = 9;
const MAX_VALUE = 999;
const REVERSED_TOP = 40;
const ORIGINAL_TOP = 180;

const LINE_INIT = 8;
const LINE_WHILE = 9;
const LINE_SAVE = 10;
const LINES_FLIP = [11, 12, 13];
const LINE_RETURN = 14;

function buildSteps({ values }: ListInput): FlipStep[] {
	const steps: FlipStep[] = [];
	const n = values.length;
	const valueAt = (index: number) => (index >= 0 && index < n ? `${values[index]}` : 'None');

	const snapshot = (phase: Phase, moved: number, highlightedLines: number[], narration: string, nextNode = '–') =>
		steps.push({ phase, moved, readout: { prev: valueAt(moved - 1), node: valueAt(moved), next_node: nextNode }, highlightedLines, narration });

	snapshot('start', 0, [LINE_INIT], n === 0 ? `The list is empty, so <code>node</code> starts as None.` : `Nothing is reversed yet, so <code>prev</code> is None, and <code>node</code> starts at the head, the ${values[0]}.`);

	for (let moved = 0; moved < n; moved++) {
		const after = valueAt(moved + 1);
		snapshot(
			'save',
			moved,
			[LINE_WHILE, LINE_SAVE],
			`<code>node</code> is the ${values[moved]}. Its arrow is about to flip, so <code>next_node</code> first saves where it points: ${after === 'None' ? 'None, the end of the list' : `the ${after}`}.`,
			after,
		);
		snapshot(
			'flip',
			moved + 1,
			LINES_FLIP,
			`<code>node.next = prev</code>: the ${values[moved]} now points to ${moved === 0 ? 'None' : `the ${values[moved - 1]}`}. <code>prev</code> moves to the ${values[moved]}, the new head of the reversed part, and <code>node</code> moves to ${after === 'None' ? 'None' : `the ${after}`}.`,
			after,
		);
	}

	snapshot(
		'done',
		n,
		[LINE_WHILE, LINE_RETURN],
		n === 0 ? `<code>node</code> is None, so the loop never runs, and the function returns <code>prev</code>: <b>None</b>.` : `<code>node</code> is None, so every node is reversed. <code>prev</code> heads the reversed list: <b>[${[...values].reverse().join(', ')}]</b>.`,
		n === 0 ? '–' : 'None',
	);
	return steps;
}

function FlipScene({ input: { values }, step: { phase, moved } }: FlipSceneProps) {
	const n = values.length;
	const isReversed = (index: number) => index < moved;
	const columnOf = (index: number) => (isReversed(index) ? moved - 1 - index : index);
	const arrowOf = (index: number) => `→ ${isReversed(index) ? (index === 0 ? 'None' : values[index - 1]) : index + 1 < n ? values[index + 1] : 'None'}`;
	const toneOf = (index: number) => {
		if (phase === 'done') return 'focus';
		if (phase === 'save' && index === moved) return 'focus';
		if (phase === 'flip' && index === moved - 1) return 'add';
		return 'plain';
	};

	return (
		<Canvas columns={n + 1} height={ORIGINAL_TOP + 100}>
			<RowLabel top={REVERSED_TOP + 16}>reversed</RowLabel>
			<RowLabel top={ORIGINAL_TOP + 16} hidden={phase === 'done'}>
				original
			</RowLabel>
			{values.map((value, index) => {
				const top = isReversed(index) ? REVERSED_TOP : ORIGINAL_TOP;
				return [
					<SubLabel key={`arrow-${index}`} column={columnOf(index)} top={top - 22}>
						{arrowOf(index)}
					</SubLabel>,
					<Cell key={`node-${index}`} value={value} column={columnOf(index)} top={top} tone={toneOf(index)} />,
				];
			})}
			<SubLabel column={moved} top={REVERSED_TOP + 18}>
				None
			</SubLabel>
			<SubLabel column={n} top={ORIGINAL_TOP + 18} hidden={phase === 'done'}>
				None
			</SubLabel>
			<Tag column={0} top={REVERSED_TOP + 66} tone="add" hidden={moved === 0}>
				prev
			</Tag>
			<Tag column={moved} top={ORIGINAL_TOP + 66} tone="add" hidden={phase === 'done'}>
				node
			</Tag>
			<Tag column={moved + 1} top={ORIGINAL_TOP + 66} tone="add" hidden={phase !== 'save'}>
				next_node
			</Tag>
		</Canvas>
	);
}

export default defineExplainer<ListInput, FlipStep>({
	title: 'One node at a time to the reversed side',
	codeFile: 'solution-2-iterative.py',
	stages: [
		{
			title: 'The reversed part grows, the original shrinks',
			subtitle: 'Above each node is where its next arrow points. Teal is the node about to flip, green the one just moved, and both rows end in None.',
			Scene: FlipScene,
		},
	],
	examples: [
		{ input: { values: [1, 2, 3, 4, 5] }, note: 'LeetCode example 1' },
		{ input: { values: [1, 2] }, note: 'LeetCode example 2' },
		{ input: { values: [] }, note: 'LeetCode example 3: empty list' },
	],
	fields: [{ name: 'values', label: 'Your own list', placeholder: 'e.g. 1, 2, 3, 4, 5' }],
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
