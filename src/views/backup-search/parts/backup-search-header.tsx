/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Container, Button, Text, Divider } from '@zextras/carbonio-design-system';
import { removeRoute, replaceHistory, t } from '@zextras/carbonio-shell-ui';

import { BACKUP_SEARCH_ROUTE, MAILS_ROUTE } from '../../../constants';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';

export const BackupSearchHeader = (): React.JSX.Element => {
	const clearSearchText = t('label.clear_search_query', 'CLEAR SEARCH');
	const clearSearchCallback = useCallback(() => {
		useBackupSearchStore.getState().setMessages([]);
		removeRoute(BACKUP_SEARCH_ROUTE);
		replaceHistory({ route: MAILS_ROUTE, path: '/' });
	}, []);
	return (
		<>
			<Container
				orientation="horizontal"
				mainAlignment="flex-start"
				width="100%"
				background={'gray5'}
				height="fit"
				minHeight="3rem"
				maxHeight="7.5rem"
				style={{ overflow: 'hidden' }}
				padding={{ horizontal: 'large', vertical: 'medium' }}
			>
				<Container width="85%" orientation="horizontal" wrap="wrap" mainAlignment="flex-start">
					<Text color="secondary">Results for: </Text>
				</Container>

				<Container width="15%" mainAlignment="flex-start" crossAlignment="flex-start">
					<Button
						label={clearSearchText}
						icon="CloseOutline"
						color="primary"
						width="fill"
						type="ghost"
						onClick={clearSearchCallback}
					/>
				</Container>
			</Container>
			<Divider color="gray3" />
		</>
	);
};
