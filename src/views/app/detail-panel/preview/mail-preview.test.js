/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable react/jsx-filename-extension */
// import React from 'react';
// import { testUtils, useAppContext } from '@zextras/carbonio-shell-ui';
// import { Route } from 'react-router-dom';
// import { screen } from '@testing-library/react';
// import { filter, find } from 'lodash';
// import faker from 'faker';
// import reducers from '../../../../store/reducers';

// import MailPreview from './mail-preview';
// import { generateMessage, generateState } from '../../../../mocks/generators';
// import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
// import { getTimeLabel } from '../../../../commons/utils';
// import { selectFolders } from '../../../../store/folders-slice';
// import { selectMessages } from '../../../../store/messages-slice';

describe.skip('MailPreview', () => {
	test.skip('Contains sender', async () => {
		// const ctx = {};
		// useAppContext.mockImplementation(() => ({ isMessageView: false }));
		// const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));
		// await testUtils.render(
		// 	<Route path="/folder/:folderId">
		// 		<MailPreview message={message} expanded={false} />
		// 	</Route>,
		// 	{
		// 		ctxt: ctx,
		// 		reducer: reducers,
		// 		initialRouterEntries: [`/folder/2`],
		// 		preloadedState: generateState({ messages: [message] })
		// 	}
		// );
		// const sender = find(message.participants, ['type', 'f']);
		// expect(screen.getByTestId('SenderText')).toContainHTML(sender.fullName);
	});

	// test.skip('Sender is colored `primary` if message is unread', async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isRead: false }));

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`],
	// 			preloadedState: generateState({ messages: [message] })
	// 		}
	// 	);

	// 	expect(screen.getByTestId('SenderText')).toHaveAttribute('color', 'primary');
	// });

	// test.skip('Sender is colored `text` if message is read', async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', isRead: true }));

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`],
	// 			preloadedState: generateState({ messages: [message] })
	// 		}
	// 	);

	// 	expect(screen.getByTestId('SenderText')).toHaveAttribute('color', 'text');
	// });

	// test.skip('Contains date if conversation view selected', async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`],
	// 			preloadedState: generateState({ messages: [message] })
	// 		}
	// 	);
	// 	expect(screen.getByTestId('DateLabel')).toBeVisible();
	// 	expect(screen.getByTestId('DateLabel')).toContainHTML(getTimeLabel(message.date));
	// });

	// test.skip('Contains To section', async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`],
	// 			preloadedState: generateState({ messages: [message] })
	// 		}
	// 	);

	// 	const toContacts = filter(message.participants, ['type', 't'])[0];

	// 	const toSection = screen.getByTestId('ToParticipants');
	// 	expect(toSection).toBeVisible();
	// 	expect(toSection).toContainHTML(`label.to: ${toContacts.fullName}`);
	// });

	// test.skip('Contains CC section', async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const cc = [
	// 		{
	// 			name: faker.name.findName(),
	// 			email: faker.internet.email()
	// 		},
	// 		{
	// 			name: faker.name.findName(),
	// 			email: faker.internet.email()
	// 		}
	// 	];

	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2', cc }));

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`],
	// 			preloadedState: generateState({ messages: [message] })
	// 		}
	// 	);

	// 	const ccContacts = filter(message.participants, ['type', 'c']);

	// 	const ccSection = screen.getByTestId('CcParticipants');
	// 	expect(ccSection).toBeVisible();
	// 	expect(ccSection).toContainHTML(`label.cc: ${ccContacts.map((c) => c.fullName).join(', ')}`);
	// });

	// test.skip('Contains `flag` if message is flagged if conversation view selected', async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: '2', isFlagged: true })
	// 	);

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`],
	// 			preloadedState: generateState({ messages: [message] })
	// 		}
	// 	);
	// 	expect(screen.getByTestId('FlagIcon')).toBeInTheDocument();
	// });

	// test.skip("Don't contain `flag` if message is not flagged", async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: '2', isFlagged: false })
	// 	);

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`],
	// 			preloadedState: generateState({ messages: [message] })
	// 		}
	// 	);
	// 	expect(screen.queryByTestId('FlagIcon')).toBeNull();
	// });

	// test.skip("Shows folder-panel badge if message don't belong to current folder-panel", async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const folderId = '3';
	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId, isRead: true, isFlagged: true })
	// 	);

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`],
	// 			preloadedState: generateState({ messages: [message], currentFolder: '2' })
	// 		}
	// 	);

	// 	const mailPreview = screen.getByTestId(`MailPreview-${message.id}`);
	// 	expect(mailPreview).toBeDefined();

	// 	const { name } = selectFolders(ctx.current.store.getState())[folderId];
	// 	expect(screen.getByTestId('FolderBadge')).toContainHTML(name);
	// });

	// test.skip("Doesn't show folder-panel badge if message belong to current folder-panel", async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const folderId = '3';
	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId, isRead: true, isFlagged: true })
	// 	);

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/3`],
	// 			preloadedState: generateState({ messages: [message], currentFolder: '3' })
	// 		}
	// 	);

	// 	const mailPreview = screen.getByTestId(`MailPreview-${message.id}`);
	// 	expect(mailPreview).toBeDefined();

	// 	expect(screen.queryByTestId('FolderBadge')).toBeNull();
	// });

	// test.skip('Contains `urgent` icon if message is important', async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: '2', isUrgent: true })
	// 	);

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/3`],
	// 			preloadedState: generateState({ messages: [message], currentFolder: '3' })
	// 		}
	// 	);
	// 	expect(screen.getByTestId('UrgentIcon')).toBeInTheDocument();
	// });

	// test.skip("Doesn't contain `urgent` icon if message is not important", async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const message = normalizeMailMessageFromSoap(
	// 		generateMessage({ folderId: '2', isUrgent: false })
	// 	);

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/3`],
	// 			preloadedState: generateState({ messages: [message], currentFolder: '3' })
	// 		}
	// 	);
	// 	await expect(screen.queryByTestId('UrgentIcon')).toBeNull();
	// });

	// test.skip('Contains fragment if not expanded', async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded={false} />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`],
	// 			preloadedState: generateState({ messages: [message] })
	// 		}
	// 	);
	// 	expect(screen.queryByText(message.fragment)).not.toBeNull();
	// });

	// test.skip('Downloads message if expanded and not saved', async () => {
	// 	const ctx = {};
	// 	useAppContext.mockImplementation(() => ({ isMessageView: false }));
	// 	const message = normalizeMailMessageFromSoap(generateMessage({ folderId: '2' }));

	// 	await testUtils.render(
	// 		<Route path="/folder/:folderId">
	// 			<MailPreview message={message} expanded />
	// 		</Route>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			initialRouterEntries: [`/folder/2`],
	// 			preloadedState: generateState({})
	// 		}
	// 	);

	// 	await screen.findByTestId('MessageBody');

	// 	expect(selectMessages(ctx.current.store.getState())[message.id]).not.toBe(message);
	// });
});
