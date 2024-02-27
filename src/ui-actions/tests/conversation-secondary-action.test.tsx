/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsActionById } from './actions-tests-utils';
import { setupHook } from '../../carbonio-ui-commons/test/test-setup';
import {
	ASSERTION,
	ConversationActionsDescriptors,
	FOLDERIDS,
	MSG_CONV_STATUS,
	MessageActionsDescriptors
} from '../../constants';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import { useMsgConvActions } from '../use-msg-conv-actions';

describe('Actions visibility', () => {
	describe('Conversation secondary actions', () => {
		/**
		 * 4. secondary actions for a conversation in any folder except trash contain the trash action
		 */
		test.each`
			case | folder                    | assertion            | action
			${4} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${5} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN} | ${MessageActionsDescriptors.SHOW_SOURCE}
			${5} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN} | ${MessageActionsDescriptors.SHOW_SOURCE}
			${5} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN} | ${MessageActionsDescriptors.SHOW_SOURCE}
			${5} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN} | ${MessageActionsDescriptors.SHOW_SOURCE}
			${6} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
			${6} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
			${6} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
			${6} | ${FOLDERIDS.SPAM}         | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
			${6} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN} | ${ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		`(
			`(case #$case) secondary actions for a conversation in $folder.desc folder $assertion.desc the $action.desc action`,
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
				expect(
					existsActionById({ id: action.id, actions: hookResult.current, type: 'secondary' })
				).toBe(assertion.value);
			}
		);

		/**
		 * 11. secondary actions for a single message conversation in any folder except trash contain the reply action
		 */
		test.each`
			case  | folder                    | assertion                | action
			${11} | ${FOLDERIDS.INBOX}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
			${11} | ${FOLDERIDS.SENT}         | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
			${11} | ${FOLDERIDS.TRASH}        | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
			${11} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REPLY}
			${11} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.REPLY}
			${11} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.CONTAIN}     | ${MessageActionsDescriptors.REPLY}
		`(
			`(case #$case) secondary actions for a conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, assertion, action }) => {
				const conv = generateMessage({
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
				expect(
					existsActionById({ id: action.id, actions: hookResult.current, type: 'secondary' })
				).toBe(assertion.value);
			}
		);

		/**
		 * 2. secondary actions for an unread conversation in any folder except drafts contain the mark as read action
		 * 3. secondary actions for a read conversation in any folder except draft contain the mark as unread action
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
			`(case #$case) secondary actions for a $read.desc conversation in $folder.desc folder $assertion.desc the $action.desc action`,
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
				expect(
					existsActionById({ id: action.id, actions: hookResult.current, type: 'secondary' })
				).toBe(assertion.value);
			}
		);

		/**
		 * 5. secondary actions for a flagged conversation in any folder contain the unflag action
		 * 6. secondary actions for an unflagged conversation in any folder contain the flag action
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
			`(case #$case) secondary actions for a $flagged.desc conversation in $folder.desc folder $assertion.desc the $action.desc action`,
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
				expect(
					existsActionById({ id: action.id, actions: hookResult.current, type: 'secondary' })
				).toBe(assertion.value);
			}
		);
	});
	test.each`
		case | folder                    | assertion                | action
		${7} | ${FOLDERIDS.INBOX}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${7} | ${FOLDERIDS.SENT}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${7} | ${FOLDERIDS.TRASH}        | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${7} | ${FOLDERIDS.DRAFTS}       | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${7} | ${FOLDERIDS.SPAM}         | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${7} | ${FOLDERIDS.USER_DEFINED} | ${ASSERTION.NOT_CONTAIN} | ${MessageActionsDescriptors.DOWNLOAD_EML}
	`(
		`(case #$case) secondary actions for a conversation in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, assertion, action }) => {
			const conv = generateConversation({
				folderId: folder.id,
				messageGenerationCount: 5
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
			expect(
				existsActionById({ id: action.id, actions: hookResult.current, type: 'secondary' })
			).toBe(assertion.value);
		}
	);
});
