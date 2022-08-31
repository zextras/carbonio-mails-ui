/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useEffect, useState } from 'react';
import { Row, IconButton, Input } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

type CustomComponentProps = {
	value: unknown;
	onClick?: () => void;
	label: string;
};

const CustomInputWrapper = styled(Row)`
	border-bottom: 1px solid ${({ theme }): string => theme.palette.gray4};
	border-radius: 2px;
	&:hover {
		background: ${({ theme }): string => theme.palette.gray2};
	}

	&:focus-within {
		border-bottom: 1px solid ${({ theme }): string => theme.palette.primary};
	}
`;
const CustomButtonWrapper = styled(Row)`
	cursour: pointer;
	padding: 0 !important;
`;

const DatePickerCustomComponent: FC<CustomComponentProps> = ({
	value,
	onClick,
	label
}): ReactElement => {
	const [input, setInput] = useState(value);

	useEffect(() => {
		setInput(value);
	}, [value]);

	return (
		<CustomInputWrapper background="gray4">
			<Row takeAvailableSpace minWidth="150px" background="transparent">
				<Input label={label} value={input} hideBorder disabled />
			</Row>

			<CustomButtonWrapper>
				<IconButton
					icon="CalendarOutline"
					size="large"
					onClick={onClick}
					backgroundColor="transparent"
					iconColor="text"
				/>
			</CustomButtonWrapper>
		</CustomInputWrapper>
	);
};

export default DatePickerCustomComponent;
