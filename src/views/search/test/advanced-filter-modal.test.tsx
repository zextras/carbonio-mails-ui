/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { format } from 'date-fns';

import {
	EDIT_ACTION,
	generateMockContactInputItem,
	mockContactInput
} from '../../../carbonio-ui-commons/test/mocks/integrations/mock-contact-input';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { AdvancedFilterModal } from '../advanced-filter-modal';
import { AdvancedFilterModalProps, SearchQueryItem } from '../types/types';

async function selectOption(
	user: UserEvent,
	selectTestId: string,
	optionText: string
): Promise<void> {
	const selectElement = within(screen.getByTestId(selectTestId)).getByTestId('icon: ChevronDown');
	expect(selectElement).toBeInTheDocument();
	await user.click(selectElement);
	const selectOption = await screen.findByText(optionText);
	await user.click(selectOption);
}

async function checkResetAndSearchButton(f: (user: UserEvent) => Promise<void>): Promise<void> {
	jest.spyOn(console, 'error').mockImplementation();
	const onSearchConfirmMock = jest.fn();
	const properties: AdvancedFilterModalProps = {
		open: true,
		onClose: jest.fn(),
		query: [],
		onSearchConfirm: onSearchConfirmMock,
		isSharedFolderIncludedInitialValue: false,
		includeSharedItemsInSearchPref: false
	};
	const { user } = setupTest(<AdvancedFilterModal {...properties} />);

	await f(user);

	const actionButton = screen.getByRole('button', {
		name: /action\.search/i
	});
	expect(actionButton).toBeInTheDocument();
	expect(actionButton).toBeEnabled();

	const resetButton = screen.getByRole('button', {
		name: /action\.reset/i
	});
	expect(resetButton).toBeInTheDocument();
	expect(resetButton).toBeEnabled();

	await user.click(resetButton);

	await waitFor(() => {
		expect(actionButton).toBeDisabled();
	});
	await waitFor(() => {
		expect(resetButton).toBeDisabled();
	});
}

