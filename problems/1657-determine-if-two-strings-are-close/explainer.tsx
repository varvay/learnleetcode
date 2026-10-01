import { Fragment } from 'react';
import { Canvas, Cell, RowLabel, SubLabel } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface WordsInput {
	word1: string;
	word2: string;
}

type Side = 1 | 2;
type Phase = 'start' | 'length' | 'count' | 'tally' | 'letters' | 'counts' | 'done';

interface Progress {
	counted: Record<Side, number>;
	tallied: Record<Side, number>;
}

interface CloseStep extends Step {
	phase: Phase;
	side: Side | null;
	progress: Progress;
	letter: string | null;
	count: number | null;
	passed: boolean;
}

type CloseSceneProps = SceneProps<WordsInput, CloseStep>;

interface SideLines {
	countLoop: number;
	countNewCheck: number;
	countFirst: number;
	countElse: number;
	countIncrement: number;
	tallyLoop: number;
	tallyNewCheck: number;
	tallyFirst: number;
	tallyElse: number;
	tallyIncrement: number;
	lettersLoop: number;
	lettersCheck: number;
	lettersFail: number;
	countsLoop: number;
	countsMissingCheck: number;
	countsMissingFail: number;
	countsDifferCheck: number;
	countsDifferFail: number;
}

const MAX_LETTERS = 10;

const LINE_LENGTH_CHECK = 3;
const LINE_LENGTH_FAIL = 4;
const LINE_D_MAPS = 6;
const LINE_C_MAPS = 7;
const LINE_RETURN_TRUE = 53;

const LINES: Record<Side, SideLines> = {
	1: {
		countLoop: 9,
		countNewCheck: 10,
		countFirst: 11,
		countElse: 12,
		countIncrement: 13,
		tallyLoop: 21,
		tallyNewCheck: 22,
		tallyFirst: 23,
		tallyElse: 24,
		tallyIncrement: 25,
		lettersLoop: 33,
		lettersCheck: 34,
		lettersFail: 35,
		countsLoop: 41,
		countsMissingCheck: 42,
		countsMissingFail: 43,
		countsDifferCheck: 44,
		countsDifferFail: 45,
	},
	2: {
		countLoop: 15,
		countNewCheck: 16,
		countFirst: 17,
		countElse: 18,
		countIncrement: 19,
		tallyLoop: 27,
		tallyNewCheck: 28,
		tallyFirst: 29,
		tallyElse: 30,
		tallyIncrement: 31,
		lettersLoop: 37,
		lettersCheck: 38,
		lettersFail: 39,
		countsLoop: 47,
		countsMissingCheck: 48,
		countsMissingFail: 49,
		countsDifferCheck: 50,
		countsDifferFail: 51,
	},
};

const SIDES: Side[] = [1, 2];
const otherSide = (side: Side): Side => (side === 1 ? 2 : 1);
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const times = (count: number) => (count === 1 ? 'once' : count === 2 ? 'twice' : `${count} times`);
const lettersAppear = (letters: number) => (letters === 1 ? 'one letter appears' : `${letters} letters appear`);

function letterCounts(word: string): Map<string, number> {
	const counts = new Map<string, number>();
	for (const letter of word) counts.set(letter, (counts.get(letter) ?? 0) + 1);
	return counts;
}

function countTally(counts: Map<string, number>, tallied: number): Map<number, number> {
	const tally = new Map<number, number>();
	for (const count of [...counts.values()].slice(0, tallied)) tally.set(count, (tally.get(count) ?? 0) + 1);
	return tally;
}

