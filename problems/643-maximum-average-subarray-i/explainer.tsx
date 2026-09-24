import {
	Canvas,
	Cell,
	Chips,
	ColumnMarker,
	Frame,
	RowLabel,
	SceneNote,
	SubLabel,
	Tag,
	type Chip,
} from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface WindowInput {
	nums: number[];
	k: number;
}

type Phase = 'intro' | 'slice' | 'shift' | 'pair' | 'done';

interface WindowStep extends Step {
	phase: Phase;
	pairIndex: number;
}

type WindowSceneProps = SceneProps<WindowInput, WindowStep>;

const MAX_VALUES = 10;
const MAX_MAGNITUDE = 999;

const LINE_SEED = 3;
const LINE_ZIP = 4;
const LINES_SLIDE = [5, 6];
const LINE_RETURN = 7;

const signed = (value: number) => (value < 0 ? `(${value})` : `${value}`);
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const isLinedUp = (phase: Phase) => phase === 'shift' || phase === 'pair' || phase === 'done';

function buildSteps({ nums, k }: WindowInput): WindowStep[] {
	const pairCount = nums.length - k;
	const seed = nums.slice(0, k).reduce((sum, value) => sum + value, 0);
	const readout = (window: number, best: number) => ({ window, best, k });

	const steps: WindowStep[] = [
		{
			phase: 'intro',
			pairIndex: -1,
			readout: readout(seed, seed),
			highlightedLines: [LINE_SEED],
			narration: `This is <code>nums</code> with k = ${k}. The first window is <code>nums[0:${k}]</code>, with sum ${seed}. Every slide after that removes one element on the left and adds one on the right.`,
		},
		{
			phase: 'slice',
			pairIndex: -1,
			readout: readout(seed, seed),
			highlightedLines: [LINE_ZIP],
			narration: `<code>nums[${k}:]</code> copies everything from index ${k} on: [${nums.slice(k).join(', ')}]. It has ${plural(pairCount, 'element')}, one for each slide.`,
		},
		{
			phase: 'shift',
			pairIndex: -1,
			readout: readout(seed, seed),
			highlightedLines: [LINE_ZIP],
			narration:
				pairCount > 0
					? `zip doesn't know about original indices. It pairs position 0 with position 0, 1 with 1, and so on. Line the copy up at position 0 and each column holds <code>nums[j]</code> and <code>nums[j + ${k}]</code>, which are always ${k} apart. The last ${plural(k, 'element')} of <code>nums</code> ${k === 1 ? 'has' : 'have'} no partner, so zip stops after ${plural(pairCount, 'pair')}.`
					: `The copy is empty, so zip produces no pairs. With k = n there is only one window.`,
		},
	];

	let window = seed;
	let best = seed;
	for (let pairIndex = 0; pairIndex < pairCount; pairIndex++) {
		const leaving = nums[pairIndex];
		const entering = nums[pairIndex + k];
		const before = window;
		window += entering - leaving;
		const improved = window > best;
		best = Math.max(best, window);
		steps.push({
			phase: 'pair',
			pairIndex,
			readout: readout(window, best),
			highlightedLines: LINES_SLIDE,
			narration:
				`Pair ${pairIndex + 1}: <code>leaving = nums[${pairIndex}] = ${leaving}</code>, <code>entering = nums[${pairIndex + k}] = ${entering}</code>. The window moves from start ${pairIndex} to start ${pairIndex + 1}, so window = ${before} + ${signed(entering)} − ${signed(leaving)} = <b>${window}</b>.` +
				(improved ? ` That's a new best.` : ``),
		});
	}

	const average = Math.round((best / k) * 100000) / 100000;
	steps.push({
		phase: 'done',
		pairIndex: -1,
		readout: readout(window, best),
		highlightedLines: [LINE_RETURN],
		narration: `zip ran out of pairs exactly when the window reached the end of the array. best = ${best}, so the answer is ${best} / ${k} = <b>${average}</b>.`,
	});
	return steps;
}

function ZipScene({ input: { nums, k }, step: { phase, pairIndex } }: WindowSceneProps) {
	const pairCount = nums.length - k;
	const linedUp = isLinedUp(phase);
	const pairing = phase === 'pair';
	const copyTop = phase === 'intro' ? 24 : 112;

	return (
		<Canvas columns={nums.length} height={200}>
			<RowLabel top={40}>
				<code>nums</code>
			</RowLabel>
			<RowLabel top={128} hidden={phase === 'intro'}>
				<code>nums[{k}:]</code>
			</RowLabel>
			<ColumnMarker column={Math.max(0, pairIndex)} top={18} height={162} label={`pair ${pairIndex + 1}`} hidden={!pairing} />
			{nums.map((value, index) => (
				<Cell
					key={`original-${index}`}
					value={value}
					column={index}
					top={24}
					tone={pairing && index === pairIndex ? 'remove' : phase === 'slice' && index >= k ? 'focus' : 'plain'}
					dimmed={!(pairing && index === pairIndex) && linedUp && index >= pairCount}
				/>
			))}
			{nums.map((_, index) => (
				<SubLabel key={`original-label-${index}`} column={index} top={82}>
					i = {index}
				</SubLabel>
			))}
			{nums.slice(k).map((value, index) => {
				const column = linedUp ? index : index + k;
				return [
					<Cell
						key={`copy-${index}`}
						value={value}
						column={column}
						top={copyTop}
						tone={pairing && index === pairIndex ? 'add' : 'focus'}
						hidden={phase === 'intro'}
					/>,
					<SubLabel key={`copy-label-${index}`} column={column} top={copyTop + 58} hidden={phase === 'intro'}>
						{linedUp ? `from i = ${index + k}` : `i = ${index + k}`}
					</SubLabel>,
				];
			})}
			<SceneNote column={Math.max(0, pairCount)} top={124} hidden={!linedUp}>
				no partner, zip stops
			</SceneNote>
		</Canvas>
	);
}

