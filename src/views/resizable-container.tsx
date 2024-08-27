/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { CSSProperties, useMemo, useRef } from 'react';

import { Container, ContainerProps } from '@zextras/carbonio-design-system';
import styled, { css, SimpleInterpolation } from 'styled-components';

import { BORDERS } from '../constants';
import { Border, useResize } from '../hooks/use-resize';
import { useViewLayout } from '../hooks/use-view-layout';

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

const HoverableContainer = styled(Container)<ContainerProps & { border: Border }>`
	& > * {
		border-right: ${({ theme, border }): string =>
			border === BORDERS.EAST ? `1px solid ${theme.palette.gray2.regular}` : '0'};
		border-bottom: ${({ theme, border }): string =>
			border === BORDERS.SOUTH ? `1px solid ${theme.palette.gray2.regular}` : '0'};
		transition: 0.2s ease-out;
	}
	&:hover > * {
		border-right: ${({ theme, border }): string =>
			border === BORDERS.EAST ? `1px solid ${theme.palette.primary.regular}` : '0'};
		border-bottom: ${({ theme, border }): string =>
			border === BORDERS.SOUTH ? `1px solid ${theme.palette.primary.regular}` : '0'};
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
	${({ $position }): SimpleInterpolation => $position};
	${({ $translateTransform }): SimpleInterpolation =>
		($translateTransform?.x || $translateTransform?.y) &&
		css`
			transform: translate(${$translateTransform?.x ?? 0}, ${$translateTransform?.y ?? 0});
		`}
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
			<HoverableContainer
				width={'100%'}
				height={'100%'}
				border={border}
				mainAlignment="flex-start"
				crossAlignment="flex-start"
			>
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					width={border === BORDERS.EAST ? '1px' : '100%'}
					height={border === BORDERS.EAST ? '100%' : '1px'}
				/>
			</HoverableContainer>
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
