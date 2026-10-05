import { Canvas, Cell, Edge, RowLabel, SubLabel, type CellPlace, type CellTone } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

type Edge = [string, string];

interface GraphInput {
	edges: Edge[];
	start: string;
}

type Phase = 'start' | 'take' | 'enqueue' | 'done';

interface WalkStep extends Step {
	phase: Phase;
	node: string;
	queue: string[];
	taken: string[];
	found: string[];
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
const GRAPH_TOP = 30;
const LEVEL_GAP = 100;
const LIST_GAP = 120;
const GRAPH_SPREAD = 1.5;

const LINES_INIT = [5, 6, 7];
const LINES_TAKE = [9, 10, 11];
const LINES_ENQUEUE = [12, 13, 14, 15];
const LINE_WHILE = 9;
const LINE_RETURN = 17;

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

const graphPlaceOf = (layout: Layout, node: string): CellPlace => ({ column: layout.column.get(node)! * GRAPH_SPREAD, top: GRAPH_TOP + layout.level.get(node)! * LEVEL_GAP });
const listTopOf = (layout: Layout) => GRAPH_TOP + layout.levels * LEVEL_GAP + 20;
const listText = (items: string[]) => items.join(', ');
const isOrAre = (items: string[]) => (items.length === 1 ? 'is' : 'are');
const stepsAway = (distance: number) => `${distance} ${distance === 1 ? 'edge' : 'edges'}`;

function buildSteps(input: GraphInput): WalkStep[] {
	const { edges, start } = input;
	const graph = graphOf(edges);
	const layout = layoutOf(input);
	const steps: WalkStep[] = [];
	const visited = new Set([start]);
	const taken: string[] = [];
	let queue = [start];
	let longest = 1;

	const snapshot = (phase: Phase, node: string, found: string[], highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			node,
			queue: [...queue],
			taken: [...taken],
			found,
			visited: [...visited],
			columns: 0,
			readout: { 'queue size': queue.length, visited: visited.size },
			highlightedLines,
			narration,
		});

	snapshot('start', '', [], LINES_INIT, `${start} is the start: it is marked visited and waits in the queue.`);

	while (queue.length > 0) {
		const [node, ...rest] = queue;
		queue = rest;
		taken.push(node);
		const distance = layout.level.get(node)!;
		snapshot(
			'take',
			node,
			[],
			LINES_TAKE,
			`Take ${node} from the front${distance > 0 ? `, ${stepsAway(distance)} from ${start}` : ''}: <code>order</code> is now ${listText(taken)}.`,
		);

		const neighbors = graph.get(node)!;
		const alreadyTaken = neighbors.filter((neighbor) => taken.includes(neighbor));
		const waiting = neighbors.filter((neighbor) => visited.has(neighbor) && !taken.includes(neighbor));
		const found = neighbors.filter((neighbor) => !visited.has(neighbor));
		for (const neighbor of found) {
			visited.add(neighbor);
			queue = [...queue, neighbor];
		}
		longest = Math.max(longest, queue.length);

		const neighborText = neighbors.length === 1 ? `${node}'s only neighbor is ${neighbors[0]}` : `${node}'s neighbors are ${listText(neighbors)}`;
		const takenText = alreadyTaken.length > 0 ? ` ${listText(alreadyTaken)} ${isOrAre(alreadyTaken)} already taken.` : '';
		const waitingText = waiting.length > 0 ? ` ${listText(waiting)} ${isOrAre(waiting)} already waiting in the queue.` : '';
		const foundText =
			found.length > 0 ? ` Mark ${listText(found)} visited and add ${found.length === 1 ? 'it' : 'them'} to the back, ${stepsAway(distance + 1)} from ${start}.` : ' Nothing new is found.';
		snapshot('enqueue', node, found, LINES_ENQUEUE, `${neighborText}.${takenText}${waitingText}${foundText}`);
	}

