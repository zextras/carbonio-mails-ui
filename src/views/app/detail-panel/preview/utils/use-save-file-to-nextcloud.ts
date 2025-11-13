/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useIntegratedFunction } from '@zextras/carbonio-shell-ui';

export type UploadFileToNextcloudFn = (file: File) => void;

export type UseUploadFileToNextcloudFn = [undefined, false] | [UploadFileToNextcloudFn, true];

export const SAVE_FILE_INTEGRATION = 'fr.zextras.nextcloud-carbonio-ui.integrations.save-file';

export const useSaveFileToNextcloud = (): UseUploadFileToNextcloudFn => {
	const [saveFile, isSaveFileAvailable] = useIntegratedFunction(SAVE_FILE_INTEGRATION);

	return useMemo(
		() =>
			isSaveFileAvailable
				? [
						(onFilesSelected): void => {
							saveFile(onFilesSelected);
						},
						true
					]
				: [undefined, false],
		[isSaveFileAvailable, saveFile]
	);
};
