/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { fireEvent, screen } from '@testing-library/react';
import { noop } from 'lodash';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS, FOLDERS_DESCRIPTORS } from '../../../../../constants';
import { ASSERTIONS } from '../../../../../tests/constants';
import { generateConversation } from '../../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import type { ConversationListItemProps } from '../../../../../types';
import { ConversationListItem } from '../conversation-list-item';

describe.each`
	type                          | isSearchModule
	${'conversation list'}        | ${false}
	${'search conversation list'} | ${true}
`('$type list item component', ({ isSearchModule }) => {
	describe('in any folders', () => {
		test('if the conversation contains more than 1 message then a badge with the messages count is visible', async () => {
			const folderId = FOLDERS.INBOX;
			const conversation = generateConversation({ folderId, isSingleMessageConversation: false });
			const messageCount = conversation.messages.length;

			const props: ConversationListItemProps = {
				item: conversation,
				selected: false,
				selecting: false,
				toggle: noop,
				isConvChildren: false,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule,
				folderId
			};

			const store = generateStore({
				conversations: {
					currentFolder: folderId,
					expandedStatus: {
						[conversation.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conversation.id]: conversation
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			setupTest(<ConversationListItem {...props} />, { store });
			const badge = await screen.findByTestId(`conversation-messages-count-${conversation.id}`);
			expect(badge).toBeVisible();
			expect(badge).toHaveTextContent(`${messageCount}`);
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
				const conversation = generateConversation({
					folderId: folder.id,
					isSingleMessageConversation: false
				});

				const props: ConversationListItemProps = {
					item: conversation,
					selected: false,
					selecting: false,
					toggle: noop,
					isConvChildren: false,
					activeItemId: '',
					deselectAll: noop,
					isSearchModule,
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						searchRequestStatus: API_REQUEST_STATUS.fulfilled
					}
				});

				setupTest(<ConversationListItem {...props} />, { store });
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
				const conversation = generateConversation({
					folderId: folder.id,
					isSingleMessageConversation: false,
					receiveDate
				});

				const props: ConversationListItemProps = {
					item: conversation,
					selected: false,
					selecting: false,
					toggle: noop,
					isConvChildren: false,
					activeItemId: '',
					deselectAll: noop,
					isSearchModule,
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						searchRequestStatus: API_REQUEST_STATUS.fulfilled
					}
				});

				setupTest(<ConversationListItem {...props} />, { store });

				const dateLabel = screen.queryByTestId('DateLabel');
				if (assertion.value) {
					expect(dateLabel).toBeVisible();
				} else {
					expect(dateLabel).not.toBeInTheDocument();
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
				const conversation = generateConversation({
					folderId: folder.id,
					isSingleMessageConversation: false,
					subject
				});

				const props: ConversationListItemProps = {
					item: conversation,
					selected: false,
					selecting: false,
					toggle: noop,
					isConvChildren: false,
					activeItemId: '',
					deselectAll: noop,
					isSearchModule,
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						searchRequestStatus: API_REQUEST_STATUS.fulfilled
					}
				});

				setupTest(<ConversationListItem {...props} />, { store });

				const subjectLabel = screen.queryByTestId('Subject');
				if (assertion.value) {
					expect(subjectLabel).toBeVisible();
					expect(subjectLabel).toHaveTextContent(subject);
				} else {
					expect(subjectLabel).not.toBeInTheDocument();
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
				const conversation = generateConversation({
					folderId: folder.id,
					isSingleMessageConversation: false,
					subject
				});

				const props: ConversationListItemProps = {
					item: conversation,
					selected: false,
					selecting: false,
					toggle: noop,
					isConvChildren: false,
					activeItemId: '',
					deselectAll: noop,
					isSearchModule,
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						searchRequestStatus: API_REQUEST_STATUS.fulfilled
					}
				});

				setupTest(<ConversationListItem {...props} />, { store });

				const subjectLabel = screen.queryByTestId('Subject');
				if (assertion.value) {
					expect(subjectLabel).toBeVisible();
					expect(subjectLabel).toHaveTextContent('label.no_subject_with_tags');
				} else {
					expect(subjectLabel).not.toBeInTheDocument();
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
				const conversation = generateConversation({
					folderId: folder.id,
					isSingleMessageConversation: false
				});

				const props: ConversationListItemProps = {
					item: conversation,
					selected: false,
					selecting: false,
					toggle: noop,
					isConvChildren: false,
					activeItemId: '',
					deselectAll: noop,
					isSearchModule,
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						searchRequestStatus: API_REQUEST_STATUS.fulfilled
					}
				});

				setupTest(<ConversationListItem {...props} />, { store });

				const senderLabel = screen.queryByTestId('participants-name-label');
				if (assertion.value) {
					expect(senderLabel).toBeVisible();
				} else {
					expect(senderLabel).not.toBeInTheDocument();
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
				const conversation = generateConversation({
					folderId: folder.id,
					isSingleMessageConversation: false,
					from
				});

				const props: ConversationListItemProps = {
					item: conversation,
					selected: false,
					selecting: false,
					toggle: noop,
					isConvChildren: false,
					activeItemId: '',
					deselectAll: noop,
					isSearchModule,
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						searchRequestStatus: API_REQUEST_STATUS.fulfilled
					}
				});

				setupTest(<ConversationListItem {...props} />, { store });

				const senderLabel = screen.queryByTestId('participants-name-label');
				expect(senderLabel).toHaveTextContent(labelContent);
			}
		);

		test("(case #8) if the conversation contains more than 1 message then all the recipients' names are visible", async () => {
			const fromMario = { type: ParticipantRole.FROM, address: 'mario@foo.baz' };
			const fromLuigi = { type: ParticipantRole.FROM, address: 'luigi@foo.baz' };
			const fromBowser = { type: ParticipantRole.FROM, address: 'bowser@foo.baz' };
			const toMyself = { type: ParticipantRole.TO, address: `me@myself.com` };
			const conversation = generateConversation({
				folderId: FOLDERS.INBOX,
				messages: [
					generateMessage({ folderId: FOLDERS.INBOX, to: [toMyself], from: fromMario }),
					generateMessage({ folderId: FOLDERS.INBOX, to: [toMyself], from: fromLuigi }),
					generateMessage({ folderId: FOLDERS.INBOX, to: [toMyself], from: fromBowser })
				],
				to: [toMyself],
				from: [fromMario, fromLuigi, fromBowser]
			});

			const props: ConversationListItemProps = {
				item: conversation,
				selected: false,
				selecting: false,
				toggle: noop,
				isConvChildren: false,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule,
				folderId: FOLDERS.INBOX
			};

			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conversation.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conversation.id]: conversation
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			setupTest(<ConversationListItem {...props} />, { store });
			const senderLabel = screen.queryByTestId('participants-name-label');
			expect(senderLabel).toHaveTextContent('mario');
			expect(senderLabel).toHaveTextContent('luigi');
			expect(senderLabel).toHaveTextContent('bowser');
		});

		test('(case #9) if the conversation contains more than 1 message then a chevron must be visible', async () => {
			const folderId = FOLDERS.INBOX;
			const conversation = generateConversation({
				folderId,
				isSingleMessageConversation: false,
				messageGenerationCount: 2
			});

			const props: ConversationListItemProps = {
				item: conversation,
				selected: false,
				selecting: false,
				toggle: noop,
				isConvChildren: false,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule,
				folderId
			};

			const store = generateStore({
				conversations: {
					currentFolder: folderId,
					expandedStatus: {
						[conversation.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conversation.id]: conversation
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			setupTest(<ConversationListItem {...props} />, { store });
			const chevron = await screen.findByTestId(`ToggleExpand`);
			expect(chevron).toBeVisible();
		});

		test('(case #10) if the conversation contains only 1 message then must be not visibile a chevron', async () => {
			const folderId = FOLDERS.INBOX;
			const conversation = generateConversation({ folderId, isSingleMessageConversation: true });

			const props: ConversationListItemProps = {
				item: conversation,
				selected: false,
				selecting: false,
				toggle: noop,
				isConvChildren: false,
				activeItemId: '',
				deselectAll: noop,
				isSearchModule,
				folderId
			};

			const store = generateStore({
				conversations: {
					currentFolder: folderId,
					expandedStatus: {
						[conversation.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conversation.id]: conversation
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			setupTest(<ConversationListItem {...props} />, { store });
			expect(screen.queryByTestId('ToggleExpand')).not.toBeInTheDocument();
		});
	});

	test('(case #11) when right-click the message the secondary actions contextual menu must be visible', async () => {
		const folderId = FOLDERS.INBOX;
		const conversation = generateConversation({ folderId });
		const conversationId = conversation.id;

		const props: ConversationListItemProps = {
			item: conversation,
			selected: false,
			selecting: false,
			toggle: noop,
			isConvChildren: false,
			activeItemId: '',
			deselectAll: noop,
			isSearchModule,
			folderId
		};

		const store = generateStore({
			conversations: {
				currentFolder: folderId,
				expandedStatus: {
					[conversation.id]: API_REQUEST_STATUS.fulfilled
				},
				searchedInFolder: {},
				conversations: {
					[conversation.id]: conversation
				},
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		setupTest(<ConversationListItem {...props} />, { store });
		const aRandomChild = await screen.findByTestId(`hover-container-${conversationId}`);

		// Initally the context menu is not created
		expect(screen.queryByTestId('dropdown-popper-list')).not.toBeInTheDocument();

		// Trigger a right-click
		fireEvent.contextMenu(aRandomChild);

		const menu = await screen.findByTestId('dropdown-popper-list');
		expect(menu).toBeVisible();
	});
});
