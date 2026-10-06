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

type Phase = 'start' | 'pop' | 'done';

interface QueueStep extends Step {
	phase: Phase;
	node: number;
	queue: number[];
	popped: number[];
	view: number[];
	recorded: number[];
}

type QueueSceneProps = SceneProps<TreeInput, QueueStep>;

const MAX_NODES = 12;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TREE_TOP = 30;
const LEVEL_GAP = 90;
const ROW_GAP = 110;

const LINE_EMPTY = [9, 10];
const LINE_INIT = 12;
const LINES_POP = [14, 15];
const LINE_RIGHT = 17;
const LINES_PUSH_RIGHT = [18, 19];
const LINE_LEFT = 20;
const LINES_PUSH_LEFT = [21, 22];
const LINE_RETURN = 24;

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

const heightOf = (nodes: TreeNode[]) => (nodes.length === 0 ? 1 : Math.max(...nodes.map((node) => node.depth)) + 1);

function buildSteps({ slots }: TreeInput): QueueStep[] {
	const nodes = treeOf(slots);
	const steps: QueueStep[] = [];
	if (nodes.length === 0) {
		steps.push({ phase: 'done', node: NONE, queue: [], popped: [], view: [], recorded: [], readout: { depth: '–', 'queue size': 0 }, highlightedLines: LINE_EMPTY, narration: `The tree is empty, so there is nothing to see: return <b>[]</b>.` });
		return steps;
	}

	let queue: number[] = [0];
	const popped: number[] = [];
	const view: number[] = [0];

	const snapshot = (phase: Phase, node: number, recorded: number[], highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			node,
			queue: [...queue],
			popped: [...popped],
			view: [...view],
			recorded,
			readout: { depth: node === NONE ? '–' : nodes[node].depth, 'queue size': queue.length },
			highlightedLines,
			narration,
		});

	snapshot('start', NONE, [0], [LINE_INIT], `The queue starts with the root at depth 0, and depth 0's view is the root itself, ${nodes[0].val}.`);

	while (queue.length > 0) {
		const [id, ...rest] = queue;
		queue = rest;
		popped.push(id);
		const { val, left, right, depth } = nodes[id];
		const lines = [...LINES_POP, LINE_RIGHT];
		const recorded: number[] = [];
		const parts: string[] = [];
		for (const child of [right, left]) {
			if (child === NONE) continue;
			queue = [...queue, child];
			const side = child === right ? 'right' : 'left';
			if (view.length === depth + 1) {
				view.push(child);
				recorded.push(child);
				parts.push(`its ${side} child ${nodes[child].val} is the first node found at depth ${depth + 1}, so <code>setdefault</code> records it as that depth's view`);
			} else {
				parts.push(`its ${side} child ${nodes[child].val} is queued, but depth ${depth + 1} already has ${nodes[view[depth + 1]].val}, found further right, so <code>setdefault</code> keeps that`);
			}
		}
		if (right !== NONE) lines.push(...LINES_PUSH_RIGHT);
		lines.push(LINE_LEFT);
		if (left !== NONE) lines.push(...LINES_PUSH_LEFT);
		const childText = parts.length > 0 ? `${parts.join('; then ')}.` : 'it has no children.';
		const lead = right !== NONE && left !== NONE ? 'Right goes first: ' : '';
		const body = lead ? `${lead}${childText}` : `${childText.charAt(0).toUpperCase()}${childText.slice(1)}`;
		snapshot('pop', id, recorded, lines, `Pop ${val} at depth ${depth}. ${body}`);
	}

	snapshot('done', NONE, [], [LINE_RETURN], `The queue is empty. Reading <code>result</code> in depth order gives the right side view: <b>[${view.map((id) => nodes[id].val).join(', ')}]</b>.`);
	return steps;
}

function QueueScene({ input: { slots }, step }: QueueSceneProps) {
	const { phase, node: current, queue, popped, view, recorded } = step;
	const nodes = treeOf(slots);
	const height = heightOf(nodes);
	const queueTop = TREE_TOP + height * LEVEL_GAP + 10;
	const resultTop = queueTop + ROW_GAP;
	const placeOf = (id: number): CellPlace => ({ column: nodes[id].column, top: TREE_TOP + nodes[id].depth * LEVEL_GAP });
	const childrenOf = (id: number) => [nodes[id].left, nodes[id].right].filter((child) => child !== NONE);

	const toneOf = (id: number): CellTone => {
		if (id === current) return 'add';
		if (view.includes(id)) return 'focus';
		return 'plain';
	};

	return (
		<Canvas columns={Math.max(nodes.length, height, 2)} height={resultTop + 80}>
			{Array.from({ length: nodes.length === 0 ? 0 : height }, (_, depth) => (
				<RowLabel key={`depth-${depth}`} top={TREE_TOP + depth * LEVEL_GAP + 16}>
					depth {depth}
				</RowLabel>
			))}
			{nodes.flatMap((_, id) => childrenOf(id).map((child) => <Edge key={`edge-${child}`} from={placeOf(id)} to={placeOf(child)} />))}
			{nodes.map((node, id) => {
				const { column, top } = placeOf(id);
				return (
					<Cell
						key={`node-${id}`}
						value={node.val}
						column={column}
						top={top}
						tone={toneOf(id)}
						dimmed={phase !== 'done' && popped.includes(id) && id !== current && !view.includes(id)}
					/>
				);
			})}
			<RowLabel top={queueTop + 16}>
				<code>queue</code>
			</RowLabel>
			{queue.map((id, position) => [
				<Cell key={`queued-${id}`} value={nodes[id].val} column={position} top={queueTop} />,
				<SubLabel key={`queued-depth-${id}`} column={position} top={queueTop + 58}>
					depth {nodes[id].depth}
				</SubLabel>,
			])}
			<RowLabel top={resultTop + 16}>
				<code>result</code>
			</RowLabel>
			{view.map((id, depth) => [
				<Cell key={`view-${depth}`} value={nodes[id].val} column={depth} top={resultTop} tone={recorded.includes(id) ? 'add' : 'focus'} />,
				<SubLabel key={`view-depth-${depth}`} column={depth} top={resultTop + 58}>
					depth {depth}
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
	if (slots.filter((slot) => slot !== null).length > MAX_NODES) return `Use ${MAX_NODES} nodes or fewer so everything fits on screen.`;
	return slots;
}

const slotsOf = (text: string) => parseSlots(text) as Slot[];

export default defineExplainer<TreeInput, QueueStep>({
	title: 'Right child first, so the first node per depth is the view',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'The tree by depth, the queue, and result',
			subtitle: 'Green is the node just popped and any view just recorded; teal marks the nodes in the view. Faded nodes were popped but are hidden by a node further right.',
			Scene: QueueScene,
		},
	],
	examples: [
		{ input: { slots: slotsOf('1, 2, 3, null, 5, null, 4') }, note: 'LeetCode example 1' },
		{ input: { slots: slotsOf('1, 2, 3, 4') }, note: 'A left node seen from the right' },
		{ input: { slots: slotsOf('1, null, 3') }, note: 'LeetCode example 2' },
		{ input: { slots: [] }, note: 'LeetCode example 3: empty' },
	],
	fields: [{ name: 'slots', label: 'Your own tree, in level order', placeholder: 'e.g. 1, 2, 3, null, 5, null, 4' }],
	describe: ({ slots }) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}]`,
	parse(values) {
		const slots = parseSlots(values.slots);
		if (typeof slots === 'string') return { error: slots };
		return { input: { slots } };
	},
	steps: buildSteps,
});
