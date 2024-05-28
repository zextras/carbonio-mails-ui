/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { setAppContext, SearchViewProps } from '@zextras/carbonio-shell-ui';

import { BackupSearchMessageList } from './backup-search-message-list';
import { useAppSelector } from '../../hooks/redux';
import { selectBackupSearchMessagesStore } from '../../store/backup-search-slice';

const BackupSearchView: FC<SearchViewProps> = () => {
	const [count, setCount] = useState(0);

	useEffect(() => {
		setAppContext({ isMessageView: true, count, setCount });
	}, [count]);

	const backupMessages = useAppSelector(selectBackupSearchMessagesStore);

	return (
		<>
			<Container>
				<Container
					orientation="horizontal"
					background="gray4"
					style={{ overflowY: 'auto' }}
					mainAlignment="flex-start"
				>
					<BackupSearchMessageList
						backupMessages={backupMessages.messages}
						// search={searchQuery}
						// query={queryToString}
						// loading={loading}
						// filterCount={filterCount}
						// setShowAdvanceFilters={setShowAdvanceFilters}
						// isInvalidQuery={isInvalidQuery}
						// invalidQueryTooltip={invalidQueryTooltip}
					/>
				</Container>
			</Container>
		</>
	);
};

export default BackupSearchView;
