/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';

export const ScrollableContainer = ({
	children
}: {
	children: ReactElement;
}): React.JSX.Element => (
	<Container
		padding={{ horizontal: 'medium', vertical: 'small' }}
		mainAlignment={'flex-start'}
		style={{
			overflowY: 'auto',
			height: 'fit-content'
		}}
	>
		{children}
	</Container>
);
