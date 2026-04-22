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
 *       entry to the attachment dropdown.
 *
 *   AttachmentSaveActionContext.getFile()
 *     → provided by the dropdown at click time; downloads the attachment
 *       from the mail server and returns a browser File object.
 *
 *   getIntegratedFunction('fr.zextras.nextcloud-carbonio-ui.integrations.save-file')
 *     → exposed by THIS module (carbonio-nextcloud-ui) to let the shell
 *       (and other modules) upload a File to the user's Nextcloud storage.
 *       In this mock the call is simulated with a console.log + delay.
 *
 * It does NOT import anything from carbonio-mails-ui source paths.
 */

import { useEffect } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';

/** Inline copy of the context shape exposed by carbonio-mails-ui. */
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
 * Registers the "Save to Nextcloud" entry into the attachment dropdown
 * via the carbonio-mails-ui public API, and cleans up on unmount.
 *
 * Full integration flow:
 *   1. User clicks "Save to Nextcloud" in the attachment dropdown.
 *   2. carbonio-mails-ui calls onClick(context).
 *   3. This handler calls context.getFile() — downloads the attachment
 *      from the mail server as a browser File object.
 *   4. The File is passed to the Nextcloud module's own save-file function,
 *      which uploads it to the user's Nextcloud storage.
 *   5. A snackbar reports success or failure.
 */
export const useRegisterNextcloudAttachmentSaveAction = (): void => {
	const createSnackbar = useSnackbar();

	useEffect(() => {
		const [registerAttachmentSaveAction, isRegisterAvailable] = getIntegratedFunction(
			'register-attachment-save-action'
		);

		if (!isRegisterAvailable) {
			return;
		}

		(registerAttachmentSaveAction as (config: unknown) => void)({
			id: 'nextcloud:save',
			label: t('label.save_to_nextcloud', 'Save to Nextcloud'),
			icon: 'CloudUploadOutline',
			onClick: async (context: AttachmentSaveActionContext): Promise<void> => {
				try {
					// Step 1 — download attachment from mail server as a browser File.
					const file = await context.getFile();

					console.log('@@@', file);
					// Step 2 — upload to Nextcloud via the module's own integrated function.
					// REAL implementation would be:
					//   const [saveFile, isSaveAvailable] = getIntegratedFunction(
					//     'fr.zextras.nextcloud-carbonio-ui.integrations.save-file'
					//   );
					//   if (isSaveAvailable) {
					//     await (saveFile as (file: File) => Promise<void>)(file);
					//   }
					//
					// MOCK: simulate the upload with a short delay.
					await new Promise<void>((resolve) => {
						setTimeout(resolve, 600);
					});
					// eslint-disable-next-line no-console
					console.log('[Nextcloud mock] saved to Nextcloud:', file.name, `(${file.size} bytes)`);

					createSnackbar({
						key: 'nextcloud-save',
						replace: true,
						severity: 'info',
						hideButton: true,
						label: t(
							'message.snackbar.saved_to_nextcloud',
							`"${context.filename}" saved to Nextcloud`
						),
						autoHideTimeout: 4000
					});
				} catch {
					createSnackbar({
						key: 'nextcloud-save-error',
						replace: true,
						severity: 'error',
						hideButton: true,
						label: t(
							'message.snackbar.nextcloud_save_error',
							'Failed to save the attachment to Nextcloud'
						),
						autoHideTimeout: 4000
					});
				}
			}
		});
	}, [createSnackbar]);
};
