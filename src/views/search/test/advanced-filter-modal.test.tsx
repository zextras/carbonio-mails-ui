/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act, ReactNode } from 'react';

import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { format } from 'date-fns';
import { useForm, FormProvider } from 'react-hook-form';

import { getTags } from '../../../carbonio-ui-commons/store/zustand/tags';
import { generateFolder } from '../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import {
	EDIT_ACTION,
	generateMockContactInputItem,
	mockContactInput
} from '../../../carbonio-ui-commons/test/mocks/integrations/mock-contact-input';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { tags as mockTags } from '../../../carbonio-ui-commons/test/mocks/tags/tags';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { TIMERS } from '../../../tests/constants';
import { AdvancedFilterModal } from '../advanced-filter-modal';
import {
	AdvancedFilterModalProps,
	AdvancedFilterModalFormValues,
	Query,
	SearchQueryItem
} from '../types/types';
import { getAdvancedFiltersDefaultValues } from '../utils';

jest.mock('../../../carbonio-ui-commons/store/zustand/tags/hooks', () => ({
	getTags: jest.fn()
}));

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
		isSharedFolderIncluded: false,
		onClose: jest.fn(),
		onSearchConfirm: updateQueryMock,
		query: emptyQuery
	};

	const { user } = await renderWithUseForm(<AdvancedFilterModal {...properties} />, defaultValues);

	await f(user);

	const confirmButton = screen.getByRole('button', {
		name: /action\.search/i
	});
	expect(confirmButton).toBeInTheDocument();
	expect(confirmButton).toBeEnabled();

	const resetButton = screen.getByRole('button', {
		name: /action\.reset/i
	});
	expect(resetButton).toBeInTheDocument();
	expect(resetButton).toBeEnabled();

	await user.click(resetButton);

	await waitFor(() => {
		expect(confirmButton).toBeDisabled();
	});
	await waitFor(() => {
		expect(resetButton).toBeDisabled();
	});
}

