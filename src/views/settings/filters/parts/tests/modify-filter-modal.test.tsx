/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { t } from '@zextras/carbonio-shell-ui';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../tests/generators/store';
import ModifyFilterModal from '../modify-filter/modify-filter-modal';

describe('ModifyFilterModal', () => {
	it('should display modal with current saved actions', async () => {
		const store = generateStore();
		const { user } = setupTest(
			<ModifyFilterModal
				t={t}
				onClose={jest.fn()}
				selectedFilter={{
					id: '1',
					name: 'Test Filter',
					active: true,
					filterTests: [],
					filterActions: [
						{
							actionKeep: [{}],
							actionTag: [{ tagName: 'tag 1' }],
							actionFlag: [{ flagName: 'flagged' }]
						}
					]
				}}
				setFetchIncomingFilters={jest.fn()}
				setIncomingFilters={jest.fn()}
			/>,
			{
				store
			}
		);

		screen.logTestingPlaygroundURL();
		expect(screen.getByText('Keep in Inbox')).toBeVisible();
		expect(await screen.findByText(/Tag with/i)).toBeVisible();
		expect(screen.getByText('tag 1')).toBeVisible();
		expect(screen.getByText('Mark as')).toBeVisible();
		expect(screen.getByText('Flagged')).toBeVisible();
	});
});
