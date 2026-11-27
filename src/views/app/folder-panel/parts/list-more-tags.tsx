/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { TagPillItem } from '@zextras/carbonio-ui-commons';

import {
	focusHiddenTagRemove,
	HiddenTagsPopover
} from 'views/app/detail-panel/preview/parts/tags/hidden-tags-popover';
import { MoreTagsButton } from 'views/app/detail-panel/preview/parts/tags/more-tags-button';
import {
	TagTarget,
	useTagEditing
} from 'views/app/detail-panel/preview/parts/tags/use-reading-pane-tags';

export type HiddenTagsMode = 'hidden' | 'menu';

/** The card is in a portal, but its events still bubble to the row through React: keep them here. */
const keepFromRow = (event: React.SyntheticEvent): void => event.stopPropagation();

export type ListMoreTagsProps = {
	target: TagTarget;
	/** The tags of the row that are not shown. */
	hidden: ReadonlyArray<TagPillItem>;
	/** Every tag of the row, to check them in the tag menu. */
	appliedIds: ReadonlySet<string>;
	/** What the card shows, `undefined` when closed. Kept by the row, which doesn't reflow meanwhile. */
	mode: HiddenTagsMode | undefined;
	onModeChange: (mode: HiddenTagsMode | undefined) => void;
	/** After an Undo, the tag put back: when it is behind "+N", "+N" takes the focus. */
	focusOnReturnOf: string | undefined;
	onFocusOnReturn: (tagId: string | undefined) => void;
};

/**
 * "+N" of a list row: a click or Enter opens the hidden tags, the same card as in the reading pane
 * ("×" on each, MANAGE TAGS), never the item. After a removal the focus goes to the next "×";
 * removing the last one closes the card.
 */
export const ListMoreTags = ({
	target,
	hidden,
	appliedIds,
	mode,
	onModeChange,
	focusOnReturnOf,
	onFocusOnReturn
}: Readonly<ListMoreTagsProps>): React.JSX.Element | null => {
	const moreRef = useRef<HTMLButtonElement>(null);
	const pendingFocus = useRef<{ index: number; removedId: string }>();
	const { onRemove, removeLabel, menu } = useTagEditing(target);

	// The last hidden tag removed: the card closes and the row recalculates.
	useLayoutEffect(() => {
		if (hidden.length === 0 && mode !== undefined) {
			pendingFocus.current = undefined;
			onModeChange(undefined);
		}
	}, [hidden.length, mode, onModeChange]);

	// A tag removed from the card: the focus goes to the next "×", or the previous one at the end.
	useLayoutEffect(() => {
		const pending = pendingFocus.current;
		if (!pending || hidden.some((tag) => tag.id === pending.removedId) || hidden.length === 0) {
			return;
		}
		pendingFocus.current = undefined;
		focusHiddenTagRemove(hidden[Math.min(pending.index, hidden.length - 1)].id);
	}, [hidden]);

	// The row's context menu listens to Enter and Space on its DOM node and takes them (preventDefault),
	// before React: keep them on "+N", whose click opens the card.
	useEffect(() => {
		const button = moreRef.current;
		const keepKeys = (event: KeyboardEvent): void => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.stopPropagation();
			}
		};
		button?.addEventListener('keydown', keepKeys);
		button?.addEventListener('keyup', keepKeys);
		return (): void => {
			button?.removeEventListener('keydown', keepKeys);
			button?.removeEventListener('keyup', keepKeys);
		};
	}, []);

	useEffect(() => {
		if (focusOnReturnOf && hidden.some((tag) => tag.id === focusOnReturnOf)) {
			moreRef.current?.focus();
			onFocusOnReturn(undefined);
		}
	}, [focusOnReturnOf, hidden, onFocusOnReturn]);

	const toggle = useCallback(() => {
		onModeChange(mode === undefined ? 'hidden' : undefined);
	}, [mode, onModeChange]);

	const close = useCallback(
		(restoreFocus: boolean) => {
			onModeChange(undefined);
			if (restoreFocus) {
				moreRef.current?.focus();
			}
		},
		[onModeChange]
	);

	const remove = useCallback(
		(tag: TagPillItem, index: number) => {
			pendingFocus.current = { index, removedId: tag.id };
			onRemove?.(tag, {
				onUndo: () => {
					onModeChange(undefined);
					onFocusOnReturn(tag.id);
				},
				onError: () => {
					pendingFocus.current = undefined;
				}
			});
		},
		[onFocusOnReturn, onModeChange, onRemove]
	);

	if (hidden.length === 0) {
		return null;
	}

	return (
		// Events only: the button and the card handle the keyboard themselves.
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<span
			style={{ display: 'inline-flex', flex: 'none' }}
			onClick={keepFromRow}
			onDoubleClick={keepFromRow}
			onKeyDown={keepFromRow}
			onContextMenu={keepFromRow}
		>
			<MoreTagsButton
				ref={moreRef}
				size="small"
				hiddenCount={hidden.length}
				open={mode !== undefined}
				onClick={toggle}
			/>
			{mode && (
				<HiddenTagsPopover
					anchorRef={moreRef}
					mode={mode}
					hiddenTags={hidden}
					appliedIds={appliedIds}
					removeLabel={(tag): string => removeLabel?.(tag) ?? tag.name}
					onRemove={onRemove && remove}
					menu={menu}
					onShowMenu={(): void => onModeChange('menu')}
					onClose={close}
				/>
			)}
		</span>
	);
};
