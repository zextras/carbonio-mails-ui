/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserAccount } from '@zextras/carbonio-shell-ui';

import { existsActionById } from './actions-tests-utils';
import { FOLDERS_DESCRIPTORS, MessageActionsDescriptors } from '../../constants';
import { ASSERTIONS, MSG_CONV_STATUS_DESCRIPTORS } from '../../tests/constants';
import { generateMessage } from '../../tests/generators/generateMessage';
import { getMsgConvActions } from '../get-msg-conv-actions';

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
		case  | folder                              | assertion                  | action
		${1}  | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
		${2}  | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY_ALL}
		${3}  | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FORWARD}
		${6}  | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${7}  | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${10} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${11} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${12} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${13} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${14} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
	`(
		`(case #$case) primary actions for a message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, assertion, action }) => {
			const createWindow = jest.fn();
			const msg = generateMessage({ folderId: folder.id });
			const dispatch = jest.fn();
			const deselectAll = jest.fn();
			const account = getUserAccount();
			const primaryActions = getMsgConvActions({
				item: msg,
				dispatch,
				deselectAll,
				tags: {},
				createWindow,
				messageActionsForExtraWindow: []
			});
			expect(existsActionById({ id: action.id, actions: primaryActions })).toBe(assertion.value);
		}
	);

	/**
	 * 4. primary actions for an unread message in any folder except draft contain the mark as read action
	 * 5. primary actions for a read message in any folder except draft contain the mark as unread action
	 */
	test.each`
		case | read                                    | folder                              | assertion                  | action
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
	`(
		`(case #$case) primary actions for a $read.desc message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, read, assertion, action }) => {
			const createWindow = jest.fn();
			const msg = generateMessage({ folderId: folder.id, isRead: read.value });
			const dispatch = jest.fn();
			const deselectAll = jest.fn();
			const account = getUserAccount();
			const primaryActions = getMsgConvActions({
				item: msg,
				dispatch,
				deselectAll,
				tags: {},
				createWindow,
				messageActionsForExtraWindow: []
			});
			expect(existsActionById({ id: action.id, actions: primaryActions })).toBe(assertion.value);
		}
	);

	/**
	 * 8. primary actions for a flagged message in any folder contain the unflag action
	 * 9. primary actions for an unflagged message in any folder contain the flag action
	 */
	test.each`
		case | flagged                                    | folder                              | assertion                  | action
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_FLAGGED} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MSG_CONV_STATUS_DESCRIPTORS.FLAGGED}     | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
	`(
		`(case #$case) primary actions for a $flagged.desc message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, flagged, assertion, action }) => {
			const createWindow = jest.fn();
			const msg = generateMessage({ folderId: folder.id, isFlagged: flagged.value });
			const dispatch = jest.fn();
			const deselectAll = jest.fn();
			const account = getUserAccount();
			const primaryActions = getMsgConvActions({
				item: msg,
				dispatch,
				deselectAll,
				tags: {},
				createWindow,
				messageActionsForExtraWindow: []
			});
			expect(existsActionById({ id: action.id, actions: primaryActions })).toBe(assertion.value);
		}
	);
});
