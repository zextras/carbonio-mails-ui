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
 *   useIntegratedFunction('fr.zextras.nextcloud-carbonio-ui.integrations.select-files')
 *     → exposed by THIS module (carbonio-nextcloud-ui) to let the shell
 *       (and other modules) open the Nextcloud file picker.
 *
 * It does NOT import anything from carbonio-mails-ui source paths.
 */

import { useEffect } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';

/** Integration key that carbonio-nextcloud-ui registers for its file picker. */
const SELECT_FILES_INTEGRATION = 'fr.zextras.nextcloud-carbonio-ui.integrations.select-files';

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

/**
 * Registers the "Add from Nextcloud" entry into the mails composer dropdown
 * via the carbonio-mails-ui public API, and cleans up on unmount.
 *
 * This hook is the Nextcloud module's only integration point with the mails
 * module — it never touches the mails store, hooks, or components directly.
 */
export const useRegisterNextcloudIntegrations = (): void => {
	const createSnackbar = useSnackbar();

	// Reactive: re-registers whenever the Nextcloud file picker becomes
	// available or unavailable (i.e. when the Nextcloud module mounts/unmounts).
	const [selectFiles, isSelectFilesAvailable] = useIntegratedFunction(SELECT_FILES_INTEGRATION);

	useEffect(() => {
		if (!isSelectFilesAvailable) {
			return undefined;
		}

		// Retrieve the registration function exposed by carbonio-mails-ui.
		// It is registered at module-load time, so it is always available by
		// the time any React component mounts.
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
				selectFiles(async (files: File[]) => {
					// ctx.uploadFiles handles uploading browser File objects to the
					// mail server and returns the successfully uploaded attachments.
					const uploaded = await ctx.uploadFiles(files);

					uploaded.forEach((att) => ctx.onAttachmentAdded(att));

					const failed = files.length - uploaded.length;
					createSnackbar({
						key: 'nextcloud-attachment',
						replace: false,
						severity: failed === 0 ? 'info' : 'warning',
						hideButton: true,
						label:
							failed === 0
								? t('message.snackbar.all_att_added', 'Attachments added successfully')
								: uploaded.length === 0
									? t(
											'message.snackbar.att_err_adding',
											'There seems to be a problem when adding attachments, please try again'
										)
									: t(
											'message.snackbar.some_att_add_fails',
											'There seems to be a problem when adding some attachments, please try again'
										),
						autoHideTimeout: 4000
					});
				});
			}
		});
	}, [createSnackbar, isSelectFilesAvailable, selectFiles]);
};
