/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Space between pills, on a line and between lines. */
export const READING_PANE_TAGS_GAP = 6;
/** Kept free at the end of each line, so a hovered pill can grow by its "×" without wrapping. */
export const READING_PANE_TAGS_LINE_END = 18;
/** Lines of tags before the rest goes to "+N": one, to keep the header of the mail short. */
export const READING_PANE_TAGS_MAX_LINES = 1;

type FitTagsInLinesArgs = {
	/** Width of the tags row, in px. */
	lineWidth: number;
	/** Natural width of each pill, in display order, in px. */
	pillWidths: ReadonlyArray<number>;
	/** Width of the "+N" button for a given number of hidden tags, in px. */
	counterWidth: (hiddenCount: number) => number;
};

/**
 * How many tags the reading pane shows: all of them while they fit in `READING_PANE_TAGS_MAX_LINES`;
 * otherwise as many as fit with "+N" after the last one on the last line. The first tag is always
 * shown, truncated when even it and "+N" don't fit.
 */
export const fitTagsInLines = ({
	lineWidth,
	pillWidths,
	counterWidth
}: FitTagsInLinesArgs): number => {
	const total = pillWidths.length;
	const usable = Math.max(1, lineWidth - READING_PANE_TAGS_LINE_END);
	if (total === 0 || lineWidth <= 0) {
		return total;
	}

	/** Lines taken by the first `count` pills, plus an item of `extra` px after them, if any. */
	const linesFor = (count: number, extra?: number): number => {
		let lines = 1;
		let used = 0;
		const place = (width: number): void => {
			const clamped = Math.min(width, usable);
			if (used === 0) {
				used = clamped;
			} else if (used + READING_PANE_TAGS_GAP + clamped <= usable) {
				used += READING_PANE_TAGS_GAP + clamped;
			} else {
				lines += 1;
				used = clamped;
			}
		};
		pillWidths.slice(0, count).forEach(place);
		if (extra !== undefined) {
			place(extra);
		}
		return lines;
	};

	if (linesFor(total) <= READING_PANE_TAGS_MAX_LINES) {
		return total;
	}
	let visible = total - 1;
	while (
		visible > 1 &&
		linesFor(visible, counterWidth(total - visible)) > READING_PANE_TAGS_MAX_LINES
	) {
		visible -= 1;
	}
	return visible;
};
