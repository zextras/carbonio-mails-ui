/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Row, Text } from '@zextras/carbonio-design-system';

import { showFragment } from './utils/utils';

export const MessageFragment = ({
	isConvChildren,
	fragment,
	read
}: {
	isConvChildren: boolean;
	fragment: string | undefined;
	read: boolean;
}): React.JSX.Element | null => {
	const fragmentLabel = useMemo(
		() => (isConvChildren ? fragment : ` - ${fragment}`),
		[fragment, isConvChildren]
	);
	const weight = useMemo<'regular' | 'bold'>(() => {
		if (typeof read === 'undefined') return 'regular';
		return read ? 'regular' : 'bold';
	}, [read]);
	if (!showFragment(fragment)) return null;
	return (
		<Row takeAvailableSpace mainAlignment="flex-start" padding={{ left: 'extrasmall' }}>
			<Text data-testid="Fragment" size="small" color="secondary" weight={weight}>
				{fragmentLabel}
			</Text>
		</Row>
	);
};
