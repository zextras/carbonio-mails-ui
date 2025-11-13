/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useIntegratedFunction } from '@zextras/carbonio-shell-ui';

export const SELECT_FILES_INTEGRATION = 'fr.zextras.nextcloud-carbonio-ui.integrations.select-files';

export type SelectFromNextcloudFn = (onFilesSelected: (files: File[]) => void) => void;

export type UseSelectFromNextcloudReturn = [undefined, false] | [SelectFromNextcloudFn, true];

export const useSelectFilesFromNextcloud = (): UseSelectFromNextcloudReturn => {
	const [selectFiles, isSelectFilesAvailable] = useIntegratedFunction(SELECT_FILES_INTEGRATION);

	return useMemo(
		() =>
			isSelectFilesAvailable
				? [
						(onFilesSelected): void => {
							selectFiles(onFilesSelected);
						},
						true
					]
				: [undefined, false],
		[isSelectFilesAvailable, selectFiles]
	);
};
