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

interface Lengths {
	left: number;
	right: number;
}

type Phase = 'start' | 'pop' | 'done';

interface ZigzagStep extends Step {
	phase: Phase;
	node: number;
	stack: number[];
	lengths: Record<number, Lengths>;
	popped: number[];
	bestPath: number[];
}

type ZigzagSceneProps = SceneProps<TreeInput, ZigzagStep>;

const MAX_NODES = 12;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TREE_TOP = 30;
const LEVEL_GAP = 96;
const STACK_GAP = 40;

const LINE_INIT = 12;
const LINES_POP = [14, 15, 17];
const LINE_RIGHT = 19;
const LINE_PUSH_RIGHT = 20;
const LINE_LEFT = 21;
const LINE_PUSH_LEFT = 22;
const LINE_RETURN = 24;

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
const lengthsText = ({ left, right }: Lengths) => `L${left} R${right}`;

function pathUpFrom(nodes: TreeNode[], end: number, length: number) {
	const path = [end];
	for (let at = end, step = 0; step < length; step++) {
		at = nodes[at].parent;
		path.unshift(at);
	}
	return path;
}

function buildSteps({ slots }: TreeInput): ZigzagStep[] {
	const nodes = treeOf(slots);
	const steps: ZigzagStep[] = [];
	const lengths: Record<number, Lengths> = { 0: { left: 0, right: 0 } };
	const popped: number[] = [];
	let stack = [0];
	let best = 0;
	let bestPath: number[] = [0];

	const snapshot = (phase: Phase, node: number, highlightedLines: number[], narration: string) =>
		steps.push({ phase, node, stack: [...stack], lengths: { ...lengths }, popped: [...popped], bestPath: [...bestPath], readout: { best, 'stack size': stack.length }, highlightedLines, narration });

	snapshot('start', NONE, [LINE_INIT], `The stack starts with the root and two zigzags of length 0: nothing has reached it yet.`);

	while (stack.length > 0) {
		const id = stack[stack.length - 1];
		stack = stack.slice(0, -1);
		popped.push(id);
		const { val, left: leftChild, right: rightChild } = nodes[id];
		const { left, right } = lengths[id];
		const before = best;
		if (Math.max(left, right) > best) {
			best = Math.max(left, right);
			bestPath = pathUpFrom(nodes, id, best);
		}
		const lines = [...LINES_POP, LINE_RIGHT];
		const pushes: string[] = [];
		if (rightChild !== NONE) {
			lengths[rightChild] = { left: right + 1, right: 0 };
			stack = [...stack, rightChild];
			lines.push(LINE_PUSH_RIGHT);
			pushes.push(`going right to ${nodes[rightChild].val} extends the zigzag that wanted a right turn: ${nodes[rightChild].val} gets L${right + 1} R0`);
		}
		lines.push(LINE_LEFT);
		if (leftChild !== NONE) {
			lengths[leftChild] = { left: 0, right: left + 1 };
			stack = [...stack, leftChild];
			lines.push(LINE_PUSH_LEFT);
			pushes.push(`going left to ${nodes[leftChild].val} extends the one that wanted a left turn: ${nodes[leftChild].val} gets L0 R${left + 1}`);
		}
		const bestText = best > before ? `best rises to ${best}.` : `best stays ${best}.`;
		const pushText = pushes.length > 0 ? ` Then ${pushes.join('; ')}.` : ' It has no children.';
		snapshot(
			'pop',
			id,
			lines,
			`Pop ${val}: the longest zigzag ending here that turns left next has length ${left}, and the one that turns right next has length ${right}. ${bestText.charAt(0).toUpperCase()}${bestText.slice(1)}${pushText}`,
		);
	}

	snapshot('done', NONE, [LINE_RETURN], `The stack is empty. A longest zigzag, highlighted, has <b>${best}</b> ${best === 1 ? 'edge' : 'edges'}.`);
	return steps;
}

function ZigzagScene({ input: { slots }, step }: ZigzagSceneProps) {
	const { phase, node: current, stack, lengths, popped, bestPath } = step;
	const nodes = treeOf(slots);
	const stackTop = TREE_TOP + heightOf(nodes) * LEVEL_GAP + STACK_GAP;
	const placeOf = (id: number): CellPlace => ({ column: nodes[id].column, top: TREE_TOP + nodes[id].depth * LEVEL_GAP });
	const childrenOf = (id: number) => [nodes[id].left, nodes[id].right].filter((child) => child !== NONE);
	const onBestPath = (parent: number, child: number) => phase === 'done' && bestPath.includes(parent) && bestPath.includes(child);

	const toneOf = (id: number): CellTone => {
		if (phase === 'done') return bestPath.includes(id) ? 'focus' : 'plain';
		if (id === current) return 'add';
		return 'plain';
	};

	return (
		<Canvas columns={Math.max(nodes.length, 2)} height={stackTop + 90}>
			<RowLabel top={TREE_TOP + 16}>
				<code>root</code>
			</RowLabel>
			{nodes.flatMap((_, id) =>
				childrenOf(id).map((child) => <Edge key={`edge-${child}`} from={placeOf(id)} to={placeOf(child)} tone={onBestPath(id, child) ? 'focus' : 'plain'} />),
			)}
			{nodes.map((node, id) => {
				const { column, top } = placeOf(id);
				return [
					<Cell key={`node-${id}`} value={node.val} column={column} top={top} tone={toneOf(id)} dimmed={phase !== 'done' && popped.includes(id) && id !== current} />,
					<SubLabel key={`lengths-${id}`} column={column} top={top + 58} hidden={!popped.includes(id)}>
						{lengths[id] ? lengthsText(lengths[id]) : ''}
					</SubLabel>,
				];
			})}
			<RowLabel top={stackTop + 16}>
				<code>stack</code>
			</RowLabel>
			{stack.map((id, position) => [
				<Cell key={`entry-${id}`} value={nodes[id].val} column={position} top={stackTop} />,
				<SubLabel key={`entry-lengths-${id}`} column={position} top={stackTop + 58}>
					{lengthsText(lengths[id])}
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

export default defineExplainer<TreeInput, ZigzagStep>({
	title: 'Two lengths per node, one for each next turn',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'The tree and the stack of (node, left, right)',
			subtitle: 'L is the longest zigzag ending at a node that turns left next, R the one that turns right next. Green is the node just popped, faded the ones already popped; at the end, the longest zigzag is highlighted.',
			Scene: ZigzagScene,
		},
	],
	examples: [
		{ input: { slots: slotsOf('1, 2, 3, null, 4, 5, null, 6, null, null, 7, 8') }, note: 'Distinct values: a zigzag of 3' },
		{ input: { slots: slotsOf('1, null, 1, 1, 1, null, null, 1, 1, null, 1, null, null, null, 1') }, note: 'LeetCode example 1' },
		{ input: { slots: slotsOf('1, 1, 1, null, 1, null, null, 1, 1, null, 1') }, note: 'LeetCode example 2' },
		{ input: { slots: slotsOf('1') }, note: 'LeetCode example 3' },
	],
	fields: [{ name: 'slots', label: 'Your own tree, in level order', placeholder: 'e.g. 1, 2, 3, null, 4, 5' }],
	describe: ({ slots }) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}]`,
	parse(values) {
		const slots = parseSlots(values.slots);
		if (typeof slots === 'string') return { error: slots };
		return { input: { slots } };
	},
	steps: buildSteps,
});
