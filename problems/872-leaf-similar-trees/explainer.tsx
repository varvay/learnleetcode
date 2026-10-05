import { Canvas, Cell, RowLabel, SubLabel, type CellTone } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

type Slot = number | null;
type Side = 1 | 2;

interface TreesInput {
	slots1: Slot[];
	slots2: Slot[];
}

interface TreeNode {
	val: number;
	left: number;
	right: number;
	depth: number;
	column: number;
}

type Phase = 'start' | 'walk' | 'leaf1' | 'match' | 'mismatch' | 'empty2' | 'done';

interface PairStep extends Step {
	phase: Phase;
	side: Side;
	node: number;
	stack1: number[];
	stack2: number[];
	walked1: number[];
	walked2: number[];
	matched1: number[];
	matched2: number[];
	waitingLeaf: number;
}

type PairSceneProps = SceneProps<TreesInput, PairStep>;

const MAX_NODES = 9;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TOP = 30;
const LEVEL_GAP = 76;
const STACK_GAP = 14;
const TREE_GAP = 110;

const LINE_INIT = 9;
const LINE_WHILE1 = 11;
const LINE_POP1 = 12;
const LINE_RIGHT1 = 13;
const LINE_PUSH_RIGHT1 = 14;
const LINE_LEFT1 = 15;
const LINE_PUSH_LEFT1 = 16;
const LINE_LEAF1 = 17;
const LINE_EMPTY2 = 18;
const LINE_RETURN_EMPTY2 = 19;
const LINE_WHILE2 = 20;
const LINE_POP2 = 21;
const LINE_RIGHT2 = 22;
const LINE_PUSH_RIGHT2 = 23;
const LINE_LEFT2 = 24;
const LINE_PUSH_LEFT2 = 25;
const LINE_LEAF2 = 26;
const LINE_COMPARE = 27;
const LINE_RETURN_MISMATCH = 28;
const LINES_BREAK = [29, 30];
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
const isLeaf = (node: TreeNode) => node.left === NONE && node.right === NONE;

