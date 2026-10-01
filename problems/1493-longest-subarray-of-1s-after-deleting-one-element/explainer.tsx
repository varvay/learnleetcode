import { Canvas, Cell, Frame, RowLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface DeleteInput {
	nums: number[];
}

type Phase = 'goal' | 'grow' | 'overflow' | 'shrink' | 'done';

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

type WindowSceneProps = SceneProps<DeleteInput, WindowStep>;

const MAX_VALUES = 11;

const LINE_INIT = 3;
const LINE_FOR = 5;
const LINE_ZERO_CHECK = 6;
const LINE_COUNT_ZERO = 7;
const LINE_OVER_BUDGET = 9;
const LINE_LEAVING_CHECK = 10;
const LINE_DROP_ZERO = 11;
const LINE_ADVANCE_LEFT = 12;
const LINE_RECORD = 14;
const LINE_RETURN = 16;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const spanEnd = (span: Span) => span.start + span.length;
const spanText = (span: Span) => `indices ${span.start} to ${spanEnd(span) - 1}`;
const scoreOf = (span: Span) => Math.max(0, span.length - 1);
const isSummary = (phase: Phase) => phase === 'goal' || phase === 'done';
const shownWindow = ({ phase, left, right, best }: WindowStep): Span =>
	isSummary(phase) ? best : { start: left, length: right - left + 1 };

function zeroIndices(nums: number[], span: Span): number[] {
	const indices: number[] = [];
	for (let index = span.start; index < spanEnd(span); index++) if (nums[index] === 0) indices.push(index);
	return indices;
}

const deletedIndex = (nums: number[], span: Span) => zeroIndices(nums, span)[0] ?? span.start;

function buildSteps({ nums }: DeleteInput): WindowStep[] {
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
		readout: { zeros, window: right - left + 1, 'after delete': zeros <= 1 ? right - left : '–', best: scoreOf(best) },
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
	const deletion = (right: number) =>
		zeros === 1
			? `Deleting it leaves a run of length <b>${right - left}</b>.`
			: `One element must still go, which leaves length <b>${right - left}</b>.`;

	for (let right = 0; right < nums.length; right++) {
		const enteringZero = nums[right] === 0;
		if (enteringZero) zeros++;
		const growLines = enteringZero ? [LINE_FOR, LINE_ZERO_CHECK, LINE_COUNT_ZERO] : [LINE_FOR, LINE_ZERO_CHECK];

		if (zeros <= 1) {
			const improved = record(right);
			const window = { start: left, length: right - left + 1 };
			loopSteps.push(
				snapshot(
					'grow',
					right,
					-1,
					[...growLines, LINE_RECORD],
					`<code>right = ${right}</code> brings in ${enteringZero ? 'a zero' : 'a 1'}. The window, ${spanText(window)}, holds ${zeros === 1 ? 'one zero' : 'no zero'}. ` +
						deletion(right) +
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
				`<code>right = ${right}</code> brings in a second zero. One deletion can't remove both, so left moves forward until the window holds one zero again.`,
			),
		);

		while (zeros > 1) {
			const leavingIndex = left;
			const droppedZero = nums[leavingIndex] === 0;
			if (droppedZero) zeros--;
			left++;
			const backInBudget = zeros <= 1;
			const improved = backInBudget && record(right);
			const window = { start: left, length: right - left + 1 };
			const outcome = backInBudget
				? ` The window, ${spanText(window)}, is back to one zero. ` + deletion(right) + newBest(improved)
				: ` Still two zeros, so left keeps moving.`;
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

	const bestZero = zeroIndices(nums, best)[0];
	const goalDeletion = bestZero === undefined ? 'one of its 1\'s' : `its zero at index ${bestZero}`;
	const initial: Omit<WindowStep, 'highlightedLines' | 'narration'> = {
		phase: 'goal',
		left: 0,
		right: -1,
		leavingIndex: -1,
		best,
		readout: { zeros: 0, window: 0, 'after delete': '–', best: 0 },
	};

	return [
		{
			...initial,
			highlightedLines: [LINE_INIT],
			narration: `Deleting one element leaves all 1's exactly when the subarray holds at most one zero. So the answer is the longest such window, minus the element deleted. Here it is ${spanText(best)}: deleting ${goalDeletion} leaves <b>${scoreOf(best)}</b>.`,
		},
		...loopSteps,
		snapshot(
			'done',
			nums.length - 1,
			-1,
			[LINE_RETURN],
			`right has reached the end. The longest window with at most one zero is ${spanText(best)}, so the answer is its length minus 1: <b>${scoreOf(best)}</b>.`,
		),
	];
}

function WindowScene({ input: { nums }, step }: WindowSceneProps) {
	const { phase, left, right, leavingIndex } = step;
	const window = shownWindow(step);
	const inWindow = (index: number) => index >= window.start && index < spanEnd(window);
	const deleted = deletedIndex(nums, window);
	const afterColumn = (index: number) => (index > deleted ? index - 1 : index);
	const showsPointers = !isSummary(phase);

	return (
		<Canvas columns={nums.length} height={220}>
			<Frame startColumn={window.start} columns={window.length} top={30} label={`window, ${plural(zeroIndices(nums, window).length, 'zero')}`} />
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
						tone={entering ? 'add' : leaving ? 'remove' : index === deleted && inWindow(index) ? 'focus' : 'plain'}
						dimmed={!leaving && !inWindow(index)}
					/>
				);
			})}
			<RowLabel top={144}>
				after
				<br />
				delete
			</RowLabel>
			{nums.map((value, index) => {
				const kept = inWindow(index) && index !== deleted;
				return (
					<Cell
						key={`after-${index}`}
						value={value}
						column={kept ? afterColumn(index) : index}
						top={128}
						tone={value === 0 ? 'remove' : 'plain'}
						hidden={!kept}
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

export default defineExplainer<DeleteInput, WindowStep>({
	title: 'Longest window with at most one zero',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'The window and its deletion',
			subtitle: 'right grows the window; left shrinks it until it holds at most one zero. Teal marks the element deleted, and the row below closes the gap.',
			Scene: WindowScene,
		},
	],
	examples: [
		{ input: { nums: [0, 1, 1, 1, 0, 1, 1, 0, 1] }, note: 'LeetCode example 2' },
		{ input: { nums: [1, 1, 0, 1] }, note: 'LeetCode example 1' },
		{ input: { nums: [1, 1, 1] }, note: 'No zero: a 1 still goes' },
	],
	fields: [{ name: 'nums', label: 'Your own array', placeholder: 'e.g. 1, 0, 1, 1, 0' }],
	describe: ({ nums }) => `[${nums.join(', ')}]`,
	parse(values) {
		const parts = values.nums.split(/[\s,]+/).filter(Boolean);
		const nums = parts.map(Number);
		if (!parts.length) return { error: 'Enter 0s and 1s separated by commas or spaces.' };
		if (nums.some((value) => value !== 0 && value !== 1)) return { error: 'Use only 0 and 1, for example 1, 0, 1, 1, 0.' };
		if (nums.length > MAX_VALUES) return { error: `Use ${MAX_VALUES} values or fewer so everything fits on screen.` };
		return { input: { nums } };
	},
	steps: buildSteps,
});
