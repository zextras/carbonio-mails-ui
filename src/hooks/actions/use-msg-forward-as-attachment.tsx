/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { EditViewActions, MessageActionsDescriptors } from 'constants/index';
import { MIMETYPE_EML } from 'helpers/attachments';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { isDraft, isSpam } from 'helpers/folders';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { UnsavedAttachment } from 'types/attachments';
import { createEditBoard } from 'views/app/detail-panel/edit/edit-view-board';

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
			const attachments: Array<UnsavedAttachment> = messageIds.map((messageId) => ({
				mid: messageId,
				filename: `${messageId}.eml`,
				contentType: MIMETYPE_EML,
				size: 0,
				isInline: false
			}));
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
