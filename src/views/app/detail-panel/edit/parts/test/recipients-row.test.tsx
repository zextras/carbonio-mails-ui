/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';

import { act, screen } from '@testing-library/react';

import { ParticipantRole } from '../../../../../../carbonio-ui-commons/constants/participants';
import { CONTACT_TYPES } from '../../../../../../carbonio-ui-commons/integrations/constants';
import { DefaultContactInput } from '../../../../../../carbonio-ui-commons/integrations/default-contact-input';
import * as contactInput from '../../../../../../carbonio-ui-commons/integrations/hooks';
import {
	generateMockContactInputItem,
	mockContactInput
} from '../../../../../../carbonio-ui-commons/test/mocks/integrations/mock-contact-input';
import { UserEvent, setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { Participant } from '../../../../../../types';
import { RecipientsRow } from '../recipients-row';

const triggerOnAdd = async (user: UserEvent): Promise<void> => {
	await paste(user, screen.getByTestId('mockedContactInput'), 'any value is ok');
};
describe('recipients-row', () => {
	describe('when contact input integration available', () => {
		it('should call onChange with value of given type when adding a new value in input', async () => {
			mockContactInput({ valueToAdd: { ...generateMockContactInputItem() } });
			const mockOnChange = jest.fn();
			const type = 'f';

			const { user } = setupTest(
				<RecipientsRow
					dataTestid={'mockedContactInput'}
					type={type}
					label="label"
					recipients={[]}
					onRecipientsChange={mockOnChange}
				></RecipientsRow>
			);
			await triggerOnAdd(user);

			expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ type })]);
		});
		it('should call onChange with a value with isGroup false when adding a user contact', async () => {
			const valueToAdd = { ...generateMockContactInputItem() };
			valueToAdd.value.type = CONTACT_TYPES.CONTACT;
			mockContactInput({ valueToAdd });
			const mockOnChange = jest.fn();

			const { user } = setupTest(
				<RecipientsRow
					type="f"
					label="label"
					dataTestid={'mockedContactInput'}
					recipients={[]}
					onRecipientsChange={mockOnChange}
				></RecipientsRow>
			);
			await triggerOnAdd(user);

			expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ isGroup: false })]);
		});
		it('should call onChange with a value with isGroup true when adding a distribution list', async () => {
			const valueToAdd = { ...generateMockContactInputItem() };
			valueToAdd.value.type = CONTACT_TYPES.DISTRIBUTION_LIST;
			mockContactInput({ valueToAdd });
			const mockOnChange = jest.fn();

			const { user } = setupTest(
				<RecipientsRow
					dataTestid={'mockedContactInput'}
					type="f"
					label="label"
					recipients={[]}
					onRecipientsChange={mockOnChange}
				></RecipientsRow>
			);
			await triggerOnAdd(user);

			expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ isGroup: true })]);
		});
		it('should call onChange with a value with address equal to email after adding any contact', async () => {
			const valueToAdd = { ...generateMockContactInputItem() };
			valueToAdd.value.email = 'test@test.com';
			mockContactInput({ valueToAdd });
			const mockOnChange = jest.fn();

			const { user } = setupTest(
				<RecipientsRow
					type="f"
					label="label"
					dataTestid={'mockedContactInput'}
					recipients={[]}
					onRecipientsChange={mockOnChange}
				></RecipientsRow>
			);
			await triggerOnAdd(user);

			expect(mockOnChange).toHaveBeenCalledWith([
				expect.objectContaining({ address: 'test@test.com' })
			]);
		});
		it('do not change the id received from ContactInput onChange', async () => {
			mockContactInput({ valueToAdd: { ...generateMockContactInputItem(), id: 'fakeId' } });
			const { user } = setupTest(<TestableRecipientsRow />);

			await paste(user, screen.getByTestId('mockedContactInput'), 'another@ema.il');

			expect(screen.getByTestId('mockedContactValue')).toHaveTextContent(
				'[{"id":"fakeId","label":"Whatever","value":{"id":"1","email":"test@test.com","type":"CONTACT"}}]'
			);
		});
		it('should display a distribution list when initial recipient has isGroup true', async () => {
			const address = 'someone@test.com';
			mockContactInput();
			const mockOnChange = jest.fn();
			const initialRecipients = [
				{
					address,
					type: ParticipantRole.TO,
					error: true,
					isGroup: true
				}
			];
			setupTest(
				<RecipientsRow
					type="f"
					label="label"
					recipients={initialRecipients}
					onRecipientsChange={mockOnChange}
				></RecipientsRow>
			);

			expect(
				await screen.findByText(
					'[{"id":"someone@test.com","label":"someone@test.com","value":{"id":"someone@test.com","email":"someone@test.com","type":"DISTRIBUTION_LIST"},"error":true}]'
				)
			).toBeInTheDocument();
		});
	});

	describe('when ContactInput is available', () => {
		beforeEach(() => {
			jest.spyOn(contactInput, 'useContactInput').mockReturnValue(DefaultContactInput);
		});

		it('create a chip rendering the entire text when invalid', async () => {
			const { user } = setupTest(<TestableRecipientsRow />);

			await paste(user, screen.getByRole('textbox'), '"not valid" <notvalid>');

			expect(await screen.findByText('"not valid" <notvalid>')).toBeVisible();
		});

		it('create a chip rendering only the email part when valid', async () => {
			const { user } = setupTest(<TestableRecipientsRow />);

			await paste(user, screen.getByRole('textbox'), '"valid" <valid@ema.il>');

			expect(await screen.findByText('valid@ema.il')).toBeInTheDocument();
		});
	});
});

async function paste(user: UserEvent, element: HTMLElement, text: string): Promise<void> {
	await user.click(element);
	await act(async () => {
		await user.paste({ getData: () => text } as unknown as DataTransfer);
	});
}

/*
 * We need to define a Testable RecipientRow because we want to test how the recipient is updated,
 * but the current implementation of the component do not handle the recipient update itself,
 * it just pass the value to the parent component
 */
function TestableRecipientsRow(): React.ReactElement {
	const [recipients, setRecipients] = useState<Participant[]>([]);

	const onChange = useCallback(
		(participants: Participant[]): void => setRecipients(participants),
		[]
	);

	return (
		<RecipientsRow
			dataTestid={'mockedContactInput'}
			type="f"
			label="label"
			recipients={recipients}
			onRecipientsChange={onChange}
		></RecipientsRow>
	);
}
