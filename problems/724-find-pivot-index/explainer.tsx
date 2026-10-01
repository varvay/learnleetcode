import { Canvas, Cell, ColumnMarker, Frame, RowLabel, SceneNote, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface PivotInput {
	nums: number[];
}

type Phase = 'start' | 'scan' | 'found' | 'none';

interface PivotStep extends Step {
	phase: Phase;
	index: number;
}

type PivotSceneProps = SceneProps<PivotInput, PivotStep>;

const MAX_VALUES = 10;
const MIN_VALUE = -20;
const MAX_VALUE = 20;

const NUMS_TOP = 38;
const LEFT_TOP = 128;
const RIGHT_TOP = 196;

const LINE_LEFT_INIT = 4;
const LINE_RIGHT_INIT = 5;
const LINE_FOR = 7;
const LINE_DROP_RIGHT = 8;
const LINE_FIRST_CHECK = 9;
const LINE_GROW_LEFT = 10;
const LINE_BALANCE_CHECK = 12;
const LINE_RETURN_PIVOT = 13;
const LINE_RETURN_NONE = 15;

const withMinus = (value: number) => (value < 0 ? `−${-value}` : `${value}`);
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function sidesOf(nums: number[]) {
	const total = sum(nums);
	const leftSums: number[] = [];
	const rightSums: number[] = [];
	let left = 0;
	nums.forEach((value, index) => {
		if (index > 0) left += nums[index - 1];
		leftSums.push(left);
		rightSums.push(total - left - value);
	});
	return { total, leftSums, rightSums };
}

function buildSteps({ nums }: PivotInput): PivotStep[] {
	const { total, leftSums, rightSums } = sidesOf(nums);
	const steps: PivotStep[] = [
		{
			phase: 'start',
			index: -1,
			readout: { i: '–', l: 0, r: withMinus(total) },
			highlightedLines: [LINE_LEFT_INIT, LINE_RIGHT_INIT],
			narration: `<code>l</code> starts at 0 and <code>r</code> at the total, ${withMinus(total)}: before the walk begins, every number counts as right of it.`,
		},
	];

	for (let index = 0; index < nums.length; index++) {
		const left = leftSums[index];
		const right = rightSums[index];
		const balanced = left === right;
		const leftText =
			index > 0
				? `nums[${index - 1}] = ${withMinus(nums[index - 1])} joins <code>l</code>, which becomes ${withMinus(left)}.`
				: `Nothing is left of index 0, so <code>l</code> stays 0.`;
		steps.push({
			phase: balanced ? 'found' : 'scan',
			index,
			readout: { i: index, l: withMinus(left), r: withMinus(right) },
			highlightedLines: [
				LINE_FOR,
				LINE_DROP_RIGHT,
				LINE_FIRST_CHECK,
				...(index > 0 ? [LINE_GROW_LEFT] : []),
				LINE_BALANCE_CHECK,
				...(balanced ? [LINE_RETURN_PIVOT] : []),
			],
			narration:
				`<code>i = ${index}</code>: nums[${index}] = ${withMinus(nums[index])} leaves <code>r</code>, which becomes ${withMinus(right)}. ${leftText} ` +
				(balanced
					? `Both sides are ${withMinus(left)}, so index ${index} is the pivot. It is the first balance found, so it is the leftmost, and the function returns <b>${index}</b>.`
					: `${withMinus(left)} ≠ ${withMinus(right)}, so the walk moves on.`),
		});
		if (balanced) return steps;
	}

	const last = nums.length - 1;
	steps.push({
		phase: 'none',
		index: last,
		readout: { i: last, l: withMinus(leftSums[last]), r: withMinus(rightSums[last]) },
		highlightedLines: [LINE_RETURN_NONE],
		narration: `No index balances its two sides, so the function returns <b>−1</b>.`,
	});
	return steps;
}

function PivotScene({ input: { nums }, step: { phase, index } }: PivotSceneProps) {
	const { total, leftSums, rightSums } = sidesOf(nums);
	const started = index >= 0;
	const current = Math.max(0, index);
	const balancedAt = (column: number) => leftSums[column] === rightSums[column];
	const sumTone = (column: number) => (column !== index ? 'plain' : balancedAt(column) ? 'add' : 'focus');

	return (
		<Canvas columns={nums.length} height={290}>
			<Frame startColumn={0} columns={started ? index : 0} top={30} label={index > 0 ? `left, sum ${withMinus(leftSums[index])}` : ''} />
			<SceneNote column={started ? index + 1 : 0} top={6} hidden={started && index === nums.length - 1}>
				right, sum {withMinus(started ? rightSums[index] : total)}
			</SceneNote>
			<RowLabel top={NUMS_TOP + 16}>
				<code>nums</code>
			</RowLabel>
			{nums.map((value, column) => (
				<Cell key={`nums-${column}`} value={withMinus(value)} column={column} top={NUMS_TOP} tone={column === index ? 'focus' : 'plain'} />
			))}
			<ColumnMarker column={current} top={LEFT_TOP - 10} height={140} label={`i = ${current}`} hidden={!started} />
			<RowLabel top={LEFT_TOP + 16}>
				<code>l</code>
			</RowLabel>
			<RowLabel top={RIGHT_TOP + 16}>
				<code>r</code>
			</RowLabel>
			{nums.map((_, column) => (
				<Cell
					key={`left-${column}`}
					value={withMinus(leftSums[column])}
					column={column}
					top={LEFT_TOP}
					tone={sumTone(column)}
					hidden={column > index}
				/>
			))}
			{nums.map((_, column) => (
				<Cell
					key={`right-${column}`}
					value={withMinus(rightSums[column])}
					column={column}
					top={RIGHT_TOP}
					tone={sumTone(column)}
					hidden={column > index}
				/>
			))}
			<Tag column={current} top={264} tone="add" hidden={phase !== 'found'}>
				pivot
			</Tag>
		</Canvas>
	);
}

export default defineExplainer<PivotInput, PivotStep>({
	title: 'Two running sums meet at the pivot',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'The walk, index by index',
			subtitle: 'The amber frame holds the numbers left of i. The rows below record l and r at each index; green marks a balance.',
			Scene: PivotScene,
		},
	],
	examples: [
		{ input: { nums: [1, 7, 3, 6, 5, 6] }, note: 'LeetCode example 1' },
		{ input: { nums: [1, 2, 3] }, note: 'LeetCode example 2: no pivot' },
		{ input: { nums: [2, 1, -1] }, note: 'LeetCode example 3: pivot at the edge' },
		{ input: { nums: [-2, 1, -1, 1, -2] }, note: 'Pivots at 1, 2 and 3: the first wins' },
	],
	fields: [{ name: 'nums', label: 'Your own array', placeholder: 'e.g. 1, 7, 3, 6, 5, 6' }],
	describe: ({ nums }) => `[${nums.join(', ')}]`,
	parse(values) {
		const parts = values.nums.split(/[\s,]+/).filter(Boolean);
		const nums = parts.map(Number);
		if (!parts.length) return { error: 'Enter whole numbers separated by commas or spaces.' };
		if (nums.some((value) => !Number.isInteger(value) || value < MIN_VALUE || value > MAX_VALUE)) return { error: `Use whole numbers from ${MIN_VALUE} to ${MAX_VALUE} so the sums fit in their cells.` };
		if (nums.length > MAX_VALUES) return { error: `Use ${MAX_VALUES} values or fewer so everything fits on screen.` };
		return { input: { nums } };
	},
	steps: buildSteps,
});
