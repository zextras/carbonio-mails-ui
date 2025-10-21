/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { screen, waitFor } from '@testing-library/react';
import { AccountSettings } from '@zextras/carbonio-shell-ui';

import { setupTest } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { CONVACTIONS } from 'commons/utilities';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { MsgActionRequest, MsgActionResponse } from 'types/index.d';
import { SearchMessageListItem } from 'views/search/list/message/search-message-list-item';

it('should delete the item when clicking on Delete action when in message mode', async () => {
	const customSettings: Partial<AccountSettings> = {
		prefs: {
			zimbraPrefGroupMailBy: 'message'
		}
	};
	const settings = generateSettings(customSettings);
	useUserSettings.mockReturnValue(settings);

	const messages = await waitFor(() => populateMessagesInEmailStore({}));
	const interceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>('MsgAction', {
		action: { op: CONVACTIONS.TRASH, id: '100' }
	});

	const { user } = setupTest(
		<SearchMessageListItem
			completeMessage={messages[0]}
			selecting={false}
			active={false}
			index={0}
			onSelect={jest.fn()}
			selected={false}
		/>
	);

	const messageActionWrapper = screen.getByTestId(`MessageListItem-100`);
	expect(messageActionWrapper).toBeVisible();

	act(() => {
		user.hover(messageActionWrapper);
	});
	await screen.findByTestId(`primary-actions-bar-100`);

	act(() => {
		user.click(screen.getByTestId('icon: Trash2Outline'));
	});
	const request = await interceptor;
	expect(request.action).toStrictEqual({ id: '100', op: CONVACTIONS.TRASH });
});
