import { Canvas, Cell, RowLabel, SubLabel, Tag } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface StarsInput {
	s: string;
}

type Phase = 'start' | 'push' | 'pop' | 'done';

interface StackStep extends Step {
	phase: Phase;
	read: number;
}

type StackSceneProps = SceneProps<StarsInput, StackStep>;

interface Trace {
	stack: number[];
	slotOf: Map<number, number>;
	poppedBy: Map<number, number>;
}

const MAX_LENGTH = 12;
const S_TOP = 30;
const STACK_TOP = 130;

const LINE_STACK = 3;
const LINE_FOR = 5;
const LINE_STAR_CHECK = 6;
const LINE_POP = 7;
const LINE_ELSE = 8;
const LINE_PUSH = 9;
const LINE_RETURN = 11;

function traceOf(s: string, read: number): Trace {
	const stack: number[] = [];
	const slotOf = new Map<number, number>();
	const poppedBy = new Map<number, number>();
	[...s].slice(0, read).forEach((token, index) => {
		if (token === '*') poppedBy.set(stack.pop()!, index);
		else {
			slotOf.set(index, stack.length);
			stack.push(index);
		}
	});
	return { stack, slotOf, poppedBy };
}

const lettersOf = (s: string, indices: number[]) => indices.map((index) => s[index]);
const stackText = (s: string, indices: number[]) => `[${lettersOf(s, indices).map((letter) => `'${letter}'`).join(', ')}]`;

function buildSteps({ s }: StarsInput): StackStep[] {
	const steps: StackStep[] = [
		{
			phase: 'start',
			read: 0,
			readout: { token: '–', 'stack size': 0 },
			highlightedLines: [LINE_STACK],
			narration: `<code>stack</code> starts empty. The loop reads <code>s</code> one token at a time, left to right.`,
		},
	];

	[...s].forEach((token, index) => {
		const { stack, poppedBy } = traceOf(s, index + 1);
		if (token === '*') {
			const popped = [...poppedBy].find(([, star]) => star === index)![0];
			steps.push({
				phase: 'pop',
				read: index + 1,
				readout: { token: "'*'", 'stack size': stack.length },
				highlightedLines: [LINE_FOR, LINE_STAR_CHECK, LINE_POP],
				narration: `A star: <code>stack.pop()</code> removes the top, '${s[popped]}' from index ${popped}. It's the closest letter to the star's left that is still there. The stack is now ${stackText(s, stack)}.`,
			});
			return;
		}
		steps.push({
			phase: 'push',
			read: index + 1,
			readout: { token: `'${token}'`, 'stack size': stack.length },
			highlightedLines: [LINE_FOR, LINE_STAR_CHECK, LINE_ELSE, LINE_PUSH],
			narration: `'${token}' is a letter, so it goes on top of the stack: ${stackText(s, stack)}.`,
		});
	});

	const { stack } = traceOf(s, s.length);
	const result = lettersOf(s, stack).join('');
	steps.push({
		phase: 'done',
		read: s.length,
		readout: { token: '–', 'stack size': stack.length },
		highlightedLines: [LINE_RETURN],
		narration:
			stack.length > 0
				? `Every star has removed its letter. Read bottom to top, the stack is the answer: <code>"".join(stack)</code> gives <b>"${result}"</b>.`
				: `Every letter was removed by a star, so the stack is empty and the answer is <b>""</b>.`,
	});
	return steps;
}

function StackScene({ input: { s }, step: { phase, read } }: StackSceneProps) {
	const { stack, slotOf, poppedBy } = traceOf(s, read);
	const justRead = read - 1;
	const poppedNow = phase === 'pop' ? [...poppedBy].find(([, star]) => star === justRead)?.[0] : undefined;
	const top = stack.length > 0 ? slotOf.get(stack[stack.length - 1])! : -1;

	return (
		<Canvas columns={s.length} height={240}>
			{[...s].map((_, index) => (
				<SubLabel key={`index-${index}`} column={index} top={S_TOP - 22}>
					{index}
				</SubLabel>
			))}
			<RowLabel top={S_TOP + 16}>
				<code>s</code>
			</RowLabel>
			<RowLabel top={STACK_TOP + 16}>
				<code>stack</code>
			</RowLabel>
			{[...s].map((token, index) => {
				const unread = index >= read;
				if (token === '*') {
					return <Cell key={`token-${index}`} value="*" column={index} top={S_TOP} tone={index === justRead ? 'remove' : 'plain'} hidden={!unread && index !== justRead} />;
				}
				const slot = slotOf.get(index);
				const popped = poppedBy.has(index);
				const tone = index === poppedNow ? 'remove' : phase === 'done' && !popped ? 'focus' : index === justRead ? 'add' : 'plain';
				return (
					<Cell
						key={`token-${index}`}
						value={token}
						column={unread ? index : slot!}
						top={unread ? S_TOP : STACK_TOP}
						tone={tone}
						hidden={popped && index !== poppedNow}
					/>
				);
			})}
			<Tag column={Math.max(0, top)} top={STACK_TOP + 66} tone="add" hidden={top < 0 || phase === 'done'}>
				top
			</Tag>
		</Canvas>
	);
}

export default defineExplainer<StarsInput, StackStep>({
	title: 'Letters on a stack, stars pop them',
	codeFile: 'solution.py',
	stages: [
		{
			title: 's, read left to right',
			subtitle: 'A letter slides down onto the stack (green). A star pops the top: both turn red, then disappear.',
			Scene: StackScene,
		},
	],
	examples: [
		{ input: { s: 'leet**cod*e' }, note: 'LeetCode example 1' },
		{ input: { s: 'erase*****' }, note: 'LeetCode example 2: everything removed' },
		{ input: { s: 'ab*c**d' }, note: 'A star after a pop reaches further back' },
	],
	fields: [{ name: 's', label: 'Your own string', placeholder: 'e.g. ab*c**d' }],
	describe: ({ s }) => `"${s}"`,
	parse(values) {
		const s = values.s.trim();
		if (!s) return { error: 'Enter a string of lowercase letters and stars.' };
		if (!/^[a-z*]+$/.test(s)) return { error: 'Use only lowercase letters a to z and *.' };
		if (s.length > MAX_LENGTH) return { error: `Use ${MAX_LENGTH} characters or fewer so everything fits on screen.` };
		let letters = 0;
		for (const token of s) {
			letters += token === '*' ? -1 : 1;
			if (letters < 0) return { error: 'Each star needs a letter to its left to remove. Add a letter before it.' };
		}
		return { input: { s } };
	},
	steps: buildSteps,
});
