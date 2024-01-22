/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useState, forwardRef, MouseEvent } from 'react';

import { Row, IconButton, Input } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

type CustomComponentProps = {
	value: string | number;
	onClick: ((e: MouseEvent | KeyboardEvent) => void) &
		((e: MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => void);

	label: string;
};

const CustomInputWrapper = styled(Row)`
	border-bottom: 1px solid ${({ theme }): string => theme.palette.gray4.regular};
	border-radius: 0.125rem;
	&:hover {
		background: ${({ theme }): string => theme.palette.gray2.regular};
	}

	&:focus-within {
		border-bottom: 1px solid ${({ theme }): string => theme.palette.primary.regular};
	}
`;
const CustomButtonWrapper = styled(Row)`
	cursor: pointer;
	padding: 0 !important;
`;
export const DatePickerCustomComponent: FC<CustomComponentProps> = forwardRef(
	function DatePickerCustomComponentFn(
		{ value, onClick, label }: CustomComponentProps,
		ref: React.Ref<HTMLInputElement>
	) {
		const [input, setInput] = useState<string | number>(value);

		useEffect(() => {
			setInput(value);
		}, [value]);

		return (
			<CustomInputWrapper background="gray4">
				<Row takeAvailableSpace minWidth="9.375rem" background="transparent">
					<Input label={label} value={input} hideBorder disabled ref={ref} />
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
	}
);
