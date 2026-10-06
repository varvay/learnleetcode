import { Canvas, Cell, Edge, RowLabel, type CellPlace, type CellTone } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

type Slot = number | null;

interface SequenceInput {
	slots: Slot[];
	keys: number[];
}

interface Link {
	val: number;
	left: number;
	right: number;
}

interface Tree {
	root: number;
	links: Record<number, Link>;
}

interface Removal {
	tree: Tree;
	moved: number;
	kind: string;
}

interface CompareStep extends Step {
	hang: Tree;
	successor: Tree;
	hangMoved: number;
	successorMoved: number;
}

type CompareSceneProps = SceneProps<SequenceInput, CompareStep>;

const MAX_NODES = 11;
const MAX_KEYS = 6;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TREE_TOP = 20;
const LEVEL_GAP = 72;

function treeOf(slots: Slot[]): Tree {
	const links: Record<number, Link> = {};
	if (slots.length === 0 || slots[0] === null) return { root: NONE, links };
	links[0] = { val: slots[0], left: NONE, right: NONE };
	let count = 1;
	const waiting = [0];
	let next = 1;
	while (waiting.length > 0 && next < slots.length) {
		const parent = waiting.shift()!;
		for (const side of ['left', 'right'] as const) {
			const slot = slots[next++];
			if (slot === undefined || slot === null) continue;
			links[count] = { val: slot, left: NONE, right: NONE };
			links[parent][side] = count;
			waiting.push(count++);
		}
	}
	return { root: 0, links };
}

const cloneTree = ({ root, links }: Tree): Tree => ({ root, links: Object.fromEntries(Object.entries(links).map(([id, link]) => [id, { ...link }])) });
const heightOf = (tree: Tree, id = tree.root): number => (id === NONE ? 0 : 1 + Math.max(heightOf(tree, tree.links[id].left), heightOf(tree, tree.links[id].right)));

function findWithParent(tree: Tree, key: number) {
	let parent = NONE;
	let id = tree.root;
	while (id !== NONE && tree.links[id].val !== key) {
		parent = id;
		id = key < tree.links[id].val ? tree.links[id].left : tree.links[id].right;
	}
	return { id, parent };
}

function relink(tree: Tree, parent: number, from: number, to: number) {
	if (parent === NONE) tree.root = to;
	else if (tree.links[parent].left === from) tree.links[parent].left = to;
	else tree.links[parent].right = to;
}

function childKind(link: Link) {
	if (link.left === NONE && link.right === NONE) return 'a leaf';
	if (link.left === NONE || link.right === NONE) return 'a node with one child';
	return 'a node with two children';
}

function hangDelete(source: Tree, key: number): Removal {
	const tree = cloneTree(source);
	const { id, parent } = findWithParent(tree, key);
	if (id === NONE) return { tree, moved: NONE, kind: 'not in the tree' };
	const link = tree.links[id];
	const kind = childKind(link);
	if (link.left !== NONE && link.right !== NONE) {
		relink(tree, parent, id, link.left);
		let rightmost = link.left;
		while (tree.links[rightmost].right !== NONE) rightmost = tree.links[rightmost].right;
		tree.links[rightmost].right = link.right;
		delete tree.links[id];
		return { tree, moved: link.right, kind };
	}
	const child = link.left !== NONE ? link.left : link.right;
	relink(tree, parent, id, child);
	delete tree.links[id];
	return { tree, moved: child, kind };
}

function successorDelete(source: Tree, key: number): Removal {
	const tree = cloneTree(source);
	const { id, parent } = findWithParent(tree, key);
	if (id === NONE) return { tree, moved: NONE, kind: 'not in the tree' };
	const link = tree.links[id];
	const kind = childKind(link);
	if (link.left !== NONE && link.right !== NONE) {
		let successorParent = id;
		let successor = link.right;
		while (tree.links[successor].left !== NONE) {
			successorParent = successor;
			successor = tree.links[successor].left;
		}
		link.val = tree.links[successor].val;
		relink(tree, successorParent, successor, tree.links[successor].right);
		delete tree.links[successor];
		return { tree, moved: id, kind };
	}
	const child = link.left !== NONE ? link.left : link.right;
	relink(tree, parent, id, child);
	delete tree.links[id];
	return { tree, moved: child, kind };
}

function buildSteps({ slots, keys }: SequenceInput): CompareStep[] {
	let hang = treeOf(slots);
	let successor = cloneTree(hang);
	const steps: CompareStep[] = [];
	const snapshot = (hangMoved: number, successorMoved: number, narration: string) =>
		steps.push({
			hang: cloneTree(hang),
			successor: cloneTree(successor),
			hangMoved,
			successorMoved,
			readout: { 'height, hang right': heightOf(hang), 'height, successor': heightOf(successor) },
			narration,
		});

	snapshot(NONE, NONE, `Both trees start the same, with height ${heightOf(hang)}. Each step deletes the next key, ${keys.join(', ')}, from both.`);

	for (const key of keys) {
		const hangBefore = heightOf(hang);
		const successorBefore = heightOf(successor);
		const hangResult = hangDelete(hang, key);
		const successorResult = successorDelete(successor, key);
		hang = hangResult.tree;
		successor = successorResult.tree;
		const hangText =
			hangResult.kind === 'a node with two children'
				? `In the first tree, ${key} has two children: its left subtree takes its place and its right subtree hangs below the left's largest node.`
				: `In the first tree, ${key} is ${hangResult.kind}.`;
		const successorText =
			successorResult.kind === 'a node with two children'
				? `In the second, ${key} has two children: the smallest key on its right is copied in, and that node is removed.`
				: `In the second, ${key} is ${successorResult.kind}.`;
		snapshot(
			hangResult.moved,
			successorResult.moved,
			`Delete ${key}. ${hangText} ${successorText} Heights: ${hangBefore} → <b>${heightOf(hang)}</b> against ${successorBefore} → <b>${heightOf(successor)}</b>.`,
		);
	}
	return steps;
}

