/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable testing-library/prefer-user-event */

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { noop } from 'lodash';
import * as reactRouterDom from 'react-router-dom';

import {
	createSoapAPIInterceptor,
	FOLDERS,
	ParticipantRole,
	setupTest
} from '@zextras/carbonio-ui-commons';
import { API_REQUEST_STATUS, FOLDERS_DESCRIPTORS } from '../../../../../constants';
import { useConvPreviewOnSeparatedWindowFn } from '../../../../../hooks/actions/use-conv-preview-on-separated-window';
import {
	setConversationsInEmailStore,
	updateConversationStatus
} from '../../../../../store/emails/store';
import { ASSERTIONS } from '../../../../../tests/constants';
import { populateConversationInEmailStore } from '../../../../../tests/generators/generateConversation';
import type { ConvActionRequest } from '../../../../../types';
import { makeAllItemsVisible } from '../../../../settings/filters/tests/test-utils';
import { ConversationListItem, ConversationListItemProps } from '../conversation-list-item';

const canExecuteCallback = jest.fn();

jest.mock('../../../../../hooks/actions/use-conv-preview-on-separated-window', () => ({
	...jest.requireActual('../../../../../hooks/actions/use-conv-preview-on-separated-window'),
	useConvPreviewOnSeparatedWindowFn: jest.fn()
}));
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: jest.fn()
}));

