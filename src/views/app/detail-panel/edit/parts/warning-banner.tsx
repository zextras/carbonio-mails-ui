/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Icon, IconProps, Padding, Text, Theme } from '@zextras/carbonio-design-system';

import * as StyledComp from 'views/app/detail-panel/edit/parts/edit-view-styled-components';

type WarningBannerProps = {
	text: string;
	icon: IconProps['icon'];
	iconColor: IconProps['color'];
	bottomBorderColor: keyof Theme['palette'];
};

export const WarningBanner = ({
	text,
	icon,
	iconColor,
	bottomBorderColor
}: WarningBannerProps): JSX.Element => (
	<StyledComp.BannerContainer
		orientation="horizontal"
		mainAlignment="flex-start"
		crossAlignment="center"
		background="gray6"
		height="fit"
		padding={{ all: 'large' }}
		$bottomBorderColor={bottomBorderColor}
	>
		<Padding right="large">
			<Icon icon={icon} color={iconColor} size="large" />
		</Padding>
		<Text>{text}</Text>
	</StyledComp.BannerContainer>
);
