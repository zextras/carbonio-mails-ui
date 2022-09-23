/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';
import { t } from '@zextras/carbonio-shell-ui';
import { Icon, Padding, Text } from '@zextras/carbonio-design-system';
import * as StyledComp from './edit-view-styled-components';

const WarningBanner: FC = () => (
	<>
		<StyledComp.BannerContainer
			orientation="horizontal"
			mainAlignment="flex-start"
			crossAlignment="center"
			background="gray6"
			height="fit"
			padding={{ all: 'large' }}
		>
			<Padding right="large">
				<Icon icon="AlertCircleOutline" color="info" size="large" />
			</Padding>
			<Text>
				{t(
					'message.sending_mail_to_self',
					"It looks like you're about to send an e-mail to yourself"
				)}
			</Text>
		</StyledComp.BannerContainer>
		<Padding bottom="small" />
	</>
);

export default WarningBanner;
