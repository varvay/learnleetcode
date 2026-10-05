import { Canvas, Cell, RowLabel, SubLabel, type CellTone } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

type Edge = [string, string];

interface GraphInput {
	edges: Edge[];
	start: string;
}

type Phase = 'start' | 'take' | 'push' | 'skip' | 'done';

interface WalkStep extends Step {
	phase: Phase;
	node: string;
	labels: string[];
	stack: number[];
	taken: number[];
	skipped: number;
	visited: string[];
	columns: number;
}

type WalkSceneProps = SceneProps<GraphInput, WalkStep>;

interface Layout {
	column: Map<string, number>;
	level: Map<string, number>;
	levels: number;
	width: number;
	unreachable: string[];
}

const MAX_NODES = 8;
const MAX_EDGES = 10;
const NONE = -1;
const GRAPH_TOP = 30;
const LEVEL_GAP = 100;
const LIST_GAP = 120;

const LINES_INIT = [2, 3, 4];
const LINES_POP = [6, 7, 8];
const LINE_CONTINUE = 9;
const LINES_TAKE = [10, 11];
const LINES_PUSH = [12, 13, 14];
const LINE_WHILE = 6;
const LINE_RETURN = 16;

const nodesOf = (edges: Edge[]) => [...new Set(edges.flat())];

function graphOf(edges: Edge[]) {
	const graph = new Map<string, string[]>(nodesOf(edges).map((node) => [node, []]));
	for (const [a, b] of edges) {
		graph.get(a)!.push(b);
		graph.get(b)!.push(a);
	}
	return graph;
}

function layoutOf({ edges, start }: GraphInput): Layout {
	const graph = graphOf(edges);
	const level = new Map([[start, 0]]);
	const children = new Map<string, string[]>([...graph.keys()].map((node) => [node, []]));
	const queue = [start];
	while (queue.length > 0) {
		const node = queue.shift()!;
		for (const neighbor of graph.get(node)!) {
			if (level.has(neighbor)) continue;
			level.set(neighbor, level.get(node)! + 1);
			children.get(node)!.push(neighbor);
			queue.push(neighbor);
		}
	}

	const column = new Map<string, number>();
	let nextLeaf = 0;
	const place = (node: string) => {
		const kids = children.get(node)!;
		if (kids.length === 0) {
			column.set(node, nextLeaf++);
			return;
		}
		kids.forEach(place);
		column.set(node, (column.get(kids[0])! + column.get(kids[kids.length - 1])!) / 2);
	};
	place(start);

	const reachableLevels = Math.max(...level.values()) + 1;
	const unreachable = [...graph.keys()].filter((node) => !level.has(node));
	unreachable.forEach((node, index) => {
		column.set(node, index);
		level.set(node, reachableLevels);
	});
	return { column, level, levels: reachableLevels + (unreachable.length > 0 ? 1 : 0), width: Math.max(nextLeaf, unreachable.length), unreachable };
}

const listTopOf = (layout: Layout) => GRAPH_TOP + layout.levels * LEVEL_GAP + 20;
const listText = (items: string[]) => items.join(', ');
const isOrAre = (items: string[]) => (items.length === 1 ? 'is' : 'are');

