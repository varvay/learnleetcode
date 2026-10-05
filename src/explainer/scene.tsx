import type { CSSProperties, ReactNode } from 'react';

export const CELL_SIZE = 54;
export const CELL_PITCH = 62;
export const ROW_LABEL_GUTTER = 96;

export const columnLeft = (column: number) => ROW_LABEL_GUTTER + column * CELL_PITCH;
export const columnCenter = (column: number) => columnLeft(column) + CELL_SIZE / 2;

export type CellTone = 'plain' | 'focus' | 'add' | 'remove';
export type EdgeTone = 'plain' | 'focus';
export type TagTone = 'add' | 'remove';
export type ChipState = 'plain' | 'current' | 'upcoming';

export interface Chip {
	label: string;
	state: ChipState;
}

export interface CellPlace {
	column: number;
	top: number;
}

const at = (left: number, top: number, hidden = false): CSSProperties => ({ left, top, ...(hidden && { opacity: 0 }) });

export function Canvas({ columns, height, children }: { columns: number; height: number; children: ReactNode }) {
	return (
		<div className="canvas" style={{ width: columnLeft(columns) + 20, height }}>
			{children}
		</div>
	);
}

export function Cell({
	value,
	column,
	top,
	tone = 'plain',
	dimmed = false,
	hidden = false,
}: {
	value: string | number;
	column: number;
	top: number;
	tone?: CellTone;
	dimmed?: boolean;
	hidden?: boolean;
}) {
	return (
		<div className={`cell tone-${tone}${dimmed ? ' dimmed' : ''}`} style={at(columnLeft(column), top, hidden)}>
			{value}
		</div>
	);
}

const EDGE_GAP = 2;

export function Edge({ from, to, tone = 'plain', hidden = false }: { from: CellPlace; to: CellPlace; tone?: EdgeTone; hidden?: boolean }) {
	const centerX = columnCenter(from.column);
	const centerY = from.top + CELL_SIZE / 2;
	const deltaX = columnCenter(to.column) - centerX;
	const deltaY = to.top + CELL_SIZE / 2 - centerY;
	const distance = Math.hypot(deltaX, deltaY) || 1;
	const directionX = deltaX / distance;
	const directionY = deltaY / distance;
	const inset = CELL_SIZE / 2 / Math.max(Math.abs(directionX), Math.abs(directionY)) + EDGE_GAP;
	const length = Math.max(0, distance - 2 * inset);
	return (
		<div
			className={`edge tone-${tone}`}
			style={{ ...at(centerX + directionX * inset, centerY + directionY * inset, hidden || length === 0), width: length, rotate: `${Math.atan2(deltaY, deltaX)}rad` }}
		/>
	);
}

export function SubLabel({ column, top, hidden, children }: { column: number; top: number; hidden?: boolean; children: ReactNode }) {
	return (
		<div className="sub-label" style={at(columnLeft(column), top, hidden)}>
			<span>{children}</span>
		</div>
	);
}

export function RowLabel({ top, hidden, children }: { top: number; hidden?: boolean; children: ReactNode }) {
	return (
		<div className="row-label" style={at(0, top, hidden)}>
			{children}
		</div>
	);
}

export function SceneNote({ column, top, hidden, children }: { column: number; top: number; hidden?: boolean; children: ReactNode }) {
	return (
		<div className="scene-note" style={at(columnLeft(column), top, hidden)}>
			{children}
		</div>
	);
}

export function ColumnMarker({
	column,
	top,
	height,
	label,
	hidden,
}: {
	column: number;
	top: number;
	height: number;
	label: string;
	hidden?: boolean;
}) {
	return (
		<div className="column-marker" style={{ ...at(columnLeft(column) - 6, top, hidden), height }}>
			<span>{label}</span>
		</div>
	);
}

export function Frame({ startColumn, columns, top, label }: { startColumn: number; columns: number; top: number; label: string }) {
	return (
		<>
			<div className="frame-label" style={at(columnLeft(startColumn) - 2, top - 24)}>
				{label}
			</div>
			<div className="frame" style={{ ...at(columnLeft(startColumn) - 6, top), width: columns * CELL_PITCH + 6 }} />
		</>
	);
}

export function Tag({
	column,
	top,
	tone,
	hidden,
	children,
}: {
	column: number;
	top: number;
	tone: TagTone;
	hidden?: boolean;
	children: ReactNode;
}) {
	return (
		<div className={`tag tone-${tone}`} style={at(columnCenter(column), top, hidden)}>
			{children}
		</div>
	);
}

export function Chips({ chips }: { chips: Chip[] }) {
	return chips.map((chip, index) => (
		<span key={index} className={`chip chip-${chip.state}`}>
			{chip.label}
		</span>
	));
}
