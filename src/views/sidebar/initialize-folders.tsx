/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { FOLDER_VIEW } from '../../carbonio-ui-commons/constants';
import { useInitializeFolders } from '../../carbonio-ui-commons/hooks/use-initialize-folders';

export const InitializeFolders = (): React.JSX.Element => {
	useInitializeFolders(FOLDER_VIEW.message);
	return <></>;
};
