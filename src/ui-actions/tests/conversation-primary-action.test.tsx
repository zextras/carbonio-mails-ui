/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserAccount } from '@zextras/carbonio-shell-ui';

import { existsActionById } from './actions-tests-utils';
import {
	ASSERTION,
	ConversationActionsDescriptors,
	FOLDERIDS,
	MSG_CONV_STATUS
} from '../../constants';
import { generateConversation } from '../../tests/generators/generateConversation';
import { getMsgConvActions } from '../get-msg-conv-actions';

describe('Actions visibility', () => {
	describe('Conversation primary actions', () => {
		/**
		 * 4. primary actions for a conversation in any folder except trash contain the trash action
		 */
		test.each`
			case | folder                    | assertion             | action
			${4} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
		`(
			`(case #$case) primary actions for a conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, assertion, action }) => {
				const createWindow = jest.fn();
				const conv = generateConversation({
					isSingleMessageConversation: false,
					folderId: folder.id
				});
				const dispatch = jest.fn();
				const deselectAll = jest.fn();
				const account = getUserAccount();

				const actions = getMsgConvActions({
					item: conv,
					dispatch,
					deselectAll,
					tags: {},
					createWindow,
					messageActionsForExtraWindow: []
				});
				expect(existsActionById({ id: action.id, actions })).toBe(assertion.value);
			}
		);

		/**
		 * 2. primary actions for an unread conversation in any folder except drafts contain the mark as read action
		 * 3. primary actions for a read conversation in any folder except draft contain the mark as unread action
		 */
		test.each`
			case | read                        | folder                    | assertion                 | action
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.MARK_AS_READ}
		`(
			`(case #$case) primary actions for a $read.desc conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, read, assertion, action }) => {
				const createWindow = jest.fn();
				const conv = generateConversation({
					isSingleMessageConversation: false,
					folderId: folder.id,
					isRead: read.value
				});
				const dispatch = jest.fn();
				const deselectAll = jest.fn();
				const account = getUserAccount();
				const actions = getMsgConvActions({
					item: conv,
					dispatch,
					deselectAll,
					tags: {},
					createWindow,
					messageActionsForExtraWindow: []
				});
				expect(existsActionById({ id: action.id, actions })).toBe(assertion.value);
			}
		);

		/**
		 * 5. primary actions for a flagged conversation in any folder contain the unflag action
		 * 6. primary actions for an unflagged conversation in any folder contain the flag action
		 */
		test.each`
			case | flagged                        | folder                    | assertion                 | action
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.UNFLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.FLAG}
		`(
			`(case #$case) primary actions for a $flagged.desc conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, flagged, assertion, action }) => {
				const createWindow = jest.fn();
				const conv = generateConversation({
					isSingleMessageConversation: false,
					folderId: folder.id,
					isFlagged: flagged.value
				});
				const dispatch = jest.fn();
				const deselectAll = jest.fn();
				const account = getUserAccount();
				const actions = getMsgConvActions({
					item: conv,
					dispatch,
					deselectAll,
					tags: {},
					createWindow,
					messageActionsForExtraWindow: []
				});
				expect(existsActionById({ id: action.id, actions })).toBe(assertion.value);
			}
		);

		test.each`
			contains_draft                        | folder                    | assertion                 | action
			${MSG_CONV_STATUS.CONTAINS_DRAFT}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.EDIT_DRAFT}
			${MSG_CONV_STATUS.CONTAINS_DRAFT}     | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.EDIT_DRAFT}
			${MSG_CONV_STATUS.CONTAINS_DRAFT}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.EDIT_DRAFT}
			${MSG_CONV_STATUS.CONTAINS_DRAFT}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.EDIT_DRAFT}
			${MSG_CONV_STATUS.CONTAINS_DRAFT}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.EDIT_DRAFT}
			${MSG_CONV_STATUS.NOT_CONTAINS_DRAFT} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.EDIT_DRAFT}
			${MSG_CONV_STATUS.NOT_CONTAINS_DRAFT} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.EDIT_DRAFT}
			${MSG_CONV_STATUS.NOT_CONTAINS_DRAFT} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.EDIT_DRAFT}
			${MSG_CONV_STATUS.NOT_CONTAINS_DRAFT} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.EDIT_DRAFT}
			${MSG_CONV_STATUS.NOT_CONTAINS_DRAFT} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.EDIT_DRAFT}
		`(
			`primary actions for a conversation that $contains_draft.desc in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ contains_draft: containsDraft, folder, assertion, action }) => {
				const createWindow = jest.fn();
				const conv = generateConversation({
					isSingleMessageConversation: false,
					folderId: folder.id,
					draftsGenerationCount: containsDraft ? 1 : 0
				});
				const dispatch = jest.fn();
				const deselectAll = jest.fn();
				const actions = getMsgConvActions({
					item: conv,
					dispatch,
					deselectAll,
					tags: {},
					createWindow,
					messageActionsForExtraWindow: []
				});
				expect(existsActionById({ id: action.id, actions })).toBe(assertion.value);
			}
		);

		test.each`
			folder                    | assertion                 | action
			${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.REPLY}
			${FOLDERIDS.SENT}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.REPLY}
			${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.REPLY}
			${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.REPLY}
			${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.REPLY}
			${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.REPLY_ALL}
			${FOLDERIDS.SENT}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.REPLY_ALL}
			${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.REPLY_ALL}
			${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.REPLY_ALL}
			${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.REPLY_ALL}
			${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.FORWARD}
			${FOLDERIDS.SENT}         | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.FORWARD}
			${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.FORWARD}
			${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAINS} | ${ConversationActionsDescriptors.FORWARD}
			${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAINS}     | ${ConversationActionsDescriptors.FORWARD}
		`(
			`primary actions for a conversation that $contains_draft.desc in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, assertion, action }) => {
				const createWindow = jest.fn();
				const conv = generateConversation({
					isSingleMessageConversation: false,
					folderId: folder.id,
					messagesGenerationCount: 4
				});
				const dispatch = jest.fn();
				const deselectAll = jest.fn();
				const actions = getMsgConvActions({
					item: conv,
					dispatch,
					deselectAll,
					tags: {},
					createWindow,
					messageActionsForExtraWindow: []
				});
				expect(existsActionById({ id: action.id, actions })).toBe(assertion.value);
			}
		);
	});
});
