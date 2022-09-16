/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import styled from 'styled-components';
import { Container, ContainerProps, Icon } from '@zextras/carbonio-design-system';
import useClickOutside from '../hooks/use-click-outside-picker';
import { ColorContainer } from '../integrations/shared-invite-reply/parts/styled-components';

const ColorBox = styled(Container)<ContainerProps & { disabled: boolean; color: string }>`
	width: 28px;
	height: 28px;
	border-radius: 8px;
	border: 3px solid #fff;
	box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.1);
	cursor: ${({ disabled }): string => (disabled ? 'no-drop' : 'pointer')};
	background-color: ${({ color }): string => color};
	opacity: ${({ disabled }): string => (disabled ? '0.5' : '1')};
`;

const PopOver = styled(Container)`
	position: absolute;
	top: calc(100% + 2px);
	left: 0;
	width: 200px;
	height: 200px;
	border-radius: 9px;
	box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
`;

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
			style={{ cursor: disabled ? 'no-drop' : 'pointer' }}
			onClick={(): void | null => (disabled ? null : setIsOpen(true))}
			height="48px"
		>
			<Container style={{ position: 'relative' }} orientation="horizontal" width="fit">
				<ColorBox color={color} disabled={disabled} />
				{isOpen && (
					<PopOver ref={popover}>
						<HexColorPicker color={color} onChange={onChange} />
					</PopOver>
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
