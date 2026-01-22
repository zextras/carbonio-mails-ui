/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import styled from '@emotion/styled';
import { Container, PaletteColor } from '@zextras/carbonio-design-system';

export const HoverBarContainer = styled(Container)<{ $hoverBackground: PaletteColor }>`
	top: 0;
	right: 0;
	display: none;
	position: absolute;
	width: fit-content;
	height: 45%;
	background: linear-gradient(
		to right,
		transparent,
		${({ $hoverBackground, theme }): string => theme.palette[$hoverBackground].hover} 1rem,
		${({ $hoverBackground, theme }): string => theme.palette[$hoverBackground].hover} 100%
	);
	padding-right: 0.5rem;
	padding-left: 2rem;
	padding-top: 0.5rem;
`;