describe('Advanced filter modal', () => {
	const props: AdvancedFilterModalProps = {
		open: true,
		onClose: jest.fn(),
		query: [],
		isSharedFolderIncludedInitialValue: false,
		includeSharedItemsInSearchPref: false,
		onSearchConfirm: jest.fn()
	};
	it('render the advanced filter modal', () => {
		setupTest(<AdvancedFilterModal {...props} />);
		const fieldLabel = screen.getByText(/label\.single_advanced_filter/i);
		expect(fieldLabel).toBeInTheDocument();
	});
	it('search button should be disable when modal open', () => {
		setupTest(<AdvancedFilterModal {...props} />);
		const fieldLabel = screen.getByText(/label\.single_advanced_filter/i);
		expect(fieldLabel).toBeInTheDocument();

		const actionButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(actionButton).toBeInTheDocument();
		expect(actionButton).toBeDisabled();
	});
	it('search button should be enable on keyword, subject change', async () => {
		const { user } = setupTest(<AdvancedFilterModal {...props} />);
		const fieldLabel = screen.getByText(/label\.single_advanced_filter/i);
		expect(fieldLabel).toBeInTheDocument();

		const actionButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(actionButton).toBeInTheDocument();
		expect(actionButton).toBeDisabled();

		const keyword = faker.lorem.word();
		const keywordComponent = screen.getByTestId('keywords-input');
		const keywordInputEle = within(keywordComponent).getByRole('textbox');

		// Reset the content of the keyword component and type the keyword
		await user.click(keywordInputEle);
		await user.clear(keywordInputEle);
		await user.type(keywordInputEle, keyword);

		const subjectComponent = screen.getByTestId('subject-input');
		const subjectInputEle = within(subjectComponent).getByRole('textbox');
		await user.click(subjectInputEle);

		expect(actionButton).toBeEnabled();
	});

	it('search button should be enabled if query is not empty', async () => {
		const properties: AdvancedFilterModalProps = {
			open: true,
			onClose: jest.fn(),
			query: [
				{
					id: 'query1',
					label: 'keywords',
					value: 'keyword'
				}
			],
			onSearchConfirm: jest.fn(),
			isSharedFolderIncludedInitialValue: false,
			includeSharedItemsInSearchPref: false
		};
		setupTest(<AdvancedFilterModal {...properties} />);
		const actionButton = screen.getByRole('button', { name: /action\.search/i });

		expect(actionButton).toBeEnabled();
	});

	it('search button should be disabled if there is no query', async () => {
		const properties: AdvancedFilterModalProps = {
			open: true,
			onClose: jest.fn(),
			query: [],
			onSearchConfirm: jest.fn(),
			isSharedFolderIncludedInitialValue: false,
			includeSharedItemsInSearchPref: false
		};
		setupTest(<AdvancedFilterModal {...properties} />);
		const actionButton = screen.getByRole('button', { name: /action\.search/i });

		expect(actionButton).toBeDisabled();
	});

	it('should call onSearchConfirm with correct args when confirm button is clicked', async () => {
		const mockOnSearchConfirm = jest.fn();
		const mockOnClose = jest.fn();

		const properties: AdvancedFilterModalProps = {
			open: true,
			onClose: mockOnClose,
			query: [],
			onSearchConfirm: mockOnSearchConfirm,
			isSharedFolderIncludedInitialValue: false,
			includeSharedItemsInSearchPref: false
		};

		const { user } = setupTest(<AdvancedFilterModal {...properties} />);

		const confirmButton = screen.getByRole('button', { name: /action\.search/i });
		expect(confirmButton).toBeInTheDocument();
		expect(confirmButton).toBeDisabled();

		const keywordInput = screen.getByTestId('keywords-input');
		const keywordInputEle = within(keywordInput).getByRole('textbox');
		await user.click(keywordInputEle);
		await user.clear(keywordInputEle);
		await user.type(keywordInputEle, 'test keyword');
		await user.click(keywordInput);

		expect(confirmButton).toBeEnabled();

		await user.click(confirmButton);

		await waitFor(() => {
			expect(mockOnSearchConfirm).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(mockOnSearchConfirm).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({
							label: 'test keyword'
						})
					],
					includeSharedFolders: false
				})
			);
		});

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('should add "received from" to query with value and label including "from:" after adding a value in the input', async () => {
		const mockOnSearchConfirm = jest.fn();
		const { user } = setupTest(
			<AdvancedFilterModal
				open
				isSharedFolderIncludedInitialValue={false}
				onClose={jest.fn()}
				query={[]}
				onSearchConfirm={mockOnSearchConfirm}
				includeSharedItemsInSearchPref={false}
			/>
		);
		const sentTo = screen.getByTestId('received-from-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(mockOnSearchConfirm).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(mockOnSearchConfirm).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({
							label: 'from:validEmail@test.com',
							value: 'validEmail@test.com'
						})
					],
					includeSharedFolders: false
				})
			);
		});
	});

	it('should add "sent to" to query with value and label including "to:" after adding a value in the input', async () => {
		const mockOnSearchConfirm = jest.fn();
		const { user } = setupTest(
			<AdvancedFilterModal
				open
				isSharedFolderIncludedInitialValue={false}
				includeSharedItemsInSearchPref={false}
				onClose={jest.fn()}
				query={[]}
				onSearchConfirm={mockOnSearchConfirm}
			/>
		);
		const sentTo = screen.getByTestId('sent-to-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(mockOnSearchConfirm).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(mockOnSearchConfirm).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({
							label: 'to:validEmail@test.com',
							value: 'validEmail@test.com'
						})
					],
					includeSharedFolders: false
				})
			);
		});
	});
	it('should keep previous query first value after adding a new value in "sent to" input', async () => {
		const mockOnSearchConfirm = jest.fn();
		const query: SearchQueryItem = {
			id: 'query1',
			label: 'from:someone@test.com',
			value: 'someone@test.com'
		};
		const { user } = setupTest(
			<AdvancedFilterModal
				open
				isSharedFolderIncludedInitialValue={false}
				includeSharedItemsInSearchPref={false}
				onClose={jest.fn()}
				query={[query]}
				onSearchConfirm={mockOnSearchConfirm}
			/>
		);
		const sentTo = screen.getByTestId('sent-to-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(mockOnSearchConfirm).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(mockOnSearchConfirm).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({
							id: 'someone@test.com',
							label: 'from:someone@test.com',
							value: 'someone@test.com'
						}),
						expect.objectContaining({
							id: 'validEmail@test.com',
							label: 'to:validEmail@test.com',
							value: 'validEmail@test.com'
						})
					],
					includeSharedFolders: false
				})
			);
		});
	});

	it('should remove edit action from query chip for "to" and "from" fields', async () => {
		const valueToAdd = generateMockContactInputItem();
		valueToAdd.actions = [EDIT_ACTION];
		mockContactInput({ valueToAdd });

		const mockOnSearchConfirm = jest.fn();
		const { user } = setupTest(
			<AdvancedFilterModal
				open
				isSharedFolderIncludedInitialValue={false}
				includeSharedItemsInSearchPref={false}
				onClose={jest.fn()}
				query={[]}
				onSearchConfirm={mockOnSearchConfirm}
			/>
		);
		const sentTo = screen.getByTestId('sent-to-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		const receivedFrom = screen.getByTestId('received-from-input');
		await user.type(receivedFrom, 'validEmail2@test.com');
		await user.type(receivedFrom, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(mockOnSearchConfirm).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(mockOnSearchConfirm).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({
							actions: []
						}),
						expect.objectContaining({
							actions: []
						})
					],
					includeSharedFolders: false
				})
			);
		});
	});
	it('should display "to" and "from" with edit action in their inputs', async () => {
		const valueToAdd = generateMockContactInputItem();
		valueToAdd.actions = [EDIT_ACTION];
		mockContactInput({ valueToAdd });

		const mockOnSearchConfirm = jest.fn();

		const { user } = setupTest(
			<AdvancedFilterModal
				open
				isSharedFolderIncludedInitialValue={false}
				includeSharedItemsInSearchPref={false}
				onClose={jest.fn()}
				query={[]}
				onSearchConfirm={mockOnSearchConfirm}
			/>
		);

		const sentTo = screen.getByTestId('sent-to-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		const receivedFrom = screen.getByTestId('received-from-input');
		await user.type(receivedFrom, 'validEmail2@test.com');
		await user.type(receivedFrom, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		const mockContactInputValues = await screen.findAllByTestId('mockedContactValue');
		expect(mockContactInputValues[0]).toHaveTextContent(/"icon":"EditOutline"/);
		expect(mockContactInputValues[1]).toHaveTextContent(/"icon":"EditOutline"/);
	});
	it('reset filters button should be enabled if query is not empty', async () => {
		const properties: AdvancedFilterModalProps = {
			open: true,
			onClose: jest.fn(),
			query: [
				{
					id: 'query1',
					label: 'keywords',
					value: 'keyword'
				}
			],
			onSearchConfirm: jest.fn(),
			isSharedFolderIncludedInitialValue: false,
			includeSharedItemsInSearchPref: false
		};
		setupTest(<AdvancedFilterModal {...properties} />);
		const actionButton = screen.getByRole('button', { name: /action\.reset/i });

		expect(actionButton).toBeEnabled();
	});
	it('reset filters button should be disable when modal open', () => {
		setupTest(<AdvancedFilterModal {...props} />);
		const fieldLabel = screen.getByText(/label\.single_advanced_filter/i);
		expect(fieldLabel).toBeInTheDocument();

		const actionButton = screen.getByRole('button', {
			name: /action\.reset/i
		});
		expect(actionButton).toBeInTheDocument();
		expect(actionButton).toBeDisabled();
	});
	it('should disable search button when reset filters button is clicked', async () => {
		const mockOnSearchConfirm = jest.fn();
		const properties: AdvancedFilterModalProps = {
			open: true,
			onClose: jest.fn(),
			query: [
				{
					id: 'query1',
					label: 'keywords',
					value: 'some keywords'
				}
			],
			onSearchConfirm: mockOnSearchConfirm,
			isSharedFolderIncludedInitialValue: false,
			includeSharedItemsInSearchPref: false
		};

		const { user } = setupTest(<AdvancedFilterModal {...properties} />);
		const confirmButton = screen.getByRole('button', { name: /action\.search/i });
		const resetButton = screen.getByRole('button', { name: /action\.reset/i });

		expect(confirmButton).toBeEnabled();
		expect(resetButton).toBeEnabled();

		await user.click(resetButton);

		expect(confirmButton).toBeDisabled();
	});

	it('should include attachment type in the query', async () => {
		jest.spyOn(console, 'error').mockImplementation();
		const onSearchConfirmMock = jest.fn();
		const properties: AdvancedFilterModalProps = {
			open: true,
			onClose: jest.fn(),
			query: [],
			onSearchConfirm: onSearchConfirmMock,
			isSharedFolderIncludedInitialValue: false,
			includeSharedItemsInSearchPref: false
		};
		const { user } = setupTest(<AdvancedFilterModal {...properties} />);

		await selectOption(user, 'attachmentTypeSelect', 'attachment_type.application');
		const actionButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(actionButton).toBeInTheDocument();
		expect(actionButton).toBeEnabled();

		await user.click(actionButton);
		await waitFor(() => {
			expect(onSearchConfirmMock).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(onSearchConfirmMock).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({
							value: 'attachment:application/*'
						})
					],
					includeSharedFolders: false
				})
			);
		});
	});

	it('should include email status in the query', async () => {
		jest.spyOn(console, 'error').mockImplementation();
		const onSearchConfirmMock = jest.fn();
		const properties: AdvancedFilterModalProps = {
			open: true,
			onClose: jest.fn(),
			query: [],
			onSearchConfirm: onSearchConfirmMock,
			isSharedFolderIncludedInitialValue: false,
			includeSharedItemsInSearchPref: false
		};
		const { user } = setupTest(<AdvancedFilterModal {...properties} />);

		await selectOption(user, 'emailStatusSelect', 'email_status.unread');
		const actionButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(actionButton).toBeInTheDocument();
		expect(actionButton).toBeEnabled();

		await user.click(actionButton);
		await waitFor(() => {
			expect(onSearchConfirmMock).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(onSearchConfirmMock).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({
							value: 'is:unread'
						})
					],
					includeSharedFolders: false
				})
			);
		});
	});

	it('should reset keyword when reset button is pressed', async () => {
		await checkResetAndSearchButton(async (user) => {
			const keywordComponent = screen.getByTestId('keywords-input');
			const keywordInputEle = within(keywordComponent).getByRole('textbox');
			await user.type(keywordInputEle, 'test');
			await user.type(keywordInputEle, '[Enter]');
		});
	});

	it('should reset subject when reset button is pressed', async () => {
		await checkResetAndSearchButton(async (user) => {
			const subjectComponent = screen.getByTestId('subject-input');
			const subjectInputEle = within(subjectComponent).getByRole('textbox');
			await user.type(subjectInputEle, 'test@test.com');
			await user.type(subjectInputEle, '[Enter]');
		});
	});

	it(`should reset 'received from' when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			const receivedFrom = screen.getByTestId('received-from-input');
			expect(receivedFrom).toBeInTheDocument();
			await user.type(receivedFrom, 'validEmail2@test.com');
			await user.type(receivedFrom, '[Enter]');
		});
	});

	it(`should reset sent to when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			const sentTo = screen.getByTestId('sent-to-input');
			expect(sentTo).toBeInTheDocument();
			await user.type(sentTo, 'validEmail@test.com');
			await user.type(sentTo, '[Enter]');
		});
	});

	it(`should reset 'attachment type' when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			await selectOption(user, 'attachmentTypeSelect', 'attachment_type.application');
		});
	});

	it(`should reset 'email status' when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			await selectOption(user, 'emailStatusSelect', 'email_status.unread');
		});
	});

	it(`should reset 'sent before' when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			const inputElement = screen.getByPlaceholderText('search.sent_before');
			const dateString = format(new Date(42424242), 'MM/dd/yyyy HH:mm');
			await user.type(inputElement, dateString);
			await user.tab();
		});
	});

	it(`should reset 'sent after' when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			const inputElement = screen.getByPlaceholderText('search.sent_after');
			const dateString = format(new Date(42424242), 'MM/dd/yyyy HH:mm');
			await user.type(inputElement, dateString);
			await user.tab();
		});
	});

	it(`should reset 'sent on' when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			const inputElement = screen.getByPlaceholderText('search.sent_on');
			const dateString = format(new Date(42424242), 'MM/dd/yyyy HH:mm');
			await user.type(inputElement, dateString);
			await user.tab();
		});
	});

	it(`should reset 'size smaller than' when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			const sizeSmaller = screen.getByTestId('sizeSmallerInput');
			const sizeSmallerEle = within(sizeSmaller).getByRole('textbox');
			await user.type(sizeSmallerEle, '42');
			await user.type(sizeSmallerEle, '[Enter]');
		});
	});

	it(`should reset 'size larger than' when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			const sizeLarger = screen.getByTestId('sizeLargerInput');
			const sizeLargerEle = within(sizeLarger).getByRole('textbox');
			await user.type(sizeLargerEle, '442');
			await user.type(sizeLargerEle, '[Enter]');
		});
	});

	it('should reset attachment toggle when reset button is pressed', async () => {
		await checkResetAndSearchButton(async (user) => {
			const hasAttachmentToggle = screen.getByTestId('hasAttachmentToggle');
			expect(hasAttachmentToggle).toBeInTheDocument();
			await user.click(hasAttachmentToggle);
		});
	});

	it(`should reset 'is flagged' toggle when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			const isFlaggedToggle = screen.getByTestId('isFlaggedToggle');
			expect(isFlaggedToggle).toBeInTheDocument();
			await user.click(isFlaggedToggle);
		});
	});

	it(`should reset unread toggle when reset button is pressed`, async () => {
		await checkResetAndSearchButton(async (user) => {
			const isUnreadToggle = screen.getByTestId('isUnreadToggle');
			expect(isUnreadToggle).toBeInTheDocument();
			await user.click(isUnreadToggle);
		});
	});

	it(`should reset 'include shared folder' toggle when reset button is pressed`, async () => {
		jest.spyOn(console, 'error').mockImplementation();
		const onSearchConfirmMock = jest.fn();
		const properties: AdvancedFilterModalProps = {
			open: true,
			onClose: jest.fn(),
			query: [],
			onSearchConfirm: onSearchConfirmMock,
			isSharedFolderIncludedInitialValue: false,
			includeSharedItemsInSearchPref: false
		};
		const { user } = setupTest(<AdvancedFilterModal {...properties} />);

		const isSharedFolderIncludedToggle = screen.getByTestId('isSharedFolderIncludedToggle');
		expect(isSharedFolderIncludedToggle).toBeInTheDocument();
		await user.click(isSharedFolderIncludedToggle);

		const actionButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(actionButton).toBeInTheDocument();
		expect(actionButton).toBeDisabled();

		const resetButton = screen.getByRole('button', {
			name: /action\.reset/i
		});
		expect(resetButton).toBeInTheDocument();
		expect(resetButton).toBeEnabled();

		await user.click(resetButton);

		await waitFor(() => {
			expect(actionButton).toBeDisabled();
		});
		await waitFor(() => {
			expect(resetButton).toBeDisabled();
		});
	});
});