function buildSteps(input: GraphInput): WalkStep[] {
	const { edges, start } = input;
	const graph = graphOf(edges);
	const layout = layoutOf(input);
	const steps: WalkStep[] = [];
	const labels: string[] = [start];
	const visited = new Set<string>();
	const taken: number[] = [];
	let stack: number[] = [0];
	let widest = 1;

	const snapshot = (phase: Phase, node: string, highlightedLines: number[], narration: string, skipped = NONE) =>
		steps.push({
			phase,
			node,
			labels: [...labels],
			stack: [...stack],
			taken: [...taken],
			skipped,
			visited: [...visited],
			columns: 0,
			readout: { 'stack size': stack.length, visited: visited.size },
			highlightedLines,
			narration,
		});

	snapshot('start', '', LINES_INIT, `The stack starts with ${start}, the start node. Nothing is visited yet.`);

	while (stack.length > 0) {
		const entry = stack[stack.length - 1];
		stack = stack.slice(0, -1);
		const node = labels[entry];

		if (visited.has(node)) {
			snapshot('skip', node, [...LINES_POP, LINE_CONTINUE], `Pop ${node}, but an earlier copy of ${node} was already taken, so skip this one.`, entry);
			continue;
		}

		visited.add(node);
		taken.push(entry);
		snapshot('take', node, [...LINES_POP, ...LINES_TAKE], `Pop ${node}. It isn't visited yet, so take it: <code>order</code> is now ${listText(taken.map((id) => labels[id]))}.`);

		const neighbors = graph.get(node)!;
		const seen = neighbors.filter((neighbor) => visited.has(neighbor));
		const pushed = [...neighbors].reverse().filter((neighbor) => !visited.has(neighbor));
		for (const neighbor of pushed) {
			labels.push(neighbor);
			stack = [...stack, labels.length - 1];
		}
		widest = Math.max(widest, stack.length);

		const neighborText = neighbors.length === 1 ? `${node}'s only neighbor is ${neighbors[0]}` : `${node}'s neighbors are ${listText(neighbors)}`;
		const seenText = seen.length > 0 ? `${listText(seen)} ${isOrAre(seen)} already visited. ` : '';
		const pushText = pushed.length === 1 ? `Push ${pushed[0]}; it comes off next.` : `Push ${pushed.join(' then ')}, in reverse, so ${pushed[pushed.length - 1]} comes off next.`;
		const top = stack.length > 0 ? labels[stack[stack.length - 1]] : '';
		const backUpText = !top ? '' : visited.has(top) ? ` The next pop is a stale copy of ${top}.` : ` The walk backs up to ${top}, the newest node still on the stack.`;
		snapshot(
			'push',
			node,
			LINES_PUSH,
			pushed.length > 0
				? `${neighborText}. ${seenText}${pushText}`
				: `${neighborText}, ${neighbors.length === 1 ? 'already visited' : 'all already visited'}, so nothing is pushed.${backUpText}`,
		);
	}

	const order = listText(taken.map((id) => labels[id]));
	const missed = layout.unreachable.length > 0 ? ` ${listText(layout.unreachable)} ${isOrAre(layout.unreachable)} not reachable from ${start}, so the walk never sees ${layout.unreachable.length === 1 ? 'it' : 'them'}.` : '';
	snapshot('done', '', [LINE_WHILE, LINE_RETURN], `The stack is empty, so every node reachable from ${start} is taken: <b>${order}</b>.${missed}`);

	const columns = Math.max(layout.width, widest, taken.length);
	return steps.map((step) => ({ ...step, columns }));
}

function WalkScene({ input, step }: WalkSceneProps) {
	const { phase, node: current, labels, stack, taken, skipped, visited, columns } = step;
	const graph = graphOf(input.edges);
	const layout = layoutOf(input);
	const listTop = listTopOf(layout);
	const orderTop = listTop + LIST_GAP;
	const unreachableTop = GRAPH_TOP + (layout.levels - 1) * LEVEL_GAP;

	const nodeTone = (node: string): CellTone => {
		if (node === current && (phase === 'take' || phase === 'push')) return 'add';
		if (visited.includes(node)) return 'focus';
		return 'plain';
	};
	const placeOf = (entry: number): { column: number; top: number; tone: CellTone } => {
		const takenAt = taken.indexOf(entry);
		if (takenAt >= 0) return { column: takenAt, top: orderTop, tone: phase === 'take' && takenAt === taken.length - 1 ? 'add' : 'plain' };
		if (entry === skipped) return { column: stack.length, top: listTop, tone: 'remove' };
		return { column: stack.indexOf(entry), top: listTop, tone: 'plain' };
	};
	const shown = labels.map((_, entry) => entry).filter((entry) => stack.includes(entry) || taken.includes(entry) || entry === skipped);

	return (
		<Canvas columns={columns} height={orderTop + 80}>
			<RowLabel top={GRAPH_TOP + 16}>graph</RowLabel>
			<RowLabel top={unreachableTop + 16} hidden={layout.unreachable.length === 0}>
				unreachable
			</RowLabel>
			{[...graph.keys()].map((node) => {
				const column = layout.column.get(node)!;
				const top = GRAPH_TOP + layout.level.get(node)! * LEVEL_GAP;
				return [
					<Cell key={`node-${node}`} value={node} column={column} top={top} tone={nodeTone(node)} dimmed={layout.unreachable.includes(node)} />,
					<SubLabel key={`neighbors-${node}`} column={column} top={top + 58}>
						→ {listText(graph.get(node)!)}
					</SubLabel>,
				];
			})}
			<RowLabel top={listTop + 16}>
				<code>stack</code>
			</RowLabel>
			<SubLabel column={Math.max(0, stack.length - 1)} top={listTop + 58} hidden={stack.length === 0}>
				top
			</SubLabel>
			<RowLabel top={orderTop + 16}>
				<code>order</code>
			</RowLabel>
			{shown.map((entry) => {
				const { column, top, tone } = placeOf(entry);
				const stale = stack.includes(entry) && visited.includes(labels[entry]);
				return <Cell key={`entry-${entry}`} value={labels[entry]} column={column} top={top} tone={tone} dimmed={stale} />;
			})}
		</Canvas>
	);
}

