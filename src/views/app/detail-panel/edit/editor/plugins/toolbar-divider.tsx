/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';

export const ToolbarDivider = (): React.JSX.Element => (
	<Container
		width="0.0625rem"
		height="1.5rem"
		background={'gray3'}
		margin={{ left: 'extrasmall', right: 'extrasmall' }}
	/>
);
