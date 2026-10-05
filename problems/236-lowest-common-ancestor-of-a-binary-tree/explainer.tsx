import { Canvas, Cell, Edge, RowLabel, SubLabel, Tag, type CellPlace, type CellTone } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

type Slot = number | null;

interface LcaInput {
	slots: Slot[];
	p: number;
	q: number;
}

interface TreeNode {
	val: number;
	left: number;
	right: number;
	depth: number;
	column: number;
}

type Phase = 'start' | 'enter' | 'return' | 'done';

interface WalkStep extends Step {
	phase: Phase;
	node: number;
	calls: number[];
	counts: Record<number, number>;
	lca: number;
}

type WalkSceneProps = SceneProps<LcaInput, WalkStep>;

const MAX_NODES = 12;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TREE_TOP = 40;
const LEVEL_GAP = 100;

const LINES_ENTER = [11, 14, 16];
const LINES_PASS_LEFT = [18, 19];
const LINES_FOUND_WITH_LEFT = [18, 21, 22];
const LINES_PASS_RIGHT = [26, 27];
const LINES_FOUND_SPLIT = [26, 29, 30];
const LINES_COUNT = [26, 29, 32];
const LINE_START = 34;
const LINE_RETURN = 35;

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

function buildSteps({ slots, p, q }: LcaInput): WalkStep[] {
	const nodes = treeOf(slots);
	const steps: WalkStep[] = [];
	const calls: number[] = [];
	const counts: Record<number, number> = {};
	let lca = NONE;

	const snapshot = (phase: Phase, node: number, highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			node,
			calls: [...calls],
			counts: { ...counts },
			lca,
			readout: { 'call depth': calls.length, found: node === NONE || !(node in counts) ? '–' : counts[node], LCA: lca === NONE ? '–' : nodes[lca].val },
			highlightedLines,
			narration,
		});

	snapshot('start', NONE, [LINE_START], `<code>walk</code> starts at the root, ${nodes[0].val}, looking for p = ${p} and q = ${q}. Each call reports how many of the two its subtree holds.`);

	const walk = (id: number): [number, number] => {
		if (id === NONE) return [0, NONE];
		const { val, left, right } = nodes[id];
		calls.push(id);
		const self = val === p || val === q ? 1 : 0;
		snapshot(
			'enter',
			id,
			LINES_ENTER,
			`<code>walk(${val})</code>: ${self ? `${val} is ${val === p ? 'p' : 'q'}, so <code>found_self</code> = 1` : `${val} is neither p nor q, so <code>found_self</code> = 0`}. ${left === NONE ? 'Its left child is None, which holds neither.' : `Walk the left subtree first, from ${nodes[left].val}.`}`,
		);

		const [foundLeft, leftAnswer] = walk(left);
		const finish = (count: number, answer: number, lines: number[], narration: string): [number, number] => {
			counts[id] = count;
			calls.pop();
			snapshot('return', id, lines, narration);
			return [count, answer];
		};

		if (foundLeft === 2) return finish(2, leftAnswer, LINES_PASS_LEFT, `Back in <code>walk(${val})</code>: the left subtree already holds both, and its answer is ${nodes[leftAnswer].val}. Pass it up unchanged.`);
		if (self === 1 && foundLeft === 1) {
			lca = id;
			return finish(2, id, LINES_FOUND_WITH_LEFT, `Back in <code>walk(${val})</code>: ${val} is one of the two and its left subtree holds the other, so ${val} is the LCA. Its right subtree is never walked.`);
		}

		const [foundRight, rightAnswer] = walk(right);
		if (foundRight === 2) return finish(2, rightAnswer, LINES_PASS_RIGHT, `Back in <code>walk(${val})</code>: the right subtree already holds both, and its answer is ${nodes[rightAnswer].val}. Pass it up unchanged.`);
		const total = self + foundLeft + foundRight;
		if (total === 2) {
			lca = id;
			const split = self === 1 ? `${val} is one of the two and its right subtree holds the other` : `the left subtree holds one and the right subtree holds the other`;
			return finish(2, id, LINES_FOUND_SPLIT, `Back in <code>walk(${val})</code>: ${self} + ${foundLeft} + ${foundRight} = 2, because ${split}. ${val} is the first node whose subtree holds both: the LCA.`);
		}
		return finish(
			total,
			id,
			LINES_COUNT,
			`Back in <code>walk(${val})</code>: ${self} + ${foundLeft} + ${foundRight} = ${total}, so its subtree holds ${total === 0 ? 'neither' : 'one of the two'}. Return ${total}.`,
		);
	};

	walk(0);
	snapshot('done', NONE, [LINE_START, LINE_RETURN], `The root's call returned count 2 with the answer attached: the lowest common ancestor of ${p} and ${q} is <b>${nodes[lca].val}</b>.`);
	return steps;
}

