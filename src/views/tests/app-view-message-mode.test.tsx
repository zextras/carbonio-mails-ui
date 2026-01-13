/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { configure, screen } from '@testing-library/react';

import { generateMessageFromAPI } from '../../__test__/generators/api';
import { mockLayoutStorage } from '../../__test__/layouts-utils';
import { stubSearchMessages } from '../../__test__/message/api-stub';
import { setupViewByMessage } from '../../__test__/setup-utils';
import { MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from '../../constants';
import AppView from '../app-view';
import { makeAllItemsVisible } from '../settings/filters/tests/test-utils';
import { setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';

describe('AppView in message mode', () => {
	beforeAll(() => {
		configure({ asyncUtilTimeout: 5000 });
	});
	beforeEach(() => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.SPLIT,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		});
		populateFoldersStore();
	});
	describe('Messages', () => {
		it('should display received messages on app load', async () => {
			setupViewByMessage();
			const incompleteMessage = generateMessageFromAPI({
				id: '123',
				su: 'Test message 1',
				l: '2',
				fr: 'Test m'
			});
			stubSearchMessages({ messages: [incompleteMessage] });
			setupTest(<AppView />, {
				initialEntries: [`/folder/2`]
			});

			// lazy components need longer timeout
			await screen.findByTestId('message-item-123', {}, { timeout: 10000 });
			makeAllItemsVisible();
			expect(await screen.findByText('Test message 1')).toBeInTheDocument();
		});
	});
});
