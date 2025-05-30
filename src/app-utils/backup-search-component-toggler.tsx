/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FC, useEffect } from 'react';

import { isEmpty } from 'lodash';

import { toggleBackupSearchComponent } from 'app-utils/toggle-backup-search-component';
import { useBackupSearchStore } from 'store/backup-search/store';

export const BackupSearchComponentToggler: FC = () => {
	const hasBackupSearchMessages = !isEmpty(useBackupSearchStore().messages);

	useEffect(() => {
		toggleBackupSearchComponent(hasBackupSearchMessages);
	}, [hasBackupSearchMessages]);

	return null;
};
