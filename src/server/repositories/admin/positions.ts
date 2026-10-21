import { Prisma } from "@prisma/client";

export type PositionEntry = { id: string; position: number };

export function positionRangeFilter(oldPosition: number, newPosition: number): Prisma.IntFilter {
  return newPosition < oldPosition
    ? { gte: newPosition, lt: oldPosition }
    : { gt: oldPosition, lte: newPosition };
}

export function shiftedSiblingPosition(position: number, oldPosition: number, newPosition: number): number {
  return newPosition < oldPosition ? position + 1 : position - 1;
}

export function clampPosition(position: number, maxPosition: number): number {
  return Math.min(Math.max(position, 1), maxPosition);
}

export type PositionUpdateDelegate = {
  update: (args: { where: { id: string }; data: { position: number } }) => Promise<unknown>;
};

export const TEMPORARY_POSITION_BASE = 1_000_000_000;

export async function shiftPositions(delegate: PositionUpdateDelegate, entries: PositionEntry[]): Promise<void> {
  for (const [index, entry] of entries.entries()) {
    await delegate.update({ where: { id: entry.id }, data: { position: TEMPORARY_POSITION_BASE + index } });
  }
  for (const entry of entries) {
    await delegate.update({ where: { id: entry.id }, data: { position: entry.position } });
  }
}
