/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { matchPath, useLocation } from 'react-router-dom';

import { MAILS_ROUTE } from '../constants';
import { useViewLayout } from '../hooks/use-view-layout';

type LayoutSelectorProps = {
	containerRef: React.RefObject<HTMLDivElement>;
	folderView: React.ReactNode;
	detailPanel: React.ReactNode;
};

export const LayoutSelector = ({
	folderView,
	detailPanel,
	containerRef
}: LayoutSelectorProps): React.JSX.Element => {
	const {
		isCurrentLayoutSplit,
		isCurrentLayoutNoSplit,
		isCurrentLayoutVerticalSplit,
		isCurrentLayoutHorizontalSplit,
		listContainerGeometry
	} = useViewLayout();

	const containerOrientation = useMemo(() => {
		if (isCurrentLayoutVerticalSplit) {
			return 'horizontal';
		}

		if (isCurrentLayoutHorizontalSplit) {
			return 'vertical';
		}

		return 'vertical';
	}, [isCurrentLayoutHorizontalSplit, isCurrentLayoutVerticalSplit]);

	const maxWidth = isCurrentLayoutVerticalSplit ? 'calc(100% - 22.5rem)' : '100%';

	const maxHeight = isCurrentLayoutHorizontalSplit ? 'calc(100% - 11.25rem)' : '100%';

	useEffect(() => {
		if (containerRef.current) {
			if (isCurrentLayoutVerticalSplit) {
				if (listContainerGeometry?.width) {
					// eslint-disable-next-line no-param-reassign
					containerRef.current.style.width = `${listContainerGeometry?.width}px`;
				} else {
					// eslint-disable-next-line no-param-reassign
					containerRef.current.style.width = `60%`;
				}
			} else {
				// eslint-disable-next-line no-param-reassign
				containerRef.current.style.width = `100%`;
			}
		}
	}, [containerRef, listContainerGeometry?.width, isCurrentLayoutVerticalSplit]);

	useEffect(() => {
		if (containerRef.current) {
			if (isCurrentLayoutHorizontalSplit) {
				if (listContainerGeometry?.height) {
					// eslint-disable-next-line no-param-reassign
					containerRef.current.style.height = `${listContainerGeometry?.height}px`;
				} else {
					// eslint-disable-next-line no-param-reassign
					containerRef.current.style.height = `50%`;
				}
			} else {
				// eslint-disable-next-line no-param-reassign
				containerRef.current.style.height = `100%`;
			}
		}
	}, [listContainerGeometry?.height, containerRef, isCurrentLayoutHorizontalSplit]);

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
			{(isCurrentLayoutSplit || (!match?.params?.itemId && isCurrentLayoutNoSplit)) && (
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
			{(isCurrentLayoutSplit || (match?.params?.itemId && isCurrentLayoutNoSplit)) && detailPanel}
		</Container>
	);
};
