/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Button, DateTimePicker, Input } from '@zextras/carbonio-design-system';
import { noop } from 'lodash';
import { Controller, useForm } from 'react-hook-form';

export const ExampleForm = ({ defaultValue }: { defaultValue?: string }): React.JSX.Element => {
	const { control, watch } = useForm();
	const inputValue = watch('test');
	const dateValue = watch('datepicker');

	return (
		<>
			<Controller
				control={control}
				name="test"
				render={({ field: { onChange, value } }) => (
					<Input type="text" defaultValue={value} onChange={onChange} label="Test" />
				)}
			/>
			<Controller
				control={control}
				name="datepicker"
				render={({ field: { onChange, value } }) => (
					<DateTimePicker defaultValue={value} onChange={onChange} label="Pick a date" />
				)}
			/>

			<Button
				data-testid={'submit-button'}
				onClick={noop}
				label="Submit"
				disabled={!inputValue && !dateValue}
			/>
		</>
	);
};
