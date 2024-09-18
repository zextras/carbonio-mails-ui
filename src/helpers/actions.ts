/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { DropdownItem } from '@zextras/carbonio-design-system';

import { UIActionDescriptor } from '../types';

export const normalizeDropdownActionItem = (item: UIActionDescriptor): DropdownItem => ({
	id: item.id,
	icon: item.icon,
	label: item.label,
	onClick: item.execute
});
