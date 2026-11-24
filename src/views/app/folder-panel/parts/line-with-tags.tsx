/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Row } from '@zextras/carbonio-design-system';
import { ListTagPills, TagPillItem } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { useTagPillItems } from '../../../../hooks/use-tag-pill-items';
import { VisuallyHidden } from 'commons/visually-hidden';

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
	tagIds: ReadonlyArray<string> | undefined;
	/** Most px the tags may take: 200 on the subject line, 160 on a conversation child row. */
	maxBudget?: number;
	/** What the tags share the line with: the subject, or the sender in a child row. */
	children: React.ReactNode;
};

/**
 * A line of a list row with the item's tags at its end: pills in up to 40% of the line, the rest as
 * "+N". Screen readers get every tag by name instead.
 */
export const LineWithTags = ({
	tagIds,
	maxBudget,
	children
}: Readonly<LineWithTagsProps>): React.JSX.Element => {
	const [t] = useTranslation();
	const lineRef = useRef<HTMLDivElement>(null);
	const items = useTagPillItems(tagIds);
	const lineWidth = useElementWidth(lineRef, items.length > 0);
	const own = items.filter((item) => !item.shared);
	const shared = items.filter((item) => item.shared);

	return (
		<Line ref={lineRef}>
			<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start" minWidth="0">
				{children}
			</Row>
			{/* Pointer-only: screen readers get the full list below, not the pills and "+N". */}
			{items.length > 0 && lineWidth > 0 && (
				<span aria-hidden="true" style={{ display: 'flex', flex: 'none' }}>
					<ListTagPills tags={items} lineWidth={lineWidth} maxBudget={maxBudget} />
				</span>
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
