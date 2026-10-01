import { Canvas, Cell, ColumnMarker, RowLabel, SubLabel } from '../../src/explainer/scene';
import { defineExplainer, type SceneProps, type Step } from '../../src/explainer/types';

interface GridInput {
	grid: number[][];
}

type Phase = 'start' | 'row' | 'col' | 'sum' | 'unvisited' | 'done';
type Kind = 'row' | 'col';

interface Read {
	kind: Kind;
	index: number;
	token: string;
}

interface Group {
	token: string;
	rows: number[];
	cols: number[];
}

interface WalkStep extends Step {
	phase: Phase;
	read: number;
	summed: number;
}

type WalkSceneProps = SceneProps<GridInput, WalkStep>;

const MAX_SIZE = 4;
const GRID_TOP = 36;
const ROW_PITCH = 62;
const MAX_LISTED_PAIRS = 4;

const LINE_N = 3;
const LINE_DICTS = 5;
const LINE_FOR = 7;
const LINE_ROW_TOKEN = 8;
const LINE_ROW_NEW_CHECK = 9;
const LINE_ROW_FIRST = 10;
const LINE_ROW_ELSE = 11;
const LINE_ROW_INCREMENT = 12;
const LINE_COL_TOKEN = 14;
const LINE_COL_NEW_CHECK = 15;
const LINE_COL_FIRST = 16;
const LINE_COL_ELSE = 17;
const LINE_COL_INCREMENT = 18;
const LINE_SUM = 20;
const LINE_ROW_HELPER = 23;
const LINE_COL_HELPER = 26;

const tokenOf = (values: number[]) => values.join('_');
const columnOf = (grid: number[][], index: number) => grid.map((line) => line[index]);
const spaced = (token: string) => token.replaceAll('_', ' ');
const listOf = (prefix: string, indices: number[]) => indices.map((index) => `${prefix}${index}`).join(', ');

const readsOf = (grid: number[][]): Read[] =>
	grid.flatMap((row, index) => [
		{ kind: 'row' as const, index, token: tokenOf(row) },
		{ kind: 'col' as const, index, token: tokenOf(columnOf(grid, index)) },
	]);

function groupsOf(reads: Read[]): Group[] {
	const groups: Group[] = [];
	for (const { kind, index, token } of reads) {
		let group = groups.find((candidate) => candidate.token === token);
		if (!group) {
			group = { token, rows: [], cols: [] };
			groups.push(group);
		}
		(kind === 'row' ? group.rows : group.cols).push(index);
	}
	return groups;
}

const rowsKeysOf = (reads: Read[]) => [...new Set(reads.filter((read) => read.kind === 'row').map((read) => read.token))];

function pairsText({ rows, cols }: Group): string {
	if (rows.length * cols.length > MAX_LISTED_PAIRS) return 'each of those rows pairs with each of those columns';
	return `the pair${rows.length * cols.length === 1 ? '' : 's'} ${rows.flatMap((row) => cols.map((col) => `(r${row}, c${col})`)).join(', ')}`;
}

