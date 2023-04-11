/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserAccount } from '@zextras/carbonio-shell-ui';
import { ASSERTION, FOLDERIDS, MSG_CONV_STATUS, MessageActionsDescriptors } from '../../constants';
import { generateMessage } from '../../tests/generators/generateMessage';
import { getMsgConvActions } from '../get-msg-conv-actions';
import { existsActionById } from './actions-tests-utils';

describe('Primary actions visibility', () => {
	/**
	 * 1.  primary actions for a message in any folder except drafts and junk contain the reply action
	 * 2.  primary actions for a message in any folder except drafts and junk contain the reply all action
	 * 3.  primary actions for a message in any folder except drafts and junk contain the forward action
	 * 6.  primary actions for a message in any folder except trash and junk contain the trash action
	 * 7.  primary actions for a message in the trash or junk folder contain the delete permanently action
	 * 10. primary actions for a message in any folder except junk contain the mark as spam action
	 * 11. primary actions for a message in the junk folder contain the not spam action
	 * 12. primary actions for a message in the drafts folder contain the edit action
	 * 13. primary actions for a message in the drafts folder contain the send action
	 * 14. primary actions for a message in the trash folder contain the restore action
	 */
	test.each`
		case  | folder                    | assertion                | action
		${1}  | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
		${2}  | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY_ALL}
		${3}  | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FORWARD}
		${6}  | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${7}  | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${10} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${11} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${12} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${13} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${14} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
	`(
		`(case #$case) primary actions for a message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, assertion, action }) => {
			const msg = generateMessage({ folderId: folder.id });
			const dispatch = jest.fn();
			const deselectAll = jest.fn();
			const account = getUserAccount();
			const actionsFactory = getMsgConvActions({
				item: msg,
				dispatch,
				deselectAll,
				account,
				tags: {}
			});
			const primaryActions = actionsFactory();
			expect(existsActionById({ id: action.id, actions: primaryActions })).toBe(assertion.value);
		}
	);

	/**
	 * 4. primary actions for an unread message in any folder except draft contain the mark as read action
	 * 5. primary actions for a read message in any folder except draft contain the mark as unread action
	 */
	test.each`
		case | read                        | folder                    | assertion                | action
		${4} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS.NOT_READ} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS.READ}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
	`(
		`(case #$case) primary actions for a $read.desc message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, read, assertion, action }) => {
			const msg = generateMessage({ folderId: folder.id, isRead: read.value });
			const dispatch = jest.fn();
			const deselectAll = jest.fn();
			const account = getUserAccount();
			const actionsFactory = getMsgConvActions({
				item: msg,
				dispatch,
				deselectAll,
				account,
				tags: {}
			});
			const primaryActions = actionsFactory();
			expect(existsActionById({ id: action.id, actions: primaryActions })).toBe(assertion.value);
		}
	);

	/**
	 * 8. primary actions for a flagged message in any folder contain the unflag action
	 * 9. primary actions for an unflagged message in any folder contain the flag action
	 */
	test.each`
		case | flagged                        | folder                    | assertion                | action
		${8} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${9} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.NOT_FLAGGED} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS.FLAGGED}     | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
	`(
		`(case #$case) primary actions for a $flagged.desc message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, flagged, assertion, action }) => {
			const msg = generateMessage({ folderId: folder.id, isFlagged: flagged.value });
			const dispatch = jest.fn();
			const deselectAll = jest.fn();
			const account = getUserAccount();
			const actionsFactory = getMsgConvActions({
				item: msg,
				dispatch,
				deselectAll,
				account,
				tags: {}
			});
			const primaryActions = actionsFactory();
			expect(existsActionById({ id: action.id, actions: primaryActions })).toBe(assertion.value);
		}
	);
});
