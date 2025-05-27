/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FunctionComponent, ReactElement, useCallback } from 'react';

import { ChipAction } from '@zextras/carbonio-design-system';

import { EDIT_ACTION_ID, CONTACT_TYPES } from '../../../integrations/constants';
import { DefaultContactInput } from '../../../integrations/default-contact-input';
import * as contactInput from '../../../integrations/hooks';
import { ContactInputItem, ContactInputProps } from '../../../integrations/types';

function generateMockedContactInput(
	valueToAdd?: ContactInputItem
): FunctionComponent<Record<string, unknown>> {
	function MockedContactInput({
		onChange,
		defaultValue,
		dragAndDropEnabled: _dragAndDropEnabled,
		orderedAccountIds: _orderedAccountIds,
		...rest
	}: ContactInputProps): ReactElement {
		const onInputChange = useCallback(() => {
			valueToAdd && onChange?.([...defaultValue, { ...valueToAdd }]);
		}, [defaultValue, onChange]);

		return (
			<>
				<DefaultContactInput {...rest} defaultValue={defaultValue} onChange={onInputChange} />
				<label data-testid="mockedContactValue">{JSON.stringify(defaultValue)}</label>
			</>
		);
	}

	return MockedContactInput as FunctionComponent<Record<string, unknown>>;
}

export function mockContactInput({ valueToAdd }: { valueToAdd?: ContactInputItem } = {}): void {
	jest
		.spyOn(contactInput, 'useContactInput')
		.mockReturnValue(generateMockedContactInput(valueToAdd));
}
export const generateMockContactInputItem = (): ContactInputItem => ({
	id: '1',
	label: 'Whatever',
	value: {
		id: '1',
		email: 'test@test.com',
		type: CONTACT_TYPES.CONTACT
	}
});

export const EDIT_ACTION: ChipAction = {
	icon: 'EditOutline',
	id: EDIT_ACTION_ID,
	label: 'Edit',
	type: 'button',
	onClick: jest.fn()
};
