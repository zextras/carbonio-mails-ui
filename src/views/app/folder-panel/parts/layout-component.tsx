/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { DropdownItem, MultiButton, Tooltip } from '@zextras/carbonio-design-system';
import { useLocalStorage } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import {
	LOCAL_STORAGE_LAYOUT,
	LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION,
	MAILS_VIEW_LAYOUTS,
	MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS
} from '../../../../constants';
import type { MailsListLayout, MailsSplitLayoutOrientation } from '../../../folder-view';

export const LayoutComponent = (): React.JSX.Element => {
	const [t] = useTranslation();
	const [listLayout, setListLayout] = useLocalStorage<MailsListLayout>(
		LOCAL_STORAGE_LAYOUT,
		MAILS_VIEW_LAYOUTS.SPLIT
	);

	const [splitLayoutOrientation, setSplitLayoutOrientation] =
		useLocalStorage<MailsSplitLayoutOrientation>(
			LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION,
			MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		);

	const tooltipLabel = useMemo(() => {
		if (listLayout === MAILS_VIEW_LAYOUTS.SPLIT) {
			return t('layoutView.tooltip.switchToFull', 'Hide preview');
		}
		if (splitLayoutOrientation === MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL) {
			return t('layoutView.tooltip.switchToHorizontal', 'Switch to horizontal');
		}
		return t('layoutView.tooltip.switchToVertical', 'Switch to vertical');
	}, [listLayout, splitLayoutOrientation, t]);

	const icon = useMemo(() => {
		if (listLayout === MAILS_VIEW_LAYOUTS.SPLIT) {
			return 'Airplane';
		}
		if (splitLayoutOrientation === MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL) {
			return 'BottomViewOutline';
		}
		return 'LayoutOutline';
	}, [listLayout, splitLayoutOrientation]);

	const onToggle = useCallback(() => {
		setListLayout((prevValue) =>
			prevValue === MAILS_VIEW_LAYOUTS.FULL ? MAILS_VIEW_LAYOUTS.SPLIT : MAILS_VIEW_LAYOUTS.FULL
		);
	}, [setListLayout]);

	const onClickVerticalSplit = useCallback(() => {
		setListLayout(MAILS_VIEW_LAYOUTS.SPLIT);
		setSplitLayoutOrientation(MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL);
	}, [setListLayout, setSplitLayoutOrientation]);

	const onClickHorizontalSplit = useCallback(() => {
		setListLayout(MAILS_VIEW_LAYOUTS.SPLIT);
		setSplitLayoutOrientation(MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL);
	}, [setListLayout, setSplitLayoutOrientation]);

	const onClickHidePreview = useCallback(() => {
		setListLayout(MAILS_VIEW_LAYOUTS.FULL);
	}, [setListLayout]);

	const layoutOptions: Array<DropdownItem> = [
		{
			id: 'vertical',
			label: t('layoutView.tooltip.vertical', 'Vertical view'),
			icon: 'LayoutOutline',
			onClick: onClickVerticalSplit
		},
		{
			id: 'horizontal',
			label: t('layoutView.tooltip.horizontal', 'Horizontal view'),
			icon: 'BottomViewOutline',
			onClick: onClickHorizontalSplit
		},
		{
			id: 'hidePreview',
			label: t('layoutView.tooltip.hidePreview', 'Hide preview'),
			icon: 'Airplane',
			onClick: onClickHidePreview
		}
	];

	return (
		<Tooltip label={tooltipLabel} placement="top">
			<MultiButton primaryIcon={icon} type={'ghost'} onClick={onToggle} items={layoutOptions} />
		</Tooltip>
	);
};
