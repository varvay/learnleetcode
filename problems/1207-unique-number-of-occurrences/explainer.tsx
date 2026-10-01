import { Canvas, Cell, RowLabel } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface OccurrencesInput {
	arr: number[];
}

type Phase = 'start' | 'count' | 'check' | 'clash' | 'done';

interface OccurrencesStep extends Step {
	phase: Phase;
	counted: number;
	checked: number;
	current: number | null;
}

type OccurrencesSceneProps = SceneProps<OccurrencesInput, OccurrencesStep>;

interface Claim {
	count: number;
	num: number;
	keyIndex: number;
}

const MAX_VALUES = 10;
const MIN_VALUE = -99;
const MAX_VALUE = 99;

const ARR_TOP = 30;
const COUNTER_KEY_TOP = 110;
const COUNTER_COUNT_TOP = 170;
const UNIQUE_KEY_TOP = 260;
const UNIQUE_VALUE_TOP = 320;

const LINE_MAPS = 3;
const LINE_FOR_ARR = 5;
const LINE_NEW_CHECK = 6;
const LINE_FIRST_COUNT = 7;
const LINE_ELSE = 8;
const LINE_INCREMENT = 9;
const LINE_FOR_COUNTER = 11;
const LINE_UNCLAIMED_CHECK = 12;
const LINE_CLAIM = 13;
const LINE_CLAIMED_BY_OTHER = 14;
const LINE_RETURN_FALSE = 15;
const LINE_RETURN_TRUE = 17;

const withMinus = (value: number) => (value < 0 ? `−${-value}` : `${value}`);
const times = (count: number) => (count === 1 ? 'once' : count === 2 ? 'twice' : `${count} times`);
const distinct = (values: number[]) => [...new Set(values)];

function countsOf(values: number[]): Map<number, number> {
	const counts = new Map<number, number>();
	for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
	return counts;
}

function claimsOf(keys: number[], counts: Map<number, number>, checked: number): Claim[] {
	const claims: Claim[] = [];
	keys.slice(0, checked).forEach((num, keyIndex) => {
		const count = counts.get(num)!;
		if (!claims.some((claim) => claim.count === count)) claims.push({ count, num, keyIndex });
	});
	return claims;
}

function buildSteps({ arr }: OccurrencesInput): OccurrencesStep[] {
	const keys = distinct(arr);
	const counts = countsOf(arr);
	const steps: OccurrencesStep[] = [];
	const push = (phase: Phase, counted: number, checked: number, current: number | null, highlightedLines: number[], narration: string) => {
		const seen = countsOf(arr.slice(0, counted));
		steps.push({
			phase,
			counted,
			checked,
			current,
			readout: {
				num: current === null ? '–' : withMinus(current),
				count: current === null ? '–' : (seen.get(current) ?? 0),
				'counter keys': seen.size,
				'unique keys': claimsOf(keys, counts, checked).length,
			},
			highlightedLines,
			narration,
		});
	};

	push('start', 0, 0, null, [LINE_MAPS], `Two empty hashmaps. <code>counter</code> will map each number to how often it appears; <code>unique</code> will map each count to the number that claimed it.`);

	arr.forEach((num, index) => {
		const count = countsOf(arr.slice(0, index + 1)).get(num)!;
		const isNew = count === 1;
		push(
			'count',
			index + 1,
			0,
			num,
			isNew ? [LINE_FOR_ARR, LINE_NEW_CHECK, LINE_FIRST_COUNT] : [LINE_FOR_ARR, LINE_NEW_CHECK, LINE_ELSE, LINE_INCREMENT],
			isNew
				? `${withMinus(num)} is not in <code>counter</code> yet, so <code>counter[${withMinus(num)}] = 1</code>.`
				: `${withMinus(num)} is already in <code>counter</code>, so its count goes up to ${count}.`,
		);
	});

	for (let index = 0; index < keys.length; index++) {
		const num = keys[index];
		const count = counts.get(num)!;
		const owner = claimsOf(keys, counts, index).find((claim) => claim.count === count);
		if (owner) {
			push(
				'clash',
				arr.length,
				index + 1,
				num,
				[LINE_FOR_COUNTER, LINE_UNCLAIMED_CHECK, LINE_CLAIMED_BY_OTHER, LINE_RETURN_FALSE],
				`${withMinus(num)} appears ${times(count)}, but <code>unique[${count}]</code> is already ${withMinus(owner.num)}. Two numbers share a count, so the function returns <b>False</b> without checking the rest.`,
			);
			return steps;
		}
		push(
			'check',
			arr.length,
			index + 1,
			num,
			[LINE_FOR_COUNTER, LINE_UNCLAIMED_CHECK, LINE_CLAIM],
			`${withMinus(num)} appears ${times(count)}. No number has claimed count ${count} yet, so <code>unique[${count}] = ${withMinus(num)}</code>.`,
		);
	}

	push('done', arr.length, keys.length, null, [LINE_RETURN_TRUE], `Every count was claimed by exactly one number, so the function returns <b>True</b>.`);
	return steps;
}

