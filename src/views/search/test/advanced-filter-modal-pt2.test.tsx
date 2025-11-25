/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { useContactInput } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import {
	EDIT_ACTION,
	generateMockContactInputItem,
	generateMockedContactInput
} from '@test-utils/integrations/mock-contact-input';
import { AdvancedFilterModal } from 'views/search/advanced-filter-modal';
import {
	defaultProps,
	defaultValues,
	renderWithUseForm
} from 'views/search/test/test-advanced-filter-modal-common-utils';
import { AdvancedFilterModalProps, SearchQueryItem } from 'views/search/types/types';
import { getAdvancedFiltersDefaultValues } from 'views/search/utils';

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	useContactInput: vi.fn()
}));

describe('advanced-filter-modal-pt2', () => {
	it('should remove edit action from query chip for "to" and "from" fields', async () => {
		const valueToAdd = generateMockContactInputItem();
		valueToAdd.actions = [EDIT_ACTION];
		(useContactInput as Mock).mockReturnValue(generateMockedContactInput(valueToAdd));

		const updateQueryMock = vi.fn();

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
		(useContactInput as Mock).mockReturnValue(generateMockedContactInput(valueToAdd));

		const updateQueryMock = vi.fn();

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
});
