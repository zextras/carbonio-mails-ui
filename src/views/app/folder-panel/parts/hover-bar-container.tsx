/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import styled from '@emotion/styled';
import { Container, PaletteColor } from '@zextras/carbonio-design-system';

export const HoverBarContainer = styled(Container)<{ $hoverBackground: PaletteColor }>`
	right: 0;
	display: none;
	position: absolute;
	background: linear-gradient(
		to right,
		transparent,
		${({ $hoverBackground, theme }): string => theme.palette[$hoverBackground].hover} 50%,
		${({ $hoverBackground, theme }): string => theme.palette[$hoverBackground].hover} 100%
	);
	width: calc(100% - 4rem);
	padding-right: 0.5rem;
`;