	const missed = layout.unreachable.length > 0 ? ` ${listText(layout.unreachable)} ${isOrAre(layout.unreachable)} not reachable from ${start}, so the walk never sees ${layout.unreachable.length === 1 ? 'it' : 'them'}.` : '';
	snapshot('done', '', [], [LINE_WHILE, LINE_RETURN], `The queue is empty, so every node reachable from ${start} is taken, nearest first: <b>${listText(taken)}</b>.${missed}`);

	const columns = Math.max((layout.width - 1) * GRAPH_SPREAD + 1, longest, taken.length);
	return steps.map((step) => ({ ...step, columns }));
}

function WalkScene({ input, step }: WalkSceneProps) {
	const { phase, node: current, queue, taken, found, visited, columns } = step;
	const graph = graphOf(input.edges);
	const layout = layoutOf(input);
	const listTop = listTopOf(layout);
	const orderTop = listTop + LIST_GAP;
	const unreachableTop = GRAPH_TOP + (layout.levels - 1) * LEVEL_GAP;

	const nodeTone = (node: string): CellTone => {
		if (node === current && (phase === 'take' || phase === 'enqueue')) return 'add';
		if (visited.includes(node)) return 'focus';
		return 'plain';
	};
	const placeOf = (node: string): { column: number; top: number; tone: CellTone } => {
		const takenAt = taken.indexOf(node);
		if (takenAt >= 0) return { column: takenAt, top: orderTop, tone: phase === 'take' && node === current ? 'add' : 'plain' };
		return { column: queue.indexOf(node), top: listTop, tone: found.includes(node) ? 'focus' : 'plain' };
	};
	const shown = [...graph.keys()].filter((node) => queue.includes(node) || taken.includes(node));

	return (
		<Canvas columns={columns} height={orderTop + 80}>
			<RowLabel top={GRAPH_TOP + 16}>graph</RowLabel>
			<RowLabel top={unreachableTop + 16} hidden={layout.unreachable.length === 0}>
				unreachable
			</RowLabel>
			{input.edges.map(([a, b]) => (
				<Edge key={`edge-${a}-${b}`} from={graphPlaceOf(layout, a)} to={graphPlaceOf(layout, b)} />
			))}
			{[...graph.keys()].map((node) => {
				const { column, top } = graphPlaceOf(layout, node);
				return [
					<Cell key={`node-${node}`} value={node} column={column} top={top} tone={nodeTone(node)} dimmed={layout.unreachable.includes(node)} />,
					<SubLabel key={`neighbors-${node}`} column={column} top={top + 58}>
						→ {listText(graph.get(node)!)}
					</SubLabel>,
				];
			})}
			<RowLabel top={listTop + 16}>
				<code>queue</code>
			</RowLabel>
			<SubLabel column={0} top={listTop + 58} hidden={queue.length === 0}>
				front
			</SubLabel>
			<RowLabel top={orderTop + 16}>
				<code>order</code>
			</RowLabel>
			{shown.map((node) => {
				const { column, top, tone } = placeOf(node);
				return <Cell key={`entry-${node}`} value={node} column={column} top={top} tone={tone} />;
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
	title: 'A queue sends the walk wide first',
	codeFile: 'bfs_graph.py',
	stages: [
		{
			title: 'The graph, the queue and the order',
			subtitle: "The graph is drawn by distance from the start, with each node's neighbor list under it, so the walk sweeps it row by row. Green is the node being taken, and teal the visited nodes: found, whether taken or still queued.",
			Scene: WalkScene,
		},
	],
	examples: [
		{ input: { edges: edgesOf('A-B, A-C, B-D, B-E, C-F, E-F'), start: 'A' }, note: 'Graph with a cycle' },
		{ input: { edges: edgesOf('A-B, B-C, C-D, A-D'), start: 'A' }, note: 'D is nearer than C' },
		{ input: { edges: edgesOf('A-B, B-C, C-A, D-E'), start: 'A' }, note: 'Some nodes are unreachable' },
		{ input: { edges: edgesOf('1-2, 1-3, 2-4, 2-5, 3-6, 3-7'), start: '1' }, note: 'Binary tree: level order' },
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
