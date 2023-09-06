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
	RowProps
} from '@zextras/carbonio-design-system';
import styled, { SimpleInterpolation } from 'styled-components';

type GapContainerProps = ContainerProps & { gap?: ContainerProps['padding'] };

type GapRowProps = RowProps & { gap?: RowProps['padding'] };

const StyledGapContainer = styled(Container)<GapContainerProps>`
	gap: ${({ theme, gap }): SimpleInterpolation => gap && getPadding(gap, theme)};
`;

const StyledGapRow = styled(Row)<GapRowProps>`
	gap: ${({ theme, gap }): SimpleInterpolation => gap && getPadding(gap, theme)};
`;

const GapContainer = React.forwardRef<HTMLDivElement, GapContainerProps>(function GapContainerFn(
	{ children, ...rest },
	ref
) {
	return (
		<StyledGapContainer ref={ref} {...rest}>
			{children}
		</StyledGapContainer>
	);
});

const GapRow = React.forwardRef<HTMLDivElement, GapRowProps>(function GapRowFn(
	{ children, ...rest },
	ref
) {
	return (
		<StyledGapRow ref={ref} {...rest}>
			{children}
		</StyledGapRow>
	);
});

export { GapContainer, GapRow, GapContainerProps, GapRowProps };
