import { Canvas, Cell, RowLabel, SubLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface PingsInput {
	pings: number[];
}

type Phase = 'start' | 'append' | 'expire' | 'count' | 'done';

interface QueueStep extends Step {
	phase: Phase;
	current: number;
	queue: number[];
	answered: number;
}

type QueueSceneProps = SceneProps<PingsInput, QueueStep>;

const MAX_PINGS = 8;
const MAX_TIME = 9999;
const WINDOW = 3000;

const TIMELINE_TOP = 30;
const QUEUE_TOP = 150;

const LINE_INIT = [3, 4];
const LINE_PING = 6;
const LINE_APPEND = 7;
const LINE_WHILE = 9;
const LINE_POPLEFT = 10;
const LINE_RETURN = 12;

const countsOf = (pings: number[]) => pings.map((t, index) => pings.slice(0, index + 1).filter((earlier) => earlier >= t - WINDOW).length);

function buildSteps({ pings }: PingsInput): QueueStep[] {
	const steps: QueueStep[] = [];
	let queue: number[] = [];
	let answered = 0;

	const snapshot = (phase: Phase, current: number, highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			current,
			queue: [...queue],
			answered,
			readout: {
				t: current >= 0 && current < pings.length ? pings[current] : '–',
				'window starts at': current >= 0 && current < pings.length ? pings[current] - WINDOW : '–',
				'queue size': queue.length,
			},
			highlightedLines,
			narration,
		});

	snapshot('start', -1, LINE_INIT, `<code>RecentCounter()</code> starts with an empty queue. Each call to <code>ping(t)</code> must count the pings in <code>[t - 3000, t]</code>.`);

	pings.forEach((t, index) => {
		queue.push(index);
		snapshot('append', index, [LINE_PING, LINE_APPEND], `<code>ping(${t})</code>: ${t} is the newest ping, so it joins the back of the queue. The window is now <code>[${t - WINDOW}, ${t}]</code>.`);
		while (pings[queue[0]] < t - WINDOW) {
			snapshot('expire', index, [LINE_WHILE, LINE_POPLEFT], `The front, ${pings[queue[0]]}, is older than ${t - WINDOW}, so it can never count again: <code>popleft()</code> drops it.`);
			queue = queue.slice(1);
		}
		answered = index + 1;
		snapshot(
			'count',
			index,
			[LINE_WHILE, LINE_RETURN],
			`The front, ${pings[queue[0]]}, is inside the window, and everything behind it is newer. So the whole queue counts: <code>ping(${t})</code> returns <b>${queue.length}</b>.`,
		);
	});

	snapshot('done', pings.length, [], `The calls returned <b>[${countsOf(pings).join(', ')}]</b>. Each ping joined the queue once and left it at most once.`);
	return steps;
}

function QueueScene({ input: { pings }, step: { phase, current, queue, answered } }: QueueSceneProps) {
	const counts = countsOf(pings);
	const expiring = phase === 'expire' ? queue[0] : -1;
	const appended = (index: number) => index <= current || phase === 'done';
	const queueTone = (index: number) => {
		if (index === expiring) return 'remove';
		if (phase === 'append' && index === current) return 'add';
		if (phase === 'count') return 'focus';
		return 'plain';
	};

	return (
		<Canvas columns={pings.length} height={250}>
			<RowLabel top={TIMELINE_TOP + 16}>pings</RowLabel>
			{pings.map((t, index) => (
				<Cell
					key={`timeline-${index}`}
					value={t}
					column={index}
					top={TIMELINE_TOP}
					tone={index === current && phase !== 'done' ? 'focus' : 'plain'}
					dimmed={phase !== 'done' && phase !== 'start' && index > current}
				/>
			))}
			{pings.map((_, index) => (
				<SubLabel key={`returned-${index}`} column={index} top={TIMELINE_TOP + 58} hidden={index >= answered}>
					returns {counts[index]}
				</SubLabel>
			))}

			<RowLabel top={QUEUE_TOP + 16}>
				<code>queue</code>
			</RowLabel>
			{pings.map((t, index) => {
				const position = queue.indexOf(index);
				const inQueue = position >= 0;
				return (
					<Cell
						key={`queued-${index}`}
						value={t}
						column={inQueue ? position : appended(index) ? 0 : index}
						top={inQueue || appended(index) ? QUEUE_TOP : TIMELINE_TOP}
						tone={queueTone(index)}
						hidden={!inQueue}
					/>
				);
			})}
			<Tag column={0} top={QUEUE_TOP + 66} tone="add" hidden={queue.length === 0}>
				front
			</Tag>
		</Canvas>
	);
}

export default defineExplainer<PingsInput, QueueStep>({
	title: 'A queue that forgets old pings',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'Pings join at the back, expire from the front',
			subtitle: 'The top row is every call in order, with what it returned. Green is the ping just appended, red is one expiring, and teal is the queue being counted.',
			Scene: QueueScene,
		},
	],
	examples: [
		{ input: { pings: [1, 100, 3001, 3002] }, note: 'LeetCode example' },
		{ input: { pings: [1, 2, 3, 3004, 6100] }, note: 'Several pings expire at once' },
		{ input: { pings: [100, 200, 300] }, note: 'Nothing expires' },
	],
	fields: [{ name: 'pings', label: 'Your own ping times', placeholder: 'e.g. 1, 100, 3001, 3002' }],
	describe: ({ pings }) => pings.join(', '),
	parse(values) {
		const parts = values.pings.split(/[\s,]+/).filter(Boolean);
		const pings = parts.map(Number);
		if (!parts.length) return { error: 'Enter ping times separated by commas or spaces.' };
		if (pings.some((t) => !Number.isInteger(t) || t < 1 || t > MAX_TIME)) return { error: `Use whole numbers from 1 to ${MAX_TIME} so they fit on screen.` };
		if (pings.some((t, index) => index > 0 && t <= pings[index - 1])) return { error: 'Ping times must strictly increase, as LeetCode guarantees.' };
		if (pings.length > MAX_PINGS) return { error: `Use ${MAX_PINGS} pings or fewer so everything fits on screen.` };
		return { input: { pings } };
	},
	steps: buildSteps,
});
