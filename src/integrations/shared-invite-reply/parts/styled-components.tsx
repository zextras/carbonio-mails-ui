/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode } from 'react';

import { Container, ContainerProps, useTheme } from '@zextras/carbonio-design-system';

export const Square = ({ color }: { color: string }): React.JSX.Element => {
	const theme = useTheme();

	return (
		<div
			style={{
				width: '1.125rem',
				height: '1.125rem',
				position: 'relative',
				top: '-0.1875rem',
				border: `0.0625rem solid ${theme.palette.gray2.regular}`,
				background: color,
				borderRadius: '0.25rem'
			}}
		/>
	);
};

export const ColorContainer = ({
	disabled,
	children,
	...rest
}: {
	disabled?: boolean;
	children: ReactNode;
} & ContainerProps &
	React.RefAttributes<HTMLDivElement>): React.JSX.Element => {
	const theme = useTheme();
	return (
		<Container
			{...rest}
			style={{
				borderBottom: `0.0625rem solid ${theme.palette.gray2.regular}`,
				cursor: disabled ? 'no-drop' : 'pointer'
			}}
		>
			{children}
		</Container>
	);
};
