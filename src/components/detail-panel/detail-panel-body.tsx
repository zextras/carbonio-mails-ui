/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';

export const DetailPanelBody = ({ children }: React.PropsWithChildren): React.JSX.Element => (
	<Container height="fit" mainAlignment="flex-start" background="gray5">
		{children}
	</Container>
);
