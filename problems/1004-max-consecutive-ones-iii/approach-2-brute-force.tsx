import { Canvas, Cell, Frame, RowLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface FlipInput {
	nums: number[];
	k: number;
}

type Phase = 'intro' | 'scan' | 'insight';

interface Scan {
	start: number;
	lastRead: number;
	overBudgetIndex: number;
	longest: number;
}

interface ScanStep extends Step {
	phase: Phase;
	scan: Scan;
	readCounts: number[];
	best: Scan;
}

type ScanSceneProps = SceneProps<FlipInput, ScanStep>;

const MAX_VALUES = 11;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function scanFrom(nums: number[], k: number, start: number): Scan {
	let zeros = 0;
	for (let end = start; end < nums.length; end++) {
		if (nums[end] === 0) zeros++;
		if (zeros > k) return { start, lastRead: end, overBudgetIndex: end, longest: end - start };
	}
	return { start, lastRead: nums.length - 1, overBudgetIndex: -1, longest: nums.length - start };
}

function slidingWindowReads(nums: number[], k: number): number {
	let left = 0;
	let zeros = 0;
	for (const num of nums) {
		if (num === 0) zeros++;
		while (zeros > k) {
			if (nums[left] === 0) zeros--;
			left++;
		}
	}
	return nums.length + left;
}

function buildSteps({ nums, k }: FlipInput): ScanStep[] {
	const noScan: Scan = { start: 0, lastRead: -1, overBudgetIndex: -1, longest: 0 };
	const steps: ScanStep[] = [
		{
			phase: 'intro',
			scan: noScan,
			readCounts: nums.map(() => 0),
			best: noScan,
			readout: { start: '–', longest: 0, best: 0, reads: 0 },
			narration: `The first idea: try every start. From each start, move the end right and count zeros until the window holds k + 1 = ${k + 1}. The window just before that is the longest one from this start. The second row counts how often each index gets read.`,
		},
	];

	let readCounts = nums.map(() => 0);
	let best = noScan;
	let previous: Scan | undefined;
	for (let start = 0; start < nums.length; start++) {
		const scan = scanFrom(nums, k, start);
		readCounts = readCounts.map((count, index) => (index >= start && index <= scan.lastRead ? count + 1 : count));
		const improved = scan.longest > best.longest;
		if (improved) best = scan;
		const reread = previous ? Math.max(0, previous.lastRead - start + 1) : 0;
		const stopText =
			scan.overBudgetIndex >= 0
				? `stops at index ${scan.overBudgetIndex}, where the window reaches ${plural(k + 1, 'zero')}`
				: `runs to the last index without passing k`;
		steps.push({
			phase: 'scan',
			scan,
			readCounts,
			best,
			readout: { start, longest: scan.longest, best: best.longest, reads: sum(readCounts) },
			narration:
				`Start ${start}: the end ${stopText}. Longest window from here: <b>${scan.longest}</b>.` +
				(improved ? ` That's a new best.` : ``) +
				(reread > 0 ? ` ${plural(reread, 'cell')} of this scan ${reread === 1 ? 'was' : 'were'} already read by start ${start - 1}.` : ``),
		});
		previous = scan;
	}

	const bruteReads = sum(readCounts);
	steps.push({
		phase: 'insight',
		scan: best,
		readCounts,
		best,
		readout: { start: best.start, longest: best.longest, best: best.longest, reads: bruteReads },
		narration: `Brute force read <b>${bruteReads}</b> cells to find ${best.longest}, and ${bruteReads - nums.length} of those reads were repeats. When a start stops at index s, every index before s is known to fit, yet the next start reads them all again. Keep the end at s and drop only the start's cell instead, and each index is read at most twice, once entering and once leaving: <b>${slidingWindowReads(nums, k)}</b> reads here. That is the sliding window below.`,
	});
	return steps;
}

function ScanScene({ input: { nums }, step: { phase, scan, readCounts, best } }: ScanSceneProps) {
	const scanning = phase === 'scan';
	const window = phase === 'insight' ? best : scan;
	const inWindow = (index: number) => index >= window.start && index < window.start + window.longest;
	const readThisStep = (index: number) => scanning && index >= scan.start && index <= scan.lastRead;

	return (
		<Canvas columns={nums.length} height={200}>
			<Frame
				startColumn={window.start}
				columns={window.longest}
				top={30}
				label={phase === 'intro' ? 'start 0' : phase === 'insight' ? `best window, ${best.longest}` : `from start ${scan.start}: ${scan.longest}`}
			/>
			<RowLabel top={54}>
				<code>nums</code>
			</RowLabel>
			{nums.map((value, index) => (
				<Cell
					key={`nums-${index}`}
					value={value}
					column={index}
					top={38}
					tone={scanning && index === scan.overBudgetIndex ? 'remove' : readThisStep(index) ? 'focus' : 'plain'}
					dimmed={phase !== 'intro' && !inWindow(index) && !readThisStep(index)}
				/>
			))}
			<Tag column={Math.max(0, scan.overBudgetIndex)} top={104} tone="remove" hidden={!scanning || scan.overBudgetIndex < 0}>
				over k
			</Tag>
			<RowLabel top={144}>
				times
				<br />
				read
			</RowLabel>
			{readCounts.map((count, index) => (
				<Cell key={`reads-${index}`} value={count} column={index} top={136} tone={readThisStep(index) ? 'focus' : 'plain'} />
			))}
		</Canvas>
	);
}

export default defineExplainer<FlipInput, ScanStep>({
	title: 'Brute force, and the work it repeats',
	stages: [
		{
			title: 'Every start, scanned from scratch',
			subtitle: 'Teal cells are read in this step; the bottom row counts every read so far.',
			Scene: ScanScene,
		},
	],
	examples: [
		{ input: { nums: [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], k: 2 }, note: 'LeetCode example 1' },
		{ input: { nums: [1, 1, 1, 1, 1, 1, 1, 1], k: 1 }, note: 'No zeros: every start reads to the end' },
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
