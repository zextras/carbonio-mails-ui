/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';

export const DetailPanelCore = ({ children }: React.PropsWithChildren): React.JSX.Element => (
	<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
		{children}
	</Container>
);
