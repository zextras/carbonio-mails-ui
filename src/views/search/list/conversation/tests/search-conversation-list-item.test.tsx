/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { waitFor, screen } from '@testing-library/react';
import { AccountSettings } from '@zextras/carbonio-shell-ui';

import { useUserSettings } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateSettings } from '../../../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { CONVACTIONS } from '../../../../../commons/utilities';
import { populateConversationInEmailStore } from '../../../../../tests/generators/generateConversation';
import { ConvActionRequest, ConvActionResponse } from '../../../../../types';
import { SearchConversationListItem } from '../search-conversation-list-item';

it('search conversation list item should delete the item when clicking on Delete action when in conversation mode', async () => {
	const ID = '-123';
	const customSettings: Partial<AccountSettings> = {
		prefs: {
			zimbraPrefGroupMailBy: 'conversation'
		}
	};
	const settings = generateSettings(customSettings);
	useUserSettings.mockReturnValue(settings);

	await waitFor(() =>
		populateConversationInEmailStore({
			conversationParams: { id: ID, subject: 'Test Subject' },
			conversationMessagesNumber: 3
		})
	);
	const interceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
		'ConvAction',
		{ action: { id: ID, op: CONVACTIONS.TRASH } }
	);

	const { user } = setupTest(
		<SearchConversationListItem
			conversationId={ID}
			selecting={false}
			active={false}
			activeItemId={''}
			toggle={jest.fn()}
			selected={false}
			deselectAll={jest.fn()}
		/>
	);

	const messageActionWrapper = screen.getByTestId(`ConversationListItem-${ID}`);
	expect(messageActionWrapper).toBeVisible();

	act(() => {
		user.hover(messageActionWrapper);
	});
	const hoverBar = await screen.findByTestId(`primary-actions-bar-${ID}`);
	expect(hoverBar).toBeVisible();

	act(() => {
		user.click(screen.getByTestId('icon: Trash2Outline'));
	});
	const request = await interceptor;
	expect(request.action).toStrictEqual({ id: ID, op: CONVACTIONS.TRASH });
});
