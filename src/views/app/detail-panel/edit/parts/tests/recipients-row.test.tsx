/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';

import { act, screen } from '@testing-library/react';
import {
	CONTACT_TYPES,
	ContactInputProps,
	ParticipantRole,
	useContactInput
} from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import { UserEvent, setupTest } from '@test-setup';
import {
	generateMockContactInputItem,
	generateMockedContactInput,
	mockContactInput
} from '@test-utils/integrations/mock-contact-input';
import { Participant } from 'types/participant';
import { RecipientsRow } from 'views/app/detail-panel/edit/parts/recipients-row';

const triggerOnAdd = async (user: UserEvent): Promise<void> => {
	await paste(user, screen.getByTestId('mockedContactInput'), 'any value is ok');
};
vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	useContactInput: vi.fn()
}));

const ContactInputWithError = ({ defaultValue }: ContactInputProps): React.JSX.Element => (
	<>
		{defaultValue.map((value, i) =>
			value.error ? <p key={i} data-testid={`recipient-error-${i}`}></p> : <></>
		)}
	</>
);
describe('recipients-row', () => {
	describe('when contact input integration available', () => {
		it('should call onChange with value of given type when adding a new value in input', async () => {
			mockContactInput({ valueToAdd: { ...generateMockContactInputItem() } });
			const mockOnChange = vi.fn();
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
			const mockOnChange = vi.fn();

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
			const mockOnChange = vi.fn();

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
			const mockOnChange = vi.fn();

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
			const mockOnChange = vi.fn();
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
					'[{"id":"someone@test.com","label":"someone@test.com","value":{"id":"someone@test.com","email":"someone@test.com","type":"DISTRIBUTION_LIST"},"error":false}]'
				)
			).toBeInTheDocument();
		});

		describe('contact name handling', () => {
			it('should use fullName when available for contact', async () => {
				const valueToAdd = {
					...generateMockContactInputItem(),
					value: {
						id: '1',
						email: 'test@test.com',
						type: CONTACT_TYPES.CONTACT,
						firstName: 'John',
						lastName: 'Doe',
						fullName: 'John Doe'
					}
				};
				mockContactInput({ valueToAdd });
				const mockOnChange = vi.fn();

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

				expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'John Doe' })]);
			});

			it('should fallback to firstName + lastName when fullName is not available', async () => {
				const valueToAdd = {
					...generateMockContactInputItem(),
					value: {
						id: '1',
						email: 'test@test.com',
						type: CONTACT_TYPES.CONTACT,
						firstName: 'John',
						lastName: 'Doe'
					}
				};
				mockContactInput({ valueToAdd });
				const mockOnChange = vi.fn();

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

				expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'John Doe' })]);
			});

			it('should fallback to firstName when only firstName is available', async () => {
				const valueToAdd = {
					...generateMockContactInputItem(),
					value: {
						id: '1',
						email: 'test@test.com',
						type: CONTACT_TYPES.CONTACT,
						firstName: 'John'
					}
				};
				mockContactInput({ valueToAdd });
				const mockOnChange = vi.fn();

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

				expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'John' })]);
			});

			it('should use fullName even when firstName and lastName are also present', async () => {
				const valueToAdd = {
					...generateMockContactInputItem(),
					value: {
						id: '1',
						email: 'dummy.user@gmail.com',
						type: CONTACT_TYPES.CONTACT,
						firstName: 'dummy',
						lastName: 'user',
						fullName: 'dummy user'
					}
				};
				mockContactInput({ valueToAdd });
				const mockOnChange = vi.fn();

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

				expect(mockOnChange).toHaveBeenCalledWith([
					expect.objectContaining({ name: 'dummy user' })
				]);
			});

			it('should set name to undefined for distribution lists', async () => {
				const valueToAdd = {
					...generateMockContactInputItem(),
					value: {
						id: '1',
						email: 'list@test.com',
						type: CONTACT_TYPES.DISTRIBUTION_LIST,
						firstName: 'List',
						lastName: 'Name',
						fullName: 'List Name'
					}
				};
				mockContactInput({ valueToAdd });
				const mockOnChange = vi.fn();

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

				expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ name: undefined })]);
			});

			it('should set name to undefined when no name fields are available', async () => {
				const valueToAdd = {
					...generateMockContactInputItem(),
					value: {
						id: '1',
						email: 'test@test.com',
						type: CONTACT_TYPES.CONTACT
					}
				};
				mockContactInput({ valueToAdd });
				const mockOnChange = vi.fn();

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

				expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ name: undefined })]);
			});
		});
	});

	describe('when ContactInput is available', () => {
		beforeEach(() => {
			(useContactInput as Mock).mockReturnValue(generateMockedContactInput());
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

describe('RecipientsRow', () => {
	beforeEach(() => {
		(useContactInput as Mock).mockReturnValue(ContactInputWithError);
	});
	test('should display error when email is invalid and error true', async () => {
		setupTest(
			<RecipientsRow
				type={ParticipantRole.TO}
				label={'to'}
				recipients={[
					{
						type: ParticipantRole.TO,
						address: 'invalid-email',
						error: true
					}
				]}
				onRecipientsChange={vi.fn()}
			/>
		);
		expect(await screen.findByTestId('recipient-error-0')).toBeInTheDocument();
	});

	test('should display error when email is invalid and error is missing', async () => {
		setupTest(
			<RecipientsRow
				type={ParticipantRole.TO}
				label={'to'}
				recipients={[
					{
						type: ParticipantRole.TO,
						address: 'invalid-email'
					}
				]}
				onRecipientsChange={vi.fn()}
			/>
		);
		expect(await screen.findByTestId('recipient-error-0')).toBeInTheDocument();
	});

	test('should display error when email is invalid and error is false', async () => {
		setupTest(
			<RecipientsRow
				type={ParticipantRole.TO}
				label={'to'}
				recipients={[
					{
						type: ParticipantRole.TO,
						address: 'invalid-email',
						error: false
					}
				]}
				onRecipientsChange={vi.fn()}
			/>
		);
		expect(await screen.findByTestId('recipient-error-0')).toBeInTheDocument();
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
