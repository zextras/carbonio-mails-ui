/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Row, Text } from '@zextras/carbonio-design-system';

import { isItemRead, showFragment } from './utils/utils';
import { MailMessage } from '../../../../types';

export const MessageFragment = ({
	isConvChildren,
	fragment,
	read
}: {
	isConvChildren: boolean;
	fragment: MailMessage['fragment'];
	read: MailMessage['read'];
}): React.JSX.Element | null => {
	const fragmentLabel = useMemo(
		() => (isConvChildren ? fragment : ` - ${fragment}`),
		[fragment, isConvChildren]
	);
	const weight = useMemo<'regular' | 'bold'>(() => (isItemRead(read) ? 'regular' : 'bold'), [read]);
	if (!showFragment(fragment)) return null;
	return (
		<Row takeAvailableSpace mainAlignment="flex-start" padding={{ left: 'extrasmall' }}>
			<Text data-testid="Fragment" size="small" color="secondary" weight={weight}>
				{fragmentLabel}
			</Text>
		</Row>
	);
};
