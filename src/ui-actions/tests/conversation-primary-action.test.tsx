/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsActionById } from './actions-tests-utils';
import { setupHook } from '../../carbonio-ui-commons/test/test-setup';
import { ConversationActionsDescriptors, FOLDERS_DESCRIPTORS } from '../../constants';
import { ASSERTIONS, MSG_CONV_STATUS_DESCRIPTORS } from '../../tests/constants';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateStore } from '../../tests/generators/store';
import { useMsgConvActions } from '../use-msg-conv-actions';

describe('Actions visibility', () => {
	describe('Conversation primary actions', () => {
		/**
		 * 4. primary actions for a conversation in any folder except trash contain the trash action
		 */
		test.each`
			case | folder                              | assertion              | action
			${4} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
		`(
			`(case #$case) primary actions for a conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, assertion, action }) => {
				const conv = generateConversation({
					isSingleMessageConversation: false,
					folderId: folder.id
				});
				const deselectAll = jest.fn();
				const { result: hookResult } = setupHook(useMsgConvActions, {
					store: generateStore(),
					initialProps: [
						{
							item: conv,
							deselectAll,
							messageActionsForExtraWindow: []
						}
					]
				});
				expect(existsActionById({ id: action.id, actions: hookResult.current })).toBe(
					assertion.value
				);
			}
		);

		/**
		 * 2. primary actions for an unread conversation in any folder except drafts contain the mark as read action
		 * 3. primary actions for a read conversation in any folder except draft contain the mark as unread action
		 */
		test.each`
			case | read                                    | folder                              | assertion                  | action
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
		`(
			`(case #$case) primary actions for a $read.desc conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, read, assertion, action }) => {
				const conv = generateConversation({
					isSingleMessageConversation: false,
					folderId: folder.id,
					isRead: read.value
				});
				const deselectAll = jest.fn();
				const { result: hookResult } = setupHook(useMsgConvActions, {
					store: generateStore(),
					initialProps: [
						{
							item: conv,
							deselectAll,
							messageActionsForExtraWindow: []
						}
					]
				});
				expect(existsActionById({ id: action.id, actions: hookResult.current })).toBe(
					assertion.value
				);
			}
		);

		/**
		 * 5. primary actions for a flagged conversation in any folder contain the unflag action
		 * 6. primary actions for an unflagged conversation in any folder contain the flag action
		 */
		test.each`
			case | flagged                                    | folder                              | assertion                  | action
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
		`(
			`(case #$case) primary actions for a $flagged.desc conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, flagged, assertion, action }) => {
				const conv = generateConversation({
					isSingleMessageConversation: false,
					folderId: folder.id,
					isFlagged: flagged.value
				});
				const deselectAll = jest.fn();
				const { result: hookResult } = setupHook(useMsgConvActions, {
					store: generateStore(),
					initialProps: [
						{
							item: conv,
							deselectAll,
							messageActionsForExtraWindow: []
						}
					]
				});
				expect(existsActionById({ id: action.id, actions: hookResult.current })).toBe(
					assertion.value
				);
			}
		);
	});
});