function parseEdges(text: string): Edge[] | string {
	const tokens = text.split(/[\s,]+/).filter(Boolean);
	if (tokens.length === 0) return 'Enter edges such as A-B, A-C, B-D.';
	const edges: Edge[] = [];
	for (const token of tokens) {
		const ends = token.split('-');
		if (ends.length !== 2 || ends.some((end) => !/^[A-Za-z0-9]{1,2}$/.test(end))) return `"${token}" is not an edge: write two node names of one or two letters or digits, joined by a dash.`;
		if (ends[0] === ends[1]) return `"${token}" joins a node to itself: use two different nodes.`;
		if (edges.some(([a, b]) => (a === ends[0] && b === ends[1]) || (a === ends[1] && b === ends[0]))) return `${token} is listed twice: give each edge once.`;
		edges.push([ends[0], ends[1]]);
	}
	if (edges.length > MAX_EDGES) return `Use ${MAX_EDGES} edges or fewer so everything fits on screen.`;
	if (nodesOf(edges).length > MAX_NODES) return `Use ${MAX_NODES} nodes or fewer so everything fits on screen.`;
	return edges;
}

const edgesOf = (text: string) => parseEdges(text) as Edge[];

export default defineExplainer<GraphInput, WalkStep>({
	title: 'A stack sends the walk deep first',
	codeFile: 'dfs_graph.py',
	stages: [
		{
			title: 'The graph, the stack and the order',
			subtitle: 'The graph is drawn by distance from the start, with each node\'s neighbor list under it. Green is the node being taken and teal the visited nodes. A faded stack entry is a stale copy of a visited node, and turns red when it is popped and skipped.',
			Scene: WalkScene,
		},
	],
	examples: [
		{ input: { edges: edgesOf('A-B, A-C, B-D, B-E, C-F, E-F'), start: 'A' }, note: 'Graph with a cycle' },
		{ input: { edges: edgesOf('A-B, A-C, A-D, B-D'), start: 'A' }, note: 'D is reached through B, not from A' },
		{ input: { edges: edgesOf('A-B, B-C, C-A, D-E'), start: 'A' }, note: 'Some nodes are unreachable' },
		{ input: { edges: edgesOf('1-2, 1-3, 2-4, 2-5, 3-6, 3-7'), start: '1' }, note: 'Binary tree: preorder' },
	],
	fields: [
		{ name: 'edges', label: 'Your own edges', placeholder: 'e.g. A-B, A-C, B-D' },
		{ name: 'start', label: 'start', placeholder: 'A' },
	],
	describe: ({ edges, start }) => `${edges.map(([a, b]) => `${a}-${b}`).join(', ')}, start ${start}`,
	parse(values) {
		const edges = parseEdges(values.edges);
		if (typeof edges === 'string') return { error: edges };
		const start = values.start.trim();
		if (!nodesOf(edges).includes(start)) return { error: `Enter a start node that appears in the edges: ${listText(nodesOf(edges))}.` };
		return { input: { edges, start } };
	},
	steps: buildSteps,
});
