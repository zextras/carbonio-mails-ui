/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { EditViewActions, MessageActionsDescriptors } from 'constants/index';
import { composeEmlFilename, MIMETYPE_EML } from 'helpers/attachments';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { isDraft, isSpam } from 'helpers/folders';
import { getMessageById } from 'store/emails/store';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { UnsavedAttachment } from 'types/attachments';
import { IncompleteMessage, MailMessage } from 'types/messages';
import { createEditBoard } from 'views/app/detail-panel/edit/edit-view-board';

/**
 * Builds the attachment that forwards an existing message as .eml.
 *
 * The message is sent by reference (`mid`), so filename and size are only displayed in the
 * composer: they come from the message in the emails store, and fall back to the message id
 * and 0 when the message is not loaded.
 */
export const composeForwardedMessageAttachment = (messageId: string): UnsavedAttachment => {
	const message: IncompleteMessage | MailMessage | undefined = getMessageById(messageId);
	return {
		mid: messageId,
		filename: composeEmlFilename(message?.subject, messageId),
		contentType: MIMETYPE_EML,
		size: message?.size ?? 0,
		isInline: false
	};
};

export const useMsgForwardAsAttachmentFn = (
	messageIds: Array<string>,
	folderId: string
): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isSpam(folderId) && !isFocusModeMailView(),
		[folderId]
	);

	const execute = useCallback(() => {
		if (canExecute()) {
			const attachments = messageIds.map((messageId) =>
				composeForwardedMessageAttachment(messageId)
			);
			createEditBoard({
				action: EditViewActions.FORWARD_AS_ATTACHMENT,
				actionTargetId: messageIds[0],
				compositionData: {
					attachments
				}
			});
		}
	}, [canExecute, messageIds]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgForwardAsAttachmentDescriptor = (
	messageIds: Array<string>,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useMsgForwardAsAttachmentFn(messageIds, folderId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.FORWARD_AS_ATTACHMENT.id,
		icon: 'Attach',
		label: t('action.forward_as_attachment', 'Forward as attachment'),
		execute,
		canExecute
	};
};
