import { Canvas, Cell, Chips, ColumnMarker, RowLabel, SceneNote, SubLabel, type Chip } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface ZipInput {
	a: string[];
	b: string[];
}

type Phase = 'intro' | 'round' | 'stop' | 'done';

interface ZipStep extends Step {
	phase: Phase;
	round: number;
}

type ZipSceneProps = SceneProps<ZipInput, ZipStep>;

const MAX_ITEMS = 8;
const MAX_ITEM_LENGTH = 4;

const LINE_START = 2;
const LINE_ZIP = 3;
const LINE_APPEND = 4;
const LINE_RETURN = 5;

const TOP_A = 24;
const TOP_B = 112;

const isNumber = (item: string) => item !== '' && !Number.isNaN(Number(item));
const repr = (item: string) => (isNumber(item) ? item : `'${item}'`);
const tuple = (left: string, right: string) => `(${repr(left)}, ${repr(right)})`;
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const pairCount = ({ a, b }: ZipInput) => Math.min(a.length, b.length);

function buildSteps(input: ZipInput): ZipStep[] {
	const { a, b } = input;
	const pairs = pairCount(input);
	const yielded = a.slice(0, pairs).map((left, index) => tuple(left, b[index]));

	const steps: ZipStep[] = [
		{
			phase: 'intro',
			round: -1,
			readout: { round: '–', pairs: 0 },
			highlightedLines: [LINE_START],
			narration: `<code>zip(a, b)</code> reads both lists by position. <code>a</code> has ${plural(a.length, 'item')} and <code>b</code> has ${plural(b.length, 'item')}. Each round takes the item at the same index from each list.`,
		},
	];

	for (let round = 0; round < pairs; round++) {
		steps.push({
			phase: 'round',
			round,
			readout: { round: round + 1, pairs: round + 1 },
			highlightedLines: [LINE_ZIP, LINE_APPEND],
			narration: `Round ${round + 1}: zip takes <code>a[${round}] = ${repr(a[round])}</code> and <code>b[${round}] = ${repr(b[round])}</code> and yields <b>${yielded[round]}</b>.`,
		});
	}

	const stopNarration = () => {
		if (a.length === b.length) return `Round ${pairs + 1}: both lists end at index ${pairs - 1}, so zip stops with nothing left over.`;
		if (a.length < b.length)
			return `Round ${pairs + 1}: zip asks <code>a</code> first, and <code>a</code> has no index ${pairs}. zip stops before touching <code>b</code>, so ${plural(b.length - pairs, 'item')} of <code>b</code> ${b.length - pairs === 1 ? 'is' : 'are'} never read.`;
		const untouched = a.length - pairs - 1;
		return (
			`Round ${pairs + 1}: zip asks <code>a</code> first and gets <code>a[${pairs}] = ${repr(a[pairs])}</code>. Then <code>b</code> has no index ${pairs}, so zip stops and drops ${repr(a[pairs])}.` +
			(untouched > 0 ? ` The ${plural(untouched, 'item')} after it ${untouched === 1 ? 'is' : 'are'} never read.` : '') +
			` With a list nothing is lost, but an iterator passed to zip has consumed that item.`
		);
	};
	steps.push({
		phase: 'stop',
		round: pairs,
		readout: { round: 'stop', pairs },
		highlightedLines: [LINE_ZIP],
		narration: stopNarration(),
	});

	steps.push({
		phase: 'done',
		round: pairs,
		readout: { round: '–', pairs },
		highlightedLines: [LINE_RETURN],
		narration: `zip yielded ${plural(pairs, 'pair')}, one per index both lists have. <code>pair_up</code> returns <b>[${yielded.join(', ')}]</b>.`,
	});
	return steps;
}

