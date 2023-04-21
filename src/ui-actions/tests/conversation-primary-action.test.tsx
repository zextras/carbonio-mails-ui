/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserAccount } from '@zextras/carbonio-shell-ui';
import {
	ASSERTION,
	ConversationActionsDescriptors,
	FOLDERIDS,
	MSG_CONV_STATUS
} from '../../constants';
import { getMsgConvActions } from '../get-msg-conv-actions';
import { existsActionById } from './actions-tests-utils';
import { generateConversation } from '../../tests/generators/generateConversation';

describe('Actions visibility', () => {
	describe('Conversation primary actions', () => {
		/**
		 * 4. primary actions for a conversation in any folder except trash contain the trash action
		 */
		test.each`
			case | folder                    | assertion            | action
			${4} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
		`(
			`(case #$case) primary actions for a conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, assertion, action }) => {
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
					account,
					tags: {}
				});
				expect(existsActionById({ id: action.id, actions })).toBe(assertion.value);
			}
		);

		/**
		 * 2. primary actions for an unread conversation in any folder except drafts contain the mark as read action
		 * 3. primary actions for a read conversation in any folder except draft contain the mark as unread action
		 */
		test.each`
			case | read                        | folder                    | assertion                | action
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.MARK_AS_READ}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${2} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.MARK_AS_UNREAD}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_READ}
			${3} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.MARK_AS_READ}
		`(
			`(case #$case) primary actions for a $read.desc conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, read, assertion, action }) => {
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
					account,
					tags: {}
				});
				expect(existsActionById({ id: action.id, actions })).toBe(assertion.value);
			}
		);

		/**
		 * 5. primary actions for a flagged conversation in any folder contain the unflag action
		 * 6. primary actions for an unflagged conversation in any folder contain the flag action
		 */
		test.each`
			case | flagged                        | folder                    | assertion                | action
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.UNFLAG}
			${5} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.UNFLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.FLAG}
			${6} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${ConversationActionsDescriptors.FLAG}
		`(
			`(case #$case) primary actions for a $flagged.desc conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, flagged, assertion, action }) => {
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
					account,
					tags: {}
				});
				expect(existsActionById({ id: action.id, actions })).toBe(assertion.value);
			}
		);
	});
});
