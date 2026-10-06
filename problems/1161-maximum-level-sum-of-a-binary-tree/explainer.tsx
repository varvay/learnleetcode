import { Canvas, Cell, Edge, RowLabel, SubLabel, type CellPlace, type CellTone } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

type Slot = number | null;

interface TreeInput {
	slots: Slot[];
}

interface TreeNode {
	val: number;
	left: number;
	right: number;
	depth: number;
	column: number;
}

type Phase = 'start' | 'add' | 'close' | 'done';

interface LevelStep extends Step {
	phase: Phase;
	node: number;
	queue: number[];
	taken: number[];
	sums: number[];
	closedLevels: number;
	result: number;
}

type LevelSceneProps = SceneProps<TreeInput, LevelStep>;

const MAX_NODES = 12;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TREE_TOP = 30;
const LEVEL_GAP = 90;
const ROW_GAP = 110;

const LINES_INIT = [12, 14];
const LINES_POP = [15, 16];
const LINE_LEFT = 18;
const LINE_PUSH_LEFT = 19;
const LINE_RIGHT = 20;
const LINE_PUSH_RIGHT = 21;
const LINE_PEEK = 23;
const LINES_CLOSE = [24, 25];
const LINES_NEW_BEST = [26, 27];
const LINE_RESET = 28;
const LINES_CONTINUE = [29, 30];
const LINE_RETURN = 32;

function treeOf(slots: Slot[]): TreeNode[] {
	const nodes: TreeNode[] = [];
	if (slots.length === 0 || slots[0] === null) return nodes;
	nodes.push({ val: slots[0], left: NONE, right: NONE, depth: 0, column: 0 });
	const waiting = [0];
	let next = 1;
	while (waiting.length > 0 && next < slots.length) {
		const parent = waiting.shift()!;
		for (const side of ['left', 'right'] as const) {
			const slot = slots[next++];
			if (slot === undefined || slot === null) continue;
			nodes.push({ val: slot, left: NONE, right: NONE, depth: nodes[parent].depth + 1, column: 0 });
			nodes[parent][side] = nodes.length - 1;
			waiting.push(nodes.length - 1);
		}
	}
	let nextColumn = 0;
	const placeInorder = (id: number) => {
		if (id === NONE) return;
		placeInorder(nodes[id].left);
		nodes[id].column = nextColumn++;
		placeInorder(nodes[id].right);
	};
	placeInorder(0);
	return nodes;
}

const heightOf = (nodes: TreeNode[]) => Math.max(...nodes.map((node) => node.depth)) + 1;
const signed = (value: number) => (value < 0 ? `(${value})` : `${value}`);

function buildSteps({ slots }: TreeInput): LevelStep[] {
	const nodes = treeOf(slots);
	const steps: LevelStep[] = [];
	let queue = [0];
	const taken: number[] = [];
	const sums: number[] = [];
	let closedLevels = 0;
	let best = nodes[0].val - 1;
	let result = 1;
	let tempSum = 0;

	const snapshot = (phase: Phase, node: number, highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			node,
			queue: [...queue],
			taken: [...taken],
			sums: [...sums],
			closedLevels,
			result,
			readout: { temp_sum: tempSum, best, result },
			highlightedLines,
			narration,
		});

	snapshot('start', NONE, LINES_INIT, `The queue starts with the root at level 1. <code>best</code> starts at ${nodes[0].val} − 1 = ${best}, one below level 1's sum, so level 1 is always taken first.`);

	while (queue.length > 0) {
		const [id, ...rest] = queue;
		queue = rest;
		taken.push(id);
		const { val, left, right, depth } = nodes[id];
		const level = depth + 1;
		const lines = [...LINES_POP, LINE_LEFT];
		if (left !== NONE) {
			queue = [...queue, left];
			lines.push(LINE_PUSH_LEFT);
		}
		lines.push(LINE_RIGHT);
		if (right !== NONE) {
			queue = [...queue, right];
			lines.push(LINE_PUSH_RIGHT);
		}
		lines.push(LINE_PEEK);
		if (sums.length < level) sums.push(0);
		const before = tempSum;
		tempSum += val;
		sums[level - 1] = tempSum;
		const next = queue[0];
		const lastOfLevel = next === undefined || nodes[next].depth + 1 !== level;

		if (!lastOfLevel) {
			snapshot('add', id, [...lines, ...LINES_CONTINUE], `Take ${val} on level ${level}. The next node, ${nodes[next].val}, is on level ${level} too, so the level isn't finished: <code>temp_sum</code> = ${before} + ${signed(val)} = ${tempSum}.`);
			continue;
		}

		const why = next === undefined ? 'The queue is now empty' : `The next node, ${nodes[next].val}, is on level ${level + 1}`;
		const levelSum = tempSum;
		closedLevels = level;
		if (levelSum > best) {
			const previous = best;
			best = levelSum;
			result = level;
			tempSum = 0;
			snapshot(
				'close',
				id,
				[...lines, ...LINES_CLOSE, ...LINES_NEW_BEST, LINE_RESET],
				`Take ${val} on level ${level}. ${why}, so ${val} closes level ${level} with sum ${before} + ${signed(val)} = ${levelSum}. ${levelSum} > ${previous}, so it becomes the best: <code>result</code> = ${level}.`,
			);
		} else {
			tempSum = 0;
			snapshot(
				'close',
				id,
				[...lines, ...LINES_CLOSE, LINE_RESET],
				`Take ${val} on level ${level}. ${why}, so ${val} closes level ${level} with sum ${before} + ${signed(val)} = ${levelSum}. ${levelSum === best ? `It ties the best, ${best}, but only a strictly larger sum takes over, so the earlier level ${result} stays.` : `That is below the best, ${best}, so <code>result</code> stays ${result}.`}`,
			);
		}
	}

	snapshot('done', NONE, [LINE_RETURN], `Every level is closed. The largest sum, ${best}, first appears on level <b>${result}</b>.`);
	return steps;
}

