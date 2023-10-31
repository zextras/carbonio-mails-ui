/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserAccount } from '@zextras/carbonio-shell-ui';

import { existsActionById } from './actions-tests-utils';
import { TagsActionsType } from '../../carbonio-ui-commons/constants';
import { tags } from '../../carbonio-ui-commons/test/mocks/tags/tags';
import { MessageActionsDescriptors } from '../../constants';
import {
	CONTAIN_ASSERTION as ASSERTION,
	FOLDERS_DESCRIPTORS as FOLDERS,
	MSG_CONV_STATUS_DESCRIPTORS as MESSAGES_STATUS
} from '../../tests/constants';
import { generateMessage } from '../../tests/generators/generateMessage';
import { getMsgConvActions } from '../get-msg-conv-actions';

describe('Secondary actions visibility', () => {
	/**
	 * 1.  secondary actions for a message in any folder except drafts and junk contain the reply action
	 * 2.  secondary actions for a message in any folder except drafts and junk contain the reply all action
	 * 3.  secondary actions for a message in any folder except drafts and junk contain the forward action
	 * 6.  secondary actions for a message in any folder except trash and junk contain the trash action
	 * 7.  secondary actions for a message in the trash or junk folder contain the delete permanently action
	 * 10. secondary actions for a message in any folder except junk contain the mark as spam action
	 * 11. secondary actions for a message in the junk folder contain the not spam action
	 * 12. secondary actions for a message in the drafts folder contain the edit action
	 * 13. secondary actions for a message in the drafts folder contain the send action
	 * 14. secondary actions for a message in the trash folder contain the restore action
	 * 15. secondary actions for a message in any folder except drafts and trash contain the print action
	 * 16. secondary actions for a message in any folder except drafts and trash contain the show original action
	 * 17. secondary actions for a message in the daft folder contain the edit draft action
	 * 18. secondary actions for a message in the daft folder contain the send draft action
	 * 19. secondary actions for a message in any folder except drafts and trash contains the redirect action
	 * 20. secondary actions for a message in any folder except the trash contain the move action
	 */
	test.each`
		case  | folder                  | assertion                | action
		${1}  | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
		${2}  | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY_ALL}
		${3}  | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FORWARD}
		${6}  | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${7}  | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${10} | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${11} | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${12} | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${13} | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${14} | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.RESTORE}
		${15} | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.PRINT}
		${15} | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.PRINT}
		${15} | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.PRINT}
		${15} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.PRINT}
		${15} | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.PRINT}
		${15} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.PRINT}
		${16} | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.SHOW_SOURCE}
		${16} | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.SHOW_SOURCE}
		${16} | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SHOW_SOURCE}
		${16} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SHOW_SOURCE}
		${16} | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.SHOW_SOURCE}
		${16} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.SHOW_SOURCE}
		${17} | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${17} | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${17} | ${FOLDERS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.EDIT_DRAFT}
		${17} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${17} | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${17} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${18} | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${18} | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${18} | ${FOLDERS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.SEND}
		${18} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${18} | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${18} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.SEND}
		${19} | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REDIRECT}
		${19} | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REDIRECT}
		${19} | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REDIRECT}
		${19} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REDIRECT}
		${19} | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REDIRECT}
		${19} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REDIRECT}
		${20} | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE}
		${20} | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE}
		${20} | ${FOLDERS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE}
		${20} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MOVE}
		${20} | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE}
		${20} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MOVE}
		${21} | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		${21} | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		${21} | ${FOLDERS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		${21} | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		${21} | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		${21} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
	`(
		`(case #$case) secondary actions for a message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, assertion, action }) => {
			const createWindow = jest.fn();
			const msg = generateMessage({ folderId: folder.id });
			const dispatch = jest.fn();
			const deselectAll = jest.fn();
			const account = getUserAccount();
			const secondaryActions = getMsgConvActions({
				item: msg,
				dispatch,
				deselectAll,
				tags,
				createWindow,
				messageActions: []
			});
			expect(
				existsActionById({ id: action.id, actions: secondaryActions, type: 'secondary' })
			).toBe(assertion.value);
		}
	);

	/**
	 * 4. secondary actions for an unread message in any folder except draft contain the mark as read action
	 * 5. secondary actions for a read message in any folder except draft contain the mark as unread action
	 */
	test.each`
		case | read                        | folder                  | assertion                | action
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
	`(
		`(case #$case) secondary actions for a $read.desc message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, read, assertion, action }) => {
			const createWindow = jest.fn();
			const msg = generateMessage({ folderId: folder.id, isRead: read.value });
			const dispatch = jest.fn();
			const deselectAll = jest.fn();
			const account = getUserAccount();
			const secondaryActions = getMsgConvActions({
				item: msg,
				dispatch,
				deselectAll,
				tags: {},
				createWindow,
				messageActions: []
			});
			expect(
				existsActionById({ id: action.id, actions: secondaryActions, type: 'secondary' })
			).toBe(assertion.value);
		}
	);

	/**
	 * 8. secondary actions for a flagged message in any folder contain the unflag action
	 * 9. secondary actions for an unflagged message in any folder contain the flag action
	 */
	test.each`
		case | flagged                        | folder                  | assertion                | action
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.UNFLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.SPAM}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.FLAG}
	`(
		`(case #$case) secondary actions for a $flagged.desc message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, flagged, assertion, action }) => {
			const createWindow = jest.fn();
			const msg = generateMessage({ folderId: folder.id, isFlagged: flagged.value });
			const dispatch = jest.fn();
			const deselectAll = jest.fn();
			const account = getUserAccount();
			const secondaryActions = getMsgConvActions({
				item: msg,
				dispatch,
				deselectAll,
				tags: {},
				createWindow,
				messageActions: []
			});
			expect(
				existsActionById({ id: action.id, actions: secondaryActions, type: 'secondary' })
			).toBe(assertion.value);
		}
	);

	/**
	 * 21. secondary actions for a message in any folder except spam contains the tag action
	 */
	test.each`
		case  | folder                  | assertion                | action
		${21} | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${TagsActionsType.Apply}
		${21} | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${TagsActionsType.Apply}
		${21} | ${FOLDERS.DRAFTS}       | ${ASSERTION.CONTAIN}     | ${TagsActionsType.Apply}
		${21} | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${TagsActionsType.Apply}
		${21} | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${TagsActionsType.Apply}
		${21} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${TagsActionsType.Apply}
	`(
		`(case #$case) secondary actions for a message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, assertion, action }) => {
			const createWindow = jest.fn();
			const msg = generateMessage({ folderId: folder.id });
			const dispatch = jest.fn();
			const deselectAll = jest.fn();
			const account = getUserAccount();
			const secondaryActions = getMsgConvActions({
				item: msg,
				dispatch,
				deselectAll,
				tags,
				createWindow,
				messageActions: []
			});
			expect(existsActionById({ id: action, actions: secondaryActions, type: 'secondary' })).toBe(
				assertion.value
			);
		}
	);
});
