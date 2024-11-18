/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Dropdown, DropdownItem } from '@zextras/carbonio-design-system';

export const ListItemDropdownAction = ({
	dropdownActions,
	children
}: {
	dropdownActions: DropdownItem[];
	children: React.JSX.Element;
}): React.JSX.Element => (
	<Dropdown
		contextMenu
		items={dropdownActions}
		display="block"
		style={{ width: '100%', height: '4rem' }}
		data-testid={`secondary-actions-menu`}
	>
		{children}
	</Dropdown>
);
