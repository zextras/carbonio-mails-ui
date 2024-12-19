/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { FilterActionsProps } from '../../../../../types';
import { FilterActionsPanel } from '../filter-actions-panel';

describe('FilterActionsPanel', () => {
	it('should update actions when switching an existing action for another one', async () => {
		const mockCompProps: FilterActionsProps = {
			setTempActions: jest.fn(),
			zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' as const,
			isIncoming: true,
			tempActions: [
				{ id: '7', actionKeep: [{}] },
				{ id: '21', actionDiscard: [{}] },
				{ id: '33', actionRedirect: [{}] }
			]
		};
		const { user } = setupTest(<FilterActionsPanel compProps={mockCompProps} />, {});
		await user.click(screen.getByText('Keep in Inbox'));
		const dropdown = screen.getByTestId('dropdown-popper-list');
		await user.click(within(dropdown).getByText('Discard'));

		expect(mockCompProps.setTempActions).toHaveBeenCalledWith([
			{ id: '7', actionDiscard: [{}] },
			{ id: '21', actionDiscard: [{}] },
			{ id: '33', actionRedirect: [{}] }
		]);
	});

	// TODO: this test makes sense only when moved at higher level as it involves changes in state
	it.skip('should reset the tag input after changing action from tag to keep back to tag', async () => {
		const filterName = 'Test Designer';
		const mockCompProps: FilterActionsProps = {
			setTempActions: jest.fn(),
			zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' as const,
			isIncoming: true,
			tempActions: [{ actionTag: [{ tagName: filterName }] }]
		};
		const { user } = setupTest(<FilterActionsPanel compProps={mockCompProps} />, {});
		expect(screen.getByText(filterName)).toBeVisible();

		await user.click(screen.getByText('Tag with'));
		await user.click(screen.getByText('Keep in Inbox'));
		await user.click(screen.getByText('Keep in Inbox'));
		await user.click(screen.getByText('Tag with'));

		expect(screen.queryByText(filterName)).not.toBeInTheDocument();
	});
});
