/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import {
	Container,
	ContainerProps,
	getPadding,
	Row,
	RowProps,
	Theme,
	useTheme
} from '@zextras/carbonio-design-system';

type GapContainerProps = ContainerProps & { gap?: ContainerProps['padding'] };

type GapRowProps = RowProps & { gap?: RowProps['padding'] };

const getStyledGapContainer = ({
	gap,
	theme
}: {
	gap?: ContainerProps['padding'];
	theme: Theme;
}): { gap: string | 0 | undefined } => ({ gap: gap && getPadding(gap, theme) });

const getGapRowStyle = ({
	gap,
	theme
}: {
	gap?: ContainerProps['padding'];
	theme: Theme;
}): { gap: string | 0 | undefined } => ({
	gap: gap && getPadding(gap, theme)
});

const GapContainer = React.forwardRef<HTMLDivElement, GapContainerProps>(function GapContainerFn(
	{ children, gap, ...rest },
	ref
) {
	const theme = useTheme();
	return (
		<Container ref={ref} style={getStyledGapContainer({ gap, theme })} {...rest}>
			{children}
		</Container>
	);
});

const GapRow = React.forwardRef<HTMLDivElement, GapRowProps>(function GapRowFn(
	{ children, gap, ...rest },
	ref
) {
	const theme = useTheme();
	return (
		<Row ref={ref} style={getGapRowStyle({ theme, gap })} {...rest}>
			{children}
		</Row>
	);
});

export { GapContainer, GapRow, type GapContainerProps, type GapRowProps };
