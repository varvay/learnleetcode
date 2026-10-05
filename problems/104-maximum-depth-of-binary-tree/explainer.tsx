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

type Phase = 'start' | 'enter' | 'return' | 'done';

interface CallStep extends Step {
	phase: Phase;
	node: number;
	calls: number[];
	returned: Record<number, number>;
	deepestPath: number[];
}

type CallSceneProps = SceneProps<TreeInput, CallStep>;

const MAX_NODES = 10;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TREE_TOP = 30;
const LEVEL_GAP = 96;
const STACK_GAP = 40;

const LINE_MAX_DEPTH = 9;
const LINE_IF = 12;
const LINE_RECURSE = 13;
const LINES_EMPTY = [14, 15];

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

const heightOf = (nodes: TreeNode[]) => (nodes.length === 0 ? 0 : Math.max(...nodes.map((node) => node.depth)) + 1);

function buildSteps({ slots }: TreeInput): CallStep[] {
	const nodes = treeOf(slots);
	const steps: CallStep[] = [];
	const calls: number[] = [];
	const returned: Record<number, number> = {};
	let lastReturned: number | string = '–';

	const snapshot = (phase: Phase, node: number, highlightedLines: number[], narration: string, deepestPath: number[] = []) =>
		steps.push({
			phase,
			node,
			calls: [...calls],
			returned: { ...returned },
			deepestPath,
			readout: { 'call stack': calls.length, returned: lastReturned },
			highlightedLines,
			narration,
		});

	if (nodes.length === 0) {
		snapshot('start', NONE, [LINE_MAX_DEPTH], `<code>maxDepth</code> calls <code>visit(root)</code>, and the root is None.`);
		lastReturned = 0;
		snapshot('done', NONE, [LINE_MAX_DEPTH, LINE_IF, ...LINES_EMPTY], `An empty tree has no nodes, so <code>visit(None)</code> returns <b>0</b>.`);
		return steps;
	}

	snapshot('start', NONE, [LINE_MAX_DEPTH], `<code>maxDepth</code> calls <code>visit</code> on the root, ${nodes[0].val}.`);

	const depthOf = (id: number) => (id === NONE ? 0 : returned[id]);
	const walk = (id: number) => {
		const { val, left, right } = nodes[id];
		calls.push(id);
		const plan =
			right !== NONE
				? `Walk the right subtree first, from ${nodes[right].val}.`
				: left !== NONE
					? `Its right child is None, which returns 0, so walk the left subtree, from ${nodes[left].val}.`
					: `Both children are None, and each returns 0.`;
		snapshot('enter', id, [LINE_IF, LINE_RECURSE], `<code>visit(${val})</code>: the node exists, so its depth is 1 plus the deeper of its subtrees. ${plan}`);
		if (right !== NONE) walk(right);
		if (left !== NONE) walk(left);
		returned[id] = 1 + Math.max(depthOf(right), depthOf(left));
		lastReturned = returned[id];
		calls.pop();
		const hasEmptyChild = left === NONE || right === NONE;
		snapshot(
			'return',
			id,
			[LINE_RECURSE, ...(hasEmptyChild ? LINES_EMPTY : [])],
			`<code>visit(${val})</code> returns 1 + max(${depthOf(right)}, ${depthOf(left)}) = ${returned[id]}${calls.length > 0 ? ` to <code>visit(${nodes[calls[calls.length - 1]].val})</code>` : ''}.`,
		);
	};
	walk(0);

	const deepestPath: number[] = [];
	for (let id = 0; id !== NONE; ) {
		deepestPath.push(id);
		const { left, right } = nodes[id];
		id = right !== NONE && depthOf(right) >= depthOf(left) ? right : left;
	}
	snapshot('done', NONE, [LINE_MAX_DEPTH], `<code>maxDepth</code> returns <b>${returned[0]}</b>: the highlighted path, ${deepestPath.map((id) => nodes[id].val).join(' → ')}, has ${returned[0]} ${returned[0] === 1 ? 'node' : 'nodes'}.`, deepestPath);
	return steps;
}

