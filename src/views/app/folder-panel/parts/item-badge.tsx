/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Badge } from '@zextras/carbonio-design-system';

export const ItemBadge = ({
	itemReadValue,
	value,
	dataTestId = 'FolderBadge'
}: {
	itemReadValue: boolean | undefined;
	value: string | number;
	dataTestId?: string;
}): React.JSX.Element => {
	const badgeReadValue = useMemo<'read' | 'unread'>(() => {
		if (itemReadValue === undefined) return 'read';
		return itemReadValue ? 'read' : 'unread';
	}, [itemReadValue]);
	return (
		<Badge
			data-testid={dataTestId}
			value={value}
			backgroundColor={badgeReadValue === 'unread' ? 'primary' : 'gray2'}
			color={badgeReadValue === 'unread' ? 'gray6' : 'gray0'}
		/>
	);
};
