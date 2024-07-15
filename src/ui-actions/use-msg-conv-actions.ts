/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useSnackbar } from '@zextras/carbonio-design-system';
import { useIntegratedFunction, useTags } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';
import { useTranslation } from 'react-i18next';

import {
	getAddRemoveFlagAction,
	getApplyTagAction,
	useDeletePermanentlyAction,
	useCreateAppointmentAction,
	getDownloadEmlAction,
	getEditAsNewAction,
	useEditDraftAction,
	getForwardAction,
	useMarkRemoveSpam,
	useMoveToFolderAction,
	useMoveToTrashAction,
	getPreviewOnSeparatedWindowAction,
	getPrintAction,
	getReadUnreadAction,
	useRedirectAction,
	getReplyAction,
	getReplyAllAction,
	getSendDraftAction,
	getShowOriginalAction
} from './get-msg-conv-actions-functions';
import { FOLDERS } from '../carbonio-ui-commons/constants/folders';
import { isTrash } from '../carbonio-ui-commons/helpers/folders';
import { getFolderIdParts, getParentFolderId, isDraft } from '../helpers/folders';
import { isConversation, isSingleMessageConversation } from '../helpers/messages';
import { useAppDispatch } from '../hooks/redux';
import { addEditor } from '../store/zustand/editor';
import { generateEditor } from '../store/zustand/editor/editor-generators';
import type { ActionReturnType, Conversation, MailMessage, MessageAction } from '../types';
import { useExtraWindowsManager } from '../views/app/extra-windows/extra-window-manager';

type useMsgConvActionsProps = {
	item: MailMessage | Conversation;
	deselectAll: () => void;
	messageActionsForExtraWindow: Array<MessageAction>;
};

export type MsgConvActionsReturnType = [
	Array<Exclude<ActionReturnType, false>>,
	Array<Exclude<ActionReturnType, false>>
];