describe('conversation-list-item component', () => {
	describe.each`
		type                          | isSearchModule
		${'conversation list'}        | ${false}
		${'search conversation list'} | ${true}
	`('$type list item component', ({ isSearchModule }) => {
		describe('in any folders', () => {
			test('if the conversation contains more than 1 message then a badge with the messages count is visible', async () => {
				const folderId = FOLDERS.INBOX;
				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationMessagesNumber: 3,
						conversationParams: { folderId }
					})
				);
				const messageCount = conversation.messageIds.length;

				const props: ConversationListItemProps = {
					conversation,
					selected: false,
					selecting: false,
					toggleMultipleSelection: noop,
					activeItemId: '',
					deselectAll: noop,
					isSearchModule,
					folderId
				};
				setConversationsInEmailStore([conversation], false);

				setupTest(<ConversationListItem {...props} />);
				const badge = await screen.findByTestId(`conversation-messages-count-${conversation.id}`);
				await act(async () => {
					expect(badge).toBeVisible();
				});
				await act(async () => {
					expect(badge).toHaveTextContent(`${messageCount}`);
				});
			});

			test.each`
				case | folder                              | assertion
				${1} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.IS_VISIBLE}
				${1} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.IS_VISIBLE}
				${1} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.IS_VISIBLE}
				${1} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.IS_VISIBLE}
				${1} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.IS_VISIBLE}
				${1} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.IS_VISIBLE}
			`(
				`(case #$case) the avatar $assertion.desc for a message in $folder.desc folder`,
				async ({ folder, assertion }) => {
					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationMessagesNumber: 3,
							conversationParams: { folderId: folder.id }
						})
					);
					const props: ConversationListItemProps = {
						conversation,
						selected: false,
						selecting: false,
						toggleMultipleSelection: noop,
						activeItemId: '',
						deselectAll: noop,
						isSearchModule,
						folderId: folder.id
					};
					setupTest(<ConversationListItem {...props} />);
					const avatar = await screen.findByTestId(
						`conversation-list-item-avatar-${conversation.id}`
					);
					assertion.value ? expect(avatar).toBeVisible() : expect(avatar).not.toBeInTheDocument();
				}
			);

			test.each`
				case | folder                              | assertion
				${2} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.IS_VISIBLE}
				${2} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.IS_VISIBLE}
				${2} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.IS_VISIBLE}
				${2} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.IS_VISIBLE}
				${2} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.IS_VISIBLE}
				${2} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.IS_VISIBLE}
			`(
				`(case #$case) the date $assertion.desc for a message in $folder.desc folder`,
				async ({ folder, assertion }) => {
					const receiveDate = Date.parse('2023-04-07T12:59:06');
					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationMessagesNumber: 3,
							conversationParams: {
								folderId: folder.id,
								isSingleMessageConversation: false,
								receiveDate
							}
						})
					);

					const props: ConversationListItemProps = {
						conversation,
						selected: false,
						selecting: false,
						toggleMultipleSelection: noop,
						activeItemId: '',
						deselectAll: noop,
						isSearchModule,
						folderId: folder.id
					};

					setupTest(<ConversationListItem {...props} />);

					const dateLabel = screen.queryByTestId('DateLabel');
					if (assertion.value) {
						await act(async () => {
							expect(dateLabel).toBeVisible();
						});
					} else {
						await act(async () => {
							expect(dateLabel).not.toBeInTheDocument();
						});
					}
				}
			);

			test.each`
				case | folder                              | assertion
				${3} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.IS_VISIBLE}
				${3} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.IS_VISIBLE}
				${3} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.IS_VISIBLE}
				${3} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.IS_VISIBLE}
				${3} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.IS_VISIBLE}
				${3} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.IS_VISIBLE}
			`(
				`(case #$case) if set, the subject $assertion.desc for a message in $folder.desc folder`,
				async ({ folder, assertion }) => {
					const subject = 'This is an interesting subject';
					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationMessagesNumber: 3,
							conversationParams: {
								folderId: folder.id,
								isSingleMessageConversation: false,
								subject
							}
						})
					);
					const props: ConversationListItemProps = {
						conversation,
						selected: false,
						selecting: false,
						toggleMultipleSelection: noop,
						activeItemId: '',
						deselectAll: noop,
						isSearchModule,
						folderId: folder.id
					};

					setupTest(<ConversationListItem {...props} />);

					const subjectLabel = screen.queryByTestId('Subject');
					if (assertion.value) {
						await act(async () => {
							expect(subjectLabel).toBeVisible();
						});
						await act(async () => {
							expect(subjectLabel).toHaveTextContent(subject);
						});
					} else {
						await act(async () => {
							expect(subjectLabel).not.toBeInTheDocument();
						});
					}
				}
			);

			test.each`
				case | folder                              | assertion
				${4} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.IS_VISIBLE}
				${4} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.IS_VISIBLE}
				${4} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.IS_VISIBLE}
				${4} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.IS_VISIBLE}
				${4} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.IS_VISIBLE}
				${4} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.IS_VISIBLE}
			`(
				`(case #$case) if set, the subject $assertion.desc for a message in $folder.desc folder`,
				async ({ folder, assertion }) => {
					const subject = '';
					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationParams: {
								folderId: folder.id,
								isSingleMessageConversation: false,
								subject
							}
						})
					);

					const props: ConversationListItemProps = {
						conversation,
						selected: false,
						selecting: false,
						toggleMultipleSelection: noop,
						activeItemId: '',
						deselectAll: noop,
						isSearchModule,
						folderId: folder.id
					};

					setupTest(<ConversationListItem {...props} />);

					const subjectLabel = screen.queryByTestId('Subject');
					if (assertion.value) {
						await act(async () => {
							expect(subjectLabel).toBeVisible();
						});
						await act(async () => {
							expect(subjectLabel).toHaveTextContent('<No Subject>');
						});
					} else {
						await act(async () => {
							expect(subjectLabel).not.toBeInTheDocument();
						});
					}
				}
			);

			test.each`
				case | folder                              | assertion
				${5} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.IS_VISIBLE}
				${5} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.IS_VISIBLE}
				${5} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.IS_VISIBLE}
				${5} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.IS_VISIBLE}
				${5} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.IS_VISIBLE}
				${5} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.IS_VISIBLE}
			`(
				`(case #$case) the sender label $assertion.desc for a message in $folder.desc folder`,
				async ({ folder, assertion }) => {
					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationMessagesNumber: 3,
							conversationParams: { folderId: folder.id, isSingleMessageConversation: false }
						})
					);

					const props: ConversationListItemProps = {
						conversation,
						selected: false,
						selecting: false,
						toggleMultipleSelection: noop,
						activeItemId: '',
						deselectAll: noop,
						isSearchModule,
						folderId: folder.id
					};

					setupTest(<ConversationListItem {...props} />);

					const senderLabel = screen.queryByTestId('participants-name-label');
					if (assertion.value) {
						await act(async () => {
							expect(senderLabel).toBeVisible();
						});
					} else {
						await act(async () => {
							expect(senderLabel).not.toBeInTheDocument();
						});
					}
				}
			);

			test.each`
				case | folder                              | senderAddress      | labelContent
				${6} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${'luigi@foo.bar'} | ${'luigi'}
				${6} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${'luigi@foo.bar'} | ${'luigi'}
				${6} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${'luigi@foo.bar'} | ${'luigi'}
				${6} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${'luigi@foo.bar'} | ${'luigi'}
				${6} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${'luigi@foo.bar'} | ${'luigi'}
			`(
				`(case #$case) the sender name must contain the sender name for a message in $folder.desc folder`,
				async ({ folder, senderAddress, labelContent }) => {
					const from = [{ type: ParticipantRole.FROM, address: senderAddress }];
					const { conversation } = await waitFor(() =>
						populateConversationInEmailStore({
							conversationMessagesNumber: 3,
							conversationParams: { from, folderId: folder.id, isSingleMessageConversation: false }
						})
					);

					const props: ConversationListItemProps = {
						conversation,
						selected: false,
						selecting: false,
						toggleMultipleSelection: noop,
						activeItemId: '',
						deselectAll: noop,
						isSearchModule,
						folderId: folder.id
					};

					setupTest(<ConversationListItem {...props} />);

					const senderLabel = screen.queryByTestId('participants-name-label');
					await act(async () => {
						expect(senderLabel).toHaveTextContent(labelContent);
					});
				}
			);

			test("(case #8) if the conversation contains more than 1 message then all the recipients' names are visible", async () => {
				const fromMario = { type: ParticipantRole.FROM, address: 'mario@foo.baz' };
				const fromLuigi = { type: ParticipantRole.FROM, address: 'luigi@foo.baz' };
				const fromBowser = { type: ParticipantRole.FROM, address: 'bowser@foo.baz' };
				const toMyself = { type: ParticipantRole.TO, address: `me@myself.com` };
				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationMessagesNumber: 3,
						messageGeneratorParams: [
							{ folderId: FOLDERS.INBOX, to: [toMyself], from: fromMario },
							{ folderId: FOLDERS.INBOX, to: [toMyself], from: fromLuigi },
							{ folderId: FOLDERS.INBOX, to: [toMyself], from: fromBowser }
						],
						conversationParams: {
							folderId: FOLDERS.INBOX,
							to: [toMyself],
							from: [fromMario, fromLuigi, fromBowser]
						}
					})
				);

				const props: ConversationListItemProps = {
					conversation,
					selected: false,
					selecting: false,
					toggleMultipleSelection: noop,
					activeItemId: '',
					deselectAll: noop,
					isSearchModule,
					folderId: FOLDERS.INBOX
				};

				setupTest(<ConversationListItem {...props} />);
				const senderLabel = screen.queryByTestId('participants-name-label');
				await act(async () => {
					expect(senderLabel).toHaveTextContent('mario');
				});
				await act(async () => {
					expect(senderLabel).toHaveTextContent('luigi');
				});
				await act(async () => {
					expect(senderLabel).toHaveTextContent('bowser');
				});
			});

			test('(case #9) if the conversation contains more than 1 message then a chevron must be visible', async () => {
				const folderId = FOLDERS.INBOX;

				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationMessagesNumber: 3,
						conversationParams: { folderId }
					})
				);
				const props: ConversationListItemProps = {
					conversation,
					selected: false,
					selecting: false,
					toggleMultipleSelection: noop,
					activeItemId: '',
					deselectAll: noop,
					isSearchModule,
					folderId
				};

				setupTest(<ConversationListItem {...props} />);
				const chevron = await screen.findByTestId(`ToggleExpand`);
				expect(chevron).toBeVisible();
			});

			test('(case #10) if the conversation contains only 1 message then must be not visibile a chevron', async () => {
				const folderId = FOLDERS.INBOX;
				const { conversation } = await waitFor(() =>
					populateConversationInEmailStore({
						conversationParams: { folderId, isSingleMessageConversation: true }
					})
				);
				const props: ConversationListItemProps = {
					conversation,
					selected: false,
					selecting: false,
					toggleMultipleSelection: noop,
					activeItemId: '',
					deselectAll: noop,
					isSearchModule,
					folderId
				};

				setupTest(<ConversationListItem {...props} />);
				await act(async () => {
					expect(screen.queryByTestId('ToggleExpand')).not.toBeInTheDocument();
				});
			});
		});

		test('(case #11) when right-click the message the secondary actions contextual menu must be visible', async () => {
			const folderId = FOLDERS.INBOX;
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { folderId }
				})
			);
			const props: ConversationListItemProps = {
				conversation,
				selected: false,
				selecting: false,
				toggleMultipleSelection: noop,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule,
				folderId
			};

			const { user } = setupTest(<ConversationListItem {...props} />);
			const conversationItem = screen.getByTestId(`ConversationListItem-${conversation.id}`);
			await user.hover(conversationItem);
			const aRandomChild = await screen.findByTestId(`hover-container-${conversation.id}`);

			// Initally the context menu is not created
			expect(screen.queryByTestId('dropdown-popper-list')).not.toBeInTheDocument();

			// Trigger a right-click
			fireEvent.contextMenu(aRandomChild);

			const menu = await screen.findByTestId('dropdown-popper-list');
			expect(menu).toBeVisible();
		});
	});

	describe('conversation-list-item not in search module', () => {
		it('should call the onClick handler when the message is clicked', async () => {
			const navigate = jest.fn();
			(reactRouterDom.useNavigate as jest.Mock).mockReturnValue(navigate);
			createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			const { conversation } = await waitFor(() => populateConversationInEmailStore({}));

			const props: ConversationListItemProps = {
				conversation,
				selected: false,
				selecting: false,
				toggleMultipleSelection: noop,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule: false,
				folderId: FOLDERS.INBOX
			};

			const { user } = await waitFor(() => setupTest(<ConversationListItem {...props} />));

			const actionWrapper = await waitFor(() =>
				screen.findByTestId(`ConversationListItem-${props.conversation.id}`)
			);

			await act(async () => {
				user.hover(actionWrapper);
			});

			const hoverContainer = await waitFor(() => screen.findByTestId(/hover-container-/));
			await act(async () => {
				expect(await screen.findByTestId(/hover-container-/)).toBeInTheDocument();
			});

			fireEvent.click(hoverContainer);

			await waitFor(async () => {
				expect(navigate).toHaveBeenCalled();
			});
		});

		it('should call the doubleClick handler when the message is doubleClicked', async () => {
			(useConvPreviewOnSeparatedWindowFn as jest.Mock).mockReturnValue({
				canExecute: canExecuteCallback,
				execute: jest.fn()
			});
			createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			const { conversation } = await waitFor(() => populateConversationInEmailStore({}));

			const props: ConversationListItemProps = {
				conversation,
				selected: false,
				selecting: false,
				toggleMultipleSelection: noop,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule: false,
				folderId: FOLDERS.INBOX
			};

			const { user } = setupTest(<ConversationListItem {...props} />);

			const actionWrapper = await screen.findByTestId(
				`ConversationListItem-${props.conversation.id}`
			);

			await act(async () => {
				user.hover(actionWrapper);
			});

			const hoverContainer = screen.getByTestId(/hover-container-/);

			expect(await screen.findByTestId(/hover-container-/)).toBeInTheDocument();

			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.dblClick(hoverContainer);

			await waitFor(async () => {
				expect(canExecuteCallback).toHaveBeenCalled();
			});
		});
	});

	describe('conversation-list-item in search module', () => {
		it('should call the onClick handler when the message is clicked', async () => {
			const navigate = jest.fn();
			(reactRouterDom.useNavigate as jest.Mock).mockReturnValue(navigate);
			createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			const { conversation } = await waitFor(() => populateConversationInEmailStore({}));

			const props: ConversationListItemProps = {
				conversation,
				selected: false,
				selecting: false,
				toggleMultipleSelection: noop,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule: true,
				folderId: FOLDERS.INBOX
			};

			const { user } = await waitFor(() => setupTest(<ConversationListItem {...props} />));

			const actionWrapper = await waitFor(() =>
				screen.findByTestId(`ConversationListItem-${props.conversation.id}`)
			);

			await act(async () => {
				user.hover(actionWrapper);
			});

			const hoverContainer = await waitFor(() => screen.findByTestId(/hover-container-/));
			await act(async () => {
				expect(await screen.findByTestId(/hover-container-/)).toBeInTheDocument();
			});

			fireEvent.click(hoverContainer);

			await waitFor(async () => {
				expect(navigate).toHaveBeenCalled();
			});
		});

		it('should call the doubleClick handler when the message is doubleClicked', async () => {
			(useConvPreviewOnSeparatedWindowFn as jest.Mock).mockReturnValue({
				canExecute: canExecuteCallback,
				execute: jest.fn()
			});
			createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			const { conversation } = await waitFor(() => populateConversationInEmailStore({}));

			const props: ConversationListItemProps = {
				conversation,
				selected: false,
				selecting: false,
				toggleMultipleSelection: noop,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule: true,
				folderId: FOLDERS.INBOX
			};

			const { user } = setupTest(<ConversationListItem {...props} />);

			const actionWrapper = await screen.findByTestId(
				`ConversationListItem-${props.conversation.id}`
			);

			await act(async () => {
				user.hover(actionWrapper);
			});

			const hoverContainer = screen.getByTestId(/hover-container-/);

			expect(await screen.findByTestId(/hover-container-/)).toBeInTheDocument();

			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.dblClick(hoverContainer);

			await waitFor(async () => {
				expect(canExecuteCallback).toHaveBeenCalled();
			});
		});

		it('should not show message items when there is only one message in the conversation', async () => {
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationMessagesNumber: 1
				})
			);

			const props: ConversationListItemProps = {
				conversation,
				selected: false,
				selecting: false,
				toggleMultipleSelection: noop,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule: true,
				folderId: FOLDERS.INBOX
			};

			setupTest(<ConversationListItem {...props} />);

			const messageItems = screen.queryAllByTestId(/conversation-message-list-item-/);
			expect(messageItems).toHaveLength(0);
		});

		it('should show message items when there are more than one message in the conversation', async () => {
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationMessagesNumber: 3
				})
			);

			updateConversationStatus(conversation.id, API_REQUEST_STATUS.fulfilled);

			const props: ConversationListItemProps = {
				conversation,
				selected: false,
				selecting: false,
				toggleMultipleSelection: noop,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule: true,
				folderId: FOLDERS.INBOX
			};

			setupTest(<ConversationListItem {...props} />);

			const toggleButton = screen.getByTestId('ToggleExpand');
			await waitFor(() => {
				expect(toggleButton).toBeVisible();
			});

			fireEvent.click(toggleButton);

			makeAllItemsVisible();

			const messageItems = await screen.findAllByTestId(/conversation-message-list-item-/);

			await waitFor(() => {
				expect(messageItems).toHaveLength(3);
			});
		});
	});
});
