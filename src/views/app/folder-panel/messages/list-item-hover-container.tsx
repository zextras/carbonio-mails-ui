/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import styled, { DefaultTheme } from 'styled-components';

const HoverBarContainer = styled(Container)<{ background: keyof DefaultTheme['palette'] }>`
	top: 0;
	right: 0;
	display: none;
	position: absolute;
	background: linear-gradient(
		to right,
		transparent,
		${({ background, theme }): string => theme.palette[background].hover}
	);
	width: calc(100% - 4rem);
	height: 45%;

	& > * {
		margin-top: ${({ theme }): string => theme.sizes.padding.small};
		margin-right: ${({ theme }): string => theme.sizes.padding.small};
	}
`;

export const ListItemHoverContainer = styled(Container).attrs(() => ({
	background: 'transparent'
}))<{ $hoverBackground: keyof DefaultTheme['palette'] }>`
	width: 100%;
	position: relative;
	cursor: pointer;
	text-decoration: none;

	&:hover {
		background: ${({ $hoverBackground, theme }): string => theme.palette[$hoverBackground].hover};

		& ${HoverBarContainer} {
			display: flex;
		}
	}
`;
