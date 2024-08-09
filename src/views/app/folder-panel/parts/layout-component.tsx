/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { DropdownItem, MultiButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from '../../../../constants';
import { useViewLayout } from '../../../../hooks/use-view-layout';

export const LayoutComponent = (): React.JSX.Element => {
	const [t] = useTranslation();
	const {
		isCurrentLayoutSplit,
		isCurrentLayoutNoSplit,
		isCurrentLayoutVerticalSplit,
		isCurrentLayoutHorizontalSplit,
		setSplitLayoutOrientation,
		setCurrentLayout
	} = useViewLayout();

	const tooltipLabel = useMemo(() => {
		if (isCurrentLayoutSplit) {
			return t('layoutView.tooltip.switchToNoSplit', 'Switch to no split');
		}
		if (isCurrentLayoutHorizontalSplit) {
			return t('layoutView.tooltip.switchToHorizontal', 'Switch to horizontal split');
		}
		return t('layoutView.tooltip.switchToVertical', 'Switch to vertical split');
	}, [isCurrentLayoutHorizontalSplit, isCurrentLayoutSplit, t]);

	const icon = useMemo(() => {
		if (isCurrentLayoutSplit) {
			return 'ViewOffOutline';
		}
		if (isCurrentLayoutHorizontalSplit) {
			return 'BottomViewOutline';
		}
		return 'LayoutOutline';
	}, [isCurrentLayoutHorizontalSplit, isCurrentLayoutSplit]);

	const onToggle = useCallback(() => {
		setCurrentLayout(isCurrentLayoutSplit ? MAILS_VIEW_LAYOUTS.NO_SPLIT : MAILS_VIEW_LAYOUTS.SPLIT);
	}, [isCurrentLayoutSplit, setCurrentLayout]);

	const onClickVerticalSplit = useCallback(() => {
		setCurrentLayout(MAILS_VIEW_LAYOUTS.SPLIT);
		setSplitLayoutOrientation(MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL);
	}, [setCurrentLayout, setSplitLayoutOrientation]);

	const onClickHorizontalSplit = useCallback(() => {
		setCurrentLayout(MAILS_VIEW_LAYOUTS.SPLIT);
		setSplitLayoutOrientation(MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL);
	}, [setCurrentLayout, setSplitLayoutOrientation]);

	const onClickHidePreview = useCallback(() => {
		setCurrentLayout(MAILS_VIEW_LAYOUTS.NO_SPLIT);
	}, [setCurrentLayout]);

	const layoutOptions: Array<DropdownItem> = [
		{
			id: 'vertical',
			label: t('layoutView.tooltip.verticalSplit', 'Vertical split'),
			icon: 'LayoutOutline',
			onClick: onClickVerticalSplit,
			selected: isCurrentLayoutVerticalSplit
		},
		{
			id: 'horizontal',
			label: t('layoutView.tooltip.horizontalSplit', 'Horizontal split'),
			icon: 'BottomViewOutline',
			onClick: onClickHorizontalSplit,
			selected: isCurrentLayoutHorizontalSplit
		},
		{
			id: 'noSplit',
			label: t('layoutView.tooltip.noSplit', 'No split'),
			icon: 'ViewOffOutline',
			onClick: onClickHidePreview,
			selected: isCurrentLayoutNoSplit
		}
	];

	return (
		<Tooltip label={tooltipLabel} placement="top">
			<MultiButton
				size={'large'}
				primaryIcon={icon}
				type={'ghost'}
				onClick={onToggle}
				color={'gray0'}
				items={layoutOptions}
			/>
		</Tooltip>
	);
};
