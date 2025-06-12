/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Theme } from '@emotion/react';
import { Container, Icon, Padding, Row, Text, useTheme } from '@zextras/carbonio-design-system';

function getBannerContainerStyle({ theme }: { theme: Theme }): {
	borderBottom: string;
	padding: string;
	display: 'flex';
	flexDirection: 'row';
	alignItems: string;
	height: string;
	borderRadius: string;
} {
	return {
		borderBottom: `0.0625rem solid ${theme.palette.warning.regular}`,
		padding: '0.5rem 1rem',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		height: '3.625rem',
		borderRadius: '0.125rem 0.125rem 0 0'
	};
}

type WarningBannerProps = {
	warningLabel: string;
	children: React.ReactNode;
};
export const WarningBanner = ({
	warningLabel,
	children
}: WarningBannerProps): React.JSX.Element => {
	const theme = useTheme();

	return (
		<Container
			orientation="horizontal"
			mainAlignment="space-between"
			crossAlignment="center"
			padding={{ all: 'large' }}
			height="3.625rem"
			background="#FFF7DE"
			width="100%"
			style={getBannerContainerStyle({ theme })}
		>
			<Row
				height="fit"
				orientation="vertical"
				display="flex"
				wrap="nowrap"
				mainAlignment="flex-start"
				style={{
					flexGrow: 1,
					flexDirection: 'row'
				}}
			>
				<Padding right="large">
					<Icon icon="AlertTriangleOutline" color="warning" size="large" />
				</Padding>
				<Text overflow="break-word" size="small">
					{warningLabel}
				</Text>
			</Row>
			<Row
				height="fit"
				orientation="vertical"
				display="flex"
				wrap="nowrap"
				mainAlignment="flex-end"
				padding={{ left: 'small' }}
				style={{
					flexGrow: 1,
					flexDirection: 'row'
				}}
			>
				{children}
			</Row>
		</Container>
	);
};
