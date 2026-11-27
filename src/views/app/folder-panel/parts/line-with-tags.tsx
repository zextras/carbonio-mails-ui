/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Row } from '@zextras/carbonio-design-system';
import { ListTagPills, TagPillItem } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { HiddenTagsMode, ListMoreTags } from './list-more-tags';
import { useTagPillItems } from '../../../../hooks/use-tag-pill-items';
import { VisuallyHidden } from 'commons/visually-hidden';
import { TagTarget } from 'views/app/detail-panel/preview/parts/tags/use-reading-pane-tags';

/**
 * Before the expand arrow of a conversation row, when it follows the tags line: the 24px target of "+N"
 * reaches 3.2px past its text and must not cover the arrow. Outside the line, so the fit of the tags
 * already has it.
 */
export const ROW_END_PADDING = { left: '0.2rem' } as const;

const Line = styled.div`
	display: flex;
	flex: 1 1 auto;
	align-items: center;
	gap: 0.5rem;
	min-width: 0;
`;

/**
 * Width of the element in whole px, observed only while `enabled`: rows without tags don't need it,
 * and rounding keeps sub-pixel changes (dragging the panel border) from re-rendering every row.
 */
const useElementWidth = (ref: React.RefObject<HTMLElement>, enabled: boolean): number => {
	const [width, setWidth] = useState(0);
	useEffect(() => {
		const element = ref.current;
		if (!element || !enabled) {
			return undefined;
		}
		const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
		observer.observe(element);
		return (): void => observer.disconnect();
	}, [ref, enabled]);
	return width;
};

const names = (items: ReadonlyArray<TagPillItem>): string =>
	items.map((item) => item.name).join(', ');

export type LineWithTagsProps = {
	/** The message or conversation of the row: what "×" and the tag menu of "+N" change. */
	target: TagTarget;
	tagIds: ReadonlyArray<string> | undefined;
	/** Folders of the item (its messages, for a conversation): whose folder a shared tag comes from. */
	folderIds?: ReadonlyArray<string>;
	/** What the tags share the line with: the subject, or the fragment in a conversation child row. */
	children: React.ReactNode;
};

/**
 * A line of a list row with the item's tags at its end: pills, then icon-only pills, in up to 40% of
 * the line, the rest behind "+N", which opens them. Screen readers get every tag by name instead.
 */
export const LineWithTags = ({
	target,
	tagIds,
	folderIds,
	children
}: Readonly<LineWithTagsProps>): React.JSX.Element => {
	const [t] = useTranslation();
	const lineRef = useRef<HTMLDivElement>(null);
	const items = useTagPillItems(tagIds, folderIds);
	const lineWidth = useElementWidth(lineRef, items.length > 0);
	const [mode, setMode] = useState<HiddenTagsMode>();
	const [focusOnReturnOf, setFocusOnReturnOf] = useState<string>();
	const appliedIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
	const renderMore = useCallback(
		(hidden: ReadonlyArray<TagPillItem>) => (
			<ListMoreTags
				target={target}
				hidden={hidden}
				appliedIds={appliedIds}
				mode={mode}
				onModeChange={setMode}
				focusOnReturnOf={focusOnReturnOf}
				onFocusOnReturn={setFocusOnReturnOf}
			/>
		),
		[appliedIds, focusOnReturnOf, mode, target]
	);
	// The tag put back by an Undo is here: "+N" took the focus if it hides it (its effect runs first),
	// else nothing waits for it any more. No tag left at all: nothing can stay open.
	useEffect(() => {
		if (focusOnReturnOf !== undefined && appliedIds.has(focusOnReturnOf)) {
			setFocusOnReturnOf(undefined);
		}
	}, [appliedIds, focusOnReturnOf]);
	useEffect(() => {
		if (items.length === 0) {
			setMode(undefined);
		}
	}, [items.length]);
	const own = items.filter((item) => !item.shared);
	const shared = items.filter((item) => item.shared);

	return (
		<Line ref={lineRef} data-testid="line-with-tags">
			<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start" minWidth="0">
				{children}
			</Row>
			{/* Screen readers get the full list below, not the pills; "+N" is a button. */}
			{items.length > 0 && lineWidth > 0 && (
				<ListTagPills
					tags={items}
					lineWidth={lineWidth}
					renderMore={renderMore}
					frozen={mode !== undefined}
				/>
			)}
			{own.length > 0 && (
				<VisuallyHidden>
					{t('label.tags_list', { tags: names(own), defaultValue: 'Tags: {{tags}}' })}
				</VisuallyHidden>
			)}
			{shared.length > 0 && (
				<VisuallyHidden>
					{t('label.shared_folder_tags_list', {
						tags: names(shared),
						defaultValue: 'Shared folder tags: {{tags}}'
					})}
				</VisuallyHidden>
			)}
		</Line>
	);
};