function buildSteps({ grid }: GridInput): WalkStep[] {
	const n = grid.length;
	const reads = readsOf(grid);
	const groups = groupsOf(reads);
	const groupOf = (token: string) => groups.find((group) => group.token === token)!;
	const rowsKeys = rowsKeysOf(reads);
	const unvisited = groups.filter((group) => group.rows.length === 0);

	const readout = (read: number, total: number | string, i: number | string = '–') => {
		const seen = groupsOf(reads.slice(0, read));
		return { i, 'rows keys': seen.filter((group) => group.rows.length > 0).length, 'cols keys': seen.filter((group) => group.cols.length > 0).length, total };
	};

	const steps: WalkStep[] = [
		{
			phase: 'start',
			read: 0,
			summed: 0,
			readout: readout(0, '–'),
			highlightedLines: [LINE_N, LINE_DICTS],
			narration: `<code>n = ${n}</code>. <code>rows</code> and <code>cols</code> start empty. Each will map a token, a row or column joined with <code>_</code>, to how many rows or columns read it.`,
		},
	];

	reads.forEach((read, position) => {
		const seen = groupsOf(reads.slice(0, position + 1)).find((group) => group.token === read.token)!;
		const isRow = read.kind === 'row';
		const count = isRow ? seen.rows.length : seen.cols.length;
		const dict = isRow ? 'rows' : 'cols';
		const values = isRow ? grid[read.index] : columnOf(grid, read.index);
		const lines = isRow
			? [LINE_FOR, LINE_ROW_TOKEN, LINE_ROW_HELPER, LINE_ROW_NEW_CHECK, ...(count === 1 ? [LINE_ROW_FIRST] : [LINE_ROW_ELSE, LINE_ROW_INCREMENT])]
			: [LINE_COL_TOKEN, LINE_COL_HELPER, LINE_COL_NEW_CHECK, ...(count === 1 ? [LINE_COL_FIRST] : [LINE_COL_ELSE, LINE_COL_INCREMENT])];
		steps.push({
			phase: read.kind,
			read: position + 1,
			summed: 0,
			readout: readout(position + 1, '–', read.index),
			highlightedLines: lines,
			narration:
				(isRow ? `<code>i = ${read.index}</code>: <code>self.row(grid, ${read.index})</code> returns row ${read.index}, ` : `<code>self.col(grid, ${read.index})</code> collects column ${read.index}, `) +
				`[${values.join(', ')}], joined into <code>"${read.token}"</code>. ` +
				(count === 1 ? `It's not in <code>${dict}</code> yet, so <code>${dict}["${read.token}"] = 1</code>.` : `It's already in <code>${dict}</code>, so <code>${dict}["${read.token}"]</code> becomes ${count}.`),
		});
	});

	let total = 0;
	rowsKeys.forEach((token, index) => {
		const group = groupOf(token);
		const counted = group.cols.length > 0;
		if (counted) total += group.rows.length * group.cols.length;
		steps.push({
			phase: 'sum',
			read: reads.length,
			summed: index + 1,
			readout: readout(reads.length, total),
			highlightedLines: [LINE_SUM],
			narration: counted
				? `The sum visits <code>"${token}"</code>. It's in <code>cols</code> too, so it adds <code>rows["${token}"] * cols["${token}"]</code> = ${group.rows.length} × ${group.cols.length} = <b>${group.rows.length * group.cols.length}</b>: ${pairsText(group)}. The total is ${total}.`
				: `The sum visits <code>"${token}"</code>, from ${group.rows.length === 1 ? 'row' : 'rows'} ${listOf('r', group.rows)}. It's not in <code>cols</code>, so <code>if token in cols</code> skips it: no column reads ${spaced(token)}.`,
		});
	});

	if (unvisited.length > 0) {
		const columns = unvisited.flatMap((group) => group.cols);
		steps.push({
			phase: 'unvisited',
			read: reads.length,
			summed: rowsKeys.length,
			readout: readout(reads.length, total),
			highlightedLines: [LINE_SUM],
			narration: `The sum only loops over the keys of <code>rows</code>, so ${columns.length === 1 ? 'column' : 'columns'} ${listOf('c', columns)} ${columns.length === 1 ? 'is' : 'are'} never visited. No row reads ${unvisited.length === 1 ? 'that sequence' : 'those sequences'}, so ${unvisited.length === 1 ? 'it' : 'they'} could only add 0 pairs.`,
		});
	}

	steps.push({
		phase: 'done',
		read: reads.length,
		summed: rowsKeys.length,
		readout: readout(reads.length, total),
		highlightedLines: [LINE_SUM],
		narration: `The sum is <b>${total}</b>, and the function returns it.`,
	});
	return steps;
}