function buildSteps({ word1, word2 }: WordsInput): CloseStep[] {
	const words: Record<Side, string> = { 1: word1, 2: word2 };
	const finalCounts: Record<Side, Map<string, number>> = { 1: letterCounts(word1), 2: letterCounts(word2) };
	const progress: Progress = { counted: { 1: 0, 2: 0 }, tallied: { 1: 0, 2: 0 } };
	const steps: CloseStep[] = [];

	const push = (phase: Phase, side: Side | null, letter: string | null, count: number | null, passed: boolean, highlightedLines: number[], narration: string) =>
		steps.push({
			phase,
			side,
			progress: { counted: { ...progress.counted }, tallied: { ...progress.tallied } },
			letter,
			count,
			passed,
			readout: {
				'd1 keys': letterCounts(word1.slice(0, progress.counted[1])).size,
				'd2 keys': letterCounts(word2.slice(0, progress.counted[2])).size,
				'c1 keys': countTally(finalCounts[1], progress.tallied[1]).size,
				'c2 keys': countTally(finalCounts[2], progress.tallied[2]).size,
			},
			highlightedLines,
			narration,
		});

	if (word1.length !== word2.length) {
		push('length', null, null, null, false, [LINE_LENGTH_CHECK, LINE_LENGTH_FAIL], `word1 has ${plural(word1.length, 'letter')} and word2 has ${plural(word2.length, 'letter')}. Neither operation changes a word's length, so the function returns <b>False</b> before counting anything.`);
		return steps;
	}
	push(
		'start',
		null,
		null,
		null,
		true,
		[LINE_LENGTH_CHECK, LINE_D_MAPS, LINE_C_MAPS],
		`Both words have ${plural(word1.length, 'letter')}, so the length check passes. <code>d1</code> and <code>d2</code> will count each letter; <code>c1</code> and <code>c2</code> will count how many letters share each count.`,
	);

	for (const side of SIDES) {
		const lines = LINES[side];
		[...words[side]].forEach((letter, index) => {
			progress.counted[side]++;
			const count = letterCounts(words[side].slice(0, index + 1)).get(letter)!;
			push(
				'count',
				side,
				letter,
				count,
				true,
				count === 1 ? [lines.countLoop, lines.countNewCheck, lines.countFirst] : [lines.countLoop, lines.countNewCheck, lines.countElse, lines.countIncrement],
				count === 1 ? `'${letter}' is new: <code>d${side}['${letter}'] = 1</code>.` : `'${letter}' again: <code>d${side}['${letter}']</code> becomes ${count}.`,
			);
		});
	}

	for (const side of SIDES) {
		const lines = LINES[side];
		[...finalCounts[side]].forEach(([letter, count]) => {
			progress.tallied[side]++;
			const sharing = countTally(finalCounts[side], progress.tallied[side]).get(count)!;
			push(
				'tally',
				side,
				letter,
				count,
				true,
				sharing === 1 ? [lines.tallyLoop, lines.tallyNewCheck, lines.tallyFirst] : [lines.tallyLoop, lines.tallyNewCheck, lines.tallyElse, lines.tallyIncrement],
				sharing === 1
					? `'${letter}' appears ${times(count)}. No earlier letter of word${side} did, so <code>c${side}[${count}] = 1</code>.`
					: `'${letter}' also appears ${times(count)}, so <code>c${side}[${count}]</code> becomes ${sharing}.`,
			);
		});
	}

	for (const side of SIDES) {
		const lines = LINES[side];
		const other = otherSide(side);
		const missing = [...finalCounts[side].keys()].find((letter) => !finalCounts[other].has(letter));
		if (missing !== undefined) {
			push('letters', side, missing, null, false, [lines.lettersLoop, lines.lettersCheck, lines.lettersFail], `'${missing}' is in word${side} but not in word${other}. Neither operation can create a letter, so the function returns <b>False</b>.`);
			return steps;
		}
		push('letters', side, null, null, true, [lines.lettersLoop, lines.lettersCheck], `Every letter of word${side} also appears in word${other}.`);
	}

	const tallies: Record<Side, Map<number, number>> = { 1: countTally(finalCounts[1], finalCounts[1].size), 2: countTally(finalCounts[2], finalCounts[2].size) };
	for (const side of SIDES) {
		const lines = LINES[side];
		const other = otherSide(side);
		for (const [count, letters] of tallies[side]) {
			const otherLetters = tallies[other].get(count);
			if (otherLetters === undefined) {
				push(
					'counts',
					side,
					null,
					count,
					false,
					[lines.countsLoop, lines.countsMissingCheck, lines.countsMissingFail],
					`In word${side}, ${lettersAppear(letters)} ${times(count)}, but no letter of word${other} does. The count patterns differ, so the function returns <b>False</b>.`,
				);
				return steps;
			}
			if (otherLetters !== letters) {
				push(
					'counts',
					side,
					null,
					count,
					false,
					[lines.countsLoop, lines.countsMissingCheck, lines.countsDifferCheck, lines.countsDifferFail],
					`In word${side}, ${lettersAppear(letters)} ${times(count)}; in word${other}, ${otherLetters === 1 ? 'one does' : `${otherLetters} do`}. The count patterns differ, so the function returns <b>False</b>.`,
				);
				return steps;
			}
		}
		push('counts', side, null, null, true, [lines.countsLoop, lines.countsMissingCheck, lines.countsDifferCheck], `Every count in <code>c${side}</code> has the same number of letters in <code>c${other}</code>.`);
	}

	push('done', null, null, null, true, [LINE_RETURN_TRUE], `Same letters and the same count pattern, so the function returns <b>True</b>.`);
	return steps;
}

const WORD_TOP: Record<Side, number> = { 1: 30, 2: 210 };
const LETTER_COUNT_TOP: Record<Side, number> = { 1: 110, 2: 290 };

