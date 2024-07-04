/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
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
	const tooltipLabel = useMemo(
		() =>
			listLayout === MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT
				? t('layoutView.tooltip.horizontal', 'Horizontal view')
				: t('layoutView.tooltip.vertical', 'Vertical view'),
		[t, listLayout]
	);

	const onClick = useCallback(() => {
		setListLayout((prevValue) =>
			prevValue === MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT
				? MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM
				: MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT
		);
	}, [setListLayout]);

	const icon = useMemo(
		() => (listLayout === MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT ? 'BottomViewOutline' : 'LayoutOutline'),
		[listLayout]
	);

	return (
		<Tooltip label={tooltipLabel} placement="top">
			<IconButton icon={icon} size="large" onClick={onClick} />
		</Tooltip>
	);
};
