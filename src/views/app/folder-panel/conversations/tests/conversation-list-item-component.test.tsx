/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { screen } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { noop, times } from 'lodash';
import React from 'react';
import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { getMocksContext } from '../../../../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS, VISIBILITY_ASSERTION } from '../../../../../tests/constants';
import { generateConversation } from '../../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import type { ConversationListItemProps, MessageListItemProps } from '../../../../../types';
import { MessageListItem } from '../../messages/message-list-item';
import { ConversationListItem } from '../conversation-list-item';

describe('Conversation list item component', () => {
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
				folderId
			};

			const store = generateStore({
				conversations: {
					currentFolder: folderId,
					expandedStatus: {
						[conversation.id]: 'complete'
					},
					searchedInFolder: {},
					conversations: {
						[conversation.id]: conversation
					},
					status: 'complete'
				}
			});

			setupTest(<ConversationListItem {...props} />, { store });
			const badge = await screen.findByTestId(`conversation-messages-count-${conversation.id}`);
			expect(badge).toBeVisible();
			expect(badge).toHaveTextContent(`${messageCount}`);
		});

		test.each`
			case | folder                              | assertion
			${1} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.SENT}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${VISIBILITY_ASSERTION.IS_VISIBLE}
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
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: 'complete'
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						status: 'complete'
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
			${2} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.SENT}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${VISIBILITY_ASSERTION.IS_VISIBLE}
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
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: 'complete'
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						status: 'complete'
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
			${3} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.SENT}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${VISIBILITY_ASSERTION.IS_VISIBLE}
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
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: 'complete'
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						status: 'complete'
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
			${4} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.SENT}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${VISIBILITY_ASSERTION.IS_VISIBLE}
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
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: 'complete'
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						status: 'complete'
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
			${5} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.SENT}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${VISIBILITY_ASSERTION.IS_VISIBLE}
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
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: 'complete'
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						status: 'complete'
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
					folderId: folder.id
				};

				const store = generateStore({
					conversations: {
						currentFolder: folder.id,
						expandedStatus: {
							[conversation.id]: 'complete'
						},
						searchedInFolder: {},
						conversations: {
							[conversation.id]: conversation
						},
						status: 'complete'
					}
				});

				setupTest(<ConversationListItem {...props} />, { store });

				const senderLabel = screen.queryByTestId('participants-name-label');
				expect(senderLabel).toHaveTextContent(labelContent);
			}
		);

		test("() if the conversation contains more than 1 message then all the recipients' names are visible", async () => {
			const folderId = FOLDERS.INBOX;
			const MESSAGES_COUNT = 3;
			const me = getMocksContext().identities.primary.identity.email;
			const participants = ['mario@foo.baz', 'luigi@foo.baz', 'bowser@foo.baz'];
			const messages = times(MESSAGES_COUNT, (i) =>
				generateMessage({
					folderId,
					to: [{ type: ParticipantRole.TO, address: me }],
					from: { type: ParticipantRole.FROM, address: participants[i] }
				})
			);
			const conversation = generateConversation({ folderId, messages });

			const props: ConversationListItemProps = {
				item: conversation,
				selected: false,
				selecting: false,
				toggle: noop,
				isConvChildren: false,
				activeItemId: '',
				deselectAll: noop,
				folderId
			};

			const store = generateStore({
				conversations: {
					currentFolder: folderId,
					expandedStatus: {
						[conversation.id]: 'complete'
					},
					searchedInFolder: {},
					conversations: {
						[conversation.id]: conversation
					},
					status: 'complete'
				}
			});

			setupTest(<ConversationListItem {...props} />, { store });
			const senderLabel = screen.queryByTestId('participants-name-label');
			expect(senderLabel).toHaveTextContent('mario');
			expect(senderLabel).toHaveTextContent('luigi');
			expect(senderLabel).toHaveTextContent('bowser');
		});
	});
});
