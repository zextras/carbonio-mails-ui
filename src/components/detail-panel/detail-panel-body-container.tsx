/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';

export const DetailPanelBodyContainer = ({
	children
}: React.PropsWithChildren): React.JSX.Element => (
	<Container
		style={{ overflowY: 'auto' }}
		height="fill"
		background="gray5"
		padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
		mainAlignment="flex-start"
	>
		{children}
	</Container>
);
