/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { TagPill, TagPillItem } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import {
	fitTagsInLines,
	READING_PANE_TAGS_GAP,
	READING_PANE_TAGS_LINE_END
} from './fit-tags-in-lines';
import { focusHiddenTagRemove, HiddenTagsPopover, TagMenu } from './hidden-tags-popover';
import { MoreTagsButton } from './more-tags-button';

const Row = styled.div`
	position: relative;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: ${READING_PANE_TAGS_GAP / 16}rem;
	min-width: 0;
	/* Room for the "×" a hovered pill grows by, so it never wraps (the fit keeps it free too). */
	padding-right: ${READING_PANE_TAGS_LINE_END / 16}rem;
`;

/** Holds the measuring copies without taking room: they must not widen the pane and make it scroll. */
const MeasureBox = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 0;
	height: 0;
	overflow: hidden;
`;

/** All the pills at their natural width, out of sight, to measure them. */
const MeasureLayer = styled.div`
	display: flex;
	width: max-content;
	gap: ${READING_PANE_TAGS_GAP / 16}rem;
	visibility: hidden;
	pointer-events: none;
	white-space: nowrap;
`;

/** "+N" at 13px: the "+", each digit, and the button's padding. */
const counterWidth = (hiddenCount: number): number =>
	Math.ceil(8 * (1 + String(hiddenCount).length)) + 8;

/** After a removal, `removedId` is the tag that must leave the list first: the store may render before. */
type PendingFocus =
	| { on: 'pill'; index: number; removedId: string }
	| { on: 'hidden-remove'; index: number; removedId: string }
	| { on: 'tag'; id: string };

type OpenState = { mode: 'hidden' | 'menu'; visibleIds: ReadonlySet<string> };

export type ReadingPaneTagsProps = {
	/** In display order: the user's tags alphabetically, then the shared folder owner's. */
	tags: ReadonlyArray<TagPillItem>;
	/** A click on a pill, e.g. to search by its tag. */
	onSearch?: (tag: TagPillItem) => void;
	/**
	 * Without it, no "×". `onUndo` is for the snackbar's Undo, after the tag is back; `onError` when the
	 * tag could not be removed.
	 */
	onRemove?: (tag: TagPillItem, options: { onUndo: () => void; onError: () => void }) => void;
	/** Accessible name of the "×". Default: "Remove tag {name}". */
	removeLabel?: (tag: TagPillItem) => string;
	/** Without it, no MANAGE TAGS. */
	menu?: TagMenu;
};

/**
 * The tags of a message or conversation in the reading pane: every tag as a pill, wrapping on up to
 * two lines, then "+N", which opens the rest with a click. A click on a pill runs `onSearch`, its "×"
 * `onRemove`. Tags of a shared folder's owner can be neither clicked nor removed.
 */
export const ReadingPaneTags = ({
	tags,
	onSearch,
	onRemove,
	removeLabel,
	menu
}: Readonly<ReadingPaneTagsProps>): React.JSX.Element | null => {
	const [t] = useTranslation();
	const rowRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	const moreRef = useRef<HTMLButtonElement>(null);
	const pillRefs = useRef(new Map<string, HTMLButtonElement>());
	const pendingFocus = useRef<PendingFocus>();

	const [lineWidth, setLineWidth] = useState(0);
	const [pillWidths, setPillWidths] = useState<ReadonlyArray<number>>([]);
	const [open, setOpen] = useState<OpenState>();

	useEffect(() => {
		const row = rowRef.current;
		if (!row) {
			return undefined;
		}
		const observer = new ResizeObserver(([entry]) =>
			setLineWidth(Math.round(entry.contentRect.width) + READING_PANE_TAGS_LINE_END)
		);
		observer.observe(row);
		return (): void => observer.disconnect();
	}, [tags.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

	useLayoutEffect(() => {
		const layer = measureRef.current;
		if (layer) {
			setPillWidths(
				Array.from(layer.children).map((child) => Math.ceil(child.getBoundingClientRect().width))
			);
		}
	}, [tags]);

	const fitCount = useMemo(
		() =>
			fitTagsInLines({
				lineWidth,
				// Until measured, every pill counts as 0px: all shown, no "+N" flashing.
				pillWidths: tags.map((_, index) => pillWidths[index] ?? 0),
				counterWidth
			}),
		[lineWidth, pillWidths, tags]
	);

	// While the card is open, the pills behind it keep their place.
	const visible = useMemo(
		() => (open ? tags.filter((tag) => open.visibleIds.has(tag.id)) : tags.slice(0, fitCount)),
		[fitCount, open, tags]
	);
	const hidden = useMemo(() => {
		const shown = new Set(visible.map((tag) => tag.id));
		return tags.filter((tag) => !shown.has(tag.id));
	}, [tags, visible]);
	const appliedIds = useMemo(() => new Set(tags.map((tag) => tag.id)), [tags]);

	const labelOfRemove = useCallback(
		(tag: TagPillItem) =>
			removeLabel?.(tag) ??
			t('label.remove_tag_name', { name: tag.name, defaultValue: 'Remove tag {{name}}' }),
		[removeLabel, t]
	);

	const focusPill = useCallback((tag: TagPillItem | undefined): boolean => {
		const element = tag && pillRefs.current.get(tag.id);
		element?.focus();
		return element !== undefined;
	}, []);

	// The last hidden tag removed from the card or unchecked in the menu: close it, "+N" goes, focus on
	// the last pill.
	useLayoutEffect(() => {
		if (open && hidden.length === 0) {
			setOpen(undefined);
			focusPill(visible[visible.length - 1]);
			pendingFocus.current = undefined;
		}
	}, [focusPill, hidden.length, open, visible]);

	// After a removal or an Undo the list changes: move the focus where the design says.
	useLayoutEffect(() => {
		const pending = pendingFocus.current;
		if (!pending) {
			return;
		}
		if (pending.on === 'tag') {
			if (!appliedIds.has(pending.id)) {
				return;
			}
			pendingFocus.current = undefined;
			const tag = visible.find((item) => item.id === pending.id);
			if (!focusPill(tag)) {
				moreRef.current?.focus();
			}
			return;
		}
		if (appliedIds.has(pending.removedId)) {
			return;
		}
		if (pending.on === 'pill') {
			if (visible.length === 0) {
				return;
			}
			pendingFocus.current = undefined;
			focusPill(visible[Math.min(pending.index, visible.length - 1)]);
			return;
		}
		if (hidden.length > 0) {
			pendingFocus.current = undefined;
			focusHiddenTagRemove(hidden[Math.min(pending.index, hidden.length - 1)].id);
		}
	}, [appliedIds, focusPill, hidden, visible]);

	const removeTag = useCallback(
		(tag: TagPillItem, focusAfter: PendingFocus) => {
			pendingFocus.current = focusAfter;
			onRemove?.(tag, {
				onUndo: () => {
					setOpen(undefined);
					pendingFocus.current = { on: 'tag', id: tag.id };
				},
				onError: () => {
					pendingFocus.current = undefined;
				}
			});
		},
		[onRemove]
	);

	const openCard = useCallback(() => {
		setOpen((current) =>
			current ? undefined : { mode: 'hidden', visibleIds: new Set(visible.map((tag) => tag.id)) }
		);
	}, [visible]);

	const closeCard = useCallback((restoreFocus: boolean) => {
		setOpen(undefined);
		if (restoreFocus) {
			moreRef.current?.focus();
		}
	}, []);

	const showMenu = useCallback(
		() => setOpen((current) => current && { ...current, mode: 'menu' }),
		[]
	);

	if (tags.length === 0) {
		return null;
	}

	return (
		<Row ref={rowRef} data-testid="reading-pane-tags">
			<MeasureBox aria-hidden="true">
				<MeasureLayer ref={measureRef} data-testid="tag-pills-measure">
					{tags.map((tag) => (
						<TagPill
							key={tag.id}
							size="medium"
							name={tag.name}
							color={tag.color}
							shared={tag.shared}
						/>
					))}
				</MeasureLayer>
			</MeasureBox>
			{visible.map((tag, index) => (
				<TagPill
					key={tag.id}
					ref={(element): void => {
						if (element) {
							pillRefs.current.set(tag.id, element);
						} else {
							pillRefs.current.delete(tag.id);
						}
					}}
					size="medium"
					name={tag.name}
					color={tag.color}
					shared={tag.shared}
					tooltip={tag.tooltip}
					maxWidth={`calc(100% - ${READING_PANE_TAGS_LINE_END / 16}rem)`}
					onClick={onSearch && ((): void => onSearch(tag))}
					onRemove={
						onRemove && ((): void => removeTag(tag, { on: 'pill', index, removedId: tag.id }))
					}
					removeLabel={labelOfRemove(tag)}
				/>
			))}
			{hidden.length > 0 && (
				<MoreTagsButton
					ref={moreRef}
					hiddenCount={hidden.length}
					open={open !== undefined}
					onClick={openCard}
				/>
			)}
			{open && hidden.length > 0 && (
				<HiddenTagsPopover
					anchorRef={moreRef}
					mode={open.mode}
					hiddenTags={hidden}
					appliedIds={appliedIds}
					removeLabel={labelOfRemove}
					onRemove={
						onRemove &&
						((tag, index): void =>
							removeTag(tag, { on: 'hidden-remove', index, removedId: tag.id }))
					}
					menu={menu}
					onShowMenu={showMenu}
					onClose={closeCard}
				/>
			)}
		</Row>
	);
};
