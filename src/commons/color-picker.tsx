/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useRef, useState } from 'react';

import { Container, Icon } from '@zextras/carbonio-design-system';
import { HexColorPicker } from 'react-colorful';

import useClickOutside from 'hooks/use-click-outside-picker';
import { ColorContainer } from 'integrations/shared-invite-reply/parts/styled-components';

type ColorPickerStyle = {
	width: string;
	height: string;
	borderRadius: string;
	border: string;
	boxShadow: string;
	cursor: string;
	backgroundColor: string;
	opacity: string;
};

function getColorPickerStyle({
	disabled,
	color
}: {
	disabled: boolean;
	color: string;
}): ColorPickerStyle {
	return {
		width: '1.75rem',
		height: '1.75rem',
		borderRadius: '0.5rem',
		border: '0.1875rem solid #fff',
		boxShadow: '0 0 0 0.0625rem rgba(0, 0, 0, 0.1), inset 0 0 0 0.0625rem rgba(0, 0, 0, 0.1)',
		cursor: disabled ? 'no-drop' : 'pointer',
		backgroundColor: color,
		opacity: disabled ? '0.5' : '1'
	};
}

type PopOverStyle = {
	position: 'absolute';
	top: string;
	left: string;
	width: string;
	height: string;
	borderRadius: string;
	boxShadow: string;
};

function getPopOverStyle(): PopOverStyle {
	return {
		position: 'absolute',
		top: 'calc(100% + 0.125rem)',
		left: '0',
		width: '12.5rem',
		height: '12.5rem',
		borderRadius: '0.5625rem',
		boxShadow: '0 0.375rem 0.75rem rgba(0, 0, 0, 0.15)'
	};
}

export const ColorPicker: FC<{
	color: string;
	onChange: (arg: string) => void;
	disabled?: boolean;
}> = ({ color, onChange, disabled = false }) => {
	const popover = useRef(null);
	const [isOpen, setIsOpen] = useState(false);

	const close = useCallback(() => setIsOpen(false), []);
	useClickOutside(popover, close);

	return (
		<ColorContainer
			orientation="horizontal"
			width="fit"
			borderRadius="half"
			background="gray5"
			padding={{
				all: 'small'
			}}
			disabled={disabled}
			onClick={(): void | null => (disabled ? null : setIsOpen(true))}
			height="3rem"
		>
			<Container style={{ position: 'relative' }} orientation="horizontal" width="fit">
				<Container
					style={getColorPickerStyle({ disabled, color })}
					data-testid="color-picker-color-box"
				/>
				{isOpen && (
					<Container ref={popover} style={getPopOverStyle()}>
						<HexColorPicker color={color} onChange={onChange} />
					</Container>
				)}
				<Icon
					size="large"
					icon={isOpen ? 'ChevronUpOutline' : 'ChevronDownOutline'}
					color={isOpen ? 'primary' : 'secondary'}
					style={{ alignSelf: 'center' }}
				/>
			</Container>
		</ColorContainer>
	);
};
