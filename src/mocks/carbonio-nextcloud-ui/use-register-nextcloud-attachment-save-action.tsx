/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect } from 'react';

import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';

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
