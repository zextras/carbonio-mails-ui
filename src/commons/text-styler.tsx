/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { HTMLAttributes } from 'react';

import styled, { SimpleInterpolation } from 'styled-components';

// TODO add supports for 	italic, strikethrough and underlined
export type TextStylerProps = HTMLAttributes<HTMLSpanElement> & {
	bold?: boolean;
};

const StyledSpan = styled.span<TextStylerProps>`
	display: inline-block;
	font-weight: ${(props): SimpleInterpolation => props.bold && 'bold'};
`;

export const TextStyler = React.forwardRef<HTMLSpanElement, TextStylerProps>(function TextStylerFn(
	{ children, ...rest },
	ref
) {
	return (
		<StyledSpan ref={ref} {...rest}>
			{children}
		</StyledSpan>
	);
});
