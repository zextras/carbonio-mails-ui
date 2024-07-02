/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useLocalStorage } from '@zextras/carbonio-shell-ui';

import { LOCAL_STORAGE_LAYOUT, MAILS_VIEW_LAYOUTS } from '../../../../constants';
import type { MailsListLayout } from '../../../app-view';

export const LayoutComponent = (): React.JSX.Element => {
	const [listLayout, setListLayout] = useLocalStorage<MailsListLayout>(
		LOCAL_STORAGE_LAYOUT,
		MAILS_VIEW_LAYOUTS.VERTICAL
	);
	const tooltipLabel = useMemo(
		() => (listLayout === MAILS_VIEW_LAYOUTS.VERTICAL ? 'Horizontal view' : 'Vertical view'),
		[listLayout]
	);

	const onClick = useCallback(() => {
		setListLayout((prevValue) =>
			prevValue === MAILS_VIEW_LAYOUTS.VERTICAL
				? MAILS_VIEW_LAYOUTS.HORIZONTAL
				: MAILS_VIEW_LAYOUTS.VERTICAL
		);
	}, [setListLayout]);

	const icon = useMemo(
		() => (listLayout === MAILS_VIEW_LAYOUTS.VERTICAL ? 'BottomViewOutline' : 'LayoutOutline'),
		[listLayout]
	);

	return (
		<Tooltip label={tooltipLabel} placement="top">
			<IconButton icon={icon} size="large" onClick={onClick} />
		</Tooltip>
	);
};
