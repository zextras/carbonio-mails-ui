/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Container, type IconProps } from '@zextras/carbonio-design-system';

import { ColorSwatchPicker } from './color-swatch-picker';
import { ToolbarIconButton } from './toolbar-icon-button';

const ColorPickerPopover = styled(Container)`
	position: absolute;
	top: calc(100% + 0.25rem);
	left: 0;
	z-index: 10;
	border-radius: 0.25rem;
	box-shadow: 0 0.375rem 0.75rem rgba(0, 0, 0, 0.15);
	background: ${({ theme }): string => theme.palette.gray6.regular};
`;

type ColorPickerToolbarButtonProps = {
	icon: IconProps['icon'];
	label: string;
	color: string;
	onColorChange: (color: string) => void;
};

export const ColorPickerToolbarButton = ({
	icon,
	label,
	color,
	onColorChange
}: ColorPickerToolbarButtonProps): React.JSX.Element => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) {
			return undefined;
		}
		const handleOutsideMouseDown = (event: MouseEvent): void => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handleOutsideMouseDown);
		return (): void => document.removeEventListener('mousedown', handleOutsideMouseDown);
	}, [open]);

	return (
		<Container
			ref={containerRef}
			width="fit"
			height="fit"
			style={{ position: 'relative', display: 'inline-flex' }}
		>
			<ToolbarIconButton
				icon={icon}
				label={label}
				onClick={(): void => setOpen((isOpen) => !isOpen)}
			/>
			{open && (
				<ColorPickerPopover width="fit" height="fit">
					<ColorSwatchPicker
						color={color}
						onChange={onColorChange}
						onColorCommit={(): void => setOpen(false)}
					/>
				</ColorPickerPopover>
			)}
		</Container>
	);
};
