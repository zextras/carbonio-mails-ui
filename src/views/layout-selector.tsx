/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, Suspense, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { Spinner, useLocalStorage } from '@zextras/carbonio-shell-ui';

import { LOCAL_STORAGE_VIEW_SIZES } from '../constants';
import { SizeAndPosition } from '../hooks/use-resize';

const LazyDetailPanel = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/detail-panel')
);

type LayoutSelectorProps = {
	containerRef: React.RefObject<HTMLDivElement>;
	isColumnView: boolean;
	children: React.ReactNode;
};

export const LayoutSelector = ({
	children,
	containerRef,
	isColumnView
}: LayoutSelectorProps): React.JSX.Element => {
	const hidePreview = true;

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
			return '40%';
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
				minHeight={'3rem'}
				minWidth={'3rem'}
				style={{ flexShrink: 0 }}
			>
				{children}
			</Container>
			{!hidePreview && (
				<Suspense fallback={<Spinner />}>
					<LazyDetailPanel />
				</Suspense>
			)}
		</Container>
	);
};
