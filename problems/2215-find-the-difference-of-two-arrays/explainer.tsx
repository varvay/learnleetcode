import { Canvas, Cell, RowLabel } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface ArraysInput {
	nums1: number[];
	nums2: number[];
}

type Phase = 'start' | 'build' | 'compare' | 'done';
type Side = 1 | 2;

interface Progress {
	built1: number;
	built2: number;
	compared1: number;
	compared2: number;
}

interface DifferenceStep extends Step {
	phase: Phase;
	side: Side;
	value: number | null;
	progress: Progress;
}

type DifferenceSceneProps = SceneProps<ArraysInput, DifferenceStep>;

const MAX_VALUES = 8;
const MIN_VALUE = -99;
const MAX_VALUE = 99;

const NUMS1_TOP = 30;
const IN1_TOP = 100;
const NUMS2_TOP = 170;
const IN2_TOP = 240;
const ONLY1_TOP = 320;
const ONLY2_TOP = 390;

const LINE_MAPS = 3;
const LINE_FOR_NUMS1 = 4;
const LINE_WRITE_IN1 = 5;
const LINE_FOR_NUMS2 = 6;
const LINE_WRITE_IN2 = 7;
const LINE_FOR_IN1 = 10;
const LINE_CHECK_IN2 = 11;
const LINE_APPEND_ONLY1 = 12;
const LINE_FOR_IN2 = 15;
const LINE_CHECK_IN1 = 16;
const LINE_APPEND_ONLY2 = 17;
const LINE_RETURN = 19;

const withMinus = (value: number) => (value < 0 ? `−${-value}` : `${value}`);
const listText = (values: number[]) => `[${values.map(withMinus).join(', ')}]`;
const distinct = (values: number[]) => [...new Set(values)];
const onlyIn = (keys: number[], other: number[]) => keys.filter((key) => !other.includes(key));

function buildSteps({ nums1, nums2 }: ArraysInput): DifferenceStep[] {
	const keys1 = distinct(nums1);
	const keys2 = distinct(nums2);
	const steps: DifferenceStep[] = [];
	const progress: Progress = { built1: 0, built2: 0, compared1: 0, compared2: 0 };
	const kept = () => onlyIn(keys1.slice(0, progress.compared1), keys2).length + onlyIn(keys2.slice(0, progress.compared2), keys1).length;
	const push = (phase: Phase, side: Side, value: number | null, highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			side,
			value,
			progress: { ...progress },
			readout: {
				x: value === null ? '–' : withMinus(value),
				'in1 keys': distinct(nums1.slice(0, progress.built1)).length,
				'in2 keys': distinct(nums2.slice(0, progress.built2)).length,
				kept: kept(),
			},
			highlightedLines,
			narration,
		});

	push('start', 1, null, [LINE_MAPS], `Two empty hashmaps. Each array's values become keys, and a key exists only once, so each map ends up holding its array's distinct values.`);

	const buildFrom = (side: Side, nums: number[], map: string, lines: number[]) =>
		nums.forEach((value, index) => {
			const repeat = nums.slice(0, index).includes(value);
			if (side === 1) progress.built1++;
			else progress.built2++;
			push(
				'build',
				side,
				value,
				lines,
				repeat
					? `<code>x = ${withMinus(value)}</code> is already a key in <code>${map}</code>, so the write changes nothing. That is how the repeat disappears.`
					: `<code>x = ${withMinus(value)}</code> becomes a new key in <code>${map}</code>.`,
			);
		});
	buildFrom(1, nums1, 'in1', [LINE_FOR_NUMS1, LINE_WRITE_IN1]);
	buildFrom(2, nums2, 'in2', [LINE_FOR_NUMS2, LINE_WRITE_IN2]);

	const compare = (side: Side, keys: number[], other: number[], names: { own: string; other: string; output: string }, lines: { loop: number; check: number; append: number }) =>
		keys.forEach((value) => {
			const shared = other.includes(value);
			if (side === 1) progress.compared1++;
			else progress.compared2++;
			push(
				'compare',
				side,
				value,
				shared ? [lines.loop, lines.check] : [lines.loop, lines.check, lines.append],
				shared
					? `Key ${withMinus(value)} of <code>${names.own}</code> is also a key in <code>${names.other}</code>: one lookup says so, and it is skipped.`
					: `Key ${withMinus(value)} of <code>${names.own}</code> is not in <code>${names.other}</code>, so it goes into <code>${names.output}</code>.`,
			);
		});
	compare(1, keys1, keys2, { own: 'in1', other: 'in2', output: 'only1' }, { loop: LINE_FOR_IN1, check: LINE_CHECK_IN2, append: LINE_APPEND_ONLY1 });
	compare(2, keys2, keys1, { own: 'in2', other: 'in1', output: 'only2' }, { loop: LINE_FOR_IN2, check: LINE_CHECK_IN1, append: LINE_APPEND_ONLY2 });

	push('done', 2, null, [LINE_RETURN], `Every key has been checked once. The answer is <b>[${listText(onlyIn(keys1, keys2))}, ${listText(onlyIn(keys2, keys1))}]</b>.`);
	return steps;
}

interface Lane {
	nums: number[];
	keys: number[];
	output: number[];
	built: number;
	compared: number;
	side: Side;
	numsTop: number;
	mapTop: number;
	outputTop: number;
	name: string;
}

