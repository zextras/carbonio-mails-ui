/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDER_VIEW, useInitializeFolders } from '@zextras/carbonio-ui-commons';

export const InitializeFolders = (): null => {
	useInitializeFolders(FOLDER_VIEW.message);
	return null;
};
