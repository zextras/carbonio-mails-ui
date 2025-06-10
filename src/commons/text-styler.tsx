/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { HTMLAttributes } from 'react';

// TODO add supports for 	italic, strikethrough and underlined
export type TextStylerProps = HTMLAttributes<HTMLSpanElement> & {
	bold?: boolean;
};

export const TextStyler = React.forwardRef<HTMLSpanElement, TextStylerProps>(function TextStylerFn(
	{ children, bold, ...rest },
	ref
) {
	return (
		<span
			ref={ref}
			style={{ display: 'inline-block', fontWeight: bold ? 'bold' : 'regular' }}
			{...rest}
		>
			{children}
		</span>
	);
});
