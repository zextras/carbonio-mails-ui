/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// import React from 'react';
// import { testUtils, useUserAccounts } from '@zextras/zapp-shell';
// import { screen } from '@testing-library/react';
// import { map } from 'lodash';
// import faker from 'faker';
// import userEvent from '@testing-library/user-event';
// import reducers from '../store/reducers';

// import { generateConversation } from '../mocks/generators';
// // import { normalizeMailMessageFromSoap } from '../../commons/normalize-message';
// // import { getTimeLabel } from '../../commons/utils';
// // import { selectFolders } from '../../store/folders-slice';
// // import MessageListItem from './message-list-lists-item';
// import { normalizeConversationFromSoap } from '../normalizations/normalize-conversation';
// import SelectPanelActions from './select-panel-action';

describe.skip('Select Panel Actions', () => {
	test.skip('Show Mark as Read ', async () => {
		// const ctx = {};
		// const selectedIDs = map(new Array(10), () => faker.random.number().toString());
		// const conversation = map(selectedIDs, (id) =>
		// 	normalizeConversationFromSoap(
		// 		generateConversation({ folderId: '3', conversationId: id, isRead: false })
		// 	)
		// );
		// const deselectAll = jest.fn();
		// await testUtils.render(
		// 	<SelectPanelActions
		// 		conversation={conversation}
		// 		folderId="2"
		// 		selectedIDs={selectedIDs}
		// 		deselectAll={deselectAll}
		// 	/>,
		// 	{
		// 		ctxt: ctx,
		// 		reducer: reducers,
		// 		initialRouterEntries: [`/folder/2`]
		// 	}
		// );
		// expect(screen.getByTestId('primary-action-button-action.mark_as_read')).toBeInTheDocument();
	});

	// test.skip('Show Delete Action if Conversation is in Select Mode', async () => {
	// 	const ctx = {};

	// 	const selectedIDs = map(new Array(10), () => faker.random.number().toString());

	// 	const conversation = map(selectedIDs, (id) =>
	// 		normalizeConversationFromSoap(generateConversation({ folderId: '3', conversationId: id }))
	// 	);
	// 	const deselectAll = jest.fn();
	// 	await testUtils.render(
	// 		<SelectPanelActions
	// 			conversation={conversation}
	// 			folderId="2"
	// 			selectedIDs={selectedIDs}
	// 			deselectAll={deselectAll}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);
	// 	expect(screen.getByTestId('primary-action-button-action.delete')).toBeInTheDocument();
	// });

	// test.skip('Check Secondary Action Button is Rendered or Not', async () => {
	// 	const ctx = {};

	// 	const selectedIDs = map(new Array(10), () => faker.random.number().toString());
	// 	const conversation = map(selectedIDs, (id) =>
	// 		normalizeConversationFromSoap(generateConversation({ folderId: '3', conversationId: id }))
	// 	);
	// 	const deselectAll = jest.fn();
	// 	await testUtils.render(
	// 		<SelectPanelActions
	// 			conversation={conversation}
	// 			folderId="2"
	// 			selectedIDs={selectedIDs}
	// 			deselectAll={deselectAll}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);
	// 	expect(screen.getByTestId('secondary-actions-open-button')).toBeInTheDocument();
	// });

	// test.skip('Show Mark as Read if Conversation is not Read', async () => {
	// 	const ctx = {};

	// 	const selectedIDs = map(new Array(10), () => faker.random.number().toString());
	// 	const conversation = map(selectedIDs, (id) =>
	// 		normalizeConversationFromSoap(
	// 			generateConversation({ folderId: '2', conversationId: id, isRead: false })
	// 		)
	// 	);
	// 	const deselectAll = jest.fn();
	// 	await testUtils.render(
	// 		<SelectPanelActions
	// 			conversation={conversation}
	// 			folderId="2"
	// 			selectedIDs={selectedIDs}
	// 			deselectAll={deselectAll}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);

	// 	userEvent.click(screen.getByTestId('secondary-actions-open-button'));

	// 	//	screen.debug();
	// 	expect(screen.getByText('action.mark_as_read')).toBeInTheDocument();
	// });
});
