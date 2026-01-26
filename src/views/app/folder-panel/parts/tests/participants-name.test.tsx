/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { Account, useUserAccount } from '@zextras/carbonio-shell-ui';
import { FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';

import { populateMessagesInEmailStore } from '../../../../../__test__/generators/generateMessage';
import { setupTest } from '@test-setup';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { ParticipantsString } from 'views/app/folder-panel/parts/participants-name';

describe('ParticipantsName component', () => {
	test('a conversation with multiple messages inside inbox folder will show from participants', async () => {
		const account: Account = useUserAccount();
		const secondParticipant = 'randomuser@test.com';
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					id: '1',
					from: [{ address: secondParticipant, type: ParticipantRole.FROM }],
					to: [{ address: account.name, type: ParticipantRole.TO }],
					folderId: FOLDERS.INBOX
				},
				messageGeneratorParams: [
					{
						id: '11',
						folderId: FOLDERS.INBOX
					},
					{
						id: '12',
						folderId: FOLDERS.SENT
					}
				]
			})
		);

		setupTest(<ParticipantsString item={conversation} />, {
			initialEntries: [`/folder/${FOLDERS.INBOX}/conversation/${conversation.id}`],
			path: '/folder/:folderId/conversation/:conversationId'
		});
		expect(screen.getByText(secondParticipant)).toBeVisible();
	});
	test('a conversation with single message inside inbox folder will show from participants', async () => {
		const account: Account = useUserAccount();
		const secondParticipant = 'randomuser@test.com';
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					id: '1',
					from: [{ address: secondParticipant, type: ParticipantRole.FROM }],
					to: [{ address: account.name, type: ParticipantRole.TO }],
					folderId: FOLDERS.INBOX
				},
				messageGeneratorParams: [
					{
						id: '11',
						folderId: FOLDERS.INBOX
					}
				]
			})
		);

		setupTest(<ParticipantsString item={conversation} />, {
			initialEntries: [`/folder/${FOLDERS.INBOX}/conversation/${conversation.id}`],
			path: '/folder/:folderId/conversation/:conversationId'
		});
		expect(screen.getByText(secondParticipant)).toBeVisible();
	});
	describe('a message inside a conversation will show depend on the folder it is contained in', () => {
		test('if it is contained in inbox will show from participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation, messages } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						folderId: FOLDERS.INBOX
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.INBOX,
							from: { address: secondParticipant, type: ParticipantRole.FROM },
							to: [{ address: account.name, type: ParticipantRole.TO }]
						}
					]
				})
			);

			setupTest(<ParticipantsString item={messages[0]} />, {
				initialEntries: [`/folder/${FOLDERS.INBOX}/conversation/${conversation.id}`],
				path: '/folder/:folderId/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('if it is contained in drafts will show to participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation, messages } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						folderId: FOLDERS.INBOX
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.DRAFTS,
							to: [{ address: secondParticipant, type: ParticipantRole.TO }],
							from: { address: account.name, type: ParticipantRole.FROM }
						}
					]
				})
			);

			setupTest(<ParticipantsString item={messages[0]} />, {
				initialEntries: [`/folder/${FOLDERS.DRAFTS}/conversation/${conversation.id}`],
				path: '/folder/:folderId/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('if it is contained in sent will show to participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation, messages } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						folderId: FOLDERS.INBOX
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.SENT,
							to: [{ address: secondParticipant, type: ParticipantRole.TO }],
							from: { address: account.name, type: ParticipantRole.FROM }
						}
					]
				})
			);

			setupTest(<ParticipantsString item={messages[0]} />, {
				initialEntries: [`/conversation/${conversation.id}`],
				path: '/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
	});
	test('a conversation with multiple messages inside sent folder will show to participants', async () => {
		const account: Account = useUserAccount();
		const secondParticipant = 'randomuser@test.com';
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					id: '1',
					to: [{ address: secondParticipant, type: ParticipantRole.TO }],
					from: [{ address: account.name, type: ParticipantRole.FROM }],
					folderId: FOLDERS.SENT
				},
				messageGeneratorParams: [
					{
						id: '11',
						folderId: FOLDERS.INBOX
					},
					{
						id: '12',
						folderId: FOLDERS.SENT
					}
				]
			})
		);

		setupTest(<ParticipantsString item={conversation} />, {
			initialEntries: [`/folder/${FOLDERS.SENT}/conversation/${conversation.id}`],
			path: '/folder/:folderId/conversation/:conversationId'
		});
		expect(screen.getByText(secondParticipant)).toBeVisible();
	});
	test('a conversation with single message inside sent folder will show to participants', async () => {
		const account: Account = useUserAccount();
		const secondParticipant = 'randomuser@test.com';
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					id: '1',
					to: [{ address: secondParticipant, type: ParticipantRole.TO }],
					from: [{ address: account.name, type: ParticipantRole.FROM }],
					folderId: FOLDERS.SENT
				},
				messageGeneratorParams: [
					{
						id: '11',
						folderId: FOLDERS.SENT
					}
				]
			})
		);

		setupTest(<ParticipantsString item={conversation} />, {
			initialEntries: [`/folder/${FOLDERS.SENT}/conversation/${conversation.id}`],
			path: '/folder/:folderId/conversation/:conversationId'
		});
		expect(screen.getByText(secondParticipant)).toBeVisible();
	});
	test('a message inside inbox folder will show from participants', () => {
		const account: Account = useUserAccount();
		const secondParticipant = 'randomuser@test.com';
		const messages = populateMessagesInEmailStore({
			messageGeneratorParams: [
				{
					id: '11',
					folderId: FOLDERS.INBOX,
					from: { address: secondParticipant, type: ParticipantRole.FROM },
					to: [{ address: account.name, type: ParticipantRole.TO }]
				}
			]
		});
		setupTest(<ParticipantsString item={messages[0]} />, {
			initialEntries: [`/folder/${FOLDERS.INBOX}/message/${messages[0].id}`],
			path: '/folder/:folderId/message/:messageId'
		});
		expect(screen.getByText(secondParticipant)).toBeVisible();
	});
	test('a message inside sent folder will show to participants', () => {
		const account: Account = useUserAccount();
		const secondParticipant = 'randomuser@test.com';
		const messages = populateMessagesInEmailStore({
			messageGeneratorParams: [
				{
					id: '11',
					folderId: FOLDERS.SENT,
					to: [{ address: secondParticipant, type: ParticipantRole.TO }],
					from: { address: account.name, type: ParticipantRole.FROM }
				}
			]
		});
		setupTest(<ParticipantsString item={messages[0]} />, {
			initialEntries: [`/folder/${FOLDERS.SENT}/message/${messages[0].id}`],
			path: '/folder/:folderId/message/:messageId'
		});
		expect(screen.getByText(secondParticipant)).toBeVisible();
	});
	test('a message inside draft folder will show to participants', () => {
		const account: Account = useUserAccount();
		const secondParticipant = 'randomuser@test.com';
		const messages = populateMessagesInEmailStore({
			messageGeneratorParams: [
				{
					id: '11',
					folderId: FOLDERS.DRAFTS,
					to: [{ address: secondParticipant, type: ParticipantRole.TO }],
					from: { address: account.name, type: ParticipantRole.FROM }
				}
			]
		});
		setupTest(<ParticipantsString item={messages[0]} />, {
			initialEntries: [`/folder/${FOLDERS.DRAFTS}/message/${messages[0].id}`],
			path: '/folder/:folderId/message/:messageId'
		});
		expect(screen.getByText(secondParticipant)).toBeVisible();
	});
	describe('a conversation with multiple messages inside any other folder (exclude sent, inbox, draft, include trash)', () => {
		test('if user is sender will show to participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						to: [{ address: secondParticipant, type: ParticipantRole.TO }],
						from: [{ address: account.name, type: ParticipantRole.FROM }],
						folderId: FOLDERS.TRASH
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.TRASH
						},
						{
							id: '12',
							folderId: FOLDERS.SENT
						}
					]
				})
			);

			setupTest(<ParticipantsString item={conversation} />, {
				initialEntries: [`/folder/${FOLDERS.TRASH}/conversation/${conversation.id}`],
				path: '/folder/:folderId/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('if user is receiver will show from participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						from: [{ address: secondParticipant, type: ParticipantRole.FROM }],
						to: [{ address: account.name, type: ParticipantRole.TO }],
						folderId: FOLDERS.TRASH
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.TRASH
						},
						{
							id: '12',
							folderId: FOLDERS.SENT
						}
					]
				})
			);

			setupTest(<ParticipantsString item={conversation} />, {
				initialEntries: [`/folder/${FOLDERS.TRASH}/conversation/${conversation.id}`],
				path: '/folder/:folderId/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('if user is in both will show from participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						from: [
							{ address: account.name, type: ParticipantRole.FROM },
							{ address: secondParticipant, type: ParticipantRole.FROM }
						],
						to: [
							{ address: account.name, type: ParticipantRole.TO },
							{ address: secondParticipant, type: ParticipantRole.TO }
						],
						folderId: FOLDERS.TRASH
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.TRASH
						},
						{
							id: '12',
							folderId: FOLDERS.SENT
						},
						{
							id: '13',
							folderId: FOLDERS.INBOX
						},
						{
							id: '14',
							folderId: FOLDERS.SENT
						}
					]
				})
			);

			setupTest(<ParticipantsString item={conversation} />, {
				initialEntries: [`/folder/${FOLDERS.TRASH}/conversation/${conversation.id}`],
				path: '/folder/:folderId/conversation/:conversationId'
			});
			expect(screen.getByText(`label.me, ${secondParticipant}`)).toBeVisible();
		});
	});
	describe('a conversation with single message inside any other folder (exclude sent, inbox, draft, include trash) ', () => {
		test('if user is sender will show to participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						to: [{ address: secondParticipant, type: ParticipantRole.TO }],
						from: [{ address: account.name, type: ParticipantRole.FROM }],
						folderId: FOLDERS.TRASH
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.TRASH
						}
					]
				})
			);

			setupTest(<ParticipantsString item={conversation} />, {
				initialEntries: [`/folder/${FOLDERS.TRASH}/conversation/${conversation.id}`],
				path: '/folder/:folderId/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('if user is receiver will show from participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						from: [{ address: secondParticipant, type: ParticipantRole.FROM }],
						to: [{ address: account.name, type: ParticipantRole.TO }],
						folderId: FOLDERS.TRASH
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.TRASH
						}
					]
				})
			);

			setupTest(<ParticipantsString item={conversation} />, {
				initialEntries: [`/folder/${FOLDERS.TRASH}/conversation/${conversation.id}`],
				path: '/folder/:folderId/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('if user is both will show from participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						from: [
							{ address: account.name, type: ParticipantRole.FROM },
							{ address: secondParticipant, type: ParticipantRole.FROM }
						],
						to: [{ address: account.name, type: ParticipantRole.TO }],
						folderId: FOLDERS.TRASH
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.TRASH
						}
					]
				})
			);

			setupTest(<ParticipantsString item={conversation} />, {
				initialEntries: [`/folder/${FOLDERS.TRASH}/conversation/${conversation.id}`],
				path: '/folder/:folderId/conversation/:conversationId'
			});
			expect(screen.getByText(`label.me, ${secondParticipant}`)).toBeVisible();
		});
	});
	describe('a conversation with multiple messages in search', () => {
		test('if all the messages are inside sent or draft it will show to participant', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						from: [{ address: account.name, type: ParticipantRole.FROM }],
						to: [{ address: secondParticipant, type: ParticipantRole.TO }],
						folderId: FOLDERS.TRASH
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.SENT
						},
						{
							id: '12',
							folderId: FOLDERS.DRAFTS
						}
					]
				})
			);

			setupTest(<ParticipantsString item={conversation} />, {
				initialEntries: [`/search/conversation/${conversation.id}`],
				path: '/search/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('if all the messages are inside inbox it will show from participant', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						from: [{ address: secondParticipant, type: ParticipantRole.FROM }],
						to: [{ address: account.name, type: ParticipantRole.TO }],
						folderId: FOLDERS.TRASH
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.INBOX
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
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		describe('if all the messages are inside any other folder (exclude sent, inbox, draft, include trash)', () => {
			test('if user is sender will show to participants', async () => {
				const account: Account = useUserAccount();
				const secondParticipant = 'randomuser@test.com';
				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '1',
							from: [{ address: account.name, type: ParticipantRole.FROM }],
							to: [{ address: secondParticipant, type: ParticipantRole.TO }],
							folderId: FOLDERS.TRASH
						},
						messageGeneratorParams: [
							{
								id: '11',
								folderId: FOLDERS.TRASH
							},
							{
								id: '12',
								folderId: '112'
							}
						]
					})
				);

				setupTest(<ParticipantsString item={conversation} />, {
					initialEntries: [`/search/conversation/${conversation.id}`],
					path: '/search/conversation/:conversationId'
				});
				expect(screen.getByText(secondParticipant)).toBeVisible();
			});
			test('if user is receiver will show from participants', async () => {
				const account: Account = useUserAccount();
				const secondParticipant = 'randomuser@test.com';
				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '1',
							from: [{ address: secondParticipant, type: ParticipantRole.FROM }],
							to: [{ address: account.name, type: ParticipantRole.TO }],
							folderId: FOLDERS.TRASH
						},
						messageGeneratorParams: [
							{
								id: '11',
								folderId: FOLDERS.TRASH
							},
							{
								id: '12',
								folderId: '112'
							}
						]
					})
				);

				setupTest(<ParticipantsString item={conversation} />, {
					initialEntries: [`/search/conversation/${conversation.id}`],
					path: '/search/conversation/:conversationId'
				});
				expect(screen.getByText(secondParticipant)).toBeVisible();
			});
			test('if user is both will show from participants', async () => {
				const account: Account = useUserAccount();
				const secondParticipant = 'randomuser@test.com';
				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '1',
							from: [
								{ address: account.name, type: ParticipantRole.FROM },
								{ address: secondParticipant, type: ParticipantRole.FROM }
							],
							to: [{ address: account.name, type: ParticipantRole.TO }],
							folderId: FOLDERS.TRASH
						},
						messageGeneratorParams: [
							{
								id: '11',
								folderId: FOLDERS.TRASH
							},
							{
								id: '12',
								folderId: '112'
							}
						]
					})
				);

				setupTest(<ParticipantsString item={conversation} />, {
					initialEntries: [`/search/conversation/${conversation.id}`],
					path: '/search/conversation/:conversationId'
				});
				expect(screen.getByText(`label.me, ${secondParticipant}`)).toBeVisible();
			});
		});
	});
	describe('a single message inside search will show participants depending its folder', () => {
		test('sent folder will show to participants', () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId: FOLDERS.SENT,
						to: [{ address: secondParticipant, type: ParticipantRole.TO }],
						from: { address: account.name, type: ParticipantRole.FROM }
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />, {
				initialEntries: [`/search/message/${messages[0].id}`],
				path: '/search/message/:messageId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('draft folder will show to participants', () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId: FOLDERS.DRAFTS,
						to: [{ address: secondParticipant, type: ParticipantRole.TO }],
						from: { address: account.name, type: ParticipantRole.FROM }
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />, {
				initialEntries: [`/search/message/${messages[0].id}`],
				path: '/search/message/:messageId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('any other folder will show from participants', () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{
						id: '11',
						folderId: FOLDERS.INBOX,
						from: { address: secondParticipant, type: ParticipantRole.FROM },
						to: [{ address: account.name, type: ParticipantRole.TO }]
					}
				]
			});
			setupTest(<ParticipantsString item={messages[0]} />, {
				initialEntries: [`/search/message/${messages[0].id}`],
				path: '/search/message/:messageId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
	});
	describe('a message inside a conversation will show depend on the folder it is contained in', () => {
		test('if it is contained in inbox will show from participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation, messages } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						folderId: FOLDERS.INBOX
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.INBOX,
							from: { address: secondParticipant, type: ParticipantRole.FROM },
							to: [{ address: account.name, type: ParticipantRole.TO }]
						}
					]
				})
			);

			setupTest(<ParticipantsString item={messages[0]} />, {
				initialEntries: [`/search/conversation/${conversation.id}`],
				path: '/search/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('if it is contained in drafts will show to participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation, messages } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						folderId: FOLDERS.INBOX
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.DRAFTS,
							to: [{ address: secondParticipant, type: ParticipantRole.TO }],
							from: { address: account.name, type: ParticipantRole.FROM }
						}
					]
				})
			);

			setupTest(<ParticipantsString item={messages[0]} />, {
				initialEntries: [`/search/conversation/${conversation.id}`],
				path: '/search/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
		test('if it is contained in sent will show to participants', async () => {
			const account: Account = useUserAccount();
			const secondParticipant = 'randomuser@test.com';
			const { conversation, messages } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '1',
						folderId: FOLDERS.INBOX
					},
					messageGeneratorParams: [
						{
							id: '11',
							folderId: FOLDERS.SENT,
							to: [{ address: secondParticipant, type: ParticipantRole.TO }],
							from: { address: account.name, type: ParticipantRole.FROM }
						}
					]
				})
			);

			setupTest(<ParticipantsString item={messages[0]} />, {
				initialEntries: [`/search/conversation/${conversation.id}`],
				path: '/search/conversation/:conversationId'
			});
			expect(screen.getByText(secondParticipant)).toBeVisible();
		});
	});
});
