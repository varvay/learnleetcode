import { Canvas, Cell, RowLabel, SubLabel } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface DecodeInput {
	s: string;
}

type Phase = 'start' | 'digit' | 'open' | 'close' | 'letter' | 'done';

interface Frame {
	before: string;
	repeat: number;
}

interface DecodeStep extends Step {
	phase: Phase;
	index: number;
	k: number;
	current: string;
	stack: Frame[];
	popped: Frame | null;
}

type DecodeSceneProps = SceneProps<DecodeInput, DecodeStep>;

const MAX_INPUT = 16;
const MAX_OUTPUT = 16;
const MAX_DEPTH = 3;

const S_TOP = 30;
const K_TOP = 110;
const CURRENT_TOP = 180;
const STACK_TOP = 270;
const STACK_PITCH = 66;

const LINE_INIT = [4, 5, 6];
const LINE_FOR = 8;
const LINE_DIGIT_CHECK = 9;
const LINE_DIGIT = 10;
const LINE_OPEN_CHECK = 11;
const LINE_PUSH = 12;
const LINE_RESET = 13;
const LINE_CLOSE_CHECK = 14;
const LINE_POP = 15;
const LINE_ATTACH = 16;
const LINE_ELSE = 17;
const LINE_APPEND = 18;
const LINE_RETURN = 20;

const quoted = (text: string) => `"${text}"`;
const frameText = ({ before, repeat }: Frame) => `(${repeat}, ${quoted(before)})`;

function buildSteps({ s }: DecodeInput): DecodeStep[] {
	const steps: DecodeStep[] = [];
	const stack: Frame[] = [];
	let current = '';
	let k = 0;

	const snapshot = (phase: Phase, index: number, highlightedLines: number[], narration: string, popped: Frame | null = null) =>
		steps.push({
			phase,
			index,
			k,
			current,
			stack: stack.map((frame) => ({ ...frame })),
			popped,
			readout: { token: index >= 0 && index < s.length ? `'${s[index]}'` : '–', k, current: quoted(current), 'stack depth': stack.length },
			highlightedLines,
			narration,
		});

	snapshot('start', -1, LINE_INIT, `The stack starts empty, <code>current</code> is "", and <code>k</code> is 0. The loop reads <code>s</code> one character at a time.`);

	[...s].forEach((ch, index) => {
		if (ch >= '0' && ch <= '9') {
			const previous = k;
			k = k * 10 + Number(ch);
			snapshot(
				'digit',
				index,
				[LINE_FOR, LINE_DIGIT_CHECK, LINE_DIGIT],
				previous === 0 ? `'${ch}' is a digit: <code>k</code> = 0 × 10 + ${ch} = ${k}.` : `'${ch}' is another digit of the same count: <code>k</code> = ${previous} × 10 + ${ch} = ${k}.`,
			);
			return;
		}
		if (ch === '[') {
			const frame = { before: current, repeat: k };
			stack.push(frame);
			current = '';
			k = 0;
			snapshot(
				'open',
				index,
				[LINE_FOR, LINE_DIGIT_CHECK, LINE_OPEN_CHECK, LINE_PUSH, LINE_RESET],
				`'[' opens a group. Save the outside on the stack as <code>(k, current)</code> = <code>${frameText(frame)}</code>: how many times this group repeats, and the text so far. Then start fresh: <code>k, current = 0, ""</code>.`,
			);
			return;
		}
		if (ch === ']') {
			const frame = stack.pop()!;
			const inner = current;
			current = frame.before + inner.repeat(frame.repeat);
			snapshot(
				'close',
				index,
				[LINE_FOR, LINE_DIGIT_CHECK, LINE_OPEN_CHECK, LINE_CLOSE_CHECK, LINE_POP, LINE_ATTACH],
				`']' closes the group. <code>repeat, before = stack.pop()</code> gives back <code>${frameText(frame)}</code>, then <code>current = ${quoted(frame.before)} + ${quoted(inner)} * ${frame.repeat}</code> = <b>${quoted(current)}</b>.`,
				frame,
			);
			return;
		}
		current += ch;
		snapshot('letter', index, [LINE_FOR, LINE_DIGIT_CHECK, LINE_OPEN_CHECK, LINE_CLOSE_CHECK, LINE_ELSE, LINE_APPEND], `'${ch}' is a letter: <code>current</code> becomes ${quoted(current)}.`);
	});

	snapshot('done', s.length, [LINE_RETURN], `Every bracket has closed, so the stack is empty and <code>current</code> is the answer: <b>${quoted(current)}</b>.`);
	return steps;
}

