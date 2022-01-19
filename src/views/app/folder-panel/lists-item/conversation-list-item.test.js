/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/jsx-filename-extension */
// import React from 'react';
// import { testUtils } from '@zextras/carbonio-shell-ui';
// import { queryByTestId, screen } from '@testing-library/react';
// import { fireEvent, getByTestId } from '@testing-library/dom';
// import reducers from '../../../../store/reducers';

// import { generateConversation, generateState } from '../../../../mocks/generators';
// import { getTimeLabel, participantToString } from '../../../../commons/utils';
// import ConversationListItem from './conversation-list-item';
// import { normalizeConversationFromSoap } from '../../../../normalizations/normalize-conversation';

describe.skip('ConversationListItem', () => {
	// Avatar

	test.skip('Contains all participants', async () => {
		// const ctx = {};
		// const conversation = normalizeConversationFromSoap(generateConversation({}));
		// const folderId = '3';
		// await testUtils.render(
		// 	<ConversationListItem
		// 		style={{}}
		// 		index={1}
		// 		conversation={conversation}
		// 		folderId={folderId}
		// 		displayData={{ open: false }}
		// 		updateDisplayData={jest.fn()}
		// 	/>,
		// 	{
		// 		ctxt: ctx,
		// 		reducer: reducers,
		// 		preloadedState: generateState({ conversations: [conversation] }),
		// 		initialRouterEntries: [`/folder/${folderId}`]
		// 	}
		// );
		// const conversationRow = screen.getByTestId('ConversationRow');
		// const label = getByTestId(conversationRow, 'ParticipantLabel');
		// expect(label).toBeDefined();
		// conversation.participants
		// 	.map((p) => participantToString(p, (str) => str, []))
		// 	.forEach((p) => expect(label).toContainHTML(p));
	});

	// test.skip('Participants are colored `primary` if conversation is unread', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({ isRead: false }));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);
	// 	const conversationRow = screen.getByTestId('ConversationRow');

	// 	const label = getByTestId(conversationRow, 'ParticipantLabel');

	// 	expect(label).toHaveAttribute('color', 'primary');
	// });

	// test.skip('Participants is colored `text` if message is read', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({ isRead: true }));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);

	// 	expect(screen.getByTestId('ParticipantLabel')).toHaveAttribute('color', 'text');
	// });

	// test.skip('Contains date', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({ isRead: true }));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);
	// 	const conversationRow = screen.getByTestId('ConversationRow');
	// 	const dateLabel = getByTestId(conversationRow, 'DateLabel');
	// 	expect(dateLabel).toBeVisible();
	// 	expect(dateLabel.innerHTML).toMatch(getTimeLabel(conversation.date));
	// });

	// test.skip('Contains `flag` if message is flagged', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({ isFlagged: true }));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);
	// 	const conversationRow = screen.getByTestId('ConversationRow');
	// 	expect(getByTestId(conversationRow, 'FlagIcon')).toBeDefined();
	// });

	// test.skip("Don't contain `flag` if message is not flagged", async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({ isFlagged: false }));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);
	// 	const conversationRow = screen.getByTestId('ConversationRow');
	// 	expect(queryByTestId(conversationRow, 'FlagIcon')).toBeNull();
	// });

	// test.skip('Contains subject if subject is not empty', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({}));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);

	// 	const conversationRow = screen.getByTestId('ConversationRow');

	// 	expect(getByTestId(conversationRow, 'Subject').innerHTML).toMatch(conversation.subject);
	// 	expect(queryByTestId(conversationRow, 'NoSubject')).toBeNull();
	// });

	// test.skip('Contains NoSubject if subject is empty', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({}));
	// 	conversation.subject = '';

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);

	// 	const conversationRow = screen.getByTestId('ConversationRow');

	// 	expect(queryByTestId(conversationRow, 'Subject')).toBeNull();
	// 	expect(queryByTestId(conversationRow, 'NoSubject').innerHTML).toBeDefined();
	// });

	// test.skip('Contains fragment if not empty', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({ isRead: true }));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);

	// 	const conversationRow = screen.getByTestId('ConversationRow');

	// 	if (conversation.fragment)
	// 		expect(getByTestId(conversationRow, 'Fragment')).toContainHTML(conversation.fragment);
	// });

	// test.skip('Contains `urgent` icon if message is important', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({ isUrgent: true }));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);

	// 	const conversationRow = screen.getByTestId('ConversationRow');

	// 	expect(getByTestId(conversationRow, 'UrgentIcon')).toBeInTheDocument();
	// });

	// test.skip("Doesn't contain `urgent` icon if message is not important", async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({ isUrgent: false }));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);

	// 	const conversationRow = screen.getByTestId('ConversationRow');

	// 	expect(queryByTestId(conversationRow, 'UrgentIcon')).toBeNull();
	// });

	// test.skip('Contains `attachment` icon if message have attachments', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(
	// 		generateConversation({ hasAttachments: true })
	// 	);

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);
	// 	const conversationRow = screen.getByTestId('ConversationRow');

	// 	expect(getByTestId(conversationRow, 'AttachmentIcon')).toBeInTheDocument();
	// });

	// test.skip("Doesn't contain `attachment` icon if message have no attachments", async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(
	// 		generateConversation({ hasAttachments: false })
	// 	);

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);
	// 	const conversationRow = screen.getByTestId('ConversationRow');
	// 	expect(queryByTestId(conversationRow, 'AttachmentIcon')).toBeNull();
	// });

	// test.skip("Doesn't contain expand if contains 1 message", async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({ length: 1 }));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);

	// 	expect(screen.queryByTestId('ToggleExpand')).toBeNull();
	// });

	// test.skip('Contains expand if contains more than 1 message', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({ length: 3 }));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);

	// 	expect(screen.getByTestId('ToggleExpand')).toBeDefined();
	// });

	// test.skip('Click on conversation navigate to `?conversation={id}`', async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(generateConversation({}));

	// 	const folderId = '3';

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			style={{}}
	// 			index={1}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder/${folderId}`]
	// 		}
	// 	);

	// 	const expandButton = screen.getByTestId('ParticipantLabel');
	// 	fireEvent.click(expandButton);
	// 	expect(ctx.current.history.location.search).toEqual(`?conversation=${conversation.id}`);
	// });

	// test("Contains Checked Avatar if conversation is checked", async () => {
	// 	const ctx = {};

	// 	const conversation = normalizeConversationFromSoap(
	// 		generateConversation({})
	// 	);
	// 	const avatarSelected=true;
	// 	const calculateCheck=false;
	// 	const folderId = "3";

	// 	await testUtils.render(
	// 		<ConversationListItem
	// 			avatarSelected={avatarSelected}
	// 			avatarOnClick={jest.fn()}
	// 			style={{}}
	// 			index={1}
	// 			selectIds={jest.fn()}
	// 			//  selectedIDs={selectedIDs}
	// 			conversation={conversation}
	// 			folderId={folderId}
	// 			displayData={{ open: false }}
	// 			updateDisplayData={jest.fn()}
	// 		/>,
	// 		{
	// 			ctxt: ctx,
	// 			reducer: reducers,
	// 			preloadedState: generateState({ conversations: [conversation] }),
	// 			initialRouterEntries: [`/folder-panel/${folderId}`],
	// 		}
	// 	);
	// 	const avatarContainer = screen.getByTestId("AvatarContainer");
	// 	const checkedAvatar = getByTestId(avatarContainer,"checkedAvatar");
	// 	expect(checkedAvatar).toBeInTheDocument();

	// });
});
