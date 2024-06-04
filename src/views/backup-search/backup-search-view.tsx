/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { BackupSearchList } from './parts/backup-search-list';
import { BackupSearchPanel } from './parts/backup-search-panel';

const BackupSearchView = (): React.JSX.Element => (
	<Container
		orientation="horizontal"
		background="gray4"
		style={{ overflowY: 'auto' }}
		mainAlignment="flex-start"
	>
		<BackupSearchList />
		<BackupSearchPanel />
	</Container>
);

export default BackupSearchView;
