/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';

import { HeaderNavigationActionItem } from '../../../../../hooks/use-preview-header-navigation';

export const NavigationIconButton = ({
	item
}: {
	item: HeaderNavigationActionItem;
}): React.JSX.Element => (
	<Tooltip label={item.tooltipLabel}>
		<IconButton
			onClick={item.action}
			customSize={{
				iconSize: 'medium',
				paddingSize: 'small'
			}}
			disabled={item.disabled}
			icon={item.icon}
		/>
	</Tooltip>
);
