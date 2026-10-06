import { Canvas, Cell, Edge, RowLabel, SceneNote, type CellPlace, type CellTone } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

type Slot = number | null;

interface SearchInput {
	slots: Slot[];
	val: number;
}

interface TreeNode {
	val: number;
	left: number;
	right: number;
	depth: number;
	column: number;
}

type Phase = 'start' | 'step' | 'found' | 'missing';

interface WalkStep extends Step {
	phase: Phase;
	node: number;
	path: number[];
	ruledOut: number[];
}

type WalkSceneProps = SceneProps<SearchInput, WalkStep>;

const MAX_NODES = 12;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TREE_TOP = 30;
const LEVEL_GAP = 90;

const LINE_START = 9;
const LINE_WHILE = 11;
const LINE_MATCH = 12;
const LINE_RETURN_FOUND = 13;
const LINE_STEP = 15;
const LINE_RETURN_MISSING = 17;

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

function subtreeOf(nodes: TreeNode[], id: number): number[] {
	if (id === NONE) return [];
	return [id, ...subtreeOf(nodes, nodes[id].left), ...subtreeOf(nodes, nodes[id].right)];
}

function isBst(nodes: TreeNode[], id: number, low: number, high: number): boolean {
	if (id === NONE) return true;
	const { val, left, right } = nodes[id];
	return val > low && val < high && isBst(nodes, left, low, val) && isBst(nodes, right, val, high);
}

function buildSteps({ slots, val }: SearchInput): WalkStep[] {
	const nodes = treeOf(slots);
	const steps: WalkStep[] = [];
	const path: number[] = [];
	const ruledOut: number[] = [];

	const snapshot = (phase: Phase, node: number, highlightedLines: number[], narration: string) =>
		steps.push({ phase, node, path: [...path], ruledOut: [...ruledOut], readout: { val, checked: path.length, 'ruled out': ruledOut.length }, highlightedLines, narration });

	snapshot('start', 0, [LINE_START], `<code>node</code> starts at the root, ${nodes[0].val}. Looking for ${val}.`);

	let id = 0;
	while (id !== NONE && nodes[id].val !== val) {
		const { val: here, left, right } = nodes[id];
		path.push(id);
		const goLeft = val < here;
		const next = goLeft ? left : right;
		const discarded = subtreeOf(nodes, goLeft ? right : left);
		ruledOut.push(...discarded);
		const side = goLeft ? 'left' : 'right';
		const reason = goLeft ? `${val} < ${here}, and everything right of ${here} is larger than ${here}` : `${val} > ${here}, and everything left of ${here} is smaller than ${here}`;
		snapshot(
			'step',
			next,
			[LINE_WHILE, LINE_MATCH, LINE_STEP],
			`Compare ${val} with ${here}: ${reason}, so ${val} can only be in the ${side} subtree. ${next === NONE ? `But ${here} has no ${side} child: <code>node</code> becomes None.` : `Step ${side} to ${nodes[next].val}.`} ${discarded.length > 0 ? `${discarded.length} ${discarded.length === 1 ? 'node is' : 'nodes are'} ruled out without being looked at.` : ''}`,
		);
		id = next;
	}

	if (id === NONE) {
		snapshot('missing', NONE, [LINE_WHILE, LINE_RETURN_MISSING], `<code>node</code> is None: the only place ${val} could be is empty, so it is not in the tree. Return <b>None</b>, after checking ${path.length} of ${nodes.length} nodes.`);
	} else {
		path.push(id);
		snapshot('found', id, [LINE_WHILE, LINE_MATCH, LINE_RETURN_FOUND], `${nodes[id].val} == ${val}: found. Return the subtree rooted here, after checking ${path.length} of ${nodes.length} nodes.`);
	}
	return steps;
}

function WalkScene({ input: { slots }, step }: WalkSceneProps) {
	const { phase, node: current, path, ruledOut } = step;
	const nodes = treeOf(slots);
	const placeOf = (id: number): CellPlace => ({ column: nodes[id].column, top: TREE_TOP + nodes[id].depth * LEVEL_GAP });
	const childrenOf = (id: number) => [nodes[id].left, nodes[id].right].filter((child) => child !== NONE);
	const answer = phase === 'found' ? subtreeOf(nodes, current) : [];

	const toneOf = (id: number): CellTone => {
		if (answer.includes(id)) return 'focus';
		if (id === current) return 'add';
		if (path.includes(id)) return 'focus';
		return 'plain';
	};
	const edgeOnPath = (parent: number, child: number) => path.includes(parent) && (path.includes(child) || child === current);

	return (
		<Canvas columns={Math.max(nodes.length, 2)} height={TREE_TOP + heightOf(nodes) * LEVEL_GAP + 10}>
			<RowLabel top={TREE_TOP + 16}>
				<code>root</code>
			</RowLabel>
			{nodes.flatMap((_, id) =>
				childrenOf(id).map((child) => (
					<Edge key={`edge-${child}`} from={placeOf(id)} to={placeOf(child)} tone={edgeOnPath(id, child) || (answer.includes(id) && answer.includes(child)) ? 'focus' : 'plain'} />
				)),
			)}
			{nodes.map((node, id) => {
				const { column, top } = placeOf(id);
				return <Cell key={`node-${id}`} value={node.val} column={column} top={top} tone={toneOf(id)} dimmed={ruledOut.includes(id) && !answer.includes(id) && id !== current} />;
			})}
			{phase === 'missing' && path.length > 0 && (
				<SceneNote column={placeOf(path[path.length - 1]).column} top={placeOf(path[path.length - 1]).top + 70}>
					None
				</SceneNote>
			)}
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
	const nodes = treeOf(slots);
	if (!isBst(nodes, 0, -Infinity, Infinity)) return 'That tree is not a binary search tree: every left subtree must be smaller, and every right subtree larger, than its node.';
	return slots;
}

const slotsOf = (text: string) => parseSlots(text) as Slot[];
const BIG_TREE = '8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7';

export default defineExplainer<SearchInput, WalkStep>({
	title: 'One comparison rules out a whole subtree',
	codeFile: 'solution-3-walk.py',
	stages: [
		{
			title: 'The walk down the ordering',
			subtitle: 'Green is where node points now, teal the path walked and, when found, the subtree returned. Faded nodes are ruled out by a comparison without ever being checked.',
			Scene: WalkScene,
		},
	],
	examples: [
		{ input: { slots: slotsOf('4, 2, 7, 1, 3'), val: 2 }, note: 'LeetCode example 1' },
		{ input: { slots: slotsOf('4, 2, 7, 1, 3'), val: 5 }, note: 'LeetCode example 2: not there' },
		{ input: { slots: slotsOf(BIG_TREE), val: 7 }, note: 'Four checks out of eleven nodes' },
		{ input: { slots: slotsOf(BIG_TREE), val: 9 }, note: 'Missing, found out in three checks' },
	],
	fields: [
		{ name: 'slots', label: 'Your own BST, in level order', placeholder: 'e.g. 4, 2, 7, 1, 3' },
		{ name: 'val', label: 'val', placeholder: '2' },
	],
	describe: ({ slots, val }) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}], val = ${val}`,
	parse(values) {
		const slots = parseSlots(values.slots);
		if (typeof slots === 'string') return { error: slots };
		const val = Number(values.val);
		if (values.val.trim() === '' || !Number.isInteger(val) || Math.abs(val) > MAX_MAGNITUDE) return { error: `Enter val as a whole number from −${MAX_MAGNITUDE} to ${MAX_MAGNITUDE}.` };
		return { input: { slots, val } };
	},
	steps: buildSteps,
});
