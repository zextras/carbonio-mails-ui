/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import { Account, useUserAccount } from '@zextras/carbonio-shell-ui';
import { FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';

import { populateMessagesInEmailStore } from '../../../../../__test__/generators/generateMessage';
import { setupHook, setupTest } from '@test-setup';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { ParticipantsString } from '../participants-string';
import { omit } from 'lodash';
import { useTheme } from '@zextras/carbonio-design-system';
import { randomUUID } from 'node:crypto';

describe('ParticipantsString', () => {
	/* ==================================================
	 * MESSAGE ITEM
	 * ================================================== */
	describe('item is a message', () => {
		test('in Inbox, shows FROM participants', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = FOLDERS.INBOX;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: participantName, type: ParticipantRole.FROM },
						to: [{ address: userName, type: ParticipantRole.TO }]
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText(participantName)).toBeVisible();
		});
		test('in Draft, shows TO participants', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = FOLDERS.DRAFTS;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: userName, type: ParticipantRole.FROM },
						to: [{ address: participantName, type: ParticipantRole.TO }]
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText(participantName)).toBeVisible();
		});
		test('in Sent, shows TO participants', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = FOLDERS.SENT;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: userName, type: ParticipantRole.FROM },
						to: [{ address: participantName, type: ParticipantRole.TO }]
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText(participantName)).toBeVisible();
		});
		test('in non Inbox/Draft/Sent, shows TO participants when item is sent by me', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = FOLDERS.TRASH;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: userName, type: ParticipantRole.FROM },
						to: [{ address: participantName, type: ParticipantRole.TO }],
						isSentByMe: true
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText(participantName)).toBeVisible();
		});
		test('in non Inbox/Draft/Sent, shows FROM participants when item is not sent by me', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = FOLDERS.TRASH;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: participantName, type: ParticipantRole.FROM },
						to: [{ address: userName, type: ParticipantRole.TO }],
						isSentByMe: false
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText(participantName)).toBeVisible();
		});
		test('all of the above apply also for shared accounts', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = `${randomUUID()}:${FOLDERS.INBOX}`;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: participantName, type: ParticipantRole.FROM },
						to: [{ address: userName, type: ParticipantRole.TO }]
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText(participantName)).toBeVisible();
		});
	});

	/* ==================================================
	 * CONVERSATION ITEM
	 * ================================================== */
	describe('item is a conversation', () => {
		describe('with route (folderId present)', () => {
			test('in Inbox folder, shows FROM participants', async () => {
				const userName: Account['name'] = useUserAccount().name;
				const participantName = 'randomuser@test.com';
				const folderId = FOLDERS.INBOX;

				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '1',
							from: [{ address: participantName, type: ParticipantRole.FROM }],
							to: [{ address: userName, type: ParticipantRole.TO }]
						},
						messageGeneratorParams: [
							{
								id: '11',
								folderId
							},
							{
								id: '12',
								folderId: FOLDERS.SENT
							}
						]
					})
				);

				setupTest(<ParticipantsString item={conversation} />, {
					initialEntries: [`/folder/${folderId}/conversation/${conversation.id}`],
					path: '/folder/:folderId/conversation/:conversationId'
				});
				expect(screen.getByText(participantName)).toBeVisible();
			});
			test('in Sent folder, shows TO participants', async () => {
				const userName: Account['name'] = useUserAccount().name;
				const participantName = 'randomuser@test.com';
				const folderId = FOLDERS.SENT;

				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '1',
							from: [{ address: userName, type: ParticipantRole.FROM }],
							to: [{ address: participantName, type: ParticipantRole.TO }]
						},
						messageGeneratorParams: [
							{
								id: '11',
								folderId
							},
							{
								id: '12',
								folderId: FOLDERS.INBOX
							}
						]
					})
				);

				setupTest(<ParticipantsString item={conversation} />, {
					initialEntries: [`/folder/${folderId}/conversation/${conversation.id}`],
					path: '/folder/:folderId/conversation/:conversationId'
				});
				expect(screen.getByText(participantName)).toBeVisible();
			});
			describe('if not in inbox or sent, falls back to participant-based rules', () => {
				test('user is both FROM and TO → shows FROM participants', async () => {
					const userName: Account['name'] = useUserAccount().name;
					const participantName = 'randomuser@test.com';
					const folderId = FOLDERS.TRASH;

					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								id: '1',
								from: [{ address: userName, type: ParticipantRole.FROM }],
								to: [
									{ address: participantName, type: ParticipantRole.TO },
									{ address: userName, type: ParticipantRole.TO }
								]
							},
							messageGeneratorParams: [
								{
									id: '11',
									folderId
								},
								{
									id: '12',
									folderId: FOLDERS.INBOX
								}
							]
						})
					);

					setupTest(<ParticipantsString item={conversation} />, {
						initialEntries: [`/folder/${folderId}/conversation/${conversation.id}`],
						path: '/folder/:folderId/conversation/:conversationId'
					});
					expect(screen.getByText('label.me')).toBeVisible();
				});
				test('user is FROM but not TO → shows TO participants', async () => {
					const userName: Account['name'] = useUserAccount().name;
					const participantName = 'randomuser@test.com';
					const folderId = FOLDERS.TRASH;

					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								id: '1',
								from: [{ address: userName, type: ParticipantRole.FROM }],
								to: [{ address: participantName, type: ParticipantRole.TO }]
							},
							messageGeneratorParams: [
								{
									id: '11',
									folderId
								},
								{
									id: '12',
									folderId: FOLDERS.INBOX
								}
							]
						})
					);

					setupTest(<ParticipantsString item={conversation} />, {
						initialEntries: [`/folder/${folderId}/conversation/${conversation.id}`],
						path: '/folder/:folderId/conversation/:conversationId'
					});
					expect(screen.getByText(participantName)).toBeVisible();
				});
				test('user is TO but not FROM → shows FROM participants', async () => {
					const userName: Account['name'] = useUserAccount().name;
					const participantName = 'randomuser@test.com';
					const folderId = FOLDERS.TRASH;

					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								id: '1',
								from: [{ address: participantName, type: ParticipantRole.FROM }],
								to: [{ address: userName, type: ParticipantRole.TO }]
							},
							messageGeneratorParams: [
								{
									id: '11',
									folderId
								},
								{
									id: '12',
									folderId: FOLDERS.INBOX
								}
							]
						})
					);

					setupTest(<ParticipantsString item={conversation} />, {
						initialEntries: [`/folder/${folderId}/conversation/${conversation.id}`],
						path: '/folder/:folderId/conversation/:conversationId'
					});
					expect(screen.getByText(participantName)).toBeVisible();
				});
			});
		});

		describe('without route (no folderId)', () => {
			test('all conversation parents in Inbox, shows FROM participants', async () => {
				const userName: Account['name'] = useUserAccount().name;
				const participantName = 'randomuser@test.com';
				const folderId = FOLDERS.INBOX;

				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '1',
							from: [{ address: participantName, type: ParticipantRole.FROM }],
							to: [{ address: userName, type: ParticipantRole.TO }]
						},
						messageGeneratorParams: [
							{
								id: '11',
								folderId
							},
							{
								id: '12',
								folderId
							}
						]
					})
				);

				setupTest(<ParticipantsString item={conversation} />, {
					initialEntries: [`/search/conversation/${conversation.id}`],
					path: '/search/conversation/:conversationId'
				});
				expect(screen.getByText(participantName)).toBeVisible();
			});
			test('all conversation parents in Sent, shows TO participants', async () => {
				const userName: Account['name'] = useUserAccount().name;
				const participantName = 'randomuser@test.com';
				const folderId = FOLDERS.SENT;

				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '1',
							from: [{ address: userName, type: ParticipantRole.FROM }],
							to: [{ address: participantName, type: ParticipantRole.TO }]
						},
						messageGeneratorParams: [
							{
								id: '11',
								folderId
							},
							{
								id: '12',
								folderId
							}
						]
					})
				);

				setupTest(<ParticipantsString item={conversation} />, {
					initialEntries: [`/search/conversation/${conversation.id}`],
					path: '/search/conversation/:conversationId'
				});
				expect(screen.getByText(participantName)).toBeVisible();
			});
			describe('conversation parents mixed or outside Inbox/Sent, falls back to participant-based rules', () => {
				test('user is both FROM and TO → shows FROM participants', async () => {
					const userName: Account['name'] = useUserAccount().name;
					const participantName = 'randomuser@test.com';
					const folderId = FOLDERS.TRASH;

					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								id: '1',
								from: [{ address: userName, type: ParticipantRole.FROM }],
								to: [
									{ address: participantName, type: ParticipantRole.TO },
									{ address: userName, type: ParticipantRole.TO }
								]
							},
							messageGeneratorParams: [
								{
									id: '11',
									folderId
								},
								{
									id: '12',
									folderId: FOLDERS.INBOX
								}
							]
						})
					);

					setupTest(<ParticipantsString item={conversation} />, {
						initialEntries: [`/search/conversation/${conversation.id}`],
						path: '/search/conversation/:conversationId'
					});
					expect(screen.getByText('label.me')).toBeVisible();
				});
				test('user is FROM but not TO → shows TO participants', async () => {
					const userName: Account['name'] = useUserAccount().name;
					const participantName = 'randomuser@test.com';
					const folderId = FOLDERS.TRASH;

					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								id: '1',
								from: [{ address: userName, type: ParticipantRole.FROM }],
								to: [{ address: participantName, type: ParticipantRole.TO }]
							},
							messageGeneratorParams: [
								{
									id: '11',
									folderId
								},
								{
									id: '12',
									folderId: FOLDERS.INBOX
								}
							]
						})
					);

					setupTest(<ParticipantsString item={conversation} />, {
						initialEntries: [`/search/conversation/${conversation.id}`],
						path: '/search/conversation/:conversationId'
					});
					expect(screen.getByText(participantName)).toBeVisible();
				});
				test('user is TO but not FROM → shows FROM participants', async () => {
					const userName: Account['name'] = useUserAccount().name;
					const participantName = 'randomuser@test.com';
					const folderId = FOLDERS.TRASH;

					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								id: '1',
								from: [{ address: participantName, type: ParticipantRole.FROM }],
								to: [{ address: userName, type: ParticipantRole.TO }]
							},
							messageGeneratorParams: [
								{
									id: '11',
									folderId
								},
								{
									id: '12',
									folderId: FOLDERS.INBOX
								}
							]
						})
					);

					setupTest(<ParticipantsString item={conversation} />, {
						initialEntries: [`/search/conversation/${conversation.id}`],
						path: '/search/conversation/:conversationId'
					});
					expect(screen.getByText(participantName)).toBeVisible();
				});
			});
		});
	});

	/* ==================================================
	 * PARTICIPANTS LIST HANDLING
	 * ================================================== */
	describe('Participants list handling', () => {
		test('deduplicates participants by address', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = FOLDERS.TRASH;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: userName, type: ParticipantRole.FROM },
						to: [
							{ address: participantName, type: ParticipantRole.TO },
							{ address: participantName, type: ParticipantRole.TO }
						],
						isSentByMe: true
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText(participantName)).toBeVisible();
		});
		test('keeps only participants matching the resolved role', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const otherParticipantName = 'randomuser@test.com';
			const folderId = FOLDERS.TRASH;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: userName, type: ParticipantRole.FROM },
						to: [
							{ address: participantName, type: ParticipantRole.TO },
							{ address: otherParticipantName, type: ParticipantRole.REPLY_TO }
						],
						isSentByMe: true
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText(participantName)).toBeVisible();
		});
		test('shows empty To field fallback when participants is undefined', () => {
			const userName: Account['name'] = useUserAccount().name;
			const folderId = FOLDERS.TRASH;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: userName, type: ParticipantRole.FROM },
						isSentByMe: true
					}
				]
			});
			setupTest(<ParticipantsString item={omit(messages[0], 'participants')} />);
			expect(screen.getByText("[Empty 'To' Field]")).toBeVisible();
		});
		test('shows empty To field fallback when no participants match role', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = FOLDERS.SENT;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: userName, type: ParticipantRole.FROM },
						to: [{ address: participantName, type: ParticipantRole.REPLY_TO }],
						isSentByMe: true
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText("[Empty 'To' Field]")).toBeVisible();
		});
		test('shows empty To field fallback when participants array is empty', () => {
			const userName: Account['name'] = useUserAccount().name;
			const folderId = FOLDERS.SENT;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: userName, type: ParticipantRole.FROM },
						isSentByMe: true
					}
				]
			});
			const item = {
				...messages[0],
				participants: []
			};
			setupTest(<ParticipantsString item={item} />);
			expect(screen.getByText("[Empty 'To' Field]")).toBeVisible();
		});
	});

	/* ==================================================
	 * UI / PRESENTATION
	 * ================================================== */
	describe('UI details', () => {
		test('shows DRAFT badge when item is in Draft folder', () => {
			const userName: Account['name'] = useUserAccount().name;
			const folderId = FOLDERS.DRAFTS;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: userName, type: ParticipantRole.FROM },
						isSentByMe: true
					}
				]
			});

			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText('[DRAFT]')).toBeVisible();
		});
		test('does not show DRAFT badge outside Draft folder', () => {
			const userName: Account['name'] = useUserAccount().name;
			const folderId = FOLDERS.INBOX;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: userName, type: ParticipantRole.FROM },
						isSentByMe: true
					}
				]
			});

			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.queryByText('[DRAFT]')).not.toBeInTheDocument();
		});
		test('renders participants string inside Tooltip', async () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = FOLDERS.INBOX;

			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: participantName, type: ParticipantRole.FROM },
						to: [{ address: userName, type: ParticipantRole.REPLY_TO }],
						isSentByMe: false
					}
				]
			});
			const { user } = setupTest(<ParticipantsString item={messages[0]} />);

			await act(async () => {
				await user.hover(screen.getByText(participantName));
			});

			act(() => {
				vi.advanceTimersByTime(500);
			});

			expect(screen.getByTestId('tooltip')).toBeVisible();
			expect(screen.getByTestId('tooltip')).toHaveTextContent(participantName);
		});
		test('uses bold text when item is unread', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = FOLDERS.INBOX;
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: participantName, type: ParticipantRole.FROM },
						to: [{ address: userName, type: ParticipantRole.REPLY_TO }],
						isSentByMe: false,
						isRead: false
					}
				]
			});

			const { result } = setupHook(useTheme);

			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText(participantName)).toHaveStyle({
				color: result.current.palette.primary.regular
			});
		});
		test('uses regular text when item is read', () => {
			const userName: Account['name'] = useUserAccount().name;
			const participantName = 'randomuser@test.com';
			const folderId = FOLDERS.INBOX;
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId,
						from: { address: participantName, type: ParticipantRole.FROM },
						to: [{ address: userName, type: ParticipantRole.REPLY_TO }],
						isSentByMe: false,
						isRead: true
					}
				]
			});

			const { result } = setupHook(useTheme);

			setupTest(<ParticipantsString item={messages[0]} />);
			expect(screen.getByText(participantName)).toHaveStyle({
				color: result.current.palette.text.regular
			});
		});
	});
});
