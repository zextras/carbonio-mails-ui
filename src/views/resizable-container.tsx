/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { CSSProperties, useMemo, useRef } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Container, ContainerProps } from '@zextras/carbonio-design-system';

import { BORDERS } from 'constants/index';
import { Border, useResize } from 'hooks/use-resize';
import { useViewLayout } from 'hooks/use-view-layout';

const RESIZABLE_BORDER_SIZE = '1rem';

const MainContainer = styled(Container)`
	position: relative;
	width: 100%;
	height: 100%;
`;

interface ResizableContainerProps extends ContainerProps {
	elementToResize: React.RefObject<HTMLElement>;
	border: Border;
	disabled?: boolean;
	minSize?: { width: number; height: number };
}

interface ResizableBorderProps {
	elementToResize: React.RefObject<HTMLElement>;
	border: Border;
}

interface BorderWithResizeProps {
	$cursor: CSSProperties['cursor'];
	$width: string;
	$height: string;
	$position: {
		top?: string;
		bottom?: string;
		left?: string;
		right?: string;
	};
	$translateTransform?: { x?: string; y?: string };
}

const DividerLine = styled.div<{ $border: Border }>`
	position: absolute;
	top: 0;
	left: 0;
	width: ${({ $border }): string => ($border === BORDERS.EAST ? '0.0625rem' : '100%')};
	height: ${({ $border }): string => ($border === BORDERS.EAST ? '100%' : '0.0625rem')};
	background-color: ${({ theme }): string => theme.palette.gray2.regular};

	/* highlight */
	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: ${({ $border }): string => ($border === BORDERS.EAST ? '0.125rem' : '100%')};
		height: ${({ $border }): string => ($border === BORDERS.EAST ? '100%' : '0.125rem')};
		background-color: ${({ theme }): string => theme.palette.primary.regular};
		opacity: 0;
		transition: opacity 0.2s ease-out;
		pointer-events: none;
	}
`;

const BorderWithResize = styled.div<
	BorderWithResizeProps & {
		height?: never;
		width?: never;
	}
>`
	position: absolute;
	z-index: 0;
	cursor: ${({ $cursor }): CSSProperties['cursor'] => $cursor};
	width: ${({ $width }): string => $width};
	height: ${({ $height }): string => $height};
	${({ $position }): BorderWithResizeProps['$position'] => $position};
	${({ $translateTransform }): undefined | string | ReturnType<typeof css> =>
		($translateTransform?.x || $translateTransform?.y) &&
		css`
			transform: translate(${$translateTransform?.x ?? 0}, ${$translateTransform?.y ?? 0});
		`}

	&:hover ${DividerLine}::after,
	&:active ${DividerLine}::after {
		opacity: 1;
	}
`;

const ResizableBorder = ({ elementToResize, border }: ResizableBorderProps): React.JSX.Element => {
	const borderRef = useRef<HTMLDivElement>(null);
	const { listContainerGeometry, setListContainerGeometry } = useViewLayout();
	const resizeHandler = useResize(elementToResize, border, {
		initialGeometry: listContainerGeometry,
		onGeometryChange: setListContainerGeometry
	});

	const positions = useMemo<Pick<BorderWithResizeProps, '$position'>>(() => {
		const $position: BorderWithResizeProps['$position'] = {};
		if (border.includes(BORDERS.SOUTH)) {
			$position.bottom = `-${RESIZABLE_BORDER_SIZE}`;
		}
		if (border.includes(BORDERS.EAST)) {
			$position.right = `-${RESIZABLE_BORDER_SIZE}`;
		}
		return { $position };
	}, [border]);

	return (
		<BorderWithResize
			ref={borderRef}
			$width={border === BORDERS.EAST ? RESIZABLE_BORDER_SIZE : '100%'}
			$height={border === BORDERS.EAST ? '100%' : RESIZABLE_BORDER_SIZE}
			{...positions}
			$cursor={border === BORDERS.EAST ? 'ew-resize' : 'ns-resize'}
			onMouseDown={resizeHandler}
		>
			<DividerLine $border={border} />
		</BorderWithResize>
	);
};

export const ResizableContainer = ({
	elementToResize,
	children,
	border,
	disabled = false,
	...rest
}: ResizableContainerProps): React.JSX.Element => (
	<MainContainer {...rest}>
		{!disabled && (
			<ResizableBorder
				key={`resizable-border-${border}`}
				border={border}
				elementToResize={elementToResize}
			/>
		)}
		{children}
	</MainContainer>
);
