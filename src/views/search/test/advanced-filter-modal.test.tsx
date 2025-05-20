/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode } from 'react';

import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { format } from 'date-fns';
import { useForm, FormProvider } from 'react-hook-form';

import {
	EDIT_ACTION,
	generateMockContactInputItem,
	mockContactInput
} from '../../../carbonio-ui-commons/test/mocks/integrations/mock-contact-input';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { AdvancedFilterModal } from '../advanced-filter-modal';
import {
	AdvancedFilterModalProps,
	AdvancedFilterModalFormValues,
	Query,
	SearchQueryItem
} from '../types/types';
import { getAdvancedFiltersDefaultValues } from '../utils';

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

const emptyQuery: Query = [];
const defaultValues = getAdvancedFiltersDefaultValues(emptyQuery, false);

const renderWithUseForm = async (
	component: React.JSX.Element,
	formValues: Partial<AdvancedFilterModalFormValues> = {}
): Promise<{ user: UserEvent }> => {
	const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => {
		const methods = useForm<AdvancedFilterModalFormValues>({ defaultValues: formValues });
		return <FormProvider {...methods}>{children}</FormProvider>;
	};

	const { user } = setupTest(<Wrapper>{component}</Wrapper>);
	return { user };
};

async function checkResetAndSearchButton(f: (user: UserEvent) => Promise<void>): Promise<void> {
	const updateQueryMock = jest.fn();
	const properties: AdvancedFilterModalProps = {
		onClose: jest.fn(),
		updateQuery: updateQueryMock,
		query: emptyQuery
	};

	const { user } = await renderWithUseForm(<AdvancedFilterModal {...properties} />, defaultValues);

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
	const defaultProps: AdvancedFilterModalProps = {
		onClose: jest.fn(),
		query: emptyQuery,
		updateQuery: jest.fn()
	};

	it('render the advanced filter modal', () => {
		renderWithUseForm(<AdvancedFilterModal {...defaultProps} />, defaultValues);
		const fieldLabel = screen.getByText(/label\.single_advanced_filter/i);
		expect(fieldLabel).toBeInTheDocument();
	});

	it('search button should be disable when modal open', () => {
		renderWithUseForm(<AdvancedFilterModal {...defaultProps} />, defaultValues);
		const fieldLabel = screen.getByText(/label\.single_advanced_filter/i);
		expect(fieldLabel).toBeInTheDocument();

		const actionButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(actionButton).toBeInTheDocument();
		expect(actionButton).toBeDisabled();
	});

	it('search button should be enable on keyword, subject change', async () => {
		const { user } = await renderWithUseForm(
			<AdvancedFilterModal {...defaultProps} />,
			defaultValues
		);
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
		const query = [
			{
				id: 'query1',
				label: 'keywords',
				value: 'keyword'
			}
		];
		const customDefaultValues = getAdvancedFiltersDefaultValues(query, false);
		await renderWithUseForm(
			<AdvancedFilterModal {...defaultProps} query={query} />,
			customDefaultValues
		);
		const actionButton = screen.getByRole('button', { name: /action\.search/i });

		expect(actionButton).toBeEnabled();
	});

	it('search button should be disabled if there is no query', async () => {
		await renderWithUseForm(<AdvancedFilterModal {...defaultProps} />, defaultValues);
		const actionButton = screen.getByRole('button', { name: /action\.search/i });

		expect(actionButton).toBeDisabled();
	});

	it('should call updateQuery with correct args when confirm button is clicked', async () => {
		const updateQueryMock = jest.fn();
		const onCloseMock = jest.fn();

		const { user } = await renderWithUseForm(
			<AdvancedFilterModal {...defaultProps} updateQuery={updateQueryMock} onClose={onCloseMock} />,
			defaultValues
		);

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
			expect(updateQueryMock).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(updateQueryMock).toHaveBeenCalledWith([
				{ label: 'test keyword', isGeneric: true, hasAvatar: false }
			]);
		});

		expect(onCloseMock).toHaveBeenCalledTimes(1);
	});

	it('should add from suffix to query label but not to query value', async () => {
		const updqateQueryMock = jest.fn();

		const props: AdvancedFilterModalProps = {
			...defaultProps,
			updateQuery: updqateQueryMock
		};
		const { user } = await renderWithUseForm(<AdvancedFilterModal {...props} />, defaultValues);
		const sentTo = screen.getByTestId('received-from-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(updqateQueryMock).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(updqateQueryMock).toHaveBeenCalledWith([
				expect.objectContaining({
					label: 'from:validEmail@test.com',
					value: 'validEmail@test.com'
				})
			]);
		});
	});

	it('should add to suffix to query label but not to value', async () => {
		const updateQueryMock = jest.fn();

		const props: AdvancedFilterModalProps = {
			...defaultProps,
			updateQuery: updateQueryMock
		};

		const { user } = await renderWithUseForm(<AdvancedFilterModal {...props} />, defaultValues);
		const sentTo = screen.getByTestId('sent-to-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(updateQueryMock).toHaveBeenCalledWith([
				expect.objectContaining({
					label: 'to:validEmail@test.com',
					value: 'validEmail@test.com'
				})
			]);
		});
	});

	it('should keep previous query first value after adding a new value in "sent to" input', async () => {
		const updateQueryMock = jest.fn();

		const query: SearchQueryItem = {
			id: 'query1',
			label: 'from:someone@test.com',
			value: 'someone@test.com'
		};

		const props: AdvancedFilterModalProps = {
			...defaultProps,
			query: [query],
			updateQuery: updateQueryMock
		};

		const customValues = getAdvancedFiltersDefaultValues([query], false);
		const { user } = await renderWithUseForm(<AdvancedFilterModal {...props} />, customValues);
		const sentTo = screen.getByTestId('sent-to-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(updateQueryMock).toHaveBeenCalledWith([
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
			]);
		});
	});

	it('should remove edit action from query chip for "to" and "from" fields', async () => {
		const valueToAdd = generateMockContactInputItem();
		valueToAdd.actions = [EDIT_ACTION];
		mockContactInput({ valueToAdd });

		const updateQueryMock = jest.fn();

		const props: AdvancedFilterModalProps = {
			...defaultProps,
			updateQuery: updateQueryMock
		};

		const query: SearchQueryItem = {
			id: 'query1',
			label: 'from:someone@test.com',
			value: 'someone@test.com'
		};

		const customDefaultValues = getAdvancedFiltersDefaultValues([query], false);
		const { user } = await renderWithUseForm(
			<AdvancedFilterModal {...props} />,
			customDefaultValues
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
			expect(updateQueryMock).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(updateQueryMock).toHaveBeenCalledWith([
				expect.objectContaining({
					actions: []
				}),
				expect.objectContaining({
					actions: []
				})
			]);
		});
	});

	it('should display "to" and "from" with edit action in their inputs', async () => {
		const valueToAdd = generateMockContactInputItem();
		valueToAdd.actions = [EDIT_ACTION];
		mockContactInput({ valueToAdd });

		const updateQueryMock = jest.fn();

		const props: AdvancedFilterModalProps = {
			...defaultProps,
			updateQuery: updateQueryMock
		};

		const { user } = await renderWithUseForm(<AdvancedFilterModal {...props} />, defaultValues);

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
		const query = [
			{
				id: 'query1',
				label: 'keywords',
				value: 'keyword'
			}
		];
		const customDefaultValues = getAdvancedFiltersDefaultValues(query, false);
		await renderWithUseForm(
			<AdvancedFilterModal {...defaultProps} query={query} />,
			customDefaultValues
		);
		const actionButton = screen.getByRole('button', { name: /action\.reset/i });
		expect(actionButton).toBeEnabled();
	});

	it('reset filters button should be disabled on render', async () => {
		await renderWithUseForm(<AdvancedFilterModal {...defaultProps} />, defaultValues);
		const fieldLabel = screen.getByText(/label\.single_advanced_filter/i);
		expect(fieldLabel).toBeInTheDocument();

		const resetButton = screen.getByRole('button', {
			name: /action\.reset/i
		});
		expect(resetButton).toBeInTheDocument();
		expect(resetButton).toBeDisabled();
	});

	it('should disable search button when reset filters button is clicked', async () => {
		const updateQueryMock = jest.fn();

		const query = [
			{
				id: 'query1',
				label: 'keywords',
				value: 'some keywords'
			}
		];

		const props: AdvancedFilterModalProps = {
			...defaultProps,
			updateQuery: updateQueryMock,
			query
		};

		const customDefaultValues = getAdvancedFiltersDefaultValues(query, false);
		const { user } = await renderWithUseForm(
			<AdvancedFilterModal {...props} />,
			customDefaultValues
		);
		const confirmButton = screen.getByRole('button', { name: /action\.search/i });
		const resetButton = screen.getByRole('button', { name: /action\.reset/i });

		expect(confirmButton).toBeEnabled();
		expect(resetButton).toBeEnabled();

		await user.click(resetButton);

		expect(confirmButton).toBeDisabled();
	});

	it('should include attachment type in the query', async () => {
		const updateQueryMock = jest.fn();
		const props: AdvancedFilterModalProps = {
			...defaultProps,
			updateQuery: updateQueryMock
		};

		const customDefaultValues = getAdvancedFiltersDefaultValues(emptyQuery, false);
		const { user } = await renderWithUseForm(
			<AdvancedFilterModal {...props} />,
			customDefaultValues
		);

		await selectOption(user, 'attachmentTypeSelect', 'attachment_type.application');
		const actionButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(actionButton).toBeInTheDocument();
		expect(actionButton).toBeEnabled();

		await user.click(actionButton);
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(updateQueryMock).toHaveBeenCalledWith([
				expect.objectContaining({
					value: 'attachment:application/*'
				})
			]);
		});
	});

	it('should include email status in the query', async () => {
		const updateQueryMock = jest.fn();
		const properties: AdvancedFilterModalProps = {
			onClose: jest.fn(),
			query: [],
			updateQuery: updateQueryMock
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
			expect(updateQueryMock).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
			expect(updateQueryMock).toHaveBeenCalledWith([
				expect.objectContaining({
					value: 'is:unread'
				})
			]);
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
		const updateQueryMock = jest.fn();
		const properties: AdvancedFilterModalProps = {
			updateQuery: updateQueryMock,
			onClose: jest.fn(),
			query: []
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
