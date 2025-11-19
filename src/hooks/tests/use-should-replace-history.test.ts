/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';

import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { setupHook } from '@test-setup';
import { useShouldReplaceHistory } from 'hooks/use-should-replace-history';

describe('useShouldReplaceHistory', () => {
	it('should return false if there is no route in parent components', async () => {
		const { messages } = await waitFor(() => populateConversationInEmailStore());
		const {
			result: { current }
		} = setupHook(useShouldReplaceHistory, {
			initialProps: [messages[0]],
			initialEntries: [''],
			path: ''
		});
		expect(current).toEqual(false);
	});
	describe('under the detail panel route', () => {
		const conversationPath = '/mails/folder/:folderId/conversation/:conversationId';
		describe('given a message and a /conversation/ path', () => {
			it('should return true if this is the only message in a conversation', async () => {
				const { conversation, messages } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '-234',
							messageIds: ['22']
						},
						messageGeneratorParams: [{ id: '22' }]
					})
				);
				const message = messages[0];
				const {
					result: { current }
				} = setupHook(useShouldReplaceHistory, {
					initialProps: [message],
					initialEntries: [`/mails/folder/2/conversation/${conversation.id}`],
					path: conversationPath
				});
				expect(current).toEqual(true);
			});
			it('should return false if there are multiple messages in the conversation related to the folder', async () => {
				const { conversation, messages } = await waitFor(() =>
					populateConversationInEmailStore({ conversationMessagesNumber: 3 })
				);
				const message = messages[0];
				const {
					result: { current }
				} = setupHook(useShouldReplaceHistory, {
					initialProps: [message],
					initialEntries: [`/mails/folder/${message.parent}/conversation/${conversation.id}`],
					path: conversationPath
				});
				expect(current).toEqual(false);
			});
			it('should return false if there are multiple messages in the conversation and the given message is from a different folder', async () => {
				const { conversation, messages } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							messageIds: ['22', '23']
						},
						messageGeneratorParams: [
							{ id: '22', folderId: '2' },
							{ id: '23', folderId: '4' }
						]
					})
				);
				const message = messages[1];
				const {
					result: { current }
				} = setupHook(useShouldReplaceHistory, {
					initialProps: [message],
					initialEntries: [`/mails/folder/2/conversation/${conversation.id}`],
					path: conversationPath
				});
				expect(current).toEqual(false);
			});
			it('should return true if there are multiple messages in a conversation but this is the only one related to the folder', async () => {
				const { conversation, messages } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							messageIds: ['22', '23', '24']
						},
						messageGeneratorParams: [
							{ id: '22', folderId: '2' },
							{ id: '23', folderId: '3' },
							{ id: '24', folderId: '3' }
						]
					})
				);
				const message = messages[0];
				const {
					result: { current }
				} = setupHook(useShouldReplaceHistory, {
					initialProps: [message],
					initialEntries: [`/mails/folder/2/conversation/${conversation.id}`],
					path: conversationPath
				});
				expect(current).toEqual(true);
			});
		});
		const messagePath = '/mails/folder/:folderId/message/:messageId';
		test('given a message and a /message/ path should return true if this has same id as the path', async () => {
			const { messages } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '-234',
						messageIds: ['22']
					},
					messageGeneratorParams: [{ id: '22' }]
				})
			);
			const message = messages[0];
			const {
				result: { current }
			} = setupHook(useShouldReplaceHistory, {
				initialProps: [message],
				initialEntries: [`/mails/folder/2/message/${message.id}`],
				path: messagePath
			});
			expect(current).toEqual(true);
		});
	});
	describe('under the folder panel route', () => {
		const path = '/mails/folder/:folderId/:type?/:itemId?';
		describe('in a /conversation/ path', () => {
			test('given a conversation should return true if this has same id as the path', async () => {
				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							messageIds: ['22', '23', '24']
						},
						messageGeneratorParams: [{ id: '22' }, { id: '23' }, { id: '24' }]
					})
				);
				const {
					result: { current }
				} = setupHook(useShouldReplaceHistory, {
					initialProps: [conversation],
					initialEntries: [`/mails/folder/2/conversation/${conversation.id}`],
					path
				});
				expect(current).toEqual(true);
			});
			test('given a conversation should return false if this has different id from the path', async () => {
				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							messageIds: ['22', '23', '24']
						},
						messageGeneratorParams: [{ id: '22' }, { id: '23' }, { id: '24' }]
					})
				);
				const {
					result: { current }
				} = setupHook(useShouldReplaceHistory, {
					initialProps: [conversation],
					initialEntries: [`/mails/folder/2/conversation/anyOtherId`],
					path
				});
				expect(current).toEqual(false);
			});
			describe('given a message', () => {
				it('should return true if this is the only message in a conversation', async () => {
					const { conversation, messages } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								id: '-234',
								messageIds: ['22']
							},
							messageGeneratorParams: [{ id: '22' }]
						})
					);
					const message = messages[0];
					const {
						result: { current }
					} = setupHook(useShouldReplaceHistory, {
						initialProps: [message],
						initialEntries: [`/mails/folder/2/conversation/${conversation.id}`],
						path
					});
					expect(current).toEqual(true);
				});
				it('should return false if there are multiple messages in the conversation related to the folder', async () => {
					const { conversation, messages } = await waitFor(() =>
						populateConversationInEmailStore({ conversationMessagesNumber: 3 })
					);
					const message = messages[0];
					const {
						result: { current }
					} = setupHook(useShouldReplaceHistory, {
						initialProps: [message],
						initialEntries: [`/mails/folder/${message.parent}/conversation/${conversation.id}`],
						path
					});
					expect(current).toEqual(false);
				});
				it('should return false if the given message is not related to the current folder', async () => {
					const { conversation, messages } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								id: '-234',
								messageIds: ['22']
							},
							messageGeneratorParams: [{ id: '22' }, { id: '23', folderId: 'anyOtherId' }]
						})
					);
					const message = messages[1];
					const {
						result: { current }
					} = setupHook(useShouldReplaceHistory, {
						initialProps: [message],
						initialEntries: [`/mails/folder/2/conversation/${conversation.id}`],
						path
					});
					expect(current).toEqual(false);
				});
				it('should return true if there are multiple messages in a conversation but this is the only one related to the folder', async () => {
					const { conversation, messages } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								messageIds: ['22', '23', '24']
							},
							messageGeneratorParams: [
								{ id: '22', folderId: '2' },
								{ id: '23', folderId: '3' },
								{ id: '24', folderId: '3' }
							]
						})
					);
					const message = messages[0];
					const {
						result: { current }
					} = setupHook(useShouldReplaceHistory, {
						initialProps: [message],
						initialEntries: [`/mails/folder/2/conversation/${conversation.id}`],
						path
					});
					expect(current).toEqual(true);
				});
			});
		});
		test('given a message and a /message/ path should return true if this has same id as the path', async () => {
			const { messages } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: {
						id: '-234',
						messageIds: ['22']
					},
					messageGeneratorParams: [{ id: '22' }]
				})
			);
			const message = messages[0];
			const {
				result: { current }
			} = setupHook(useShouldReplaceHistory, {
				initialProps: [message],
				initialEntries: [`/mails/folder/2/message/${message.id}`],
				path
			});
			expect(current).toEqual(true);
		});
	});
	describe('in search view', () => {
		describe('under the detail panel route', () => {
			const conversationPath = '/search/conversation/:conversationId';
			describe('given a message and a /conversation/ path', () => {
				it('should return false even if this is the only message in a conversation', async () => {
					const { conversation, messages } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								id: '-234',
								messageIds: ['22']
							},
							messageGeneratorParams: [{ id: '22' }]
						})
					);
					const message = messages[0];
					const {
						result: { current }
					} = setupHook(useShouldReplaceHistory, {
						initialProps: [message],
						initialEntries: [`/search/conversation/${conversation.id}`],
						path: conversationPath
					});
					expect(current).toEqual(false);
				});
				it('should return false even if there are multiple messages in the conversation', async () => {
					const { conversation, messages } = await waitFor(() =>
						populateConversationInEmailStore({ conversationMessagesNumber: 3 })
					);
					const message = messages[0];
					const {
						result: { current }
					} = setupHook(useShouldReplaceHistory, {
						initialProps: [message],
						initialEntries: [`/search/conversation/${conversation.id}`],
						path: conversationPath
					});
					expect(current).toEqual(false);
				});
				it('should return false even if there are multiple messages with different parents in the conversation', async () => {
					const { conversation, messages } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								messageIds: ['22', '23', '24']
							},
							messageGeneratorParams: [
								{ id: '22', folderId: '2' },
								{ id: '23', folderId: '3' },
								{ id: '24', folderId: '3' }
							]
						})
					);
					const message = messages[0];
					const {
						result: { current }
					} = setupHook(useShouldReplaceHistory, {
						initialProps: [message],
						initialEntries: [`/search/conversation/${conversation.id}`],
						path: conversationPath
					});
					expect(current).toEqual(false);
				});
				it('should return false if there are multiple messages in the conversation and the given message is from a different folder', async () => {
					const { conversation, messages } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								messageIds: ['22', '23']
							},
							messageGeneratorParams: [
								{ id: '22', folderId: '2' },
								{ id: '23', folderId: '4' }
							]
						})
					);
					const message = messages[1];
					const {
						result: { current }
					} = setupHook(useShouldReplaceHistory, {
						initialProps: [message],
						initialEntries: [`/search/conversation/${conversation.id}`],
						path: conversationPath
					});
					expect(current).toEqual(false);
				});
			});
			const messagePath = '/search/message/:messageId';
			test('given a message and a /message/ path should return true if this has same id as the path', async () => {
				const { messages } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '-234',
							messageIds: ['22']
						},
						messageGeneratorParams: [{ id: '22' }]
					})
				);
				const message = messages[0];
				const {
					result: { current }
				} = setupHook(useShouldReplaceHistory, {
					initialProps: [message],
					initialEntries: [`/search/message/${message.id}`],
					path: messagePath
				});
				expect(current).toEqual(true);
			});
			test('given a message and a /message/ path should return false if this has a different id from the path', async () => {
				const { messages } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '-234',
							messageIds: ['22']
						},
						messageGeneratorParams: [{ id: '22' }]
					})
				);
				const message = messages[0];
				const {
					result: { current }
				} = setupHook(useShouldReplaceHistory, {
					initialProps: [message],
					initialEntries: [`/search/message/anyOtherId`],
					path: messagePath
				});
				expect(current).toEqual(false);
			});
		});
		describe('under the folder panel route', () => {
			const path = '/search/:type?/:itemId?';
			describe('in a /conversation/ path', () => {
				test('given a conversation should return true if this has same id as the path', async () => {
					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								messageIds: ['22', '23', '24']
							},
							messageGeneratorParams: [{ id: '22' }, { id: '23' }, { id: '24' }]
						})
					);
					const {
						result: { current }
					} = setupHook(useShouldReplaceHistory, {
						initialProps: [conversation],
						initialEntries: [`/search/conversation/${conversation.id}`],
						path
					});
					expect(current).toEqual(true);
				});
				test('given a conversation should return false if this has a different id from the path', async () => {
					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								messageIds: ['22', '23', '24']
							},
							messageGeneratorParams: [{ id: '22' }, { id: '23' }, { id: '24' }]
						})
					);
					const {
						result: { current }
					} = setupHook(useShouldReplaceHistory, {
						initialProps: [conversation],
						initialEntries: [`/search/conversation/anyOtherId`],
						path
					});
					expect(current).toEqual(false);
				});
				describe('given a message', () => {
					it('should return false even if this is the only message in a conversation', async () => {
						const { conversation, messages } = await waitFor(() =>
							populateConversationInEmailStore({
								conversationParams: {
									id: '-234',
									messageIds: ['22']
								},
								messageGeneratorParams: [{ id: '22' }]
							})
						);
						const message = messages[0];
						const {
							result: { current }
						} = setupHook(useShouldReplaceHistory, {
							initialProps: [message],
							initialEntries: [`/search/conversation/${conversation.id}`],
							path
						});
						expect(current).toEqual(false);
					});
					it('should return false even if there are multiple messages in the conversation', async () => {
						const { conversation, messages } = await waitFor(() =>
							populateConversationInEmailStore({ conversationMessagesNumber: 3 })
						);
						const message = messages[0];
						const {
							result: { current }
						} = setupHook(useShouldReplaceHistory, {
							initialProps: [message],
							initialEntries: [`/search/conversation/${conversation.id}`],
							path
						});
						expect(current).toEqual(false);
					});
					it('should return false even if there are multiple messages with different parents in the conversation', async () => {
						const { conversation, messages } = await waitFor(() =>
							populateConversationInEmailStore({
								conversationParams: {
									messageIds: ['22', '23', '24']
								},
								messageGeneratorParams: [
									{ id: '22', folderId: '2' },
									{ id: '23', folderId: '3' },
									{ id: '24', folderId: '3' }
								]
							})
						);
						const message = messages[0];
						const {
							result: { current }
						} = setupHook(useShouldReplaceHistory, {
							initialProps: [message],
							initialEntries: [`/search/conversation/${conversation.id}`],
							path
						});
						expect(current).toEqual(false);
					});
				});
			});
			test('given a message and a /message/ path should return true if this has same id as the path', async () => {
				const { messages } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '-234',
							messageIds: ['22']
						},
						messageGeneratorParams: [{ id: '22' }]
					})
				);
				const message = messages[0];
				const {
					result: { current }
				} = setupHook(useShouldReplaceHistory, {
					initialProps: [message],
					initialEntries: [`/search/message/${message.id}`],
					path
				});
				expect(current).toEqual(true);
			});
			test('given a message and a /message/ path should return false if this has a different id from the path', async () => {
				const { messages } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: {
							id: '-234',
							messageIds: ['22']
						},
						messageGeneratorParams: [{ id: '22' }]
					})
				);
				const message = messages[0];
				const {
					result: { current }
				} = setupHook(useShouldReplaceHistory, {
					initialProps: [message],
					initialEntries: [`/search/message/anyOtherId`],
					path
				});
				expect(current).toEqual(false);
			});
		});
	});
});