function DecodeScene({ input: { s }, step }: DecodeSceneProps) {
	const { phase, index, k, current, stack, popped } = step;
	const levels = [...stack, ...(popped ? [popped] : [])];
	const columns = Math.max(s.length, MAX_OUTPUT);

	return (
		<Canvas columns={columns} height={STACK_TOP + MAX_DEPTH * STACK_PITCH + 10}>
			{[...s].map((_, column) => (
				<SubLabel key={`index-${column}`} column={column} top={S_TOP - 22}>
					{column}
				</SubLabel>
			))}
			<RowLabel top={S_TOP + 16}>
				<code>s</code>
			</RowLabel>
			{[...s].map((ch, column) => (
				<Cell key={`s-${column}`} value={ch} column={column} top={S_TOP} tone={column === index ? 'focus' : 'plain'} dimmed={phase !== 'start' && phase !== 'done' && column > index} />
			))}

			<RowLabel top={K_TOP + 16}>
				<code>k</code>
			</RowLabel>
			<Cell value={k} column={0} top={K_TOP} tone={phase === 'digit' ? 'add' : phase === 'open' ? 'focus' : 'plain'} />

			<RowLabel top={CURRENT_TOP + 16}>
				<code>current</code>
			</RowLabel>
			<SubLabel column={0} top={CURRENT_TOP + 18} hidden={current.length > 0}>
				""
			</SubLabel>
			{Array.from({ length: MAX_OUTPUT }, (_, column) => (
				<Cell
					key={`current-${column}`}
					value={current[column] ?? ''}
					column={column}
					top={CURRENT_TOP}
					tone={phase === 'close' || phase === 'done' || (phase === 'letter' && column === current.length - 1) ? 'add' : 'plain'}
					hidden={column >= current.length}
				/>
			))}

			<SubLabel column={0} top={STACK_TOP + (MAX_DEPTH - levels.length) * STACK_PITCH - 22} hidden={levels.length === 0}>
				repeat
			</SubLabel>
			<SubLabel column={1} top={STACK_TOP + (MAX_DEPTH - levels.length) * STACK_PITCH - 22} hidden={levels.length === 0}>
				before: the text decoded before this "["
			</SubLabel>
			{Array.from({ length: MAX_DEPTH }, (_, level) => {
				const frame = levels[level];
				const isPopped = popped !== null && level === levels.length - 1;
				const isPushed = phase === 'open' && level === stack.length - 1;
				const top = STACK_TOP + (MAX_DEPTH - 1 - level) * STACK_PITCH;
				const tone = isPopped ? 'remove' : isPushed ? 'add' : 'plain';
				return [
					<RowLabel key={`stack-label-${level}`} top={top + 16} hidden={!frame}>
						stack[{level}]
					</RowLabel>,
					<Cell key={`stack-repeat-${level}`} value={frame ? `×${frame.repeat}` : ''} column={0} top={top} tone={tone} hidden={!frame} />,
					<SubLabel key={`stack-empty-${level}`} column={1} top={top + 18} hidden={!frame || frame.before.length > 0}>
						""
					</SubLabel>,
					...Array.from({ length: MAX_OUTPUT - 1 }, (_, offset) => (
						<Cell
							key={`stack-${level}-${offset}`}
							value={frame?.before[offset] ?? ''}
							column={offset + 1}
							top={top}
							tone={tone}
							hidden={!frame || offset >= frame.before.length}
						/>
					)),
				];
			})}
		</Canvas>
	);
}

function decode(s: string): string {
	const stack: Frame[] = [];
	let current = '';
	let k = 0;
	for (const ch of s) {
		if (ch >= '0' && ch <= '9') k = k * 10 + Number(ch);
		else if (ch === '[') {
			stack.push({ before: current, repeat: k });
			current = '';
			k = 0;
		} else if (ch === ']') {
			const frame = stack.pop()!;
			current = frame.before + current.repeat(frame.repeat);
		} else current += ch;
	}
	return current;
}

function validationError(s: string): string | undefined {
	if (!/^[a-z0-9[\]]+$/.test(s)) return 'Use only lowercase letters, digits, and square brackets.';
	let depth = 0;
	let deepest = 0;
	for (let index = 0; index < s.length; index++) {
		const ch = s[index];
		const isDigit = ch >= '0' && ch <= '9';
		if (isDigit && !/^\d*\[/.test(s.slice(index))) return 'Every number must be followed by "[", as in 3[a].';
		if (ch === '[' && !(index > 0 && s[index - 1] >= '0' && s[index - 1] <= '9')) return 'Every "[" needs a count right before it, as in 3[a].';
		if (isDigit && (index === 0 || !(s[index - 1] >= '0' && s[index - 1] <= '9')) && ch === '0') return 'Counts must be positive and have no leading zero.';
		if (ch === '[') deepest = Math.max(deepest, ++depth);
		if (ch === ']' && --depth < 0) return 'A "]" has no "[" to close.';
		if (ch === ']' && s[index - 1] === '[') return 'A group can\'t be empty, as in 2[].';
	}
	if (depth !== 0) return 'Every "[" needs a matching "]".';
	if (deepest > MAX_DEPTH) return `Use at most ${MAX_DEPTH} levels of nesting so the stack fits on screen.`;
	if (decode(s).length > MAX_OUTPUT) return `The decoded string must be ${MAX_OUTPUT} characters or fewer so it fits on screen.`;
	return undefined;
}

export default defineExplainer<DecodeInput, DecodeStep>({
	title: 'A stack of (text, count) pairs',
	codeFile: 'solution.py',
	stages: [
		{
			title: 's, read one character at a time',
			subtitle: 'Teal is the character being read; green is what just changed. Each stack row is one pair saved at a "[": first repeat, the k for that group, then before, the text current held when the "[" was read. They were pushed as (k, current), and stack.pop() returns them as repeat, before. Red is the pair being popped.',
			Scene: DecodeScene,
		},
	],
	examples: [
		{ input: { s: '3[a2[c]]' }, note: 'LeetCode example 2: nested' },
		{ input: { s: '3[a]2[bc]' }, note: 'LeetCode example 1' },
		{ input: { s: '2[abc]3[cd]ef' }, note: 'LeetCode example 3' },
		{ input: { s: '12[a]' }, note: 'A two-digit count' },
	],
	fields: [{ name: 's', label: 'Your own encoded string', placeholder: 'e.g. 2[a3[b]]' }],
	describe: ({ s }) => quoted(s),
	parse(values) {
		const s = values.s.trim();
		if (!s) return { error: 'Enter an encoded string, for example 2[a3[b]].' };
		if (s.length > MAX_INPUT) return { error: `Use ${MAX_INPUT} characters or fewer so everything fits on screen.` };
		const error = validationError(s);
		return error ? { error } : { input: { s } };
	},
	steps: buildSteps,
});
