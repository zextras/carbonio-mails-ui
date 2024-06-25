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

const MainContainer = styled(Container)`
	position: relative;
	width: 100%;
	height: 100%;
`;

interface ResizableContainerProps extends ContainerProps {
	elementToResize: React.RefObject<HTMLElement>;
	localStorageKey?: string;
	border: Border;
	keepSyncedWithStorage?: boolean;
	disabled?: boolean;
	minSize?: { width: number; height: number };
}

interface ResizableBorderProps {
	elementToResize: React.RefObject<HTMLElement>;
	localStorageKey?: string;
	border: Border;
	keepSyncedWithStorage?: boolean;
}

interface BorderWithResizeProps {
	$cursor: CSSProperties['cursor'];
	$width: string;
	$height: string;
	$position: {
		top?: number;
		bottom?: number;
		left?: number;
		right?: number;
	};
	$translateTransform?: { x?: string; y?: string };
}

const BorderWithResize = styled.div<
	BorderWithResizeProps & {
		height?: never;
		width?: never;
	}
>`
	position: absolute;
	z-index: 2;
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

const ResizableBorder = ({
	elementToResize,
	border,
	localStorageKey,
	keepSyncedWithStorage
}: ResizableBorderProps): React.JSX.Element => {
	const borderRef = useRef<HTMLDivElement>(null);
	const resizeHandler = useResize(elementToResize, border, {
		localStorageKey,
		keepSyncedWithStorage
	});

	const positions = useMemo<
		Pick<BorderWithResizeProps, '$position' | '$translateTransform'>
	>(() => {
		const $position: BorderWithResizeProps['$position'] = {};
		const $translateTransform: BorderWithResizeProps['$translateTransform'] = {};
		if (border.includes(BORDERS.SOUTH)) {
			$position.bottom = 0;
			$translateTransform.y = '50%';
		}
		if (border.includes(BORDERS.EAST)) {
			$position.right = 0;
			$translateTransform.x = '50%';
		}
		return { $position, $translateTransform };
	}, [border]);

	return (
		<BorderWithResize
			ref={borderRef}
			$width={border === BORDERS.EAST ? '0.25rem' : '100%'}
			$height={border === BORDERS.EAST ? '100%' : '0.25rem'}
			{...positions}
			$cursor={border === BORDERS.EAST ? 'ew-resize' : 'ns-resize'}
			onMouseDown={resizeHandler}
		/>
	);
};

export const ResizableContainer = ({
	elementToResize,
	children,
	border,
	localStorageKey,
	disabled = false,
	keepSyncedWithStorage,
	...rest
}: ResizableContainerProps): React.JSX.Element => (
	<MainContainer {...rest}>
		{!disabled && (
			<ResizableBorder
				key={`resizable-border-e`}
				border={border}
				elementToResize={elementToResize}
				localStorageKey={localStorageKey}
				keepSyncedWithStorage={keepSyncedWithStorage}
			/>
		)}
		{children}
	</MainContainer>
);
