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
import styled from '@emotion/styled';

type GapContainerProps = ContainerProps & { gap?: ContainerProps['padding'] };

type GapRowProps = RowProps & { gap?: RowProps['padding'] };

const StyledGapContainer = styled(Container)<{ $gap?: ContainerProps['padding'] }>`
	gap: ${({ theme, $gap }): undefined | string | 0 => $gap && getPadding($gap, theme)};
`;

const StyledGapRow = styled(Row)<{ $gap?: ContainerProps['padding'] }>`
	gap: ${({ theme, $gap }): undefined | string | 0 => $gap && getPadding($gap, theme)};
`;

const GapContainer = React.forwardRef<HTMLDivElement, GapContainerProps>(function GapContainerFn(
	{ children, gap, ...rest },
	ref
) {
	return (
		<StyledGapContainer ref={ref} $gap={gap} {...rest}>
			{children}
		</StyledGapContainer>
	);
});

const GapRow = React.forwardRef<HTMLDivElement, GapRowProps>(function GapRowFn(
	{ children, gap, ...rest },
	ref
) {
	return (
		<StyledGapRow ref={ref} $gap={gap} {...rest}>
			{children}
		</StyledGapRow>
	);
});

export { GapContainer, GapRow, type GapContainerProps, type GapRowProps };
