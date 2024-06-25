/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { CSSProperties, useMemo, useRef } from 'react';

import { Container, ContainerProps } from '@zextras/carbonio-design-system';
import styled, { css, SimpleInterpolation } from 'styled-components';

import { useResize } from '../hooks/use-resize';

const MainContainer = styled(Container)`
	position: relative;
	width: 100%;
	height: 100%;
`;

interface ResizableContainerProps extends ContainerProps {
	elementToResize: React.RefObject<HTMLElement>;
	keepSyncedWithStorage?: boolean;
	disabled?: boolean;
	minSize?: { width: number; height: number };
}

interface ResizableBorderProps {
	elementToResize: React.RefObject<HTMLElement>;
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
	keepSyncedWithStorage
}: ResizableBorderProps): React.JSX.Element => {
	const borderRef = useRef<HTMLDivElement>(null);
	const resizeHandler = useResize(elementToResize, 'e', {
		keepSyncedWithStorage
	});

	const positions = useMemo<
		Pick<BorderWithResizeProps, '$position' | '$translateTransform'>
	>(() => {
		const $position: BorderWithResizeProps['$position'] = {};
		const $translateTransform: BorderWithResizeProps['$translateTransform'] = {};
		$position.right = 0;
		$translateTransform.x = '50%';
		return { $position, $translateTransform };
	}, []);

	return (
		<BorderWithResize
			ref={borderRef}
			$width={'0.25rem'}
			$height={'100%'}
			{...positions}
			$cursor={'ew-resize'}
			onMouseDown={resizeHandler}
		/>
	);
};

export const ResizableContainer = ({
	elementToResize,
	children,
	disabled = false,
	keepSyncedWithStorage,
	...rest
}: ResizableContainerProps): React.JSX.Element => (
	<MainContainer {...rest}>
		{!disabled && (
			<ResizableBorder
				key={`resizable-border-e`}
				elementToResize={elementToResize}
				keepSyncedWithStorage={keepSyncedWithStorage}
			/>
		)}
		{children}
	</MainContainer>
);
