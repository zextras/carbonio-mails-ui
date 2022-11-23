/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import styled from 'styled-components';
import { Container, Text } from '@zextras/carbonio-design-system';

export const Square = styled.div`
	width: 1.125rem;
	height: 1.125rem;
	position: relative;
	top: -0.1875rem;
	border: 0.0625rem solid ${({ theme }) => theme.palette.gray2.regular};
	background: ${({ color }) => color};
	border-radius: 0.25rem;
`;
export const ColorContainer = styled(Container)`
	border-bottom: 0.0625rem solid ${({ theme }) => theme.palette.gray2.regular};
	cursor: ${({ disabled }) => (disabled ? 'no-drop' : 'pointer')};
`;

export const TextUpperCase = styled(Text)`
	text-transform: capitalize;
`;
