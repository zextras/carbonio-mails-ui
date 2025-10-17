/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { useUserAccount } from '@zextras/carbonio-shell-ui';
import { Folder, FOLDERS, ParticipantRole, useFolderStore } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { populateFoldersStore } from '@test-utils/store/folders';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { generateMessage, populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { ParticipantsName } from 'views/app/folder-panel/parts/participants-name';

describe('ParticipantsName component', () => {
	it('renders participants string for inbox folder', async () => {
		populateFoldersStore();
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					id: '1',
					from: [{ address: 'user@example.com', type: ParticipantRole.FROM }],
					folderId: FOLDERS.INBOX
				},
				conversationMessagesNumber: 2
			})
		);

		setupTest(<ParticipantsName item={conversation} />);
		expect(screen.getByTestId('participants-name-label')).toHaveTextContent('user@example.com');
	});

	it('renders participants string for sent folder', async () => {
		populateFoldersStore();
		const message = await waitFor(() =>
			populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '1',
						from: { address: 'me@example.com', type: ParticipantRole.FROM },
						to: [{ address: 'recipient@example.com', type: ParticipantRole.TO }],
						folderId: FOLDERS.SENT
					}
				]
			})
		);

		setupTest(<ParticipantsName item={message[0]} />);
		expect(screen.getByTestId('participants-name-label')).toHaveTextContent(
			'recipient@example.com'
		);
	});

	it('renders participants string for subfolder of sent folder', async () => {
		const subFolderId = '500';
		const subFolder = generateFolder({
			id: subFolderId,
			name: 'Sent Subfolder',
			l: FOLDERS.SENT,
			parent: FOLDERS.SENT,
			absFolderPath: '/Sent/Sent Subfolder'
		} satisfies Partial<Folder>);
		populateFoldersStore();

		useFolderStore.getState().updateFolder(FOLDERS.SENT, { children: [subFolder] });
		useFolderStore.setState((state) => ({
			...state,
			folders: { ...state.folders, [subFolderId]: subFolder }
		}));

		const message = await waitFor(() =>
			populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '1',
						from: { address: 'me@example.com', type: ParticipantRole.FROM },
						to: [{ address: 'recipient@example.com', type: ParticipantRole.TO }],
						folderId: subFolderId // subfolder of sent
					}
				]
			})
		);

		setupTest(<ParticipantsName item={message[0]} />);
		expect(screen.getByTestId('participants-name-label')).toHaveTextContent(
			'recipient@example.com'
		);
	});

	it('does not display reply-to participants', async () => {
		const generatedMessage = generateMessage({ id: '1', folderId: FOLDERS.DRAFTS });
		const message = {
			...generatedMessage,
			participants: [
				{ name: 'toAddress', type: ParticipantRole.TO, address: 'to@example.com' },
				{ name: 'replyToAddress', type: ParticipantRole.REPLY_TO, address: 'replyTo@example.com' }
			]
		};
		setupTest(<ParticipantsName item={message} />);
		expect(screen.getByTestId('participants-name-label')).toHaveTextContent('toAddress');
	});

	it('renders participants string for search module', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					id: '1',
					from: [{ address: 'user@example.com', type: ParticipantRole.FROM }],
					folderId: FOLDERS.SENT
				},
				conversationMessagesNumber: 2
			})
		);

		setupTest(<ParticipantsName item={conversation} isSearchModule />);
		expect(screen.getByTestId('participants-name-label')).toHaveTextContent('user@example.com');
	});

	it('renders draft label for drafts folder', async () => {
		const messages = await waitFor(() =>
			populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '1',
						from: { address: 'user@example.com', type: ParticipantRole.FROM },
						folderId: FOLDERS.DRAFTS
					}
				]
			})
		);

		setupTest(<ParticipantsName item={messages[0]} />);
		expect(screen.getByText('label.draft_folder')).toBeInTheDocument();
	});

	it('in conversation should put account owner as first participant', async () => {
		const account = useUserAccount();
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					id: '1',
					to: [
						{ address: 'randomuser@test.com', type: ParticipantRole.TO },
						{ address: account.name, type: ParticipantRole.TO }
					],
					folderId: FOLDERS.INBOX
				},
				messageGeneratorParams: [
					{
						id: '1',
						folderId: FOLDERS.INBOX
					}
				]
			})
		);

		setupTest(<ParticipantsName item={conversation} />);
		const participantsNameLabelText = screen.getByTestId('participants-name-label').innerHTML;
		expect(participantsNameLabelText.indexOf('label.me, randomuser@test.com')).toBe(0);
	});
});
