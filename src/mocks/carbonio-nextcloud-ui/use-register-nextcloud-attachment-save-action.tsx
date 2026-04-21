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

import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';

/**
 * Registers the "Save to Nextcloud" entry into the attachment hover bar
 * via the carbonio-mails-ui public API, and cleans up on unmount.
 *
 * This hook is the Nextcloud module's only integration point with the mails
 * module for saving received attachments — it never touches the mails store,
 * hooks, or components directly.
 */
export const useRegisterNextcloudAttachmentSaveAction = (): void => {
	useEffect(() => {
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
			onClick: (): void => {
				/* saveFile(file, ...) */
			}
		});
	}, []);
};
