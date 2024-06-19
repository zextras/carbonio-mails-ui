/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import styled, { DefaultTheme } from 'styled-components';

import { HoverBarContainer } from './hover-bar-container';

export const HoverContainer = styled(Container).attrs(() => ({
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