function WalkScene({ input: { grid }, step: { phase, read: readCount, summed } }: WalkSceneProps) {
	const n = grid.length;
	const reads = readsOf(grid);
	const groups = groupsOf(reads);
	const counts = groupsOf(reads.slice(0, readCount));
	const countsFor = (token: string) => counts.find((group) => group.token === token);
	const rowsKeys = rowsKeysOf(reads);
	const current = phase === 'row' || phase === 'col' ? reads[readCount - 1] : undefined;
	const visiting = phase === 'sum' ? groups.find((group) => group.token === rowsKeys[summed - 1]) : undefined;
	const unvisitedShown = phase === 'unvisited' || phase === 'done';
	const unvisitedGroups = groups.filter((group) => group.rows.length === 0);

	const litRows = current ? (current.kind === 'row' ? [current.index] : []) : (visiting?.rows ?? []);
	const ringedCols = current
		? current.kind === 'col'
			? [current.index]
			: []
		: phase === 'unvisited'
			? unvisitedGroups.flatMap((group) => group.cols)
			: (visiting?.cols ?? []);
	const focusing = phase !== 'start' && phase !== 'done';

	const tableTop = GRID_TOP + n * ROW_PITCH + 58;
	const colsTop = tableTop + 62;

	const isSummed = (group: Group) => rowsKeys.indexOf(group.token) >= 0 && rowsKeys.indexOf(group.token) < summed;
	const note = (group: Group): string | undefined => {
		if (isSummed(group)) return group.cols.length > 0 ? `${group.rows.length} × ${group.cols.length} = ${group.rows.length * group.cols.length}` : 'skipped';
		if (group.rows.length === 0 && unvisitedShown) return 'not visited';
		return undefined;
	};
	const countTone = (group: Group, dict: Kind) => {
		if (current?.token === group.token && current.kind === dict) {
			const seen = countsFor(group.token)!;
			return (dict === 'row' ? seen.rows.length : seen.cols.length) === 1 ? 'add' : 'focus';
		}
		if (visiting?.token === group.token) return visiting.cols.length > 0 ? 'add' : dict === 'row' ? 'focus' : 'plain';
		if (phase === 'unvisited' && group.rows.length === 0 && dict === 'col') return 'focus';
		return 'plain';
	};

	return (
		<Canvas columns={Math.max(n, groups.length)} height={colsTop + 84}>
			{grid.map((_, column) => (
				<ColumnMarker key={`marker-${column}`} column={column} top={GRID_TOP - 6} height={n * ROW_PITCH + 4} label={`c${column}`} hidden={!ringedCols.includes(column)} />
			))}
			{grid.map((_, rowIndex) => (
				<RowLabel key={`row-label-${rowIndex}`} top={GRID_TOP + rowIndex * ROW_PITCH + 16}>
					r{rowIndex}
				</RowLabel>
			))}
			{grid.flatMap((row, rowIndex) =>
				row.map((value, colIndex) => {
					const inRow = litRows.includes(rowIndex);
					const inCol = ringedCols.includes(colIndex);
					return (
						<Cell
							key={`cell-${rowIndex}-${colIndex}`}
							value={value}
							column={colIndex}
							top={GRID_TOP + rowIndex * ROW_PITCH}
							tone={inRow ? 'focus' : inCol ? 'add' : 'plain'}
							dimmed={focusing && !inRow && !inCol}
						/>
					);
				}),
			)}
			{grid.map((_, column) => (
				<SubLabel key={`col-label-${column}`} column={column} top={GRID_TOP + n * ROW_PITCH + 2}>
					c{column}
				</SubLabel>
			))}

			{groups.map((group, column) => (
				<SubLabel key={`sequence-${group.token}`} column={column} top={tableTop - 22} hidden={!countsFor(group.token)}>
					"{group.token}"
				</SubLabel>
			))}
			<RowLabel top={tableTop + 16}>
				<code>rows</code>
			</RowLabel>
			{groups.map((group, column) => {
				const seen = countsFor(group.token);
				return (
					<Cell
						key={`rows-${group.token}`}
						value={seen?.rows.length ?? 0}
						column={column}
						top={tableTop}
						tone={countTone(group, 'row')}
						dimmed={seen !== undefined && seen.rows.length === 0}
						hidden={!seen}
					/>
				);
			})}
			<RowLabel top={colsTop + 16}>
				<code>cols</code>
			</RowLabel>
			{groups.map((group, column) => {
				const seen = countsFor(group.token);
				return (
					<Cell
						key={`cols-${group.token}`}
						value={seen?.cols.length ?? 0}
						column={column}
						top={colsTop}
						tone={countTone(group, 'col')}
						dimmed={seen !== undefined && seen.cols.length === 0}
						hidden={!seen}
					/>
				);
			})}
			{groups.map((group, column) => (
				<SubLabel key={`note-${group.token}`} column={column} top={colsTop + 56} hidden={note(group) === undefined}>
					{note(group) ?? ''}
				</SubLabel>
			))}
		</Canvas>
	);
}

function parseGrid(text: string): { grid: number[][] } | { error: string } {
	const grid = text
		.split(/[;|\n]+/)
		.map((line) => line.split(/[\s,]+/).filter(Boolean).map(Number))
		.filter((row) => row.length > 0);
	if (!grid.length) return { error: 'Enter rows separated by semicolons, for example 3 2 1; 1 7 6; 2 7 7.' };
	if (grid.length > MAX_SIZE) return { error: `Use at most ${MAX_SIZE} rows so everything fits on screen.` };
	if (grid.some((row) => row.length !== grid.length)) return { error: `The grid must be square: ${grid.length} rows of ${grid.length} numbers each.` };
	if (grid.flat().some((value) => !Number.isInteger(value) || value < 1 || value > 9)) return { error: 'Use whole numbers from 1 to 9 so the tokens fit on screen.' };
	return { grid };
}

export default defineExplainer<GridInput, WalkStep>({
	title: 'Count rows and columns by token, then multiply',
	codeFile: 'solution.py',
	stages: [
		{
			title: 'The grid and the two dicts',
			subtitle: 'Teal is a row, ringed green a column. Below, each column of the table is one token with its count in rows and in cols; the note under it says what the sum does with it.',
			Scene: WalkScene,
		},
	],
	examples: [
		{ input: { grid: [[3, 1, 2, 2], [1, 4, 4, 5], [2, 4, 2, 2], [2, 4, 2, 2]] }, note: 'LeetCode example 2' },
		{ input: { grid: [[3, 2, 1], [1, 7, 6], [2, 7, 7]] }, note: 'LeetCode example 1' },
		{ input: { grid: [[1, 2], [1, 2]] }, note: 'Two equal rows, no equal column' },
		{ input: { grid: [[1, 1], [1, 1]] }, note: 'All ones: 2 × 2 pairs' },
	],
	fields: [{ name: 'grid', label: 'Your own grid', placeholder: 'e.g. 3 2 1; 1 7 6; 2 7 7' }],
	describe: ({ grid }) => grid.map((row) => row.join(' ')).join('; '),
	parse(values) {
		const parsed = parseGrid(values.grid);
		return 'error' in parsed ? parsed : { input: { grid: parsed.grid } };
	},
	steps: buildSteps,
});