function TreeScene({ tree, moved }: { tree: Tree; moved: number }) {
	const columns: Record<number, number> = {};
	const depths: Record<number, number> = {};
	let nextColumn = 0;
	const place = (id: number, depth: number) => {
		if (id === NONE) return;
		place(tree.links[id].left, depth + 1);
		columns[id] = nextColumn++;
		depths[id] = depth;
		place(tree.links[id].right, depth + 1);
	};
	place(tree.root, 0);
	const ids = Object.keys(tree.links).map(Number);
	const placeOf = (id: number): CellPlace => ({ column: columns[id], top: TREE_TOP + depths[id] * LEVEL_GAP });
	const height = heightOf(tree);
	const toneOf = (id: number): CellTone => (id === moved ? 'add' : 'plain');

	return (
		<Canvas columns={Math.max(ids.length, 2)} height={TREE_TOP + Math.max(height, 1) * LEVEL_GAP}>
			<RowLabel top={TREE_TOP + 16}>height {height}</RowLabel>
			{ids.flatMap((id) =>
				[tree.links[id].left, tree.links[id].right].filter((child) => child !== NONE).map((child) => <Edge key={`edge-${child}`} from={placeOf(id)} to={placeOf(child)} />),
			)}
			{ids.map((id) => {
				const { column, top } = placeOf(id);
				return <Cell key={`node-${id}`} value={tree.links[id].val} column={column} top={top} tone={toneOf(id)} />;
			})}
		</Canvas>
	);
}

const HangScene = ({ step }: CompareSceneProps) => <TreeScene tree={step.hang} moved={step.hangMoved} />;
const SuccessorScene = ({ step }: CompareSceneProps) => <TreeScene tree={step.successor} moved={step.successorMoved} />;

function parseList(text: string): Slot[] | string {
	const inner = text.trim().replace(/^\[/, '').replace(/\]$/, '');
	const slots: Slot[] = [];
	for (const token of inner.split(/[\s,]+/).filter(Boolean)) {
		if (token.toLowerCase() === 'null') {
			slots.push(null);
			continue;
		}
		const value = Number(token);
		if (!Number.isInteger(value) || Math.abs(value) > MAX_MAGNITUDE) return `"${token}" is not a number from −${MAX_MAGNITUDE} to ${MAX_MAGNITUDE}.`;
		slots.push(value);
	}
	return slots;
}

function isBst(tree: Tree, id: number, low: number, high: number): boolean {
	if (id === NONE) return true;
	const { val, left, right } = tree.links[id];
	return val > low && val < high && isBst(tree, left, low, val) && isBst(tree, right, val, high);
}

function slotsOf(text: string): Slot[] {
	const slots = parseList(text);
	if (typeof slots === 'string') throw new Error(`Invalid example [${text}]: ${slots}`);
	const tree = treeOf(slots);
	if (!isBst(tree, tree.root, -Infinity, Infinity)) throw new Error(`Invalid example [${text}]: not a binary search tree`);
	return slots;
}
const ELEVEN_NODES = '8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7';

export default defineExplainer<SequenceInput, CompareStep>({
	title: 'The two-child case decides the height',
	stages: [
		{ title: 'Hang the right subtree under the left’s largest node', subtitle: 'solution-1-original.py. Green is the subtree root that moved.', Scene: HangScene },
		{ title: 'Copy the in-order successor', subtitle: 'solution-2-successor.py. Green is the node that took the successor’s value.', Scene: SuccessorScene },
	],
	examples: [
		{ input: { slots: slotsOf(ELEVEN_NODES), keys: [8, 4] }, note: 'Two deletions: 5, 6 against 4, 4' },
		{ input: { slots: slotsOf('5, 3, 6, 2, 4, null, 7'), keys: [3, 5] }, note: 'LeetCode example 1, then its root' },
	],
	fields: [
		{ name: 'slots', label: 'Your own BST, in level order', placeholder: 'e.g. 5, 3, 6, 2, 4, null, 7' },
		{ name: 'keys', label: 'keys to delete, in order', placeholder: '3, 5' },
	],
	describe: ({ slots, keys }) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}], delete ${keys.join(', ')}`,
	parse(values) {
		const slots = parseList(values.slots);
		if (typeof slots === 'string') return { error: slots };
		const keys = parseList(values.keys);
		if (typeof keys === 'string') return { error: keys };
		const tree = treeOf(slots);
		if (Object.keys(tree.links).length > MAX_NODES) return { error: `Use ${MAX_NODES} nodes or fewer so both trees fit.` };
		if (!isBst(tree, tree.root, -Infinity, Infinity)) return { error: 'That tree is not a binary search tree.' };
		if (keys.length === 0 || keys.length > MAX_KEYS || keys.some((key) => key === null)) return { error: `Enter 1 to ${MAX_KEYS} keys to delete, separated by commas.` };
		return { input: { slots, keys: keys as number[] } };
	},
	steps: buildSteps,
});
