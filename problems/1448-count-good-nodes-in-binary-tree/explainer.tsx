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
	parent: number;
	depth: number;
	column: number;
}

interface StackEntry {
	node: number;
	best: number;
}

type Phase = 'start' | 'pop' | 'done';

interface PopStep extends Step {
	phase: Phase;
	node: number;
	stack: StackEntry[];
	verdicts: Record<number, boolean>;
}

type PopSceneProps = SceneProps<TreeInput, PopStep>;

const MAX_NODES = 10;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TREE_TOP = 30;
const LEVEL_GAP = 96;
const STACK_GAP = 40;

const LINE_INIT = 12;
const LINE_WHILE = 14;
const LINE_POP = 15;
const LINE_RIGHT = 16;
const LINE_PUSH_RIGHT = 17;
const LINE_LEFT = 18;
const LINE_PUSH_LEFT = 19;
const LINE_CHECK = 20;
const LINE_COUNT = 21;
const LINE_RETURN = 23;

function treeOf(slots: Slot[]): TreeNode[] {
	const nodes: TreeNode[] = [];
	if (slots.length === 0 || slots[0] === null) return nodes;
	nodes.push({ val: slots[0], left: NONE, right: NONE, parent: NONE, depth: 0, column: 0 });
	const waiting = [0];
	let next = 1;
	while (waiting.length > 0 && next < slots.length) {
		const parent = waiting.shift()!;
		for (const side of ['left', 'right'] as const) {
			const slot = slots[next++];
			if (slot === undefined || slot === null) continue;
			nodes.push({ val: slot, left: NONE, right: NONE, parent, depth: nodes[parent].depth + 1, column: 0 });
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

function pathOf(nodes: TreeNode[], id: number) {
	const path: number[] = [];
	for (let at = id; at !== NONE; at = nodes[at].parent) path.unshift(nodes[at].val);
	return path;
}

function buildSteps({ slots }: TreeInput): PopStep[] {
	const nodes = treeOf(slots);
	const steps: PopStep[] = [];
	const verdicts: Record<number, boolean> = {};
	let stack: StackEntry[] = [{ node: 0, best: nodes[0].val }];
	let solution = 0;

	const snapshot = (phase: Phase, node: number, highlightedLines: number[], narration: string) =>
		steps.push({ phase, node, stack: [...stack], verdicts: { ...verdicts }, readout: { 'stack size': stack.length, solution }, highlightedLines, narration });

	snapshot('start', NONE, [LINE_INIT], `The stack starts with the root and its path's largest value: (${nodes[0].val}, ${nodes[0].val}).`);

	while (stack.length > 0) {
		const { node: id, best } = stack[stack.length - 1];
		stack = stack.slice(0, -1);
		const { val, left, right } = nodes[id];
		const pushes: string[] = [];
		const lines = [LINE_WHILE, LINE_POP, LINE_RIGHT];
		if (right !== NONE) {
			const childBest = Math.max(best, nodes[right].val);
			stack = [...stack, { node: right, best: childBest }];
			pushes.push(`its right child ${nodes[right].val} with max(${best}, ${nodes[right].val}) = ${childBest}`);
			lines.push(LINE_PUSH_RIGHT);
		}
		lines.push(LINE_LEFT);
		if (left !== NONE) {
			const childBest = Math.max(best, nodes[left].val);
			stack = [...stack, { node: left, best: childBest }];
			pushes.push(`its left child ${nodes[left].val} with max(${best}, ${nodes[left].val}) = ${childBest}`);
			lines.push(LINE_PUSH_LEFT);
		}
		lines.push(LINE_CHECK);
		const good = val >= best;
		verdicts[id] = good;
		if (good) {
			solution += 1;
			lines.push(LINE_COUNT);
		}
		const path = pathOf(nodes, id);
		const pathText = path.length === 1 ? `its path is just itself` : `the largest on its path, ${path.join(' → ')}`;
		const pushText = pushes.length > 0 ? ` Push ${pushes.join(', then ')}.` : ' It has no children to push.';
		const verdictText = good ? `${val} ≥ ${best}, so ${val} is good: <code>solution</code> = ${solution}.` : `${val} < ${best}, so ${val} is not good.`;
		snapshot('pop', id, lines, `Pop ${val} with best = ${best}: ${pathText}.${pushText} ${verdictText}`);
	}

	snapshot('done', NONE, [LINE_WHILE, LINE_RETURN], `The stack is empty, so every node is checked: the tree has <b>${solution}</b> good ${solution === 1 ? 'node' : 'nodes'}.`);
	return steps;
}

function PopScene({ input: { slots }, step }: PopSceneProps) {
	const { phase, node: current, stack, verdicts } = step;
	const nodes = treeOf(slots);
	const stackTop = TREE_TOP + heightOf(nodes) * LEVEL_GAP + STACK_GAP;
	const placeOf = (id: number): CellPlace => ({ column: nodes[id].column, top: TREE_TOP + nodes[id].depth * LEVEL_GAP });
	const childrenOf = (id: number) => [nodes[id].left, nodes[id].right].filter((child) => child !== NONE);

	const toneOf = (id: number): CellTone => {
		if (id === current) return 'add';
		if (verdicts[id] === true) return 'focus';
		return 'plain';
	};

	return (
		<Canvas columns={Math.max(nodes.length, 2)} height={stackTop + 90}>
			<RowLabel top={TREE_TOP + 16}>
				<code>root</code>
			</RowLabel>
			{nodes.flatMap((_, id) => childrenOf(id).map((child) => <Edge key={`edge-${child}`} from={placeOf(id)} to={placeOf(child)} />))}
			{nodes.map((node, id) => {
				const { column, top } = placeOf(id);
				return [
					<Cell key={`node-${id}`} value={node.val} column={column} top={top} tone={toneOf(id)} dimmed={phase !== 'start' && verdicts[id] === false && id !== current} />,
					<SubLabel key={`verdict-${id}`} column={column} top={top + 58} hidden={!(id in verdicts)}>
						{verdicts[id] ? 'good' : 'not good'}
					</SubLabel>,
				];
			})}
			<RowLabel top={stackTop + 16}>
				<code>stack</code>
			</RowLabel>
			{stack.map(({ node: id, best }, position) => [
				<Cell key={`entry-${id}`} value={nodes[id].val} column={position} top={stackTop} />,
				<SubLabel key={`entry-best-${id}`} column={position} top={stackTop + 58}>
					best {best}
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

export default defineExplainer<TreeInput, PopStep>({
	title: 'Each node carries its path\'s maximum',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'The tree and the stack of (node, best) pairs',
			subtitle: 'Nodes sit at their depth, left to right in order. Under each stack entry is the largest value on its path. Green is the node just popped, teal the good nodes, and faded the ones that are not good.',
			Scene: PopScene,
		},
	],
	examples: [
		{ input: { slots: slotsOf('3, 1, 4, 3, null, 1, 5') }, note: 'LeetCode example 1' },
		{ input: { slots: slotsOf('3, 3, null, 4, 2') }, note: 'LeetCode example 2: a tie counts' },
		{ input: { slots: slotsOf('1') }, note: 'LeetCode example 3' },
		{ input: { slots: slotsOf('9, 8, null, 7, null, 6') }, note: 'Falling chain: only the root' },
	],
	fields: [{ name: 'slots', label: 'Your own tree, in level order', placeholder: 'e.g. 3, 1, 4, 3, null, 1, 5' }],
	describe: ({ slots }) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}]`,
	parse(values) {
		const slots = parseSlots(values.slots);
		if (typeof slots === 'string') return { error: slots };
		return { input: { slots } };
	},
	steps: buildSteps,
});
