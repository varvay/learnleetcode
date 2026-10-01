import { Canvas, Cell, RowLabel, SubLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface AltitudeInput {
	gain: number[];
}

type Phase = 'start' | 'climb' | 'done';

interface ClimbStep extends Step {
	phase: Phase;
	point: number;
	highestPoint: number;
}

type ClimbSceneProps = SceneProps<AltitudeInput, ClimbStep>;

const MAX_VALUES = 9;
const MIN_GAIN = -100;
const MAX_GAIN = 100;

const PROFILE_TOP = 26;
const PROFILE_DEPTH = 130;
const GAIN_TOP = 250;

const LINE_INIT = 3;
const LINE_FOR = 4;
const LINE_ADD_GAIN = 5;
const LINE_KEEP_HIGHEST = 6;
const LINE_RETURN = 7;

const withMinus = (value: number) => (value < 0 ? `−${-value}` : `${value}`);
const signed = (value: number) => (value > 0 ? `+${value}` : withMinus(value));

function altitudesOf(gain: number[]): number[] {
	const altitudes = [0];
	for (const g of gain) altitudes.push(altitudes[altitudes.length - 1] + g);
	return altitudes;
}

function buildSteps({ gain }: AltitudeInput): ClimbStep[] {
	const altitudes = altitudesOf(gain);
	let highestPoint = 0;

	const steps: ClimbStep[] = [
		{
			phase: 'start',
			point: 0,
			highestPoint,
			readout: { point: 0, altitude: 0, highest: 0 },
			highlightedLines: [LINE_INIT],
			narration: `The biker starts at point 0, altitude 0. Each gain is the climb or drop to the next point, so <code>s</code> tracks the altitude and <code>m</code> the highest one seen. Both start at 0, because point 0 counts.`,
		},
	];

	gain.forEach((g, index) => {
		const point = index + 1;
		const previousHighest = altitudes[highestPoint];
		const altitude = altitudes[point];
		const climbsHigher = altitude > previousHighest;
		if (climbsHigher) highestPoint = point;
		steps.push({
			phase: 'climb',
			point,
			highestPoint,
			readout: { point, altitude: withMinus(altitude), highest: altitudes[highestPoint] },
			highlightedLines: [LINE_FOR, LINE_ADD_GAIN, LINE_KEEP_HIGHEST],
			narration:
				`Point ${point}: <code>s</code> = ${withMinus(altitudes[index])} ${g < 0 ? '−' : '+'} ${Math.abs(g)} = <b>${withMinus(altitude)}</b>.` +
				(climbsHigher ? ` That's above ${previousHighest}, so <code>m</code> becomes ${altitude}.` : ` Not above <code>m</code> = ${previousHighest}, so <code>m</code> stays.`),
		});
	});

	const highest = altitudes[highestPoint];
	steps.push({
		phase: 'done',
		point: gain.length,
		highestPoint,
		readout: { point: gain.length, altitude: withMinus(altitudes[gain.length]), highest },
		highlightedLines: [LINE_RETURN],
		narration:
			highestPoint === 0
				? `Every point after the start is lower or level, so the highest altitude is the start's: <b>0</b>.`
				: `Every point is visited. The highest altitude is <b>${highest}</b>, first reached at point ${highestPoint}.`,
	});
	return steps;
}

function ClimbScene({ input: { gain }, step: { phase, point, highestPoint } }: ClimbSceneProps) {
	const altitudes = altitudesOf(gain);
	const lowest = Math.min(...altitudes);
	const range = Math.max(1, Math.max(...altitudes) - lowest);
	const topOf = (altitude: number) => PROFILE_TOP + ((Math.max(...altitudes) - altitude) / range) * PROFILE_DEPTH;
	const reached = (index: number) => index <= point;

	return (
		<Canvas columns={altitudes.length} height={314}>
			<RowLabel top={PROFILE_TOP + PROFILE_DEPTH / 2 + 16}>altitude</RowLabel>
			<Tag column={highestPoint} top={topOf(altitudes[highestPoint]) - 24} tone="add">
				highest
			</Tag>
			{altitudes.map((altitude, index) => (
				<Cell
					key={`altitude-${index}`}
					value={withMinus(altitude)}
					column={index}
					top={topOf(altitude)}
					tone={phase === 'climb' && index === point ? 'add' : index === highestPoint ? 'focus' : 'plain'}
					hidden={!reached(index)}
				/>
			))}
			{altitudes.map((_, index) => (
				<SubLabel key={`point-${index}`} column={index} top={GAIN_TOP - 26}>
					point {index}
				</SubLabel>
			))}
			<RowLabel top={GAIN_TOP + 16}>
				<code>gain</code>
			</RowLabel>
			{gain.map((g, index) => (
				<Cell
					key={`gain-${index}`}
					value={signed(g)}
					column={index + 0.5}
					top={GAIN_TOP}
					tone={phase === 'climb' && index === point - 1 ? 'add' : 'plain'}
					dimmed={index >= point}
				/>
			))}
		</Canvas>
	);
}

export default defineExplainer<AltitudeInput, ClimbStep>({
	title: 'Altitude as a running sum',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'The climb, point by point',
			subtitle: 'Each gain sits between the two points it connects. Points rise and fall with their altitude; teal marks the highest so far.',
			Scene: ClimbScene,
		},
	],
	examples: [
		{ input: { gain: [-5, 1, 5, 0, -7] }, note: 'LeetCode example 1' },
		{ input: { gain: [-4, -3, -2, -1, 4, 3, 2] }, note: 'LeetCode example 2: the start is highest' },
		{ input: { gain: [2, -1, 3, -4, 1] }, note: 'Two peaks' },
	],
	fields: [{ name: 'gain', label: 'Your own gains', placeholder: 'e.g. 3, -1, 2, -5' }],
	describe: ({ gain }) => `[${gain.join(', ')}]`,
	parse(values) {
		const parts = values.gain.split(/[\s,]+/).filter(Boolean);
		const gain = parts.map(Number);
		if (!parts.length) return { error: 'Enter whole numbers separated by commas or spaces.' };
		if (gain.some((value) => !Number.isInteger(value) || value < MIN_GAIN || value > MAX_GAIN)) return { error: `Use whole numbers from ${MIN_GAIN} to ${MAX_GAIN}.` };
		if (gain.length > MAX_VALUES) return { error: `Use ${MAX_VALUES} values or fewer so everything fits on screen.` };
		return { input: { gain } };
	},
	steps: buildSteps,
});