export function useMsgConvActions({
	item,
	deselectAll,
	messageActionsForExtraWindow
}: useMsgConvActionsProps): MsgConvActionsReturnType {
	const getDeletePermanentlyAction = useDeletePermanentlyAction();
	const getEditDraftAction = useEditDraftAction();
	const getMarkRemoveSpam = useMarkRemoveSpam();
	const getMoveToFolderAction = useMoveToFolderAction();
	const getMoveToTrashAction = useMoveToTrashAction();
	const getRedirectAction = useRedirectAction();
	const getCreateAppointmentAction = useCreateAppointmentAction();

	const isConv = isConversation(item);
	const folderId = getParentFolderId(item);
	const dispatch = useAppDispatch();
	const tags = useTags();
	const createSnackbar = useSnackbar();
	const { t } = useTranslation();
	const { createWindow } = useExtraWindowsManager();
	const [openAppointmentComposer, isAvailable] = useIntegratedFunction('create_appointment');
	if (!folderId) {
		return [[], []];
	}

	const firstConversationMessage = isConv
		? filter(item?.messages, (msg) => {
				const folderIdParts = getFolderIdParts(msg.parent).id ?? '';
				return !isTrash(folderIdParts) && !isDraft(folderIdParts);
			})?.[0] ?? {}
		: item;
	const isSingleMsgConv = isSingleMessageConversation(item);
	const { id } = item;

	/**
	 * Folders where the actions are enabled or disabled
	 */
	const foldersExcludedMarkReadUnread = [FOLDERS.DRAFTS];
	const foldersExcludedTrash = [FOLDERS.TRASH];
	const foldersIncludedDeletePermanently = [FOLDERS.TRASH, FOLDERS.SPAM];
	const foldersExcludedTags = [FOLDERS.SPAM];
	const foldersExcludedMarkUnmarkSpam = [FOLDERS.DRAFTS];
	const folderExcludedPrintMessage = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderExcludedShowOriginal = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderIncludeEditDraft = [FOLDERS.DRAFTS];
	const folderExcludedReply = [FOLDERS.DRAFTS, FOLDERS.SPAM];
	const folderExcludedReplyAll = [FOLDERS.DRAFTS, FOLDERS.SPAM];
	const folderExcludedForward = [FOLDERS.DRAFTS, FOLDERS.SPAM];
	const folderExcludedEditAsNew = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderIncludedSendDraft = [FOLDERS.DRAFTS];
	const folderExcludedRedirect = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderExcludedDownloadEML = [FOLDERS.DRAFTS];
	const folderExcludedCreateAppointment = [FOLDERS.DRAFTS, FOLDERS.SPAM];

	const addRemoveFlagAction = getAddRemoveFlagAction({
		isConversation: isConv,
		id,
		item,
		dispatch
	});

	const msgReadUnreadAction = getReadUnreadAction({
		isConversation: isConv,
		id,
		item,
		dispatch,
		folderId,
		deselectAll,
		foldersExcludedMarkReadUnread
	});

	const moveToTrashAction = getMoveToTrashAction({
		isConversation: isConv,
		id,
		dispatch,
		folderId: firstConversationMessage.parent,
		deselectAll,
		foldersExcludedTrash
	});

	const deletePermanentlyAction = getDeletePermanentlyAction({
		isConversation: isConv,
		id,
		deselectAll,
		dispatch,
		foldersIncludedDeletePermanently,
		folderId: firstConversationMessage.parent
	});

	const moveToFolderAction = getMoveToFolderAction({
		isConversation: isConv,
		id,
		dispatch,
		folderId: firstConversationMessage.parent,
		deselectAll
	});

	const printAction = getPrintAction({
		isConversation: isConv,
		item,
		folderExcludedPrintMessage,
		folderId
	});

	const applyTagAction = getApplyTagAction({
		tags,
		item,
		isConversation: isConv,
		foldersExcludedTags,
		folderId
	});

	const markRemoveSpam = getMarkRemoveSpam({
		isConversation: isConv,
		id,
		folderId,
		dispatch,
		deselectAll,
		foldersExcludedMarkUnmarkSpam
	});

	const showOriginalAction = getShowOriginalAction({
		isConversation: isConv,
		id: firstConversationMessage.id,
		folderExcludedShowOriginal,
		folderId: firstConversationMessage.parent
	});

	const editDraftAction = getEditDraftAction({
		isConversation: isConv,
		id,
		folderId,
		folderIncludeEditDraft
	});

	const replyAction = getReplyAction(
		isConv,
		isSingleMsgConv,
		firstConversationMessage.id,
		folderId,
		id,
		folderExcludedReply
	);

	const replyAllAction = getReplyAllAction({
		isConversation: isConv,
		isSingleMessageConversation: isSingleMsgConv,
		firstConversationMessageId: firstConversationMessage.id,
		folderId,
		id,
		folderExcludedReplyAll
	});

	const forwardAction = getForwardAction({
		isConversation: isConv,
		isSingleMessageConversation: isSingleMsgConv,
		firstConversationMessageId: firstConversationMessage.id,
		folderId,
		id,
		folderExcludedForward
	});

	const editAsNewAction = getEditAsNewAction({
		isConversation: isConv,
		id,
		folderId,
		folderExcludedEditAsNew
	});

	const sendDraftAction = isConversation(item)
		? false
		: getSendDraftAction({
				item,
				dispatch,
				folderIncludedSendDraft,
				folderId,
				generateEditor,
				addEditor,
				createSnackbar,
				t
			});

	const redirectAction = getRedirectAction({
		isConversation: isConv,
		id,
		folderExcludedRedirect,
		folderId
	});

	const previewOnSeparatedWindow = getPreviewOnSeparatedWindowAction({
		isConversation: isConv,
		id,
		folderId,
		subject: item.subject,
		createWindow,
		messageActions: messageActionsForExtraWindow
	});

	const downloadEmlAction = getDownloadEmlAction({
		isConversation: isConv,
		id,
		folderId,
		folderExcludedDownloadEML
	});

	const createAppointmentAction = getCreateAppointmentAction({
		isConversation: isConv,
		item,
		folderId,
		folderExcludedCreateAppointment,
		openAppointmentComposer,
		isAvailable
	});

	/**
	 * Primary actions are the ones that are shown when the user hovers over a message
	 * @returns an array of arrays of actions
	 */
	const primaryActions: Array<Exclude<ActionReturnType, false>> = [
		replyAction,
		replyAllAction,
		forwardAction,
		moveToTrashAction,
		deletePermanentlyAction,
		msgReadUnreadAction,
		addRemoveFlagAction
	].reduce((acc: Array<Exclude<ActionReturnType, false>>, action) => {
		if (action) {
			acc.push(action);
		}
		return acc;
	}, []);

	/**
	 * Secondary actions are the ones that are shown when the user right-clicks on the message
	 * @returns an array of arrays of actions
	 */
	const secondaryActions: Array<Exclude<ActionReturnType, false>> = [
		replyAction,
		replyAllAction,
		forwardAction,
		sendDraftAction,
		moveToTrashAction,
		deletePermanentlyAction,
		msgReadUnreadAction,
		addRemoveFlagAction,
		markRemoveSpam,
		applyTagAction,
		moveToFolderAction,
		createAppointmentAction,
		printAction,
		previewOnSeparatedWindow,
		redirectAction,
		editDraftAction,
		editAsNewAction,
		showOriginalAction,
		downloadEmlAction
	].reduce((acc: Array<Exclude<ActionReturnType, false>>, action) => {
		if (action) {
			acc.push(action);
		}
		return acc;
	}, []);

	return [primaryActions, secondaryActions];
}
