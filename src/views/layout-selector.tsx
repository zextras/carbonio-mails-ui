/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useLocalStorage } from '@zextras/carbonio-shell-ui';

import { LOCAL_STORAGE_VIEW_SIZES } from '../constants';
import { SizeAndPosition } from '../hooks/use-resize';

type LayoutSelectorProps = {
	containerRef: React.RefObject<HTMLDivElement>;
	isColumnView: boolean;
	folderView: React.ReactNode;
	detailPanel: React.ReactNode;
};

export const LayoutSelector = ({
	folderView,
	detailPanel,
	containerRef,
	isColumnView
}: LayoutSelectorProps): React.JSX.Element => {
	const [lastSavedViewSizes] = useLocalStorage<Partial<SizeAndPosition>>(
		LOCAL_STORAGE_VIEW_SIZES,
		{}
	);

	const orientation = useMemo(() => (isColumnView ? 'horizontal' : 'vertical'), [isColumnView]);

	const width = useMemo(() => {
		if (isColumnView) {
			if (lastSavedViewSizes?.width) {
				return `${lastSavedViewSizes?.width}px`;
			}
			return '60%';
		}
		return '100%';
	}, [isColumnView, lastSavedViewSizes?.width]);

	const height = useMemo(() => {
		if (!isColumnView) {
			if (lastSavedViewSizes?.height) {
				return `${lastSavedViewSizes?.height}px`;
			}
			return '50%';
		}
		return '100%';
	}, [isColumnView, lastSavedViewSizes?.height]);

	return (
		<Container orientation={orientation} mainAlignment="flex-start">
			<Container
				ref={containerRef}
				width={width}
				height={height}
				minHeight={'5rem'}
				minWidth={'3rem'}
				style={{ flexShrink: 0 }}
			>
				{folderView}
			</Container>
			{detailPanel}
		</Container>
	);
};
