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
 *   getIntegratedFunction('register-attachment-save-action')
 *     → exposed by carbonio-mails-ui to let any module add a "Save to …"
 *       entry to the attachment hover bar.
 *
 *   AttachmentSaveActionContext.getFile()
 *     → provided by the hover bar at click time; downloads the attachment
 *       from the mail server and returns a browser File object.
 *
 *   useIntegratedFunction('fr.zextras.nextcloud-carbonio-ui.integrations.save-file')
 *     → exposed by THIS module (carbonio-nextcloud-ui) to let the shell
 *       (and other modules) upload a File to the user's Nextcloud storage.
 *
 * It does NOT import anything from carbonio-mails-ui source paths.
 */

import { useEffect } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';

/** Integration key that carbonio-nextcloud-ui registers for its file save function. */
const SAVE_FILE_INTEGRATION = 'fr.zextras.nextcloud-carbonio-ui.integrations.save-file';

type AttachmentSaveActionContext = {
	messageId: string;
	partName: string;
	filename: string;
	contentType: string;
	size: number;
	downloadUrl: string;
	getFile(): Promise<File>;
};

/**
 * Registers the "Save to Nextcloud" entry into the attachment hover bar
 * via the carbonio-mails-ui public API, and cleans up on unmount.
 *
 * This hook is the Nextcloud module's only integration point with the mails
 * module for saving received attachments — it never touches the mails store,
 * hooks, or components directly.
 */
export const useRegisterNextcloudAttachmentSaveAction = (): void => {
	const createSnackbar = useSnackbar();

	// Reactive: re-registers whenever the Nextcloud save function becomes
	// available or unavailable (i.e. when the Nextcloud module mounts/unmounts).
	const [saveFile, isSaveFileAvailable] = useIntegratedFunction(SAVE_FILE_INTEGRATION);

	useEffect(() => {
		if (!isSaveFileAvailable) {
			return undefined;
		}

		// Retrieve the registration function exposed by carbonio-mails-ui.
		// It is registered at module-load time, so it is always available by
		// the time any React component mounts.
		const [registerAttachmentSaveAction, isRegisterAvailable] = getIntegratedFunction(
			'register-attachment-save-action'
		);

		if (!isRegisterAvailable) {
			return undefined;
		}

		(registerAttachmentSaveAction as (config: unknown) => void)({
			id: 'nextcloud:save',
			label: t('label.save_to_nextcloud', 'Save to Nextcloud'),
			icon: 'CloudUploadOutline',
			onClick: async (ctx: AttachmentSaveActionContext) => {
				// ctx.getFile() downloads the attachment from the mail server and
				// returns it as a browser File object for uploading to Nextcloud.
				const file = await ctx.getFile();

				saveFile(file, (success: boolean) => {
					createSnackbar({
						key: 'nextcloud-save',
						replace: true,
						severity: success ? 'info' : 'warning',
						hideButton: true,
						label: success
							? t(
									'message.snackbar.att_saved_nextcloud',
									'Attachment saved to Nextcloud'
								)
							: t(
									'message.snackbar.att_err',
									'There seems to be a problem when saving, please try again'
								),
						autoHideTimeout: 3000
					});
				});
			}
		});
	}, [createSnackbar, isSaveFileAvailable, saveFile]);
};