function WalkScene({ input: { slots, p, q }, step }: WalkSceneProps) {
	const { phase, node: current, calls, counts, lca } = step;
	const nodes = treeOf(slots);
	const placeOf = (id: number): CellPlace => ({ column: nodes[id].column, top: TREE_TOP + nodes[id].depth * LEVEL_GAP });
	const childrenOf = (id: number) => [nodes[id].left, nodes[id].right].filter((child) => child !== NONE);
	const visited = (id: number) => id in counts || calls.includes(id);

	const toneOf = (id: number): CellTone => {
		if (id === lca) return 'focus';
		if (id === current) return 'add';
		if (calls.includes(id)) return 'focus';
		return 'plain';
	};
	const labelOf = (id: number) => (id === lca ? 'LCA' : `found ${counts[id]}`);

	return (
		<Canvas columns={Math.max(nodes.length, 2)} height={TREE_TOP + heightOf(nodes) * LEVEL_GAP + 10}>
			<RowLabel top={TREE_TOP + 16}>
				<code>root</code>
			</RowLabel>
			{nodes.flatMap((_, id) => childrenOf(id).map((child) => <Edge key={`edge-${child}`} from={placeOf(id)} to={placeOf(child)} />))}
			{nodes.map((node, id) => {
				const { column, top } = placeOf(id);
				const role = node.val === p ? 'p' : node.val === q ? 'q' : '';
				return [
					<Cell key={`node-${id}`} value={node.val} column={column} top={top} tone={toneOf(id)} dimmed={phase !== 'start' && !visited(id)} />,
					role && (
						<Tag key={`role-${id}`} column={column} top={top - 22} tone="add">
							{role}
						</Tag>
					),
					<SubLabel key={`count-${id}`} column={column} top={top + 58} hidden={!(id in counts) && id !== lca}>
						{labelOf(id)}
					</SubLabel>,
				];
			})}
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
	const values = slots.filter((slot): slot is number => slot !== null);
	if (slots.length === 0 || slots[0] === null) return 'The tree needs at least two nodes.';
	if (values.length > MAX_NODES) return `Use ${MAX_NODES} nodes or fewer so everything fits on screen.`;
	if (new Set(values).size !== values.length) return 'Node values must be unique, as LeetCode guarantees.';
	return slots;
}

const slotsOf = (text: string) => parseSlots(text) as Slot[];
const EXAMPLE_TREE = '3, 5, 1, 6, 2, 0, 8, null, null, 7, 4';

export default defineExplainer<LcaInput, WalkStep>({
	title: 'Each call counts how many of p and q it holds',
	codeFile: 'solution-1-original.py',
	stages: [
		{
			title: 'The tree, and what each call returns',
			subtitle: 'Tags mark p and q. Green is the call just entered, teal the calls still waiting on a child, and under each finished node is how many of the two its subtree holds. Faded nodes are never walked.',
			Scene: WalkScene,
		},
	],
	examples: [
		{ input: { slots: slotsOf(EXAMPLE_TREE), p: 5, q: 1 }, note: 'LeetCode example 1: split across the root' },
		{ input: { slots: slotsOf(EXAMPLE_TREE), p: 5, q: 4 }, note: 'LeetCode example 2: p is above q' },
		{ input: { slots: slotsOf('1, 2'), p: 1, q: 2 }, note: 'LeetCode example 3' },
		{ input: { slots: slotsOf(EXAMPLE_TREE), p: 7, q: 4 }, note: 'Found deep, then passed up' },
	],
	fields: [
		{ name: 'slots', label: 'Your own tree, in level order', placeholder: 'e.g. 3, 5, 1, 6, 2, 0, 8' },
		{ name: 'p', label: 'p', placeholder: '5' },
		{ name: 'q', label: 'q', placeholder: '1' },
	],
	describe: ({ slots, p, q }) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}], p = ${p}, q = ${q}`,
	parse(values) {
		const slots = parseSlots(values.slots);
		if (typeof slots === 'string') return { error: slots };
		const present = new Set(treeOf(slots).map((node) => node.val));
		const p = Number(values.p);
		const q = Number(values.q);
		if (values.p.trim() === '' || values.q.trim() === '' || !present.has(p) || !present.has(q)) return { error: `Enter p and q as two values from the tree: ${[...present].join(', ')}.` };
		if (p === q) return { error: 'p and q must be different nodes.' };
		return { input: { slots, p, q } };
	},
	steps: buildSteps,
});
