/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { EditViewActions, MessageActionsDescriptors } from '../../constants';
import { isDraft, isSpam } from '../../helpers/folders';
import { uploadAttachment } from '../../store/actions/upload-attachments';
import { ActionFn, UIActionDescriptor, UnsavedAttachment } from '../../types';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';
import { getLocationOrigin } from '../../views/app/detail-panel/preview/utils';

function downloadEml(messageId: string): Promise<string> {
	return fetch(`${getLocationOrigin()}/service/home/~/?auth=co&id=${messageId}`).then((response) =>
		response.text()
	);
}

function uploadEmlAsAttachment(eml: string, filename: string): Promise<UnsavedAttachment> {
	return new Promise((resolve, reject) => {
		const blob = new Blob([eml], { type: 'text/plain' });
		const file = new File([blob], filename, { type: 'message/rfc822' });
		uploadAttachment(file, {
			onUploadComplete: (file: File, uploadId: string, attachmentId: string) => {
				const attachment = {
					aid: attachmentId,
					filename,
					contentType: 'message/rfc822',
					size: file.size,
					isInline: false
				};
				resolve(attachment);
			},
			onUploadError: (file: File, uploadId: string, error: string) => {
				console.error(`Error uploading EML as attachment: ${error}`);
				reject(error);
			}
		});
	});
}

export const useMsgForwardAsAttachmentFn = (messageId: string, folderId: string): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isSpam(folderId),
		[folderId]
	);

	const execute = useCallback(() => {
		if (canExecute()) {
			downloadEml(messageId).then((eml) => {
				uploadEmlAsAttachment(eml, 'message.eml')
					.then((attachment) => {
						createEditBoard({
							action: EditViewActions.FORWARD_AS_ATTACHMENT,
							actionTargetId: messageId,
							compositionData: {
								attachments: [attachment]
							}
						});
					})
					.catch((error) => {
						console.error(`Error uploading EML as attachment: ${error}`);
					});
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
