import { Canvas, Cell, Chips, Edge, RowLabel, SubLabel, type CellPlace, type CellTone, type Chip } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

type Slot = number | null;

interface PathInput {
	slots: Slot[];
	target: number;
}

interface TreeNode {
	val: number;
	left: number;
	right: number;
	depth: number;
	column: number;
}

type Phase = 'start' | 'enter' | 'leave' | 'done';

interface CountEntry {
	sum: number;
	count: number;
}

interface VisitStep extends Step {
	phase: Phase;
	node: number;
	path: number[];
	segments: number[][];
	sums: Record<number, number>;
	counts: CountEntry[];
	lookup: number | null;
	excluded: number[];
}

type VisitSceneProps = SceneProps<PathInput, VisitStep>;

const MAX_NODES = 12;
const MAX_MAGNITUDE = 999;
const NONE = -1;
const TREE_TOP = 30;
const LEVEL_GAP = 96;

const LINE_COUNTS = 9;
const LINE_RUNNING = 14;
const LINE_LOOKUP = 15;
const LINE_ADD = 16;
const LINE_RECURSE = 17;
const LINE_REMOVE = 18;
const LINE_RETURN_FOUND = 19;
const LINE_RETURN = 21;

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
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const signed = (value: number) => (value < 0 ? `(${value})` : `${value}`);

function buildSteps({ slots, target }: PathInput): VisitStep[] {
	const nodes = treeOf(slots);
	const steps: VisitStep[] = [];
	const counts = new Map<number, number>([[0, 1]]);
	const sums: Record<number, number> = {};
	const path: number[] = [];
	const leftBehind: number[] = [];
	let total = 0;

	const snapshot = (phase: Phase, node: number, highlightedLines: number[], narration: string, segments: number[][] = [], lookup: number | null = null, excluded: number[] = []) =>
		steps.push({
			phase,
			node,
			path: [...path],
			segments,
			sums: { ...sums },
			counts: [...counts].filter(([, count]) => count > 0).map(([sum, count]) => ({ sum, count })),
			lookup,
			excluded,
			readout: { running: node === NONE ? '–' : sums[node], 'looking for': lookup ?? '–', found: total },
			highlightedLines,
			narration,
		});

	snapshot('start', NONE, [LINE_COUNTS], `<code>counts</code> starts as {0: 1}: the sum before the root, so a path that starts at the root can be found.`);

	const visit = (id: number, parentRunning: number): number => {
		const { val, left, right } = nodes[id];
		path.push(id);
		const running = parentRunning + val;
		sums[id] = running;
		const key = running - target;
		const matches = counts.get(key) ?? 0;
		const segments: number[][] = [];
		if (key === 0) segments.push([...path]);
		path.slice(0, -1).forEach((ancestor, index) => {
			if (sums[ancestor] === key) segments.push(path.slice(index + 1));
		});
		total += matches;
		counts.set(running, (counts.get(running) ?? 0) + 1);

		const segmentText = segments.map((segment) => segment.map((part) => nodes[part].val).join(' → ')).join(' and ');
		const foundText = matches > 0 ? `counts[${key}] = ${matches}, so ${matches === 1 ? 'a path ends' : `${matches} paths end`} here: ${segmentText}.` : `counts[${key}] is 0, so no path ends here.`;
		const excluded = leftBehind.filter((other) => sums[other] === key);
		const one = excluded.length === 1;
		const excludedText =
			excluded.length > 0
				? ` The red ${excluded.map((other) => nodes[other].val).join(' and ')} ${one ? 'also has' : 'also have'} running sum ${key}, but ${one ? 'it is' : 'they are'} in another branch, not above this node: a path from there would have to climb up and back down. The walk lowered its count when it left ${one ? 'it' : 'them'}, so ${one ? 'it is' : 'they are'} not counted here.`
				: '';
		snapshot(
			'enter',
			id,
			[LINE_RUNNING, LINE_LOOKUP, LINE_ADD],
			`<code>visit(${val})</code>: running = ${parentRunning} + ${signed(val)} = ${running}. A path ending here sums to ${target} when an ancestor's running sum is ${running} − ${target} = ${key}. ${foundText}${excludedText} Then add ${running} to <code>counts</code> for the nodes below.`,
			segments,
			key,
			excluded,
		);

		let found = matches;
		if (left !== NONE) found += visit(left, running);
		if (right !== NONE) found += visit(right, running);
		const before = counts.get(running)!;
		counts.set(running, before - 1);
		snapshot(
			'leave',
			id,
			[LINE_RECURSE, LINE_REMOVE, LINE_RETURN_FOUND],
			`The subtree of ${val} is done: ${plural(found, 'path')} ${found === 1 ? 'ends' : 'end'} in it. Every node the walk visits from now on is outside this subtree, so no path to it can start just below ${val}. Lower counts[${running}] from ${before} to ${before - 1}${before === 1 ? ', which drops it from the map' : ''}, and return ${found}.`,
		);
		path.pop();
		leftBehind.push(id);
		return found;
	};

	const answer = nodes.length > 0 ? visit(0, 0) : 0;
	snapshot('done', NONE, [LINE_RETURN], `<code>visit(root, 0)</code> returns <b>${answer}</b>: ${plural(answer, 'downward path')} ${answer === 1 ? 'sums' : 'sum'} to ${target}.`);
	return steps;
}