function LettersScene({ input: { word1, word2 }, step }: CloseSceneProps) {
	const words: Record<Side, string> = { 1: word1, 2: word2 };
	const { phase, side: activeSide, letter: activeLetter, passed, progress } = step;

	return (
		<Canvas columns={Math.max(word1.length, word2.length)} height={380}>
			{SIDES.map((side) => {
				const word = words[side];
				const counted = progress.counted[side];
				const counts = letterCounts(word.slice(0, counted));
				const letters = [...letterCounts(word).keys()];
				const active = activeSide === side;
				const letterTone = (letter: string) => {
					if (phase === 'letters' && active) return passed ? 'add' : letter === activeLetter ? 'remove' : 'plain';
					if (!active || letter !== activeLetter) return 'plain';
					if (phase === 'count') return counts.get(letter) === 1 ? 'add' : 'focus';
					return phase === 'tally' ? 'focus' : 'plain';
				};
				return (
					<Fragment key={`letters-${side}`}>
						<RowLabel top={WORD_TOP[side] + 16}>
							<code>word{side}</code>
						</RowLabel>
						{[...word].map((letter, column) => (
							<Cell
								key={`word${side}-${column}`}
								value={letter}
								column={column}
								top={WORD_TOP[side]}
								tone={phase === 'count' && active && column === counted - 1 ? 'focus' : 'plain'}
								dimmed={column >= counted}
							/>
						))}
						<RowLabel top={LETTER_COUNT_TOP[side] + 16}>
							<code>d{side}</code>
						</RowLabel>
						{letters.map((letter, column) => (
							<Cell
								key={`d${side}-${letter}`}
								value={counts.get(letter) ?? 0}
								column={column}
								top={LETTER_COUNT_TOP[side]}
								tone={letterTone(letter)}
								hidden={!counts.has(letter)}
							/>
						))}
						{letters.map((letter, column) => (
							<SubLabel key={`d${side}-label-${letter}`} column={column} top={LETTER_COUNT_TOP[side] + 58} hidden={!counts.has(letter)}>
								'{letter}'
							</SubLabel>
						))}
					</Fragment>
				);
			})}
		</Canvas>
	);
}

const TALLY_TOP: Record<Side, number> = { 1: 30, 2: 110 };

function CountsScene({ input: { word1, word2 }, step }: CloseSceneProps) {
	const finalCounts: Record<Side, Map<string, number>> = { 1: letterCounts(word1), 2: letterCounts(word2) };
	const columns = [...new Set([...finalCounts[1].values(), ...finalCounts[2].values()])].sort((a, b) => a - b);
	const { phase, side: activeSide, count: activeCount, passed, progress } = step;

	return (
		<Canvas columns={columns.length} height={180}>
			{columns.map((count, column) => (
				<SubLabel key={`header-${count}`} column={column} top={6}>
					{times(count)}
				</SubLabel>
			))}
			{SIDES.map((side) => {
				const tally = countTally(finalCounts[side], progress.tallied[side]);
				const active = activeSide === side;
				const tallyTone = (count: number) => {
					if (phase === 'counts') return !passed && count === activeCount ? 'remove' : passed && active ? 'add' : 'plain';
					if (phase !== 'tally' || !active || count !== activeCount) return 'plain';
					return tally.get(count) === 1 ? 'add' : 'focus';
				};
				return (
					<Fragment key={`tally-${side}`}>
						<RowLabel top={TALLY_TOP[side] + 16}>
							<code>c{side}</code>
						</RowLabel>
						{columns.map((count, column) => (
							<Cell key={`c${side}-${count}`} value={tally.get(count) ?? 0} column={column} top={TALLY_TOP[side]} tone={tallyTone(count)} hidden={!tally.has(count)} />
						))}
					</Fragment>
				);
			})}
		</Canvas>
	);
}

export default defineExplainer<WordsInput, CloseStep>({
	title: 'Same letters, same count pattern',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'Count each letter',
			subtitle: 'd1 and d2 map each letter to how often it appears. Red marks a letter the other word lacks.',
			Scene: LettersScene,
		},
		{
			title: 'Count the counts',
			subtitle: 'c1 and c2 map each count to how many letters have it, lined up by count. Matching columns mean the same pattern; red marks the first mismatch.',
			Scene: CountsScene,
		},
	],
	examples: [
		{ input: { word1: 'cabbba', word2: 'abbccc' }, note: 'LeetCode example 3: close' },
		{ input: { word1: 'abc', word2: 'bca' }, note: 'LeetCode example 1: close' },
		{ input: { word1: 'a', word2: 'aa' }, note: 'LeetCode example 2: lengths differ' },
		{ input: { word1: 'abb', word2: 'cdd' }, note: 'Same pattern, different letters' },
		{ input: { word1: 'aaabbc', word2: 'aabbcc' }, note: 'Same letters, different pattern' },
	],
	fields: [
		{ name: 'word1', label: 'word1', placeholder: 'e.g. cabbba' },
		{ name: 'word2', label: 'word2', placeholder: 'e.g. abbccc' },
	],
	describe: ({ word1, word2 }) => `"${word1}" and "${word2}"`,
	parse(values) {
		const word1 = values.word1.trim();
		const word2 = values.word2.trim();
		if (!word1 || !word2) return { error: 'Enter both words.' };
		if (!/^[a-z]+$/.test(word1) || !/^[a-z]+$/.test(word2)) return { error: 'Use only lowercase letters a to z.' };
		if (word1.length > MAX_LETTERS || word2.length > MAX_LETTERS) return { error: `Use ${MAX_LETTERS} letters or fewer per word so everything fits on screen.` };
		return { input: { word1, word2 } };
	},
	steps: buildSteps,
});
