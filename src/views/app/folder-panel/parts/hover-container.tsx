/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Theme } from '@emotion/react';
import styled, { StyledComponent } from '@emotion/styled/macro';
import { Container, ContainerProps } from '@zextras/carbonio-design-system';

import { HoverBarContainer } from 'views/app/folder-panel/parts/hover-bar-container';

export const HoverContainer: StyledComponent<ContainerProps & { $hoverBackground: keyof Theme['palette'] }> = styled(
	Container
)<{ $hoverBackground: keyof Theme['palette'] }>`
	width: 100%;
	position: relative;
	cursor: pointer;
	text-decoration: none;
	background: transparent;

	&:hover {
		background: ${({ $hoverBackground, theme }): string =>
			theme?.palette[$hoverBackground]?.hover || 'primary'};

		& ${HoverBarContainer} {
			display: flex;
		}
	}
`;
