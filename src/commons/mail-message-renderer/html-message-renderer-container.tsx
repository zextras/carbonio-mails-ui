/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';

export const HtmlMessageRendererContainer = ({ html }: { html: string }): React.JSX.Element => (
	<Container
		width={'fit'}
		height={'100%'}
		data-testid="message-renderer-container"
		style={{ overflowY: 'auto', overflowX: 'hidden', padding: '0.75rem 0px' }}
		dangerouslySetInnerHTML={{
			__html: html
		}}
	/>
);
