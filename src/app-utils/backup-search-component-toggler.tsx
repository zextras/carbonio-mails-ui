/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect } from 'react';

import { isEmpty } from 'lodash';

import { useBackupSearchStore } from '../store/backup-search/store';
import { toggleBackupSearchComponent } from './toggle-backup-search-component';

export const BackupSearchComponentToggler: FC = () => {
	const hasBackupSearchMessages = !isEmpty(useBackupSearchStore().messages);

	useEffect(() => {
		toggleBackupSearchComponent(hasBackupSearchMessages);
	}, [hasBackupSearchMessages]);

	return null;
};
