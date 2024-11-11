/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { EditViewActions, MessageActionsDescriptors } from '../../constants';
import { MIMETYPE_EML } from '../../helpers/attachments';
import { isDraft, isSpam } from '../../helpers/folders';
import { ActionFn, UIActionDescriptor, UnsavedAttachment } from '../../types';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';

export const useMsgForwardAsAttachmentFn = (messageId: string, folderId: string): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isSpam(folderId),
		[folderId]
	);

	const execute = useCallback(() => {
		if (canExecute()) {
			const attachment: UnsavedAttachment = {
				mid: messageId,
				filename: `${messageId}.eml`,
				contentType: MIMETYPE_EML,
				size: 0,
				isInline: false
			};
			createEditBoard({
				action: EditViewActions.FORWARD_AS_ATTACHMENT,
				actionTargetId: messageId,
				compositionData: {
					attachments: [attachment]
				}
			});
		}
	}, [canExecute, messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgForwardAsAttachmentDescriptor = (
	messageId: string,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useMsgForwardAsAttachmentFn(messageId, folderId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.FORWARD_AS_ATTACHMENT.id,
		icon: 'Attach',
		label: t('action.forward_as_attachment', 'Forward as attachment'),
		execute,
		canExecute
	};
};
