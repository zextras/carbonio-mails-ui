/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useLocalStorage } from '@zextras/carbonio-shell-ui';

import type { MailsListLayout } from './app-view';
import { LOCAL_STORAGE_VIEW_SIZES, MAILS_VIEW_LAYOUTS } from '../constants';
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
		if (listLayout === MAILS_VIEW_LAYOUTS.VERTICAL) {
			return MAILS_VIEW_LAYOUTS.HORIZONTAL;
		}
		if (listLayout === MAILS_VIEW_LAYOUTS.HORIZONTAL) {
			return MAILS_VIEW_LAYOUTS.VERTICAL;
		}
		return MAILS_VIEW_LAYOUTS.DEFAULT;
	}, [listLayout]);

	useEffect(() => {
		if (containerRef.current) {
			if (listLayout === MAILS_VIEW_LAYOUTS.VERTICAL) {
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
			if (listLayout === MAILS_VIEW_LAYOUTS.HORIZONTAL) {
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
		<Container orientation={orientation} mainAlignment="flex-start">
			<Container
				ref={containerRef}
				minHeight={'11.25rem'}
				minWidth={'22.5rem'}
				style={{ flexShrink: 0 }}
			>
				{folderView}
			</Container>
			{detailPanel}
		</Container>
	);
};