describe('Advanced filter modal', () => {
	const defaultProps: AdvancedFilterModalProps = {
		isSharedFolderIncluded: false,
		onClose: jest.fn(),
		query: emptyQuery,
		onSearchConfirm: jest.fn()
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

		const confirmButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(confirmButton).toBeInTheDocument();
		expect(confirmButton).toBeDisabled();
	});

	it('search button should be enable on keyword, subject change', async () => {
		const { user } = await renderWithUseForm(
			<AdvancedFilterModal {...defaultProps} />,
			defaultValues
		);
		const fieldLabel = screen.getByText(/label\.single_advanced_filter/i);
		expect(fieldLabel).toBeInTheDocument();

		const confirmButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(confirmButton).toBeInTheDocument();
		expect(confirmButton).toBeDisabled();

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

		expect(confirmButton).toBeEnabled();
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
		const confirmButton = screen.getByRole('button', { name: /action\.search/i });

		expect(confirmButton).toBeEnabled();
	});

	it('search button should be disabled if there is no query', async () => {
		await renderWithUseForm(<AdvancedFilterModal {...defaultProps} />, defaultValues);
		const confirmButton = screen.getByRole('button', { name: /action\.search/i });

		expect(confirmButton).toBeDisabled();
	});

	it('should call updateQuery with correct args when confirm button is clicked', async () => {
		const updateQueryMock = jest.fn();
		const onCloseMock = jest.fn();

		const { user } = await renderWithUseForm(
			<AdvancedFilterModal
				{...defaultProps}
				onSearchConfirm={updateQueryMock}
				onClose={onCloseMock}
			/>,
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
		});
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({ label: 'test keyword', isGeneric: true, hasAvatar: false })
					]
				})
			);
		});

		expect(onCloseMock).toHaveBeenCalledTimes(1);
	});

	it('should add from suffix to query label but not to query value', async () => {
		const updateQueryMock = jest.fn();

		const props: AdvancedFilterModalProps = {
			...defaultProps,
			onSearchConfirm: updateQueryMock
		};
		const { user } = await renderWithUseForm(<AdvancedFilterModal {...props} />, defaultValues);
		const sentTo = screen.getByTestId('received-from-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledTimes(1);
		});
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledWith({
				includeSharedFolders: false,
				query: [
					expect.objectContaining({
						label: 'from:validEmail@test.com',
						value: 'validEmail@test.com'
					})
				]
			});
		});
	});

	it('should add to suffix to query label but not to value', async () => {
		const updateQueryMock = jest.fn();

		const props: AdvancedFilterModalProps = {
			...defaultProps,
			onSearchConfirm: updateQueryMock
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
		});
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledWith({
				includeSharedFolders: false,
				query: [
					expect.objectContaining({
						label: 'to:validEmail@test.com',
						value: 'validEmail@test.com'
					})
				]
			});
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
			onSearchConfirm: updateQueryMock
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
		});
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledWith(
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
					]
				})
			);
		});
	});

	it('should remove edit action from query chip for "to" and "from" fields', async () => {
		const valueToAdd = generateMockContactInputItem();
		valueToAdd.actions = [EDIT_ACTION];
		mockContactInput({ valueToAdd });

		const updateQueryMock = jest.fn();

		const props: AdvancedFilterModalProps = {
			...defaultProps,
			onSearchConfirm: updateQueryMock
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
		});
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({
							actions: []
						}),
						expect.objectContaining({
							actions: []
						})
					]
				})
			);
		});
	});

	it('should display "to" and "from" with edit action in their inputs', async () => {
		const valueToAdd = generateMockContactInputItem();
		valueToAdd.actions = [EDIT_ACTION];
		mockContactInput({ valueToAdd });

		const updateQueryMock = jest.fn();

		const props: AdvancedFilterModalProps = {
			...defaultProps,
			onSearchConfirm: updateQueryMock
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
		const confirmButton = screen.getByRole('button', { name: /action\.reset/i });
		expect(confirmButton).toBeEnabled();
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
			onSearchConfirm: updateQueryMock,
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
			onSearchConfirm: updateQueryMock
		};

		const customDefaultValues = getAdvancedFiltersDefaultValues(emptyQuery, false);
		const { user } = await renderWithUseForm(
			<AdvancedFilterModal {...props} />,
			customDefaultValues
		);

		await selectOption(user, 'attachmentTypeSelect', 'attachment_type.application');
		const confirmButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(confirmButton).toBeInTheDocument();
		expect(confirmButton).toBeEnabled();

		await user.click(confirmButton);
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledTimes(1);
		});
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({
							value: 'attachment:application/*'
						})
					]
				})
			);
		});
	});

	it('should include email status in the query', async () => {
		const updateQueryMock = jest.fn();
		const properties: AdvancedFilterModalProps = {
			onClose: jest.fn(),
			isSharedFolderIncluded: false,
			query: [],
			onSearchConfirm: updateQueryMock
		};
		const { user } = setupTest(<AdvancedFilterModal {...properties} />);

		await selectOption(user, 'emailStatusSelect', 'email_status.unread');
		const confirmButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(confirmButton).toBeInTheDocument();
		expect(confirmButton).toBeEnabled();

		await user.click(confirmButton);
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledTimes(1);
		});
		await waitFor(() => {
			expect(updateQueryMock).toHaveBeenCalledWith(
				expect.objectContaining({
					query: [
						expect.objectContaining({
							value: 'is:unread'
						})
					]
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

	it(`should reset 'tags' when reset button is pressed`, async () => {
		(getTags as jest.Mock).mockReturnValue(mockTags);
		await checkResetAndSearchButton(async (user) => {
			const selectElement = screen.getByTestId('tagInput');
			expect(selectElement).toBeInTheDocument();
			await user.click(selectElement);
			const selectOption = screen.getAllByTestId('dropdown-item')[0];
			await user.click(selectOption);
		});
	});

	it(`should reset 'Is contained in' input when reset button is pressed`, async () => {
		const folderName = 'random-inbox';
		populateFoldersStore({
			customFolders: [generateFolder({ id: '222', name: folderName })]
		});
		await checkResetAndSearchButton(async (user) => {
			const openFolderDialogButton = within(screen.getByTestId('folderInput')).getByTestId(
				'icon: FolderOutline'
			);
			expect(openFolderDialogButton).toBeInTheDocument();
			await user.click(openFolderDialogButton);

			act(() => {
				jest.advanceTimersByTime(TIMERS.modal_open_delay);
			});

			const folderOption = screen.getByText(folderName);

			await user.click(folderOption);

			const chooseFolderButton = screen.getByRole('button', { name: 'label.choose_folder' });

			await user.click(chooseFolderButton);
		});
	});

	it(`should reset 'include shared folder' toggle when reset button is pressed`, async () => {
		const updateQueryMock = jest.fn();
		const properties: AdvancedFilterModalProps = {
			isSharedFolderIncluded: false,
			onSearchConfirm: updateQueryMock,
			onClose: jest.fn(),
			query: []
		};
		const { user } = setupTest(<AdvancedFilterModal {...properties} />);

		const isSharedFolderIncludedToggle = screen.getByTestId('isSharedFolderIncludedToggle');
		expect(isSharedFolderIncludedToggle).toBeInTheDocument();
		await user.click(isSharedFolderIncludedToggle);

		const confirmButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(confirmButton).toBeInTheDocument();
		expect(confirmButton).toBeDisabled();

		const resetButton = screen.getByRole('button', {
			name: /action\.reset/i
		});
		expect(resetButton).toBeInTheDocument();
		expect(resetButton).toBeEnabled();

		await user.click(resetButton);

		await waitFor(() => {
			expect(confirmButton).toBeDisabled();
		});
		await waitFor(() => {
			expect(resetButton).toBeDisabled();
		});
	});

	it('should reset shared folder toggle to initial state when modal is closed without search confirmation', async () => {
		const updateQueryMock = jest.fn();
		const propertiesInitialSearch: AdvancedFilterModalProps = {
			isSharedFolderIncluded: false,
			onSearchConfirm: updateQueryMock,
			onClose: jest.fn(),
			query: []
		};

		const { user, rerender } = setupTest(<AdvancedFilterModal {...propertiesInitialSearch} />);

		// Initial state check
		const isSharedFolderIncludedToggle = screen.getByTestId('isSharedFolderIncludedToggle');
		expect(isSharedFolderIncludedToggle).toBeInTheDocument();
		expect(
			within(isSharedFolderIncludedToggle).getByTestId('icon: ToggleLeftOutline')
		).toBeInTheDocument();

		// Toggle the shared folder inclusion
		await user.click(isSharedFolderIncludedToggle);
		expect(
			within(isSharedFolderIncludedToggle).getByTestId('icon: ToggleRight')
		).toBeInTheDocument();

		const closeButton = screen.getByTestId('icon: Close');
		await user.click(closeButton);

		rerender(<AdvancedFilterModal {...propertiesInitialSearch} />);

		// Wait for the modal to be fully rendered and state to be reset
		await waitFor(() => {
			const toggle = screen.getByTestId('isSharedFolderIncludedToggle');
			expect(within(toggle).getByTestId('icon: ToggleLeftOutline')).toBeInTheDocument();
		});
	});

	it('should preserve shared folder toggle after a search', async () => {
		const updateQueryMock = jest.fn();
		const propertiesInitialSearch: AdvancedFilterModalProps = {
			isSharedFolderIncluded: false,
			onSearchConfirm: updateQueryMock,
			onClose: jest.fn(),
			query: [
				{
					id: 'query1',
					label: 'keywords',
					value: 'keyword'
				}
			]
		};

		const { user, rerender } = setupTest(<AdvancedFilterModal {...propertiesInitialSearch} />);

		// Initial state check
		const isSharedFolderIncludedToggle = screen.getByTestId('isSharedFolderIncludedToggle');
		expect(isSharedFolderIncludedToggle).toBeInTheDocument();
		expect(
			within(isSharedFolderIncludedToggle).getByTestId('icon: ToggleLeftOutline')
		).toBeInTheDocument();

		// Toggle the shared folder inclusion
		await user.click(isSharedFolderIncludedToggle);
		expect(
			within(isSharedFolderIncludedToggle).getByTestId('icon: ToggleRight')
		).toBeInTheDocument();

		const confirmButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(confirmButton).toBeEnabled();

		await user.click(confirmButton);

		expect(updateQueryMock).toHaveBeenCalledTimes(1);
		expect(updateQueryMock).toHaveBeenCalledWith(
			expect.objectContaining({
				includeSharedFolders: true
			})
		);

		rerender(<AdvancedFilterModal {...propertiesInitialSearch} />);

		// Wait for the modal to be fully rendered and state to be reset
		await waitFor(() => {
			const toggle = screen.getByTestId('isSharedFolderIncludedToggle');
			expect(within(toggle).getByTestId('icon: ToggleRight')).toBeInTheDocument();
		});
	});
});
