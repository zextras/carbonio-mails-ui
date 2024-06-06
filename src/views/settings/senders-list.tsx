/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Divider, TextWithTooltip } from '@zextras/carbonio-design-system';

import type { InputProps } from '../../types';

export const SendersList = ({ settingsObj, updateSettings }: InputProps): React.JSX.Element => (
	<Container background="gray6" padding={{ horizontal: 'medium', bottom: 'large' }}>
		<Container orientation="horizontal" padding={{ horizontal: 'medium', top: 'medium' }}>
			<Container id={sectionTitle.id}>
				<Heading title={sectionTitle.label} size="medium" />
			</Container>
			<Container width="auto" crossAlignment="flex-end">
				<TextWithTooltip size="extrasmall">{message}</TextWithTooltip>
			</Container>
		</Container>
		<Divider />
		<Container
			padding={{ all: 'medium', bottom: 'small' }}
			orientation="horizontal"
			mainAlignment="flex-start"
		></Container>
	</Container>
);