function LaneCells({ lane, step }: { lane: Lane; step: DifferenceStep }) {
	const { nums, keys, output, built, compared, side, numsTop, mapTop, outputTop, name } = lane;
	const builtKeys = distinct(nums.slice(0, built));
	const keptKeys = output.filter((value) => keys.indexOf(value) < compared);
	const current = step.side === side ? step.value : null;
	const lookedUp = step.phase === 'compare' && step.side !== side ? step.value : null;
	const keyTone = (value: number) => {
		if (value === lookedUp) return 'remove';
		if (value !== current) return 'plain';
		if (step.phase === 'build') return nums.slice(0, built - 1).includes(value) ? 'focus' : 'add';
		return step.phase === 'compare' ? 'focus' : 'plain';
	};

	return (
		<>
			<RowLabel top={numsTop + 16}>
				<code>nums{side}</code>
			</RowLabel>
			{nums.map((value, column) => (
				<Cell
					key={`nums${side}-${column}`}
					value={withMinus(value)}
					column={column}
					top={numsTop}
					tone={step.phase === 'build' && step.side === side && column === built - 1 ? 'focus' : 'plain'}
					dimmed={column >= built}
				/>
			))}
			<RowLabel top={mapTop + 16}>
				<code>{name}</code>
			</RowLabel>
			{keys.map((value, column) => (
				<Cell key={`in${side}-${value}`} value={withMinus(value)} column={column} top={mapTop} tone={keyTone(value)} hidden={!builtKeys.includes(value)} />
			))}
			<RowLabel top={outputTop + 16}>
				<code>only{side}</code>
			</RowLabel>
			{output.map((value) => {
				const placed = keptKeys.includes(value);
				return (
					<Cell
						key={`only${side}-${value}`}
						value={withMinus(value)}
						column={placed ? keptKeys.indexOf(value) : keys.indexOf(value)}
						top={placed ? outputTop : mapTop}
						tone={step.phase === 'compare' && value === current ? 'add' : 'plain'}
						hidden={!placed}
					/>
				);
			})}
		</>
	);
}

function DifferenceScene({ input: { nums1, nums2 }, step }: DifferenceSceneProps) {
	const keys1 = distinct(nums1);
	const keys2 = distinct(nums2);
	const { built1, built2, compared1, compared2 } = step.progress;
	const lane = (side: Side, nums: number[], keys: number[], other: number[], built: number, compared: number, numsTop: number, mapTop: number, outputTop: number): Lane => ({
		nums,
		keys,
		output: onlyIn(keys, other),
		built,
		compared,
		side,
		numsTop,
		mapTop,
		outputTop,
		name: `in${side}`,
	});

	return (
		<Canvas columns={Math.max(nums1.length, nums2.length)} height={460}>
			<LaneCells lane={lane(1, nums1, keys1, keys2, built1, compared1, NUMS1_TOP, IN1_TOP, ONLY1_TOP)} step={step} />
			<LaneCells lane={lane(2, nums2, keys2, keys1, built2, compared2, NUMS2_TOP, IN2_TOP, ONLY2_TOP)} step={step} />
		</Canvas>
	);
}

function parseList(text: string, name: string): { values: number[] } | { error: string } {
	const parts = text.split(/[\s,]+/).filter(Boolean);
	const values = parts.map(Number);
	if (!parts.length) return { error: `Enter ${name} as whole numbers separated by commas or spaces.` };
	if (values.some((value) => !Number.isInteger(value) || value < MIN_VALUE || value > MAX_VALUE)) return { error: `Use whole numbers from ${MIN_VALUE} to ${MAX_VALUE} in ${name}.` };
	if (values.length > MAX_VALUES) return { error: `Use ${MAX_VALUES} values or fewer in ${name} so everything fits on screen.` };
	return { values };
}

export default defineExplainer<ArraysInput, DifferenceStep>({
	title: 'Two hashmaps, then one lookup per key',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'Build the maps, then compare their keys',
			subtitle: 'Green marks a new key or a kept value; teal, a repeat or the key being checked; red, the key the lookup finds in the other map.',
			Scene: DifferenceScene,
		},
	],
	examples: [
		{ input: { nums1: [1, 2, 3], nums2: [2, 4, 6] }, note: 'LeetCode example 1' },
		{ input: { nums1: [1, 2, 3, 3], nums2: [1, 1, 2, 2] }, note: 'LeetCode example 2: repeats collapse' },
		{ input: { nums1: [-1, 0, 0, 5], nums2: [5, -1, 7, 7] }, note: 'Negatives and repeats on both sides' },
	],
	fields: [
		{ name: 'nums1', label: 'nums1', placeholder: 'e.g. 1, 2, 3' },
		{ name: 'nums2', label: 'nums2', placeholder: 'e.g. 2, 4, 6' },
	],
	describe: ({ nums1, nums2 }) => `[${nums1.join(', ')}] and [${nums2.join(', ')}]`,
	parse(values) {
		const first = parseList(values.nums1, 'nums1');
		if ('error' in first) return first;
		const second = parseList(values.nums2, 'nums2');
		if ('error' in second) return second;
		return { input: { nums1: first.values, nums2: second.values } };
	},
	steps: buildSteps,
});
