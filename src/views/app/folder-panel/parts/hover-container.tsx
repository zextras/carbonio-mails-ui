/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import styled from '@emotion/styled';
import { Container, ContainerProps, PaletteColor } from '@zextras/carbonio-design-system';

import { HoverBarContainer } from 'views/app/folder-panel/parts/hover-bar-container';

interface HoverContainerProps extends ContainerProps {
	$hoverBackground: PaletteColor;
}

const StyledContainer = styled(Container)<{ $hoverBackground: PaletteColor }>`
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

export const HoverContainer = React.forwardRef(function HoverContainerFn(
	props: HoverContainerProps,
	ref: React.Ref<HTMLDivElement>
) {
	return (
		<StyledContainer ref={ref} background={'transparent'} {...props}>
			{props.children}
		</StyledContainer>
	);
});