function buildSteps({ slots1, slots2 }: TreesInput): PairStep[] {
	const trees = { 1: treeOf(slots1), 2: treeOf(slots2) };
	const steps: PairStep[] = [];
	const stacks = { 1: [0], 2: [0] };
	const walked: Record<Side, number[]> = { 1: [], 2: [] };
	const matched: Record<Side, number[]> = { 1: [], 2: [] };
	let waitingLeaf = NONE;

	const snapshot = (phase: Phase, side: Side, node: number, highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			side,
			node,
			stack1: [...stacks[1]],
			stack2: [...stacks[2]],
			walked1: [...walked[1]],
			walked2: [...walked[2]],
			matched1: [...matched[1]],
			matched2: [...matched[2]],
			waitingLeaf,
			readout: { 'leaves matched': matched[1].length, stack1: stacks[1].length, stack2: stacks[2].length },
			highlightedLines,
			narration,
		});

	const popAndPush = (side: Side) => {
		const id = stacks[side].pop()!;
		const node = trees[side][id];
		if (node.right !== NONE) stacks[side].push(node.right);
		if (node.left !== NONE) stacks[side].push(node.left);
		walked[side].push(id);
		return id;
	};
	const pushLines = (side: Side, node: TreeNode) =>
		side === 1
			? [LINE_RIGHT1, ...(node.right !== NONE ? [LINE_PUSH_RIGHT1] : []), LINE_LEFT1, ...(node.left !== NONE ? [LINE_PUSH_LEFT1] : [])]
			: [LINE_RIGHT2, ...(node.right !== NONE ? [LINE_PUSH_RIGHT2] : []), LINE_LEFT2, ...(node.left !== NONE ? [LINE_PUSH_LEFT2] : [])];
	const pushText = (side: Side, node: TreeNode) => {
		const children = trees[side];
		if (node.left !== NONE && node.right !== NONE) return `push its right child, ${children[node.right].val}, then its left, ${children[node.left].val}, so the left is walked first`;
		const only = node.left !== NONE ? node.left : node.right;
		return `push its only child, ${children[only].val}`;
	};

	snapshot('start', 1, NONE, [LINE_INIT], `Each tree gets its own stack, starting with its root.`);

	while (stacks[1].length > 0) {
		const id1 = popAndPush(1);
		const node1 = trees[1][id1];
		if (!isLeaf(node1)) {
			snapshot('walk', 1, id1, [LINE_WHILE1, LINE_POP1, ...pushLines(1, node1), LINE_LEAF1], `Tree 1: pop ${node1.val}. It isn't a leaf, so ${pushText(1, node1)}.`);
			continue;
		}
		waitingLeaf = id1;
		if (stacks[2].length === 0) {
			snapshot('empty2', 1, id1, [LINE_WHILE1, LINE_POP1, LINE_RIGHT1, LINE_LEFT1, LINE_LEAF1, LINE_EMPTY2, LINE_RETURN_EMPTY2], `Tree 1: pop ${node1.val}, a leaf. But <code>stack2</code> is empty: tree 2 has no leaves left, so return <b>False</b>.`);
			return steps;
		}
		snapshot('leaf1', 1, id1, [LINE_WHILE1, LINE_POP1, LINE_RIGHT1, LINE_LEFT1, LINE_LEAF1, LINE_EMPTY2], `Tree 1: pop ${node1.val}, a leaf. Now advance tree 2 to its next leaf.`);

		while (stacks[2].length > 0) {
			const id2 = popAndPush(2);
			const node2 = trees[2][id2];
			if (!isLeaf(node2)) {
				snapshot('walk', 2, id2, [LINE_WHILE2, LINE_POP2, ...pushLines(2, node2), LINE_LEAF2], `Tree 2: pop ${node2.val}. It isn't a leaf, so ${pushText(2, node2)}.`);
				continue;
			}
			if (node1.val !== node2.val) {
				snapshot('mismatch', 2, id2, [LINE_WHILE2, LINE_POP2, LINE_RIGHT2, LINE_LEFT2, LINE_LEAF2, LINE_COMPARE, LINE_RETURN_MISMATCH], `Tree 2: pop ${node2.val}, a leaf. Tree 1's leaf is ${node1.val}, and ${node1.val} ≠ ${node2.val}, so return <b>False</b>.`);
				return steps;
			}
			matched[1].push(id1);
			matched[2].push(id2);
			waitingLeaf = NONE;
			snapshot('match', 2, id2, [LINE_WHILE2, LINE_POP2, LINE_RIGHT2, LINE_LEFT2, LINE_LEAF2, LINE_COMPARE, ...LINES_BREAK], `Tree 2: pop ${node2.val}, a leaf, and it equals tree 1's leaf. That is leaf pair ${matched[1].length}; <code>break</code> back to tree 1.`);
			break;
		}
	}

	const similar = stacks[2].length === 0;
	snapshot(
		'done',
		1,
		NONE,
		[LINE_WHILE1, LINE_RETURN],
		similar
			? `<code>stack1</code> is empty, and so is <code>stack2</code>: both trees ran out of leaves together, so return <b>True</b>.`
			: `<code>stack1</code> is empty, but <code>stack2</code> is not: tree 2 still has leaves left, so return <b>False</b>.`,
	);
	return steps;
}

function TreeRows({ nodes, top, stackTop, stack, walked, matched, current, tone, label, stackLabel }: {
	nodes: TreeNode[];
	top: number;
	stackTop: number;
	stack: number[];
	walked: number[];
	matched: number[];
	current: number;
	tone: CellTone;
	label: string;
	stackLabel: string;
}) {
	const toneOf = (id: number): CellTone => {
		if (id === current) return tone;
		if (matched.includes(id)) return 'focus';
		return 'plain';
	};
	return (
		<>
			<RowLabel top={top + 16}>
				<code>{label}</code>
			</RowLabel>
			{nodes.map((node, id) => (
				<Cell
					key={`${label}-node-${id}`}
					value={node.val}
					column={node.column}
					top={top + node.depth * LEVEL_GAP}
					tone={toneOf(id)}
					dimmed={id !== current && walked.includes(id) && !matched.includes(id)}
				/>
			))}
			<RowLabel top={stackTop + 16}>
				<code>{stackLabel}</code>
			</RowLabel>
			{stack.map((id, position) => (
				<Cell key={`${stackLabel}-${id}`} value={nodes[id].val} column={position} top={stackTop} />
			))}
			<SubLabel column={Math.max(0, stack.length - 1)} top={stackTop + 58} hidden={stack.length === 0}>
				top
			</SubLabel>
		</>
	);
}

