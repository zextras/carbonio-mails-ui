/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

export const EmptyBody = (): React.JSX.Element => (
	<Container padding={{ bottom: 'medium' }}>
		<Text>{`(${t('messages.no_content', 'This message has no text content')}.)`}</Text>
	</Container>
);