function LevelScene({ input: { slots }, step }: LevelSceneProps) {
	const { phase, node: current, queue, taken, sums, closedLevels, result } = step;
	const nodes = treeOf(slots);
	const height = heightOf(nodes);
	const queueTop = TREE_TOP + height * LEVEL_GAP + 10;
	const sumsTop = queueTop + ROW_GAP;
	const placeOf = (id: number): CellPlace => ({ column: nodes[id].column, top: TREE_TOP + nodes[id].depth * LEVEL_GAP });
	const childrenOf = (id: number) => [nodes[id].left, nodes[id].right].filter((child) => child !== NONE);

	const nodeTone = (id: number): CellTone => {
		if (id === current) return 'add';
		if (phase === 'done' && nodes[id].depth + 1 === result) return 'focus';
		return 'plain';
	};
	const sumTone = (index: number): CellTone => {
		const level = index + 1;
		if (phase === 'close' && level === closedLevels) return level === result ? 'focus' : 'remove';
		if (level <= closedLevels && level === result) return 'focus';
		if (level > closedLevels) return 'add';
		return 'plain';
	};

	return (
		<Canvas columns={Math.max(nodes.length, height, 2)} height={sumsTop + 80}>
			{Array.from({ length: height }, (_, depth) => (
				<RowLabel key={`level-${depth}`} top={TREE_TOP + depth * LEVEL_GAP + 16}>
					level {depth + 1}
				</RowLabel>
			))}
			{nodes.flatMap((_, id) => childrenOf(id).map((child) => <Edge key={`edge-${child}`} from={placeOf(id)} to={placeOf(child)} />))}
			{nodes.map((node, id) => {
				const { column, top } = placeOf(id);
				return <Cell key={`node-${id}`} value={node.val} column={column} top={top} tone={nodeTone(id)} dimmed={phase !== 'done' && taken.includes(id) && id !== current} />;
			})}
			<RowLabel top={queueTop + 16}>
				<code>queue</code>
			</RowLabel>
			{queue.map((id, position) => [
				<Cell key={`queued-${id}`} value={nodes[id].val} column={position} top={queueTop} />,
				<SubLabel key={`queued-level-${id}`} column={position} top={queueTop + 58}>
					level {nodes[id].depth + 1}
				</SubLabel>,
			])}
			<RowLabel top={sumsTop + 16}>level sums</RowLabel>
			{sums.map((sum, index) => [
				<Cell key={`sum-${index}`} value={sum} column={index} top={sumsTop} tone={sumTone(index)} />,
				<SubLabel key={`sum-level-${index}`} column={index} top={sumsTop + 58}>
					{index + 1 > closedLevels ? `level ${index + 1}…` : `level ${index + 1}`}
				</SubLabel>,
			])}
		</Canvas>
	);
}

function parseSlots(text: string): Slot[] | string {
	const inner = text.trim().replace(/^\[/, '').replace(/\]$/, '');
	const tokens = inner.split(/[\s,]+/).filter(Boolean);
	const slots: Slot[] = [];
	for (const token of tokens) {
		if (token.toLowerCase() === 'null') {
			slots.push(null);
			continue;
		}
		const value = Number(token);
		if (!Number.isInteger(value) || Math.abs(value) > MAX_MAGNITUDE) return `"${token}" is not a node: use whole numbers from −${MAX_MAGNITUDE} to ${MAX_MAGNITUDE}, or null.`;
		slots.push(value);
	}
	if (slots.length === 0 || slots[0] === null) return 'The tree needs at least one node, as LeetCode guarantees.';
	if (slots.filter((slot) => slot !== null).length > MAX_NODES) return `Use ${MAX_NODES} nodes or fewer so everything fits on screen.`;
	return slots;
}

const slotsOf = (text: string) => parseSlots(text) as Slot[];

export default defineExplainer<TreeInput, LevelStep>({
	title: 'A level closes when the next node belongs to another',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'The tree by level, the queue, and each level\'s sum',
			subtitle: 'Green is the node just taken and the level still being summed (marked …). A closed level turns teal when it is the best so far and red when it is not; at the end, the winning level is teal.',
			Scene: LevelScene,
		},
	],
	examples: [
		{ input: { slots: slotsOf('1, 7, 0, 7, -8') }, note: 'LeetCode example 1' },
		{ input: { slots: slotsOf('2, 1, 1, -5') }, note: 'A tie: the smaller level wins' },
		{ input: { slots: slotsOf('3, 1, 2, 4') }, note: 'The deepest level wins' },
		{ input: { slots: slotsOf('-1, -2, -3') }, note: 'Every sum negative' },
	],
	fields: [{ name: 'slots', label: 'Your own tree, in level order', placeholder: 'e.g. 1, 7, 0, 7, -8' }],
	describe: ({ slots }) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}]`,
	parse(values) {
		const slots = parseSlots(values.slots);
		if (typeof slots === 'string') return { error: slots };
		return { input: { slots } };
	},
	steps: buildSteps,
});
