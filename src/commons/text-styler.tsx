/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { HTMLAttributes } from 'react';

import styled from '@emotion/styled';

// TODO add supports for 	italic, strikethrough and underlined
export type TextStylerProps = HTMLAttributes<HTMLSpanElement> & {
	bold?: boolean;
};

const StyledSpan = styled.span<{ $bold?: boolean }>`
	display: inline-block;
	font-weight: ${({ $bold }): false | undefined | string => $bold && 'bold'};
`;

export const TextStyler = React.forwardRef<HTMLSpanElement, TextStylerProps>(function TextStylerFn(
	{ children, bold, ...rest },
	ref
) {
	return (
		<StyledSpan ref={ref} $bold={bold} {...rest}>
			{children}
		</StyledSpan>
	);
});
