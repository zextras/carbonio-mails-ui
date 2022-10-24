/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable import/no-extraneous-dependencies */

// import * as faker from 'faker';
// import { testUtils, useAppContext, setAppContext } from '@zextras/carbonio-shell-ui';
// import { findByTestId, screen } from '@testing-library/react';
// import React from 'react';
// import { Route } from 'react-router-dom';
// // import { fireEvent, getByTestId } from '@testing-library/dom';
// import { generateConversation, generateConversations, generateState } from '../../mocks/generators';
// import reducers from '../../store/reducers';
// import { normalizeConversationFromSoap } from '../../normalizations/normalize-conversation';
// import { Breadcrumbs } from './folder-panel/breadcrumbs';
// import FolderPanel from './folder-panel';

describe.skip('Breadcrumb', () => {
	test.skip('Shows correct path if conversation view selected', async () => {
		// const path = `/${faker.lorem.words(2).concat('/')}`;
		// useAppContext.mockImplementation(() => ({ isMessageView: false }));
		// await testUtils.render(<Breadcrumbs folderPath={path} itemsCount={10} />, {
		// 	ctxt: {}
		// });
		// expect(screen.getByTestId('BreadcrumbPath')).toContainHTML(path.split('/').join(' / '));
	});

	test.skip('Shows correct Count if count <=100', async () => {
		// const itemCount = 10;
		// await testUtils.render(<Breadcrumbs folderPath=" " itemsCount={itemCount} />, {
		// 	ctxt: {}
		// });
		// expect(screen.getByTestId('BreadcrumbCount')).toHaveTextContent(itemCount);
	});

	test.skip('Shows correct Count if count >100', async () => {
		// const itemCount = 110;
		// await testUtils.render(<Breadcrumbs folderPath=" " itemsCount={itemCount} />, {
		// 	ctxt: {}
		// });
		// expect(screen.getByTestId('BreadcrumbCount')).toHaveTextContent('100+');
	});
});

describe.skip('FolderPanel', () => {
	test.skip('Contains all stored conversations if conversation view selected', async () => {
		// const ctx = {};
		// useAppContext.mockImplementation(() => ({ isMessageView: false }));
		// const folderId = '2';
		// setAppContext.mockImplementation(() => jest.fn());
		// const conversations = generateConversations(folderId, 10).map(normalizeConversationFromSoap);
		// await testUtils.render(
		// 	<Route path="/folder/:folderId">
		// 		<FolderPanel />
		// 	</Route>,
		// 	{
		// 		ctxt: ctx,
		// 		reducer: reducers,
		// 		preloadedState: generateState({ conversations, currentFolder: folderId }),
		// 		initialRouterEntries: [`/folder/${folderId}`]
		// 	}
		// );
		// await screen.findByTestId(`ConversationListItem-${conversations[0].id}`);
		// conversations.forEach((c) => {
		// 	expect(screen.getByTestId(`ConversationListItem-${c.id}`)).toBeVisible();
		// });
	});

	test.skip('Expanding a conversation ', async () => {
		// const ctx = {};
		// const folderId = '2';
		// const conversation = normalizeConversationFromSoap(
		// 	generateConversation({ folderId, length: 4 })
		// );
		// conversation.messages[1].parent = folderId;
		// await testUtils.render(
		// 	<Route path="/folder/:folderId">
		// 		<FolderPanel />
		// 	</Route>,
		// 	{
		// 		ctxt: ctx,
		// 		reducer: reducers,
		// 		preloadedState: generateState({ conversations: [conversation], currentFolder: folderId }),
		// 		initialRouterEntries: [`/folder/${folderId}`]
		// 	}
		// );
		// const conversationElement = await screen.findByTestId(
		// 	`ConversationListItem-${conversation.id}`
		// );
		// // fireEvent.click(await findByTestId(conversationElement, 'ToggleExpand'));
		// // eslint-disable-next-line no-restricted-syntax
		// for (const m of conversation.messages) {
		// 	// Don't show messages in Trash or Spam
		// 	if (m.parent !== '3' && m.parent !== '4') {
		// 		// eslint-disable-next-line no-await-in-loop
		// 		expect(await screen.findByTestId(`MessageListItem-${m.id}`)).toBeDefined();
		// 	}
		// }
	});

	test.skip('Expanding and Collapsing a conversation ', async () => {
		// const ctx = {};
		// const folderId = '2';
		// const conversation = normalizeConversationFromSoap(
		// 	generateConversation({ folderId, length: 4 })
		// );
		// conversation.messages[1].parent = folderId;
		// await testUtils.render(
		// 	<Route path="/folder/:folderId">
		// 		<FolderPanel />
		// 	</Route>,
		// 	{
		// 		ctxt: ctx,
		// 		reducer: reducers,
		// 		preloadedState: generateState({ conversations: [conversation], currentFolder: folderId }),
		// 		initialRouterEntries: [`/folder/${folderId}`]
		// 	}
		// );
		// const conversationElement = await screen.findByTestId(
		// 	`ConversationListItem-${conversation.id}`
		// );
		// // fireEvent.click(await findByTestId(conversationElement, 'ToggleExpand'));
		// // eslint-disable-next-line no-restricted-syntax
		// for (const m of conversation.messages) {
		// 	// Don't show messages in Trash or Spam
		// 	if (m.parent !== '3' && m.parent !== '4') {
		// 		// eslint-disable-next-line no-await-in-loop
		// 		expect(await screen.findByTestId(`MessageListItem-${m.id}`)).toBeDefined();
		// 	}
		// }
		// fireEvent.click(await findByTestId(conversationElement, 'ToggleExpand'));
		// expect(getByTestId(conversationElement, 'ConversationExpander')).not.toBeVisible();
	});
});
