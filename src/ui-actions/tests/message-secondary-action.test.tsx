/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsActionById } from './actions-tests-utils';
import { TagsActionsType } from '../../carbonio-ui-commons/constants';
import { useIntegratedFunction } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupHook } from '../../carbonio-ui-commons/test/test-setup';
import { MessageActionsDescriptors } from '../../constants';
import {
	CONTAIN_ASSERTION as ASSERTION,
	FOLDERS_DESCRIPTORS as FOLDERS,
	MSG_CONV_STATUS_DESCRIPTORS as MESSAGES_STATUS
} from '../../tests/constants';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import { useMsgConvActions } from '../use-msg-conv-actions';

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
		case  | folder                  | assertion                  | action
		${1}  | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REPLY}
		${1}  | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
		${2}  | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REPLY_ALL}
		${2}  | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY_ALL}
		${3}  | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FORWARD}
		${3}  | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FORWARD}
		${6}  | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${6}  | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE_TO_TRASH}
		${7}  | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${7}  | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
		${10} | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${10} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_SPAM}
		${11} | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${11} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_NOT_SPAM}
		${12} | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${12} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${13} | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${13} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${14} | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
		${14} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.RESTORE}
		${15} | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.PRINT}
		${15} | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.PRINT}
		${15} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.PRINT}
		${15} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.PRINT}
		${15} | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.PRINT}
		${15} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.PRINT}
		${16} | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.SHOW_SOURCE}
		${16} | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.SHOW_SOURCE}
		${16} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SHOW_SOURCE}
		${16} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SHOW_SOURCE}
		${16} | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.SHOW_SOURCE}
		${16} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.SHOW_SOURCE}
		${17} | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${17} | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${17} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.EDIT_DRAFT}
		${17} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${17} | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${17} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.EDIT_DRAFT}
		${18} | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${18} | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${18} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.SEND}
		${18} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${18} | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${18} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.SEND}
		${19} | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REDIRECT}
		${19} | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REDIRECT}
		${19} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REDIRECT}
		${19} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REDIRECT}
		${19} | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REDIRECT}
		${19} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REDIRECT}
		${20} | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE}
		${20} | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE}
		${20} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE}
		${20} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MOVE}
		${20} | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE}
		${20} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MOVE}
		${21} | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		${21} | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		${21} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		${21} | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		${21} | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		${21} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
	`(
		`(case #$case) secondary actions for a message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, assertion, action }) => {
			const msg = generateMessage({ folderId: folder.id });
			const deselectAll = jest.fn();
			const { result: hookResult } = setupHook(useMsgConvActions, {
				store: generateStore(),
				initialProps: [
					{
						item: msg,
						deselectAll,
						messageActionsForExtraWindow: []
					}
				]
			});
			expect(
				existsActionById({ id: action.id, actions: hookResult.current, type: 'secondary' })
			).toBe(assertion.value);
		}
	);

	/**
	 * 4. secondary actions for an unread message in any folder except draft contain the mark as read action
	 * 5. secondary actions for a read message in any folder except draft contain the mark as unread action
	 */
	test.each`
		case | read                        | folder                  | assertion                  | action
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MESSAGES_STATUS.NOT_READ} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${5} | ${MESSAGES_STATUS.READ}     | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
	`(
		`(case #$case) secondary actions for a $read.desc message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, read, assertion, action }) => {
			const msg = generateMessage({ folderId: folder.id, isRead: read.value });
			const deselectAll = jest.fn();
			const { result: hookResult } = setupHook(useMsgConvActions, {
				store: generateStore(),
				initialProps: [
					{
						item: msg,
						deselectAll,
						messageActionsForExtraWindow: []
					}
				]
			});
			expect(
				existsActionById({ id: action.id, actions: hookResult.current, type: 'secondary' })
			).toBe(assertion.value);
		}
	);

	/**
	 * 8. secondary actions for a flagged message in any folder contain the unflag action
	 * 9. secondary actions for an unflagged message in any folder contain the flag action
	 */
	test.each`
		case | flagged                        | folder                  | assertion                  | action
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${8} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.UNFLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.NOT_FLAGGED} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
		${9} | ${MESSAGES_STATUS.FLAGGED}     | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.FLAG}
	`(
		`(case #$case) secondary actions for a $flagged.desc message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, flagged, assertion, action }) => {
			const msg = generateMessage({ folderId: folder.id, isFlagged: flagged.value });
			const deselectAll = jest.fn();
			const { result: hookResult } = setupHook(useMsgConvActions, {
				store: generateStore(),
				initialProps: [
					{
						item: msg,
						deselectAll,
						messageActionsForExtraWindow: []
					}
				]
			});
			expect(
				existsActionById({ id: action.id, actions: hookResult.current, type: 'secondary' })
			).toBe(assertion.value);
		}
	);
	/**
	 * 21. secondary actions for a message in any folder except spam contains the tag action
	 */
	test.each`
		case  | folder                  | assertion                  | action
		${21} | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${TagsActionsType.Apply}
		${21} | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${TagsActionsType.Apply}
		${21} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.CONTAINS}     | ${TagsActionsType.Apply}
		${21} | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${TagsActionsType.Apply}
		${21} | ${FOLDERS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${TagsActionsType.Apply}
		${21} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${TagsActionsType.Apply}
	`(
		`(case #$case) secondary actions for a message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, assertion, action }) => {
			const msg = generateMessage({ folderId: folder.id });
			const deselectAll = jest.fn();
			const { result: hookResult } = setupHook(useMsgConvActions, {
				store: generateStore(),
				initialProps: [
					{
						item: msg,
						deselectAll,
						messageActionsForExtraWindow: []
					}
				]
			});
			expect(existsActionById({ id: action, actions: hookResult.current, type: 'secondary' })).toBe(
				assertion.value
			);
		}
	);

	/**
	 * 22. secondary actions for a message in any folder except spam contains the download EML action
	 */
	test.each`
		case  | folder                  | assertion                  | action
		${22} | ${FOLDERS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${22} | ${FOLDERS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${22} | ${FOLDERS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${22} | ${FOLDERS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${22} | ${FOLDERS.SPAM}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${22} | ${FOLDERS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.DOWNLOAD_EML}
	`(
		`(case #$case) secondary actions for a message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, assertion, action }) => {
			const msg = generateMessage({ folderId: folder.id });
			const deselectAll = jest.fn();
			const { result: hookResult } = setupHook(useMsgConvActions, {
				store: generateStore(),
				initialProps: [
					{
						item: msg,
						deselectAll,
						messageActionsForExtraWindow: []
					}
				]
			});
			expect(
				existsActionById({
					id: action.id,
					actions: hookResult.current,
					type: 'secondary'
				})
			).toBe(assertion.value);
		}
	);

	/**
	 * 23. secondary actions for a message in any folder except draft and spam contains the Create Appointment action
	 */
	test.each`
		case  | folder                  | assertion                | action
		${22} | ${FOLDERS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.CREATE_APPOINTMENT}
		${22} | ${FOLDERS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.CREATE_APPOINTMENT}
		${22} | ${FOLDERS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.CREATE_APPOINTMENT}
		${22} | ${FOLDERS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.CREATE_APPOINTMENT}
		${22} | ${FOLDERS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.CREATE_APPOINTMENT}
		${22} | ${FOLDERS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.CREATE_APPOINTMENT}
	`(
		`(case #$case) secondary actions for a message in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, assertion, action }) => {
			useIntegratedFunction.mockImplementation(() => [jest.fn(), true]);
			const msg = generateMessage({ folderId: folder.id });
			const deselectAll = jest.fn();
			const { result: hookResult } = setupHook(useMsgConvActions, {
				store: generateStore(),
				initialProps: [
					{
						item: msg,
						deselectAll,
						messageActionsForExtraWindow: []
					}
				]
			});
			expect(
				existsActionById({
					id: action.id,
					actions: hookResult.current,
					type: 'secondary'
				})
			).toBe(assertion.value);
		}
	);
});
