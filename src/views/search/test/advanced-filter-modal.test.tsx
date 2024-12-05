/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';

import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../tests/generators/store';
import { AdvancedFilterModalProps, SearchQueryItem } from '../../../types';
import { AdvancedFilterModal } from '../advanced-filter-modal';

describe('Advanced filter modal', () => {
	const props: AdvancedFilterModalProps = {
		open: true,
		onClose: jest.fn(),
		query: [],
		updateQuery: jest.fn(),
		setIsSharedFolderIncluded: jest.fn(),
		isSharedFolderIncluded: false
	};
	it('render the advanced filter modal', () => {
		const store = generateStore();
		setupTest(<AdvancedFilterModal {...props} />, { store });
		const fieldLabel = screen.getByText(/label\.single_advanced_filter/i);
		expect(fieldLabel).toBeInTheDocument();
	});
	it('search button should be disable when modal open', () => {
		const store = generateStore();
		setupTest(<AdvancedFilterModal {...props} />, { store });
		const fieldLabel = screen.getByText(/label\.single_advanced_filter/i);
		expect(fieldLabel).toBeInTheDocument();

		const actionButton = screen.getByRole('button', {
			name: /action\.search/i
		});
		expect(actionButton).toBeInTheDocument();
		expect(actionButton).toBeDisabled();
	});
	it('search button should be enable on keyword, subject change', async () => {
		const store = generateStore();
		const { user } = setupTest(<AdvancedFilterModal {...props} />, { store });
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
	it('should add "received from" to query with value and label including "from:" after adding a value in the input', async () => {
		const store = generateStore();
		const mockUpdateQuery = jest.fn();
		const { user } = setupTest(
			<AdvancedFilterModal
				open
				isSharedFolderIncluded={false}
				onClose={jest.fn()}
				query={[]}
				updateQuery={mockUpdateQuery}
				setIsSharedFolderIncluded={jest.fn()}
			/>,
			{ store }
		);
		const sentTo = screen.getByTestId('received-from-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(mockUpdateQuery).toHaveBeenCalledWith([
				{
					id: 'validEmail@test.com',
					label: 'from:validEmail@test.com',
					value: 'from:validEmail@test.com'
				}
			]);
		});
	});

	it('should add "sent to" to query with value and label including "to:" after adding a value in the input', async () => {
		const store = generateStore();
		const mockUpdateQuery = jest.fn();
		const { user } = setupTest(
			<AdvancedFilterModal
				open
				isSharedFolderIncluded={false}
				onClose={jest.fn()}
				query={[]}
				updateQuery={mockUpdateQuery}
				setIsSharedFolderIncluded={jest.fn()}
			/>,
			{ store }
		);
		const sentTo = screen.getByTestId('sent-to-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(mockUpdateQuery).toHaveBeenCalledWith([
				{
					id: 'validEmail@test.com',
					label: 'to:validEmail@test.com',
					value: 'to:validEmail@test.com'
				}
			]);
		});
	});
	it('should keep previous query first value after adding a new value in "sent to" input', async () => {
		const store = generateStore();
		const mockUpdateQuery = jest.fn();
		const query: SearchQueryItem = {
			id: 'query1',
			label: 'from:someone@test.com',
			value: 'from:someone@test.com'
		};
		const { user } = setupTest(
			<AdvancedFilterModal
				open
				isSharedFolderIncluded={false}
				onClose={jest.fn()}
				query={[query]}
				updateQuery={mockUpdateQuery}
				setIsSharedFolderIncluded={jest.fn()}
			/>,
			{ store }
		);
		const sentTo = screen.getByTestId('sent-to-input');
		await user.type(sentTo, 'validEmail@test.com');
		await user.type(sentTo, '[Enter]');
		expect(sentTo).toBeInTheDocument();
		const confirmButton = screen.getByText('action.search');
		await user.click(confirmButton);
		await waitFor(() => {
			expect(mockUpdateQuery).toHaveBeenCalledWith([
				expect.objectContaining({
					id: 'query1',
					label: 'from:someone@test.com',
					value: 'from:someone@test.com'
				}),
				{
					id: 'validEmail@test.com',
					label: 'to:validEmail@test.com',
					value: 'to:validEmail@test.com'
				}
			]);
		});
	});
});
