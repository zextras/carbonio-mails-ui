/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useLocalStorage } from '@zextras/carbonio-shell-ui';

import type { MailsListLayout } from './folder-view';
import {
	LOCAL_STORAGE_VIEW_SIZES,
	MAILS_VIEW_LAYOUTS,
	MAILS_VIEW_ORIENTATIONS
} from '../constants';
import { SizeAndPosition } from '../hooks/use-resize';

type LayoutSelectorProps = {
	containerRef: React.RefObject<HTMLDivElement>;
	listLayout: MailsListLayout;
	folderView: React.ReactNode;
	detailPanel: React.ReactNode;
};

export const LayoutSelector = ({
	folderView,
	detailPanel,
	containerRef,
	listLayout
}: LayoutSelectorProps): React.JSX.Element => {
	const [lastSavedViewSizes] = useLocalStorage<Partial<SizeAndPosition>>(
		LOCAL_STORAGE_VIEW_SIZES,
		{}
	);

	const orientation = useMemo(() => {
		if (listLayout === MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT) {
			return MAILS_VIEW_ORIENTATIONS.HORIZONTAL;
		}
		if (listLayout === MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM) {
			return MAILS_VIEW_ORIENTATIONS.VERTICAL;
		}
		return MAILS_VIEW_ORIENTATIONS.VERTICAL;
	}, [listLayout]);

	useEffect(() => {
		if (containerRef.current) {
			if (listLayout === MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT) {
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
	}, [containerRef, listLayout, lastSavedViewSizes?.width]);

	useEffect(() => {
		if (containerRef.current) {
			if (listLayout === MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM) {
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
	}, [listLayout, lastSavedViewSizes?.height, containerRef]);

	return (
		<Container
			data-testid={'LayoutSelectorOuterContainer'}
			orientation={orientation}
			mainAlignment="flex-start"
		>
			<Container
				data-testid={'LayoutSelectorInnerContainer'}
				ref={containerRef}
				minHeight={'11.25rem'}
				minWidth={'22.5rem'}
				maxHeight={
					listLayout === MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT ? '100%' : 'calc(100% - 11.25rem)'
				}
				maxWidth={listLayout === MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT ? 'calc(100% - 22.5rem)' : '100%'}
				style={{ flexShrink: 0 }}
			>
				{folderView}
			</Container>
			{detailPanel}
		</Container>
	);
};
