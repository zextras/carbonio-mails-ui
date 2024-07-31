/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { DropdownItem, MultiButton, Tooltip } from '@zextras/carbonio-design-system';
import { useLocalStorage } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { LOCAL_STORAGE_LAYOUT, MAILS_VIEW_LAYOUTS } from '../../../../constants';
import type { MailsListLayout } from '../../../folder-view';

export const LayoutComponent = (): React.JSX.Element => {
	const [t] = useTranslation();
	const [listLayout, setListLayout] = useLocalStorage<MailsListLayout>(
		LOCAL_STORAGE_LAYOUT,
		MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT
	);

	const layoutsInfo = {
		vertical: {
			id: MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM,
			label: t('layoutView.tooltip.vertical', 'Vertical view'),
			icon: 'LayoutOutline'
		},
		horizontal: {
			id: MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT,
			label: t('layoutView.tooltip.horizontal', 'Horizontal view'),
			icon: 'BottomViewOutline'
		},
		hidePreview: {
			id: MAILS_VIEW_LAYOUTS.HIDE_PREVIEW,
			label: t('layoutView.tooltip.hidePreview', 'Hide preview'),
			icon: 'Airplane'
		}
	};

	// FIXME
	const tooltipLabel = useMemo(
		() =>
			listLayout === MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT
				? t('layoutView.tooltip.horizontal', 'Horizontal view')
				: t('layoutView.tooltip.vertical', 'Vertical view'),
		[t, listLayout]
	);

	// FIXME
	const onClick = useCallback(() => {
		setListLayout((prevValue) =>
			prevValue === MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT
				? MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM
				: MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT
		);
	}, [setListLayout]);

	// FIXME
	const icon = useMemo(
		() => (listLayout === MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT ? 'BottomViewOutline' : 'LayoutOutline'),
		[listLayout]
	);

	const layoutOptions: Array<DropdownItem> = [
		{
			id: MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM,
			label: layoutsInfo.vertical.label,
			icon: layoutsInfo.vertical.icon,
			onClick: () => console.log('secondary action')
		},
		{
			id: MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT,
			label: layoutsInfo.horizontal.label,
			icon: layoutsInfo.horizontal.icon,
			onClick: () => console.log('secondary action')
		},
		{
			id: MAILS_VIEW_LAYOUTS.HIDE_PREVIEW,
			label: layoutsInfo.hidePreview.label,
			icon: layoutsInfo.hidePreview.icon,
			onClick: () => console.log('secondary action')
		}
	];

	return (
		<Tooltip label={tooltipLabel} placement="top">
			<MultiButton primaryIcon={icon} type={'ghost'} onClick={onClick} items={layoutOptions} />
		</Tooltip>
	);
};