function ListsScene({ input, step: { phase, round } }: ZipSceneProps) {
	const { a, b } = input;
	const pairs = pairCount(input);
	const columns = Math.max(a.length, b.length);
	const finished = phase === 'stop' || phase === 'done';
	const toneAt = (index: number) => (phase === 'round' && index === round ? 'focus' : 'plain');
	const unread = (index: number) => finished && index >= pairs;
	const dropped = (index: number) => finished && a.length > b.length && index === pairs;
	const noteTop = a.length === b.length ? 80 : a.length < b.length ? TOP_A + 12 : TOP_B + 12;

	return (
		<Canvas columns={columns + 1} height={200}>
			<RowLabel top={TOP_A + 16}>a</RowLabel>
			<RowLabel top={TOP_B + 16}>b</RowLabel>
			<ColumnMarker
				column={Math.max(0, round)}
				top={TOP_A - 6}
				height={TOP_B - TOP_A + 66}
				label={phase === 'stop' ? 'stop' : `round ${round + 1}`}
				hidden={phase !== 'round' && phase !== 'stop'}
			/>
			{a.map((item, index) => (
				<Cell
					key={`a-${index}`}
					value={item}
					column={index}
					top={TOP_A}
					tone={dropped(index) ? 'remove' : toneAt(index)}
					dimmed={unread(index) && !dropped(index)}
				/>
			))}
			{b.map((item, index) => (
				<Cell key={`b-${index}`} value={item} column={index} top={TOP_B} tone={toneAt(index)} dimmed={unread(index)} />
			))}
			{Array.from({ length: columns }, (_, index) => (
				<SubLabel key={`index-${index}`} column={index} top={TOP_B + 58}>
					i = {index}
				</SubLabel>
			))}
			<SceneNote column={pairs} top={noteTop} hidden={!finished}>
				{a.length === b.length ? 'both end here' : 'empty'}
			</SceneNote>
		</Canvas>
	);
}

function YieldedTuples({ input, step: { phase, round } }: ZipSceneProps) {
	const { a, b } = input;
	if (phase === 'intro') return <Chips chips={[{ label: 'Tuples appear as zip yields them', state: 'upcoming' }]} />;
	const shown = phase === 'round' ? round + 1 : pairCount(input);
	const chips: Chip[] = a.slice(0, shown).map((left, index) => ({
		label: tuple(left, b[index]),
		state: phase === 'round' && index === round ? 'current' : 'plain',
	}));
	return <Chips chips={chips} />;
}

function parseList(raw: string) {
	return raw.split(/[\s,]+/).filter(Boolean);
}

export default defineExplainer<ZipInput, ZipStep>({
	title: 'How zip(a, b) walks two lists',
	codeFile: 'pair_up.py',
	stages: [
		{
			title: 'Two lists, one index at a time',
			subtitle: 'Each round reads the same index from both lists.',
			Scene: ListsScene,
			Footer: YieldedTuples,
		},
	],
	examples: [
		{ input: { a: ['1', '2', '3'], b: ['x', 'y', 'z'] }, note: 'Equal lengths' },
		{ input: { a: ['1', '2', '3', '4', '5'], b: ['a', 'b'] }, note: 'Second list shorter' },
		{ input: { a: ['x'], b: ['10', '20', '30'] }, note: 'First list shorter' },
	],
	fields: [
		{ name: 'a', label: 'a', placeholder: 'e.g. 1, 2, 3' },
		{ name: 'b', label: 'b', placeholder: 'e.g. x, y' },
	],
	describe: ({ a, b }) => `a = [${a.map(repr).join(', ')}], b = [${b.map(repr).join(', ')}]`,
	parse(values) {
		const a = parseList(values.a);
		const b = parseList(values.b);
		if (!a.length || !b.length) return { error: 'Enter at least one item in each list, separated by commas or spaces.' };
		if (a.length > MAX_ITEMS || b.length > MAX_ITEMS) return { error: `Use ${MAX_ITEMS} items or fewer per list so everything fits on screen.` };
		if ([...a, ...b].some((item) => item.length > MAX_ITEM_LENGTH)) return { error: `Keep each item to ${MAX_ITEM_LENGTH} characters or fewer.` };
		return { input: { a, b } };
	},
	steps: buildSteps,
});
