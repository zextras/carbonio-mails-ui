/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FC } from 'react';

import { ListItemProps } from '@zextras/carbonio-design-system';

import { CustomListItem } from '../../../../carbonio-ui-commons/components/list/list-item';

export function getCustomListItem(): FC<ListItemProps> {
	return CustomListItem;
}