function VisitScene({ input: { slots }, step }: VisitSceneProps) {
	const { phase, node: current, path, segments, sums, excluded } = step;
	const nodes = treeOf(slots);
	const placeOf = (id: number): CellPlace => ({ column: nodes[id].column, top: TREE_TOP + nodes[id].depth * LEVEL_GAP });
	const childrenOf = (id: number) => [nodes[id].left, nodes[id].right].filter((child) => child !== NONE);
	const inSegment = (id: number) => segments.some((segment) => segment.includes(id));
	const edgeInSegment = (parent: number, child: number) => segments.some((segment) => segment.includes(parent) && segment.includes(child));

	const toneOf = (id: number): CellTone => {
		if ((phase === 'leave' && id === current) || excluded.includes(id)) return 'remove';
		if (inSegment(id) || id === current) return 'add';
		if (path.includes(id)) return 'focus';
		return 'plain';
	};

	return (
		<Canvas columns={Math.max(nodes.length, 2)} height={TREE_TOP + heightOf(nodes) * LEVEL_GAP + 10}>
			<RowLabel top={TREE_TOP + 16}>
				<code>root</code>
			</RowLabel>
			{nodes.flatMap((_, id) =>
				childrenOf(id).map((child) => <Edge key={`edge-${child}`} from={placeOf(id)} to={placeOf(child)} tone={edgeInSegment(id, child) ? 'focus' : 'plain'} />),
			)}
			{nodes.map((node, id) => {
				const { column, top } = placeOf(id);
				return [
					<Cell key={`node-${id}`} value={node.val} column={column} top={top} tone={toneOf(id)} />,
					<SubLabel key={`sum-${id}`} column={column} top={top + 58} hidden={!(id in sums)}>
						sum {sums[id]}
					</SubLabel>,
				];
			})}
		</Canvas>
	);
}

function CountChips({ step: { counts, lookup } }: VisitSceneProps) {
	const chips: Chip[] = counts.map(({ sum, count }) => ({ label: `${sum} ×${count}`, state: sum === lookup ? 'current' : 'plain' }));
	if (lookup !== null && !counts.some(({ sum }) => sum === lookup)) chips.push({ label: `${lookup} ×0`, state: 'upcoming' });
	return <Chips chips={chips} />;
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

export default defineExplainer<PathInput, VisitStep>({
	title: 'Running sums find every path in one walk',
	codeFile: 'solution-2-prefix-sums.py',
	stages: [
		{
			title: 'The tree, its running sums, and counts',
			subtitle: 'Under each node is its running sum from the root. Teal is the current root-to-node path; green is the node being visited and any path just found; red is a node being left, or one already left whose sum no longer counts. Below, counts holds the sums on the current path, with the one being looked up in bold.',
			Scene: VisitScene,
			Footer: CountChips,
		},
	],
	examples: [
		{ input: { slots: slotsOf('10, 5, -3, 3, 2, null, 11, 3, -2, null, 1'), target: 8 }, note: 'LeetCode example 1, target 8' },
		{ input: { slots: slotsOf('5, 4, 8, 11, null, 13, 4, 7, 2, null, null, 5, 1'), target: 22 }, note: 'LeetCode example 2, target 22' },
		{ input: { slots: slotsOf('0, 0, 0'), target: 0 }, note: 'Zeros, target 0: overlapping paths' },
		{ input: { slots: slotsOf('5, 3, 2, -3, null, null, null, 2'), target: 2 }, note: 'A repeated sum: why counts, not a set' },
	],
	fields: [
		{ name: 'slots', label: 'Your own tree, in level order', placeholder: 'e.g. 10, 5, -3, 3, 2, null, 11' },
		{ name: 'target', label: 'targetSum', placeholder: '8' },
	],
	describe: ({ slots, target }) => `[${slots.map((slot) => (slot === null ? 'null' : slot)).join(', ')}], target ${target}`,
	parse(values) {
		const slots = parseSlots(values.slots);
		if (typeof slots === 'string') return { error: slots };
		const target = Number(values.target);
		if (values.target.trim() === '' || !Number.isInteger(target) || Math.abs(target) > 9999) return { error: 'Enter targetSum as a whole number from −9999 to 9999.' };
		return { input: { slots, target } };
	},
	steps: buildSteps,
});
