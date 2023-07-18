/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, ContainerProps, getPadding } from '@zextras/carbonio-design-system';
import styled, { SimpleInterpolation } from 'styled-components';

type GapContainerProps = ContainerProps & { gap?: ContainerProps['padding'] };

const StyledGapContainer = styled(Container)<GapContainerProps>`
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

export { GapContainer, GapContainerProps };
