/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * SIMULATION FILE — represents code that would live inside the
 * carbonio-nextcloud-ui module, NOT inside carbonio-mails-ui.
 *
 * This hook only consumes the public Carbonio Shell integration bus:
 *
 *   getIntegratedFunction('register-attachment-add-action')
 *     → exposed by carbonio-mails-ui to let any module add an entry
 *       to the composer "Add Attachments" dropdown.
 *
 *   AttachmentAddActionContext.uploadFiles(files)
 *     → provided by the composer at click time; uploads browser File
 *       objects to the mail server and returns UploadedAttachment records.
 *
 * It does NOT import anything from carbonio-mails-ui source paths.
 */

import { useEffect } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';

type AttachmentAddActionContext = {
	onAttachmentAdded: (att: {
		attachmentId: string;
		name: string;
		contentType: string;
		size: number;
	}) => void;
	uploadFiles: (files: File[]) => Promise<
		Array<{ attachmentId: string; name: string; contentType: string; size: number }>
	>;
};

export const useRegisterNextcloudIntegrations = (): void => {
	const createSnackbar = useSnackbar();

	useEffect(() => {
		const [registerAttachmentAddAction, isRegisterAvailable] = getIntegratedFunction(
			'register-attachment-add-action'
		);

		if (!isRegisterAvailable) {
			return undefined;
		}

		(registerAttachmentAddAction as (config: unknown) => void)({
			id: 'nextcloud:attach',
			label: t('composer.attachment.nextcloud', 'Add from Nextcloud'),
			icon: 'CloudDownloadOutline',
			onClick: (ctx: AttachmentAddActionContext) => {
				// selectFiles(async (files: File[]) => {
				// 	const uploaded = await ctx.uploadFiles(files);
				// 	uploaded.forEach((att) => ctx.onAttachmentAdded(att));
				// 	const failed = files.length - uploaded.length;
				// 	createSnackbar({ ... });
				// });
				createSnackbar({
					key: 'nextcloud-attachment',
					replace: false,
					severity: 'info',
					hideButton: true,
					label: t('message.snackbar.all_att_added', 'Attachments added successfully'),
					autoHideTimeout: 4000
				});
			}
		});
	}, [createSnackbar]);
};
