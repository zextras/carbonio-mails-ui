/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors, EditViewActions } from 'constants/index';
import { MIMETYPE_EML } from 'helpers/attachments';
import { useMsgForwardAsAttachmentFn } from 'hooks/actions/use-msg-forward-as-attachment';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { UnsavedAttachment } from 'types/attachments';
import { createEditBoard } from 'views/app/detail-panel/edit/edit-view-board';

type ConvForwardAsAttachmentAction = {
	firstMessageId: string;
	folderId: string;
	messagesLength: number;
};

export const useConvForwardAsAttachmentFn = ({
	firstMessageId,
	folderId,
	messagesLength
}: ConvForwardAsAttachmentAction): ActionFn => {
	const messageAction = useMsgForwardAsAttachmentFn([firstMessageId], folderId);
	const canExecute = useCallback(
		(): boolean => messagesLength === 1 && messageAction.canExecute(),
		[messageAction, messagesLength]
	);

	const execute = useCallback(() => {
		const attachments: Array<UnsavedAttachment> = [
			{
				mid: firstMessageId,
				filename: `${firstMessageId}.eml`,
				contentType: MIMETYPE_EML,
				size: 0,
				isInline: false
			}
		];
		if (canExecute()) {
			createEditBoard({
				action: EditViewActions.FORWARD_AS_ATTACHMENT,
				actionTargetId: firstMessageId,
				compositionData: {
					attachments
				}
			});
		}
	}, [canExecute, firstMessageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvForwardAsAttachmentDescriptor = ({
	firstMessageId,
	folderId,
	messagesLength
}: ConvForwardAsAttachmentAction): UIActionDescriptor => {
	const { canExecute, execute } = useConvForwardAsAttachmentFn({
		firstMessageId,
		folderId,
		messagesLength
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.FORWARD_AS_ATTACHMENT.id,
		icon: 'Attach',
		label: t('action.forward_as_attachment', 'Forward as attachment'),
		execute,
		canExecute
	};
};
