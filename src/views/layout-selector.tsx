/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useLocalStorage } from '@zextras/carbonio-shell-ui';
import { matchPath, useLocation } from 'react-router-dom';

import type { MailsListLayout, MailsSplitLayoutOrientation } from './folder-view';
import {
	LOCAL_STORAGE_VIEW_SIZES,
	MAILS_ROUTE,
	MAILS_VIEW_LAYOUTS,
	MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS
} from '../constants';
import { SizeAndPosition } from '../hooks/use-resize';

type LayoutSelectorProps = {
	containerRef: React.RefObject<HTMLDivElement>;
	listLayout: MailsListLayout;
	splitLayoutOrientation: MailsSplitLayoutOrientation;
	folderView: React.ReactNode;
	detailPanel: React.ReactNode;
};

export const LayoutSelector = ({
	folderView,
	detailPanel,
	containerRef,
	listLayout,
	splitLayoutOrientation
}: LayoutSelectorProps): React.JSX.Element => {
	const [lastSavedViewSizes] = useLocalStorage<Partial<SizeAndPosition>>(
		LOCAL_STORAGE_VIEW_SIZES,
		{}
	);

	const isVerticalSplit = useMemo(
		() =>
			listLayout === MAILS_VIEW_LAYOUTS.SPLIT &&
			splitLayoutOrientation === MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL,
		[listLayout, splitLayoutOrientation]
	);

	const isHorizontalSplit = useMemo(
		() =>
			listLayout === MAILS_VIEW_LAYOUTS.SPLIT &&
			splitLayoutOrientation === MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL,
		[listLayout, splitLayoutOrientation]
	);

	const containerOrientation = useMemo(() => {
		if (isVerticalSplit) {
			return 'horizontal';
		}

		if (isHorizontalSplit) {
			return 'vertical';
		}

		return 'vertical';
	}, [isHorizontalSplit, isVerticalSplit]);

	const maxWidth = isVerticalSplit ? 'calc(100% - 22.5rem)' : '100%';

	const maxHeight = isHorizontalSplit ? 'calc(100% - 11.25rem)' : '100%';

	useEffect(() => {
		if (containerRef.current) {
			if (isVerticalSplit) {
				if (lastSavedViewSizes?.width) {
					// eslint-disable-next-line no-param-reassign
					containerRef.current.style.width = `${lastSavedViewSizes?.width}px`;
				} else {
					// eslint-disable-next-line no-param-reassign
					containerRef.current.style.width = `60%`;
				}
			} else {
				// eslint-disable-next-line no-param-reassign
				containerRef.current.style.width = `100%`;
			}
		}
	}, [
		containerRef,
		listLayout,
		lastSavedViewSizes?.width,
		splitLayoutOrientation,
		isVerticalSplit
	]);

	useEffect(() => {
		if (containerRef.current) {
			if (isHorizontalSplit) {
				if (lastSavedViewSizes?.height) {
					// eslint-disable-next-line no-param-reassign
					containerRef.current.style.height = `${lastSavedViewSizes?.height}px`;
				} else {
					// eslint-disable-next-line no-param-reassign
					containerRef.current.style.height = `50%`;
				}
			} else {
				// eslint-disable-next-line no-param-reassign
				containerRef.current.style.height = `100%`;
			}
		}
	}, [
		listLayout,
		lastSavedViewSizes?.height,
		containerRef,
		splitLayoutOrientation,
		isHorizontalSplit
	]);

	const { pathname } = useLocation();
	const match = matchPath<{ itemId?: string }>(
		pathname,
		`/${MAILS_ROUTE}/folder/:folderId/:type?/:itemId?`
	);
	return (
		<Container
			data-testid={'LayoutSelectorOuterContainer'}
			orientation={containerOrientation}
			mainAlignment="flex-start"
		>
			{(listLayout === MAILS_VIEW_LAYOUTS.SPLIT ||
				(!match?.params?.itemId && listLayout === MAILS_VIEW_LAYOUTS.FULL)) && (
				<Container
					data-testid={'LayoutSelectorInnerContainer'}
					ref={containerRef}
					minHeight={'11.25rem'}
					minWidth={'22.5rem'}
					maxHeight={maxHeight}
					maxWidth={maxWidth}
					style={{ flexShrink: 0 }}
				>
					{folderView}
				</Container>
			)}
			{(listLayout === MAILS_VIEW_LAYOUTS.SPLIT ||
				(match?.params?.itemId && listLayout === MAILS_VIEW_LAYOUTS.FULL)) &&
				detailPanel}
		</Container>
	);
};
