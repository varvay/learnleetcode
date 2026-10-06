import { Canvas, Cell, Edge, RowLabel, SubLabel, Tag, type CellPlace, type CellTone } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

type Slot = number | null;

interface DeleteInput {
	slots: Slot[];
	key: number;
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

type Phase = 'start' | 'compare' | 'missing' | 'successor' | 'copy' | 'remove' | 'done';

interface DeleteStep extends Step {
	phase: Phase;
	tree: Tree;
	node: number;
	calls: number[];
	successor: number;
	target: number;
}

type DeleteSceneProps = SceneProps<DeleteInput, DeleteStep>;

const MAX_NODES = 11;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TREE_TOP = 40;
const LEVEL_GAP = 92;

const LINES_EMPTY = [9, 10];
const LINES_LEFT = [9, 11, 12];
const LINES_RIGHT = [9, 11, 13, 14];
const LINES_NO_LEFT = [9, 11, 13, 15, 16];
const LINES_NO_RIGHT = [9, 11, 13, 15, 17, 18];
const LINES_SUCCESSOR_START = [9, 11, 13, 15, 17, 19, 20];
const LINES_SUCCESSOR_STEP = [21, 22];
const LINE_COPY = 23;
const LINE_DELETE_SUCCESSOR = 24;
const LINE_RETURN = 25;

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

function isBst(tree: Tree, id: number, low: number, high: number): boolean {
	if (id === NONE) return true;
	const { val, left, right } = tree.links[id];
	return val > low && val < high && isBst(tree, left, low, val) && isBst(tree, right, val, high);
}

function buildSteps({ slots, key }: DeleteInput): DeleteStep[] {
	const tree = treeOf(slots);
	const steps: DeleteStep[] = [];
	const calls: number[] = [];

	const snapshot = (phase: Phase, node: number, highlightedLines: number[], narration: string, successor = NONE, target = key) =>
		steps.push({ phase, tree: cloneTree(tree), node, calls: [...calls], successor, target, readout: { key: target, 'call depth': calls.length }, highlightedLines, narration });

	if (tree.root === NONE) {
		snapshot('done', NONE, LINES_EMPTY, `The tree is empty, so there is nothing to delete: return <b>None</b>.`);
		return steps;
	}

	snapshot('start', tree.root, [], `Delete ${key}. Each call returns the root of its subtree after the deletion, and the caller stores that back into its own link.`);

	const remove = (id: number, parentId: number, target: number): void => {
		if (id === NONE) {
			snapshot('missing', NONE, LINES_EMPTY, `The walk fell off the tree: ${target} is not here. This call returns None, which is the same child its parent already had, so nothing changes.`, NONE, target);
			return;
		}
		calls.push(id);
		const link = tree.links[id];
		if (target < link.val) {
			snapshot('compare', id, LINES_LEFT, `${target} < ${link.val}: delete it from ${link.val}'s left subtree, and store what comes back in <code>${link.val}.left</code>.`, NONE, target);
			remove(link.left, id, target);
			calls.pop();
			return;
		}
		if (target > link.val) {
			snapshot('compare', id, LINES_RIGHT, `${target} > ${link.val}: delete it from ${link.val}'s right subtree, and store what comes back in <code>${link.val}.right</code>.`, NONE, target);
			remove(link.right, id, target);
			calls.pop();
			return;
		}

		const relinkTo = (child: number) => {
			if (parentId === NONE) tree.root = child;
			else if (tree.links[parentId].left === id) tree.links[parentId].left = child;
			else tree.links[parentId].right = child;
			delete tree.links[id];
		};
		const parentText = parentId === NONE ? 'the tree' : `<code>${tree.links[parentId].val}.${tree.links[parentId].left === id ? 'left' : 'right'}</code>`;

		if (link.left === NONE) {
			const child = link.right;
			snapshot(
				'remove',
				id,
				LINES_NO_LEFT,
				`Found ${link.val}. It has no left child, so <code>return root.right</code>: ${child === NONE ? 'None' : `its right subtree, from ${tree.links[child].val},`} replaces it in ${parentText}.`,
				NONE,
				target,
			);
			relinkTo(child);
			calls.pop();
			return;
		}
		if (link.right === NONE) {
			snapshot('remove', id, LINES_NO_RIGHT, `Found ${link.val}. It has no right child, so <code>return root.left</code>: its left subtree, from ${tree.links[link.left].val}, replaces it in ${parentText}.`, NONE, target);
			relinkTo(link.left);
			calls.pop();
			return;
		}

		let successor = link.right;
		snapshot(
			'successor',
			id,
			LINES_SUCCESSOR_START,
			`Found ${link.val}, with two children. Its replacement must be larger than everything on its left and smaller than everything on its right: the smallest key on the right. Start at its right child, ${tree.links[successor].val}.`,
			successor,
			target,
		);
		while (tree.links[successor].left !== NONE) {
			successor = tree.links[successor].left;
			snapshot('successor', id, LINES_SUCCESSOR_STEP, `Smaller keys are always to the left: step left to ${tree.links[successor].val}.`, successor, target);
		}
		const successorVal = tree.links[successor].val;
		snapshot('successor', id, [21], `${successorVal} has no left child, so it is the smallest key on the right: the in-order successor.`, successor, target);
		link.val = successorVal;
		snapshot(
			'copy',
			id,
			[LINE_COPY],
			`Copy ${successorVal} into this node. The tree is still ordered, but ${successorVal} now appears twice: the old copy must go.`,
			successor,
			target,
		);
		snapshot('compare', id, [LINE_DELETE_SUCCESSOR], `Delete ${successorVal} from the right subtree. It has no left child, so that deletion is always the easy case.`, successor, successorVal);
		remove(link.right, id, successorVal);
		calls.pop();
	};

	remove(tree.root, NONE, key);
	snapshot('done', NONE, [LINE_RETURN], `Every call has returned its subtree's root. The tree is a binary search tree again, with height ${heightOf(tree)}.`);
	return steps;
}

function DeleteScene({ step }: DeleteSceneProps) {
	const { phase, tree, node: current, calls, successor } = step;
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

	const toneOf = (id: number): CellTone => {
		if (phase === 'remove' && id === current) return 'remove';
		if (phase === 'copy' && id === current) return 'add';
		if (id === current) return 'add';
		if (calls.includes(id)) return 'focus';
		return 'plain';
	};

	return (
		<Canvas columns={Math.max(ids.length, 2)} height={TREE_TOP + Math.max(heightOf(tree), 1) * LEVEL_GAP}>
			<RowLabel top={TREE_TOP + 16}>
				<code>root</code>
			</RowLabel>
			{ids.length === 0 && (
				<SubLabel column={0} top={TREE_TOP + 18}>
					None
				</SubLabel>
			)}
			{ids.flatMap((id) =>
				[tree.links[id].left, tree.links[id].right].filter((child) => child !== NONE).map((child) => <Edge key={`edge-${child}`} from={placeOf(id)} to={placeOf(child)} />),
			)}
			{ids.map((id) => {
				const { column, top } = placeOf(id);
				return <Cell key={`node-${id}`} value={tree.links[id].val} column={column} top={top} tone={toneOf(id)} />;
			})}
			{successor !== NONE && successor in tree.links && (phase === 'successor' || phase === 'copy') && (
				<Tag column={columns[successor]} top={placeOf(successor).top - 22} tone="add">
					successor
				</Tag>
			)}
		</Canvas>
	);
}

function parseSlots(text: string): Slot[] | string {
	const inner = text.trim().replace(/^\[/, '').replace(/\]$/, '');
	const slots: Slot[] = [];
	for (const token of inner.split(/[\s,]+/).filter(Boolean)) {
		if (token.toLowerCase() === 'null') {
			slots.push(null);
			continue;
		}
		const value = Number(token);
		if (!Number.isInteger(value) || Math.abs(value) > MAX_MAGNITUDE) return `"${token}" is not a node: use whole numbers from −${MAX_MAGNITUDE} to ${MAX_MAGNITUDE}, or null.`;
		slots.push(value);
	}
	return slots;
}

function slotsOf(text: string): Slot[] {
	const slots = parseSlots(text);
	if (typeof slots === 'string') throw new Error(`Invalid example [${text}]: ${slots}`);
	const tree = treeOf(slots);
	if (!isBst(tree, tree.root, -Infinity, Infinity)) throw new Error(`Invalid example [${text}]: not a binary search tree`);
	return slots;
}
const EXAMPLE = '5, 3, 6, 2, 4, null, 7';

export default defineExplainer<DeleteInput, DeleteStep>({
	title: 'Delete by returning each subtree’s new root',
	codeFile: 'solution-2-successor.py',
	stages: [
		{
			title: 'The calls down the tree, and the rewiring on the way back',
			subtitle: 'Green is the call running now, teal the calls waiting for it. Red is the node being removed; the tag marks the in-order successor.',
			Scene: DeleteScene,
		},
	],
	examples: [
		{ input: { slots: slotsOf(EXAMPLE), key: 3 }, note: 'LeetCode example 1: two children' },
		{ input: { slots: slotsOf(EXAMPLE), key: 6 }, note: 'One child' },
		{ input: { slots: slotsOf(EXAMPLE), key: 0 }, note: 'LeetCode example 2: not in the tree' },
		{ input: { slots: slotsOf('8, 4, 12, 2, 6, 10, 14, 1, 3, null, null, 9, 11'), key: 8 }, note: 'The root, with a deeper successor' },
		{ input: { slots: [], key: 0 }, note: 'LeetCode example 3: empty' },
	],
	fields: [
		{ name: 'slots', label: 'Your own BST, in level order', placeholder: 'e.g. 5, 3, 6, 2, 4, null, 7' },
		{ name: 'key', label: 'key', placeholder: '3' },
	],
	describe: ({ slots, key }) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}], key = ${key}`,
	parse(values) {
		const slots = parseSlots(values.slots);
		if (typeof slots === 'string') return { error: slots };
		const tree = treeOf(slots);
		if (Object.keys(tree.links).length > MAX_NODES) return { error: `Use ${MAX_NODES} nodes or fewer so everything fits on screen.` };
		if (!isBst(tree, tree.root, -Infinity, Infinity)) return { error: 'That tree is not a binary search tree.' };
		const key = Number(values.key);
		if (values.key.trim() === '' || !Number.isInteger(key) || Math.abs(key) > MAX_MAGNITUDE) return { error: `Enter key as a whole number from −${MAX_MAGNITUDE} to ${MAX_MAGNITUDE}.` };
		return { input: { slots, key } };
	},
	steps: buildSteps,
});
