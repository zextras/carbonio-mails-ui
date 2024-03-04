/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserAccount } from '@zextras/carbonio-shell-ui';

import { existsActionById } from './actions-tests-utils';
import {
	ConversationActionsDescriptors,
	FOLDERS_DESCRIPTORS,
	MessageActionsDescriptors
} from '../../constants';
import { ASSERTIONS, MSG_CONV_STATUS_DESCRIPTORS } from '../../tests/constants';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateMessage } from '../../tests/generators/generateMessage';
import { getMsgConvActions } from '../get-msg-conv-actions';

describe('Actions visibility', () => {
	describe('Conversation secondary actions', () => {
		/**
		 * 4. secondary actions for a conversation in any folder except trash contain the trash action
		 */
		test.each`
			case | folder                              | assertion              | action
			${4} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${4} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.MOVE_TO_TRASH}
			${5} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS} | ${MessageActionsDescriptors.SHOW_SOURCE}
			${5} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS} | ${MessageActionsDescriptors.SHOW_SOURCE}
			${5} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS} | ${MessageActionsDescriptors.SHOW_SOURCE}
			${5} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS} | ${MessageActionsDescriptors.SHOW_SOURCE}
			${6} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
			${6} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
			${6} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
			${6} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
			${6} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS} | ${ConversationActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW}
		`(
			`(case #$case) secondary actions for a conversation in $folder.desc folder $assertion.desc the $action.desc action`,
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
				expect(existsActionById({ id: action.id, actions, type: 'secondary' })).toBe(
					assertion.value
				);
			}
		);

		/**
		 * 11. secondary actions for a single message conversation in any folder except trash contain the reply action
		 */
		test.each`
			case  | folder                              | assertion                  | action
			${11} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
			${11} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
			${11} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
			${11} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REPLY}
			${11} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.REPLY}
			${11} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.REPLY}
		`(
			`(case #$case) secondary actions for a conversation in $folder.desc folder $assertion.desc the $action.desc action`,
			async ({ folder, assertion, action }) => {
				const createWindow = jest.fn();
				const conv = generateMessage({
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
				expect(existsActionById({ id: action.id, actions, type: 'secondary' })).toBe(
					assertion.value
				);
			}
		);

		/**
		 * 2. secondary actions for an unread conversation in any folder except drafts contain the mark as read action
		 * 3. secondary actions for a read conversation in any folder except draft contain the mark as unread action
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
			`(case #$case) secondary actions for a $read.desc conversation in $folder.desc folder $assertion.desc the $action.desc action`,
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
				expect(existsActionById({ id: action.id, actions, type: 'secondary' })).toBe(
					assertion.value
				);
			}
		);

		/**
		 * 5. secondary actions for a flagged conversation in any folder contain the unflag action
		 * 6. secondary actions for an unflagged conversation in any folder contain the flag action
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
			`(case #$case) secondary actions for a $flagged.desc conversation in $folder.desc folder $assertion.desc the $action.desc action`,
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
				expect(existsActionById({ id: action.id, actions, type: 'secondary' })).toBe(
					assertion.value
				);
			}
		);
	});
	test.each`
		case | folder                              | assertion                  | action
		${7} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${7} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${7} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${7} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${7} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DOWNLOAD_EML}
		${7} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.DOWNLOAD_EML}
	`(
		`(case #$case) secondary actions for a conversation in $folder.desc folder $assertion.desc the $action.desc action`,
		async ({ folder, assertion, action }) => {
			const createWindow = jest.fn();
			const conv = generateConversation({
				folderId: folder.id,
				messageGenerationCount: 5
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
			expect(existsActionById({ id: action.id, actions, type: 'secondary' })).toBe(assertion.value);
		}
	);
});