function PairChips({ input: { nums, k }, step: { phase, pairIndex } }: WindowSceneProps) {
	const pairCount = nums.length - k;
	if (!isLinedUp(phase)) return <Chips chips={[{ label: 'Pairs appear once the lists are lined up', state: 'upcoming' }]} />;
	if (pairCount === 0) return <Chips chips={[{ label: 'No pairs', state: 'upcoming' }]} />;
	const chips: Chip[] = nums.slice(0, pairCount).map((leaving, index) => ({
		label: `(${leaving}, ${nums[index + k]})`,
		state:
			phase === 'pair' && index === pairIndex
				? 'current'
				: phase === 'shift' || (phase === 'pair' && index > pairIndex)
					? 'upcoming'
					: 'plain',
	}));
	return <Chips chips={chips} />;
}

function WindowScene({ input: { nums, k }, step: { phase, pairIndex } }: WindowSceneProps) {
	const pairing = phase === 'pair';
	const windowStart = pairing ? pairIndex + 1 : phase === 'done' ? Math.max(0, nums.length - k) : 0;

	return (
		<Canvas columns={nums.length} height={150}>
			<Frame startColumn={windowStart} columns={k} top={30} label={`window, start ${windowStart}`} />
			<Tag column={Math.max(0, pairIndex)} top={112} tone="remove" hidden={!pairing}>
				leaving
			</Tag>
			<Tag column={Math.max(0, pairIndex) + k} top={112} tone="add" hidden={!pairing}>
				entering
			</Tag>
			{nums.map((value, index) => {
				const leaving = pairing && index === pairIndex;
				const entering = pairing && index === pairIndex + k;
				return (
					<Cell
						key={index}
						value={value}
						column={index}
						top={38}
						tone={leaving ? 'remove' : entering ? 'add' : 'plain'}
						dimmed={!leaving && !entering && (index < windowStart || index >= windowStart + k)}
					/>
				);
			})}
			<RowLabel top={54}>
				<code>nums</code>
			</RowLabel>
		</Canvas>
	);
}

export default defineExplainer<WindowInput, WindowStep>({
	title: 'How zip(nums, nums[k:]) slides a window',
	codeFile: 'solution.py',
	stages: [
		{ title: 'What zip sees', subtitle: 'zip pairs items by their position in each list.', Scene: ZipScene, Footer: PairChips },
		{ title: 'The window in the original array', subtitle: 'Each pair from zip is one slide of the window.', Scene: WindowScene },
	],
	examples: [
		{ input: { nums: [1, 12, -5, -6, 50, 3], k: 4 }, note: 'LeetCode example' },
		{ input: { nums: [5, 2, -1, 0, 3], k: 2 }, note: 'Small window' },
		{ input: { nums: [1, 3, 2, 5], k: 1 }, note: 'k = 1: neighbor pairs' },
	],
	fields: [
		{ name: 'nums', label: 'Your own array', placeholder: 'e.g. 4, 2, 7, 1, 9' },
		{ name: 'k', label: 'k', placeholder: '2' },
	],
	describe: ({ nums, k }) => `[${nums.join(', ')}], k = ${k}`,
	parse(values) {
		const parts = values.nums.split(/[\s,]+/).filter(Boolean);
		const nums = parts.map(Number);
		const k = Number(values.k);
		if (!parts.length) return { error: 'Enter some integers separated by commas or spaces.' };
		if (nums.some((value) => !Number.isInteger(value))) return { error: 'Use whole numbers only, for example 4, 2, 7, 1, 9.' };
		if (nums.length > MAX_VALUES) return { error: `Use ${MAX_VALUES} values or fewer so everything fits on screen.` };
		if (nums.some((value) => Math.abs(value) > MAX_MAGNITUDE)) return { error: `Keep values between -${MAX_MAGNITUDE} and ${MAX_MAGNITUDE}.` };
		if (values.k === '' || !Number.isInteger(k) || k < 1 || k > nums.length) return { error: `Enter k as a whole number from 1 to ${nums.length}.` };
		return { input: { nums, k } };
	},
	steps: buildSteps,
});
