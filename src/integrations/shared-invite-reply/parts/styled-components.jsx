/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import styled from 'styled-components';
import { Container, Text } from '@zextras/carbonio-design-system';

export const Square = styled.div`
	width: 18px;
	height: 18px;
	position: relative;
	top: -3px;
	border: 1px solid ${({ theme }) => theme.palette.gray2.regular};
	background: ${({ color }) => color};
	border-radius: 4px;
`;
export const ColorContainer = styled(Container)`
	border-bottom: 1px solid ${({ theme }) => theme.palette.gray2.regular};
`;

export const TextUpperCase = styled(Text)`
	text-transform: capitalize;
`;
