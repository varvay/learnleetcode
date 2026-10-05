import { Canvas, Cell, RowLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

type Party = 'R' | 'D';
type PartyCounts = Record<Party, number>;

interface SenateInput {
	senate: Party[];
}

type Phase = 'start' | 'vote' | 'out' | 'done';

interface TurnStep extends Step {
	phase: Phase;
	senator: number;
	queue: number[];
	banned: number[];
	bans: PartyCounts;
}

type TurnSceneProps = SceneProps<SenateInput, TurnStep>;

const MAX_SENATORS = 10;
const BANNED_TOP = 30;
const QUEUE_TOP = 150;

const LINES_INIT = [3, 4, 5];
const LINES_TURN = [7, 8, 9, 10];
const LINES_OUT = [11, 12];
const LINES_VOTE = [13, 14, 15];
const LINE_WHILE = 7;
const LINE_RETURN = 17;

const PARTIES: Party[] = ['R', 'D'];
const PARTY_NAME: Record<Party, string> = { R: 'Radiant', D: 'Dire' };

const rivalOf = (party: Party): Party => (party === 'R' ? 'D' : 'R');
const senatorName = (senate: Party[], index: number) => `${senate[index]}${index}`;
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const toSenate = (text: string) => text.toUpperCase().replace(/[\s,]+/g, '').split('');

const doomedIn = (senate: Party[], queue: number[], bans: PartyCounts) =>
	PARTIES.flatMap((party) => queue.filter((index) => senate[index] === party).slice(0, bans[party]));

function buildSteps({ senate }: SenateInput): TurnStep[] {
	const steps: TurnStep[] = [];
	const remaining: PartyCounts = { R: senate.filter((party) => party === 'R').length, D: senate.filter((party) => party === 'D').length };
	const bans: PartyCounts = { R: 0, D: 0 };
	const banned: number[] = [];
	let queue = senate.map((_, index) => index);

	const snapshot = (phase: Phase, senator: number, highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			senator,
			queue: [...queue],
			banned: [...banned],
			bans: { ...bans },
			readout: { 'bans R': bans.R, 'bans D': bans.D, 'remaining R': remaining.R, 'remaining D': remaining.D },
			highlightedLines,
			narration,
		});

	snapshot('start', -1, LINES_INIT, `<code>queue</code> holds the senators in voting order, front on the left. No bans are waiting yet.`);

	while (remaining.R > 0 && remaining.D > 0) {
		const [senator, ...rest] = queue;
		queue = rest;
		const party = senate[senator];
		const rival = rivalOf(party);
		const name = senatorName(senate, senator);

		if (bans[party] > 0) {
			bans[party] -= 1;
			remaining[party] -= 1;
			banned.push(senator);
			snapshot(
				'out',
				senator,
				[...LINES_TURN, ...LINES_OUT],
				`${name} is up, and a ban is waiting for ${PARTY_NAME[party]}, so ${name} loses their vote for good. ${PARTY_NAME[party]} has ${plural(remaining[party], 'senator')} left.`,
			);
			continue;
		}

		bans[rival] += 1;
		queue = [...queue, senator];
		const target = queue.filter((index) => senate[index] === rival)[bans[rival] - 1];
		const landing =
			target === undefined
				? `Every ${PARTY_NAME[rival]} senator left already has a ban waiting, so ${PARTY_NAME[rival]} is out of turns.`
				: `It will land on ${senatorName(senate, target)}.`;
		snapshot(
			'vote',
			senator,
			[...LINES_TURN, ...LINES_VOTE],
			`${name} is up with no ban waiting for ${PARTY_NAME[party]}, so ${name} votes to ban the next ${PARTY_NAME[rival]} senator to come up. ${landing} ${name} goes to the back for the next round.`,
		);
	}

	const winner: Party = remaining.R > 0 ? 'R' : 'D';
	snapshot('done', -1, [LINE_WHILE, LINE_RETURN], `${PARTY_NAME[rivalOf(winner)]} has no senators left, so the loop stops and the function returns <b>"${PARTY_NAME[winner]}"</b>.`);
	return steps;
}

function SenateScene({ input: { senate }, step: { phase, senator, queue, banned, bans } }: TurnSceneProps) {
	const doomed = phase === 'done' ? [] : doomedIn(senate, queue, bans);
	const toneOf = (index: number) => {
		if (index === senator) return phase === 'out' ? 'remove' : 'add';
		if (phase === 'done' && queue.includes(index)) return 'focus';
		return 'plain';
	};

	return (
		<Canvas columns={senate.length} height={250}>
			<RowLabel top={BANNED_TOP + 16}>banned</RowLabel>
			<RowLabel top={QUEUE_TOP + 16}>
				<code>queue</code>
			</RowLabel>
			{senate.map((_, index) => {
				const position = queue.indexOf(index);
				const inQueue = position >= 0;
				return (
					<Cell
						key={`senator-${index}`}
						value={senatorName(senate, index)}
						column={inQueue ? position : banned.indexOf(index)}
						top={inQueue ? QUEUE_TOP : BANNED_TOP}
						tone={toneOf(index)}
						dimmed={!inQueue && index !== senator}
					/>
				);
			})}
			{doomed.map((index) => (
				<Tag key={`doomed-${index}`} column={queue.indexOf(index)} top={QUEUE_TOP + 66} tone="remove">
					doomed
				</Tag>
			))}
		</Canvas>
	);
}

export default defineExplainer<SenateInput, TurnStep>({
	title: 'Bans wait for the next rival to come up',
	codeFile: 'solution-2-clean.py',
	stages: [
		{
			title: 'One turn at a time from the front of the queue',
			subtitle: 'Green is a senator who just voted and went to the back, red one just banned. A red tag marks a senator a waiting ban will remove when they come up.',
			Scene: SenateScene,
		},
	],
	examples: [
		{ input: { senate: ['R', 'D'] }, note: 'LeetCode example 1' },
		{ input: { senate: ['R', 'D', 'D'] }, note: 'LeetCode example 2' },
		{ input: { senate: ['R', 'D', 'R', 'D', 'D'] }, note: 'Radiant wins two against three' },
		{ input: { senate: ['R', 'R', 'D', 'D', 'D'] }, note: 'The trace in solution-1-original.py' },
	],
	fields: [{ name: 'senate', label: 'Your own senate', placeholder: 'e.g. RDRDD' }],
	describe: ({ senate }) => senate.join(''),
	parse(values) {
		const letters = toSenate(values.senate);
		if (!letters.length) return { error: 'Enter the senate as a string of R and D, e.g. RDRDD.' };
		if (letters.some((letter) => letter !== 'R' && letter !== 'D')) return { error: 'Use only R for Radiant and D for Dire.' };
		if (letters.length > MAX_SENATORS) return { error: `Use ${MAX_SENATORS} senators or fewer so everything fits on screen.` };
		return { input: { senate: letters as Party[] } };
	},
	steps: buildSteps,
});
