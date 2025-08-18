/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Container, Icon, Padding, Row, Text } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

const BannerContainer = styled(Container)`
	border-bottom: 0.0625rem solid ${(props): string => props.theme.palette.warning.regular};
	padding: 0.5rem 1rem;
	display: flex;
	flex-direction: row;
	align-items: center;
	height: 3.625rem;
	border-radius: 0.125rem 0.125rem 0 0;
`;

type WarningBannerProps = {
	warningLabel: string;
	children: React.ReactNode;
};
export const WarningBanner = ({
	warningLabel,
	children
}: WarningBannerProps): React.JSX.Element => (
	<BannerContainer
		orientation="horizontal"
		mainAlignment="space-between"
		crossAlignment="center"
		padding={{ all: 'large' }}
		height="3.625rem"
		background="#FFF7DE"
		width="100%"
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
	</BannerContainer>
);