function PairScene({ input: { slots1, slots2 }, step }: PairSceneProps) {
	const { phase, side, node, stack1, stack2, walked1, walked2, matched1, matched2, waitingLeaf } = step;
	const tree1 = treeOf(slots1);
	const tree2 = treeOf(slots2);
	const stack1Top = TOP + heightOf(tree1) * LEVEL_GAP + STACK_GAP;
	const tree2Top = stack1Top + TREE_GAP;
	const stack2Top = tree2Top + heightOf(tree2) * LEVEL_GAP + STACK_GAP;
	const currentTone: CellTone = phase === 'mismatch' || phase === 'empty2' ? 'remove' : phase === 'match' ? 'focus' : 'add';
	const columns = Math.max(2, tree1.length, tree2.length);

	return (
		<Canvas columns={columns} height={stack2Top + 90}>
			<TreeRows
				nodes={tree1}
				top={TOP}
				stackTop={stack1Top}
				stack={stack1}
				walked={walked1}
				matched={matched1}
				current={side === 1 ? node : waitingLeaf}
				tone={side === 1 ? currentTone : phase === 'mismatch' ? 'remove' : 'add'}
				label="root1"
				stackLabel="stack1"
			/>
			<TreeRows
				nodes={tree2}
				top={tree2Top}
				stackTop={stack2Top}
				stack={stack2}
				walked={walked2}
				matched={matched2}
				current={side === 2 ? node : NONE}
				tone={currentTone}
				label="root2"
				stackLabel="stack2"
			/>
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
	if (slots.length === 0 || slots[0] === null) return 'Each tree needs at least one node, as LeetCode guarantees.';
	if (slots.filter((slot) => slot !== null).length > MAX_NODES) return `Use ${MAX_NODES} nodes or fewer per tree so everything fits on screen.`;
	return slots;
}

const slotsOf = (text: string) => parseSlots(text) as Slot[];

export default defineExplainer<TreesInput, PairStep>({
	title: 'Two stacks, one leaf at a time',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'Both trees and their stacks',
			subtitle: 'Nodes sit at their depth, left to right in order. Green is the node just popped, teal the leaves matched so far, and red where the trees disagree. Faded nodes are walked already.',
			Scene: PairScene,
		},
	],
	examples: [
		{ input: { slots1: slotsOf('3, 5, 1, 6, 2, 9, 8, null, null, 7, 4'), slots2: slotsOf('3, 5, 1, 6, 7, 4, 2, null, null, null, null, null, null, 9, 8') }, note: 'LeetCode example 1: similar' },
		{ input: { slots1: slotsOf('1, 2, 3'), slots2: slotsOf('1, 3, 2') }, note: 'LeetCode example 2: a mismatch' },
		{ input: { slots1: slotsOf('1, 2, 3'), slots2: slotsOf('5, 2, 6, null, null, 3, 4') }, note: 'Tree 2 has a leaf left over' },
		{ input: { slots1: slotsOf('5, 2, 6, null, null, 3, 4'), slots2: slotsOf('1, 2, 3') }, note: 'Tree 1 has a leaf left over' },
	],
	fields: [
		{ name: 'slots1', label: 'Tree 1, in level order', placeholder: 'e.g. 1, 2, 3' },
		{ name: 'slots2', label: 'Tree 2', placeholder: 'e.g. 1, 3, 2' },
	],
	describe: ({ slots1, slots2 }) => {
		const text = (slots: Slot[]) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}]`;
		return `${text(slots1)} and ${text(slots2)}`;
	},
	parse(values) {
		const slots1 = parseSlots(values.slots1);
		if (typeof slots1 === 'string') return { error: `Tree 1: ${slots1}` };
		const slots2 = parseSlots(values.slots2);
		if (typeof slots2 === 'string') return { error: `Tree 2: ${slots2}` };
		return { input: { slots1, slots2 } };
	},
	steps: buildSteps,
});