function OccurrencesScene({ input: { arr }, step: { phase, counted, checked, current } }: OccurrencesSceneProps) {
	const keys = distinct(arr);
	const finalCounts = countsOf(arr);
	const seen = countsOf(arr.slice(0, counted));
	const claims = claimsOf(keys, finalCounts, checked);
	const allClaims = claimsOf(keys, finalCounts, keys.length);
	const clashCount = phase === 'clash' && current !== null ? finalCounts.get(current) : undefined;
	const counterTone = (num: number) => {
		if (num !== current) return 'plain';
		if (phase === 'clash') return 'remove';
		if (phase === 'count' && seen.get(num) === 1) return 'add';
		return 'focus';
	};

	return (
		<Canvas columns={arr.length} height={390}>
			<RowLabel top={ARR_TOP + 16}>
				<code>arr</code>
			</RowLabel>
			{arr.map((value, column) => (
				<Cell
					key={`arr-${column}`}
					value={withMinus(value)}
					column={column}
					top={ARR_TOP}
					tone={phase === 'count' && column === counted - 1 ? 'focus' : 'plain'}
					dimmed={column >= counted}
				/>
			))}

			<RowLabel top={COUNTER_KEY_TOP + 16}>
				<code>counter</code> key
			</RowLabel>
			<RowLabel top={COUNTER_COUNT_TOP + 16}>count</RowLabel>
			{keys.map((num, column) => (
				<Cell key={`key-${num}`} value={withMinus(num)} column={column} top={COUNTER_KEY_TOP} tone={counterTone(num)} hidden={!seen.has(num)} />
			))}
			{keys.map((num, column) => (
				<Cell key={`count-${num}`} value={seen.get(num) ?? 0} column={column} top={COUNTER_COUNT_TOP} tone={counterTone(num)} hidden={!seen.has(num)} />
			))}

			<RowLabel top={UNIQUE_KEY_TOP + 16}>
				<code>unique</code> key
			</RowLabel>
			<RowLabel top={UNIQUE_VALUE_TOP + 16}>value</RowLabel>
			{allClaims.map(({ count, num, keyIndex }) => {
				const position = claims.findIndex((claim) => claim.count === count);
				const placed = position >= 0;
				const tone = count === clashCount ? 'remove' : phase === 'check' && num === current ? 'add' : 'plain';
				return (
					<Cell
						key={`unique-${count}`}
						value={count}
						column={placed ? position : keyIndex}
						top={placed ? UNIQUE_KEY_TOP : COUNTER_COUNT_TOP}
						tone={tone}
						hidden={!placed}
					/>
				);
			})}
			{allClaims.map(({ count, num, keyIndex }) => {
				const position = claims.findIndex((claim) => claim.count === count);
				const placed = position >= 0;
				return (
					<Cell
						key={`owner-${count}`}
						value={withMinus(num)}
						column={placed ? position : keyIndex}
						top={placed ? UNIQUE_VALUE_TOP : COUNTER_KEY_TOP}
						tone={count === clashCount ? 'remove' : 'plain'}
						hidden={!placed}
					/>
				);
			})}
		</Canvas>
	);
}

export default defineExplainer<OccurrencesInput, OccurrencesStep>({
	title: 'Count, then claim each count once',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'Two hashmaps, one pass each',
			subtitle: 'counter fills from arr; then each count slides into unique when it is claimed. Red marks the clash: a count claimed twice.',
			Scene: OccurrencesScene,
		},
	],
	examples: [
		{ input: { arr: [1, 2, 2, 1, 1, 3] }, note: 'LeetCode example 1: True' },
		{ input: { arr: [1, 2] }, note: 'LeetCode example 2: False' },
		{ input: { arr: [-3, 0, 1, -3, 1, 1, 1, -3, 10, 0] }, note: 'LeetCode example 3: True' },
	],
	fields: [{ name: 'arr', label: 'Your own array', placeholder: 'e.g. 1, 2, 2, 1, 1, 3' }],
	describe: ({ arr }) => `[${arr.join(', ')}]`,
	parse(values) {
		const parts = values.arr.split(/[\s,]+/).filter(Boolean);
		const arr = parts.map(Number);
		if (!parts.length) return { error: 'Enter whole numbers separated by commas or spaces.' };
		if (arr.some((value) => !Number.isInteger(value) || value < MIN_VALUE || value > MAX_VALUE)) return { error: `Use whole numbers from ${MIN_VALUE} to ${MAX_VALUE}.` };
		if (arr.length > MAX_VALUES) return { error: `Use ${MAX_VALUES} values or fewer so everything fits on screen.` };
		return { input: { arr } };
	},
	steps: buildSteps,
});
