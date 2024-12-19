/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { CompProps } from '../../../../../types';
import { FilterActionsPanel } from '../filter-actions-panel';

describe('FilterActionsPanel', () => {
	it('should update actions when switching an existing action for another one', async () => {
		const mockCompProps: CompProps = {
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
});
