/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable import/no-extraneous-dependencies */
// import React from 'react';
// import { testUtils } from '@zextras/carbonio-shell-ui';
// import { screen } from '@testing-library/react';
// import { find } from 'lodash';
// import { fireEvent } from '@testing-library/dom';
// import reducers from '../../../../store/reducers';

// import { generateMessage, generateState } from '../../../../mocks/generators';
// import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
// import { getTimeLabel } from '../../../../commons/utils';
// import { selectFolders } from '../../../../store/folders-slice';
// import MessageListItem from './message-list-item';

describe.skip('MessageListItem', () => {
	test.skip('Contains sender', async () => {
		// const ctx = {};
		// const message = normalizeMailMessageFromSoap(generateMessage({}));
		// await testUtils.render(
		// 	<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
		// 	{
		// 		ctxt: ctx,
		// 		reducer: reducers,
		// 		initialRouterEntries: [`/folder/2`]
		// 	}
		// );
		// const sender = find(message.participants, ['type', 'f']);
		// expect(screen.getByTestId('SenderText')).toContainHTML(sender.fullName);
	});

	// test.skip('Sender is colored `primary` if message is unread', async () => {
	// 	const ctx = {};

	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isRead: false }));

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);

	// 	expect(screen.getByTestId('SenderText')).toHaveAttribute('color', 'primary');
	// });

	// test.skip('Sender is colored `text` if message is read', async () => {
	// 	const ctx = {};

	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isRead: true }));

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);

	// 	expect(screen.getByTestId('SenderText')).toHaveAttribute('color', 'text');
	// });

	// test.skip('Contains date', async () => {
	// 	const ctx = {};

	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);
	// 	expect(screen.getByTestId('DateLabel')).toBeVisible();
	// 	expect(screen.getByTestId('DateLabel')).toContainHTML(getTimeLabel(message.date));
	// });

	// test.skip('Contains `flag` if message is flagged', async () => {
	// 	const ctx = {};

	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: '2', isFlagged: true })
	// 	);

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);
	// 	expect(screen.getByTestId('FlagIcon')).toBeInTheDocument();
	// });

	// test.skip("Don't contain `flag` if message is not flagged", async () => {
	// 	const ctx = {};

	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: '2', isFlagged: false })
	// 	);

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);
	// 	expect(screen.queryByTestId('FlagIcon')).toBeNull();
	// });

	// test.skip("Shows folder-panel badge if message don't belong to current folder-panel", async () => {
	// 	const ctx = {};

	// 	const folderId = '3';
	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId }));

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ currentFolder: '2' })
	// 		}
	// 	);

	// 	const { name } = selectFolders(ctx.current.store.getState())[folderId];
	// 	expect(screen.getByTestId('FolderBadge')).toContainHTML(name);
	// });

	// test.skip("Doesn't show folder-panel badge if message belong to current folder-panel", async () => {
	// 	const ctx = {};

	// 	const messagefolderId = '3';
	// 	const currentFolderId = '3';
	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: messagefolderId }));

	// 	await testUtils.render(
	// 		<MessageListItem
	// 			message={message}
	// 			folderId={currentFolderId}
	// 			conversationId={message.conversation}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/${currentFolderId}`],
	// 			preloadedState: generateState({ currentFolder: currentFolderId })
	// 		}
	// 	);

	// 	expect(screen.queryByTestId('FolderBadge')).toBeNull();
	// });

	// test.skip('Contains fragment', async () => {
	// 	const ctx = {};

	// 	const messagefolderId = '3';
	// 	const currentFolderId = '3';
	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: messagefolderId, isRead: true, isFlagged: true })
	// 	);

	// 	await testUtils.render(
	// 		<MessageListItem
	// 			message={message}
	// 			folderId={currentFolderId}
	// 			conversationId={message.conversation}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/${currentFolderId}`],
	// 			preloadedState: generateState({ currentFolder: currentFolderId })
	// 		}
	// 	);

	// 	expect(screen.getByTestId('Fragment')).toContainHTML(message.fragment);
	// });

	// test.skip('Contains `urgent` icon if message is important', async () => {
	// 	const ctx = {};

	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: '2', isUrgent: true })
	// 	);

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);
	// 	expect(screen.getByTestId('UrgentIcon')).toBeInTheDocument();
	// });

	// test.skip("Doesn't contain `urgent` icon if message is not important", async () => {
	// 	const ctx = {};

	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: '2', isUrgent: false })
	// 	);

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);
	// 	await expect(screen.queryByTestId('UrgentIcon')).toBeNull();
	// });

	// test.skip('Contains `attachment` icon if message have attachments', async () => {
	// 	const ctx = {};

	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: '2', hasAttachments: true })
	// 	);

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);
	// 	expect(screen.getByTestId('AttachmentIcon')).toBeInTheDocument();
	// });

	// test.skip("Doesn't contain `attachment` icon if message have no attachments", async () => {
	// 	const ctx = {};

	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: '2', hasAttachments: false })
	// 	);

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);
	// 	expect(screen.queryByTestId('AttachmentIcon')).toBeNull();
	// });

	// test.skip('Click on message navigate to `?conversation={id}&message={id}`', async () => {
	// 	const ctx = {};

	// 	const message = normalizeMailMessageFromSoap(generateMessage({}));

	// 	await testUtils.render(
	// 		<MessageListItem message={message} folderId="2" conversationId={message.conversation} />,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`]
	// 		}
	// 	);

	// 	const expandButton = screen.getByTestId('SenderText');
	// 	fireEvent.click(expandButton);
	// 	expect(ctx.current.history.location.search).toEqual(
	// 		`?conversation=${message.conversation}&message=${message.id}`
	// 	);
	// });

	// missing Tags and avatar
});
