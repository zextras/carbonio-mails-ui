/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { HTMLAttributes } from 'react';
import React from 'react';

import styled from '@emotion/styled';
import { AnyColor, getColor } from '@zextras/carbonio-design-system';

export type MakeRequired<TObj, TKey extends keyof TObj> = TObj & Required<Pick<TObj, TKey>>;

interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
	/** Divider color */
	color?: AnyColor;
	orientation?: 'horizontal' | 'vertical';
}

const HorizontalDividerEl = styled.div<{ color: AnyColor }>`
	box-sizing: border-box;
	background-color: ${({ theme, color }): string => getColor(color, theme)};
	height: 0.0625rem;
	max-height: 0.0625rem;
	min-height: 0.0625rem;
	width: 100%;
`;

const VerticalDividerEl = styled.div<{ color: AnyColor }>`
	box-sizing: border-box;
	background-color: ${({ theme, color }): string => getColor(color, theme)};
	height: 100%;
	max-width: 0.0625rem;
	min-width: 0.0625rem;
	width: 0.0625rem;
`;

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(function DividerFn(
	{ color = 'gray2', orientation = 'horizontal', ...rest },
	ref
) {
	return orientation === 'horizontal' ? (
		<HorizontalDividerEl ref={ref} color={color} data-testid={'divider'} {...rest} />
	) : (
		<VerticalDividerEl ref={ref} color={color} data-testid={'divider'} {...rest} />
	);
});

export type { DividerProps };
export { Divider };
