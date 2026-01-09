/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { act } from 'react';

import { screen } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';

import { generateMessageFromAPI } from '../../__test__/generators/api';
import { mockLayoutStorage } from '../../__test__/layouts-utils';
import { MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from '../../constants';
import { SearchRequest, SearchResponse } from '../../types';
import AppView from '../app-view';
import { makeAllItemsVisible } from '../settings/filters/tests/test-utils';
import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { populateFoldersStore } from '@test-utils/store/folders';

describe('AppView', () => {
	it('should render without crashing', async () => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.SPLIT,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		});
		const settings = generateSettings({
			prefs: {
				zimbraPrefGroupMailBy: 'message'
			}
		});
		vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const incompleteMessage = generateMessageFromAPI({
			id: '123',
			su: 'Test message 1',
			l: '2',
			fr: 'Test m'
		});
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			more: false,
			m: [incompleteMessage]
		});

		populateFoldersStore();

		act(() => {
			setupTest(<AppView />, {
				initialEntries: [`/folder/2`]
			});
		});

		await screen.findByTestId('message-item-123');
		makeAllItemsVisible();
		expect(await screen.findByText('Test message 1')).toBeInTheDocument();
	});
});
