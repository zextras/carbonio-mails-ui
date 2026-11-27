/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import styled from '@emotion/styled';
import { TagPill } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { ReadingPaneTags } from './reading-pane-tags';
import { useReadingPaneTags } from './use-reading-pane-tags';
import { VisuallyHidden } from 'commons/visually-hidden';
import { useTagPillItems } from 'hooks/use-tag-pill-items';

/** A click on a pill or in the hidden tags must not toggle the card around it. */
const keepCardState = (event: React.MouseEvent): void => event.preventDefault();

const CollapsedTagsRow = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	flex: none;
	min-width: 0;
	padding-left: ${({ theme }): string => theme.sizes.padding.small};
`;

const Counter = styled.span`
	color: ${({ theme }): string => theme.palette.secondary.active};
	font-size: ${({ theme }): string => theme.sizes.font.extrasmall};
`;

/** Most a collapsed card's pill takes, as a pill after the first in a list row. */
const COLLAPSED_PILL_MAX_WIDTH = '7.5rem';

/**
 * Under the conversation subject, in its block, the header gives where the subject starts. On a message
 * card the tags start with the sender and the recipients, after the avatar column.
 */
const PADDING = { conversation: '0 0.5rem 0.75rem 0', message: '0 0.5rem 0.5rem 2rem' } as const;

type ItemTagsProps = {
	kind: 'message' | 'conversation';
	id: string;
	tagIds: ReadonlyArray<string> | undefined;
	folderId: string;
};

/**
 * The tags of the conversation under its subject, those of all its messages (removing one removes it
 * from every message), or of an expanded message card (from that message only).
 */
export const ItemTags = ({
	kind,
	id,
	tagIds,
	folderId
}: Readonly<ItemTagsProps>): React.JSX.Element => {
	const props = useReadingPaneTags({ kind, id, tagIds, folderId });
	const hasTags = props.tags.length > 0;
	// Mounted also without tags: after removing the only one, Undo gives it the focus back.
	return (
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
		<div
			data-testid="item-tags"
			onClick={keepCardState}
			// The whole width of the pane: in a column that aligns its items to the start, the row would
			// otherwise be as wide as the pills it shows, and fewer pills would fit at each resize.
			style={{
				boxSizing: 'border-box',
				width: '100%',
				padding: hasTags ? PADDING[kind] : 0
			}}
		>
			{/* A new item starts afresh: a focus waiting for the previous one must not land here */}
			<ReadingPaneTags key={id} {...props} />
		</div>
	);
};

/**
 * The tags of a collapsed message card: its first tag and "+N", not interactive (the card opens on
 * click). Screen readers get every tag by name.
 */
export const CollapsedCardTags = ({
	tagIds,
	folderId
}: Readonly<{
	tagIds: ReadonlyArray<string> | undefined;
	folderId: string;
}>): React.JSX.Element | null => {
	const [t] = useTranslation();
	const folderIds = useMemo(() => [folderId], [folderId]);
	const items = useTagPillItems(tagIds, folderIds);
	if (items.length === 0) {
		return null;
	}
	const [first] = items;
	return (
		<CollapsedTagsRow data-testid="collapsed-card-tags">
			<span
				aria-hidden="true"
				style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
			>
				<TagPill
					name={first.name}
					color={first.color}
					shared={first.shared}
					tooltip={first.tooltip}
					maxWidth={COLLAPSED_PILL_MAX_WIDTH}
				/>
				{items.length > 1 && <Counter>+{items.length - 1}</Counter>}
			</span>
			<VisuallyHidden>
				{t('label.tags_list', {
					tags: items.map((item) => item.name).join(', '),
					defaultValue: 'Tags: {{tags}}'
				})}
			</VisuallyHidden>
		</CollapsedTagsRow>
	);
};