function CallScene({ input: { slots }, step }: CallSceneProps) {
	const { phase, node: current, calls, returned, deepestPath } = step;
	const nodes = treeOf(slots);
	const stackTop = TREE_TOP + Math.max(1, heightOf(nodes)) * LEVEL_GAP + STACK_GAP;
	const placeOf = (id: number): CellPlace => ({ column: nodes[id].column, top: TREE_TOP + nodes[id].depth * LEVEL_GAP });
	const childrenOf = (id: number) => [nodes[id].left, nodes[id].right].filter((child) => child !== NONE);

	const toneOf = (id: number): CellTone => {
		if (phase === 'done') return deepestPath.includes(id) ? 'focus' : 'plain';
		if (id === current) return phase === 'enter' ? 'add' : 'focus';
		if (calls.includes(id)) return 'focus';
		return 'plain';
	};

	return (
		<Canvas columns={Math.max(nodes.length, 2)} height={stackTop + 80}>
			<RowLabel top={TREE_TOP + 16}>
				<code>root</code>
			</RowLabel>
			{nodes.length === 0 && (
				<SubLabel column={0} top={TREE_TOP + 18}>
					None
				</SubLabel>
			)}
			{nodes.flatMap((_, id) =>
				childrenOf(id).map((child) => (
					<Edge key={`edge-${child}`} from={placeOf(id)} to={placeOf(child)} tone={phase === 'done' && deepestPath.includes(child) ? 'focus' : 'plain'} />
				)),
			)}
			{nodes.map((node, id) => {
				const top = TREE_TOP + node.depth * LEVEL_GAP;
				return [
					<Cell key={`node-${id}`} value={node.val} column={node.column} top={top} tone={toneOf(id)} dimmed={phase !== 'done' && !(id in returned) && !calls.includes(id) && phase !== 'start'} />,
					<SubLabel key={`returned-${id}`} column={node.column} top={top + 58} hidden={!(id in returned)}>
						returns {returned[id]}
					</SubLabel>,
				];
			})}
			<RowLabel top={stackTop + 16}>call stack</RowLabel>
			{calls.map((id, position) => (
				<Cell key={`call-${id}`} value={nodes[id].val} column={position} top={stackTop} tone={position === calls.length - 1 ? 'add' : 'plain'} />
			))}
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
	if (slots.filter((slot) => slot !== null).length > MAX_NODES) return `Use ${MAX_NODES} nodes or fewer so everything fits on screen.`;
	return slots;
}

const slotsOf = (text: string) => parseSlots(text) as Slot[];

export default defineExplainer<TreeInput, CallStep>({
	title: 'Each call returns its subtree\'s depth',
	codeFile: 'solution-2-bottom-up.py',
	stages: [
		{
			title: 'The tree and the call stack',
			subtitle: 'Nodes sit at their depth, left to right in order. Green is the call just entered, teal the calls still waiting on a child, and each finished node shows what it returned. Faded nodes are not reached yet.',
			Scene: CallScene,
		},
	],
	examples: [
		{ input: { slots: slotsOf('3, 9, 20, null, null, 15, 7') }, note: 'LeetCode example 1' },
		{ input: { slots: slotsOf('1, null, 2') }, note: 'LeetCode example 2' },
		{ input: { slots: slotsOf('1, 2, 3, 4, null, null, null, 5') }, note: 'The deepest path runs left' },
		{ input: { slots: [] }, note: 'Empty tree' },
	],
	fields: [{ name: 'slots', label: 'Your own tree, in level order', placeholder: 'e.g. 3, 9, 20, null, null, 15, 7' }],
	describe: ({ slots }) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}]`,
	parse(values) {
		const slots = parseSlots(values.slots);
		if (typeof slots === 'string') return { error: slots };
		return { input: { slots } };
	},
	steps: buildSteps,
});
