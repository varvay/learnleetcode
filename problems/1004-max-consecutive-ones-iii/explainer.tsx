import { Canvas, Cell, ColumnMarker, Frame, RowLabel, SubLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface FlipInput {
	nums: number[];
	k: number;
}

type Phase = 'goal' | 'horizon' | 'grow' | 'overflow' | 'shrink' | 'done';

interface Span {
	start: number;
	length: number;
}

interface WindowStep extends Step {
	phase: Phase;
	left: number;
	right: number;
	leavingIndex: number;
	best: Span;
}

type WindowSceneProps = SceneProps<FlipInput, WindowStep>;

const MAX_VALUES = 11;

const LINE_INIT = 3;
const LINE_FOR = 4;
const LINE_ZERO_CHECK = 5;
const LINE_COUNT_ZERO = 6;
const LINE_OVER_BUDGET = 7;
const LINE_LEAVING_CHECK = 8;
const LINE_DROP_ZERO = 9;
const LINE_ADVANCE_LEFT = 10;
const LINE_RECORD = 11;
const LINE_RETURN = 12;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const countZeros = (values: number[]) => values.filter((value) => value === 0).length;
const spanEnd = (span: Span) => span.start + span.length;
const spanText = (span: Span) => `indices ${span.start} to ${spanEnd(span) - 1}`;
const isSummary = (phase: Phase) => phase === 'goal' || phase === 'done';
const shownWindow = ({ phase, left, right, best }: WindowStep): Span =>
	isSummary(phase) ? best : { start: left, length: right - left + 1 };

function zeroCountsFrom(nums: number[], left: number): number[] {
	let zeros = 0;
	return nums.map((value, index) => {
		if (index >= left && value === 0) zeros++;
		return zeros;
	});
}

function buildSteps({ nums, k }: FlipInput): WindowStep[] {
	const loopSteps: WindowStep[] = [];
	let left = 0;
	let zeros = 0;
	let best: Span = { start: 0, length: 0 };

	const snapshot = (phase: Phase, right: number, leavingIndex: number, highlightedLines: number[], narration: string): WindowStep => ({
		phase,
		left,
		right,
		leavingIndex,
		best,
		readout: { zeros, k, length: right - left + 1, best: best.length },
		highlightedLines,
		narration,
	});

	const record = (right: number) => {
		const length = right - left + 1;
		const improved = length > best.length;
		if (improved) best = { start: left, length };
		return improved;
	};

	const newBest = (improved: boolean) => (improved ? ` That's a new best.` : ``);

	for (let right = 0; right < nums.length; right++) {
		const enteringZero = nums[right] === 0;
		if (enteringZero) zeros++;
		const growLines = enteringZero ? [LINE_FOR, LINE_ZERO_CHECK, LINE_COUNT_ZERO] : [LINE_FOR, LINE_ZERO_CHECK];

		if (zeros <= k) {
			const improved = record(right);
			const window = { start: left, length: right - left + 1 };
			loopSteps.push(
				snapshot(
					'grow',
					right,
					-1,
					[...growLines, LINE_RECORD],
					`<code>right = ${right}</code> brings in ${enteringZero ? 'a zero' : 'a 1'}. The window, ${spanText(window)}, holds ${plural(zeros, 'zero')}, within k = ${k}: length <b>${window.length}</b>.` +
						newBest(improved),
				),
			);
			continue;
		}

		loopSteps.push(
			snapshot(
				'overflow',
				right,
				-1,
				[...growLines, LINE_OVER_BUDGET],
				`<code>right = ${right}</code> brings in a zero. The window now holds ${plural(zeros, 'zero')}, one more than k = ${k}. The second panel shows that every window from <code>left = ${left}</code> reaching index ${right} or further holds too many, so left moves forward.`,
			),
		);

		while (zeros > k) {
			const leavingIndex = left;
			const droppedZero = nums[leavingIndex] === 0;
			if (droppedZero) zeros--;
			left++;
			const backInBudget = zeros <= k;
			const improved = backInBudget && record(right);
			const window = { start: left, length: right - left + 1 };
			const outcome = !backInBudget
				? ` Still over k, so left keeps moving.`
				: window.length === 0
					? ` The window is now empty.`
					: ` The window, ${spanText(window)}, is back to ${plural(zeros, 'zero')}: length <b>${window.length}</b>.` + newBest(improved);
			loopSteps.push(
				snapshot(
					'shrink',
					right,
					leavingIndex,
					[
						LINE_OVER_BUDGET,
						LINE_LEAVING_CHECK,
						...(droppedZero ? [LINE_DROP_ZERO] : []),
						LINE_ADVANCE_LEFT,
						...(backInBudget ? [LINE_RECORD] : []),
					],
					`left moves past index ${leavingIndex}, ${droppedZero ? 'dropping a zero.' : `a 1, so the window still holds ${plural(zeros, 'zero')}.`}` + outcome,
				),
			);
		}
	}

	const bestZeros = countZeros(nums.slice(best.start, spanEnd(best)));
	const toFlip = bestZeros > 0 ? `${plural(bestZeros, 'zero')} to flip` : 'nothing to flip';
	const firstOverFromStart = zeroCountsFrom(nums, 0).findIndex((count) => count > k);
	const initial: Omit<WindowStep, 'highlightedLines' | 'narration'> = {
		phase: 'goal',
		left: 0,
		right: -1,
		leavingIndex: -1,
		best,
		readout: { zeros: 0, k, length: 0, best: 0 },
	};

	return [
		{
			...initial,
			highlightedLines: [],
			narration:
				best.length > 0
					? `A window can be flipped to all 1's exactly when it holds at most k = ${k} zeros. So the answer is the longest such window. Here it is ${spanText(best)}, with ${toFlip}.`
					: `A window can be flipped to all 1's exactly when it holds at most k = ${k} zeros. Every element here is a zero and k = 0, so no window qualifies.`,
		},
		{
			...initial,
			phase: 'horizon',
			highlightedLines: [LINE_INIT],
			narration:
				`The loop finds that window with two indices, left and right. Fix left at 0 and count the zeros from there to each later index (second panel). The count never goes down.` +
				(firstOverFromStart >= 0
					? ` It passes k at index ${firstOverFromStart}, so every window from index 0 that reaches index ${firstOverFromStart} or further fails too. Then left must move forward, and it never has to move back.`
					: ` Here it never passes k = ${k}, so right grows the window all the way to the end.`),
		},
		...loopSteps,
		snapshot(
			'done',
			nums.length - 1,
			-1,
			[LINE_RETURN],
			best.length > 0
				? `right has reached the end. The longest window with at most ${plural(k, 'zero')} is ${spanText(best)}, with ${toFlip}, so the answer is <b>${best.length}</b>.`
				: `right has reached the end without finding a window it could flip, so the answer is <b>0</b>.`,
		),
	];
}

function WindowScene({ input: { nums, k }, step }: WindowSceneProps) {
	const { phase, left, right, leavingIndex } = step;
	const window = shownWindow(step);
	const inWindow = (index: number) => index >= window.start && index < spanEnd(window);
	const windowZeros = countZeros(nums.slice(window.start, spanEnd(window)));
	const overBudget = windowZeros > k;
	const showsPointers = !isSummary(phase);

	return (
		<Canvas columns={nums.length} height={220}>
			<Frame
				startColumn={window.start}
				columns={window.length}
				top={30}
				label={window.length > 0 ? `window, ${plural(windowZeros, 'zero')}` : 'empty window'}
			/>
			<RowLabel top={54}>
				<code>nums</code>
			</RowLabel>
			{nums.map((value, index) => {
				const entering = (phase === 'grow' || phase === 'overflow') && index === right;
				const leaving = phase === 'shrink' && index === leavingIndex;
				return (
					<Cell
						key={`nums-${index}`}
						value={value}
						column={index}
						top={38}
						tone={entering ? 'add' : leaving ? 'remove' : inWindow(index) && value === 0 ? 'focus' : 'plain'}
						dimmed={!leaving && !inWindow(index)}
					/>
				);
			})}
			<RowLabel top={144}>flipped</RowLabel>
			{nums.map((value, index) => {
				const unflippable = overBudget && index === right;
				return (
					<Cell
						key={`flipped-${index}`}
						value={unflippable ? 0 : 1}
						column={index}
						top={128}
						tone={unflippable ? 'remove' : value === 0 ? 'focus' : 'plain'}
						hidden={!inWindow(index)}
					/>
				);
			})}
			<Tag column={left} top={194} tone="remove" hidden={!showsPointers}>
				left
			</Tag>
			<Tag column={Math.max(0, right)} top={194} tone="add" hidden={!showsPointers || right < 0}>
				right
			</Tag>
		</Canvas>
	);
}

function HorizonScene({ input: { nums, k }, step: { phase, left, right } }: WindowSceneProps) {
	const counting = phase !== 'goal';
	const zerosSinceLeft = zeroCountsFrom(nums, left);
	const firstOver = zerosSinceLeft.findIndex((count) => count > k);
	const tracksRight = !isSummary(phase) && right >= 0;

	return (
		<Canvas columns={nums.length} height={210}>
			<RowLabel top={40}>
				<code>nums</code>
			</RowLabel>
			<RowLabel top={120} hidden={!counting}>
				zeros
				<br />
				since left
			</RowLabel>
			<ColumnMarker column={Math.max(0, right)} top={18} height={162} label="right" hidden={!tracksRight} />
			{nums.map((value, index) => (
				<Cell
					key={`nums-${index}`}
					value={value}
					column={index}
					top={24}
					tone={value === 0 && index >= left ? 'focus' : 'plain'}
					dimmed={index < left}
				/>
			))}
			{nums.map((_, index) => (
				<SubLabel key={`index-${index}`} column={index} top={82}>
					i = {index}
				</SubLabel>
			))}
			{zerosSinceLeft.map((count, index) => (
				<Cell
					key={`count-${index}`}
					value={count}
					column={index}
					top={112}
					tone={count > k ? 'remove' : 'plain'}
					hidden={!counting || index < left}
				/>
			))}
			<Tag column={Math.max(0, firstOver)} top={186} tone="remove" hidden={!counting || firstOver < 0}>
				over k
			</Tag>
		</Canvas>
	);
}

export default defineExplainer<FlipInput, WindowStep>({
	title: 'Longest window with at most k zeros',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'The window and its flips',
			subtitle: 'right grows the window; left shrinks it until it holds at most k zeros.',
			Scene: WindowScene,
		},
		{
			title: 'Why left only moves forward',
			subtitle: 'Zeros counted from left to each later index. The count never drops, so once it passes k, every longer window fails too.',
			Scene: HorizonScene,
		},
	],
	examples: [
		{ input: { nums: [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], k: 2 }, note: 'LeetCode example 1' },
		{ input: { nums: [1, 1, 0, 1, 1, 1, 0, 1], k: 0 }, note: 'k = 0: plain runs of 1s' },
		{ input: { nums: [0, 1, 0, 1, 1], k: 2 }, note: 'Enough flips for every zero' },
	],
	fields: [
		{ name: 'nums', label: 'Your own array', placeholder: 'e.g. 1, 0, 1, 1, 0' },
		{ name: 'k', label: 'k', placeholder: '1' },
	],
	describe: ({ nums, k }) => `[${nums.join(', ')}], k = ${k}`,
	parse(values) {
		const parts = values.nums.split(/[\s,]+/).filter(Boolean);
		const nums = parts.map(Number);
		const k = Number(values.k);
		if (!parts.length) return { error: 'Enter 0s and 1s separated by commas or spaces.' };
		if (nums.some((value) => value !== 0 && value !== 1)) return { error: 'Use only 0 and 1, for example 1, 0, 1, 1, 0.' };
		if (nums.length > MAX_VALUES) return { error: `Use ${MAX_VALUES} values or fewer so everything fits on screen.` };
		if (values.k === '' || !Number.isInteger(k) || k < 0 || k > nums.length) return { error: `Enter k as a whole number from 0 to ${nums.length}.` };
		return { input: { nums, k } };
	},
	steps: buildSteps,
});
