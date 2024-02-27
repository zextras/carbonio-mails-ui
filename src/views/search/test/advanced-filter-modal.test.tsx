/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { screen, within } from '@testing-library/react';

import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../tests/generators/store';
import { AdvancedFilterModalProps } from '../../../types';
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
});
