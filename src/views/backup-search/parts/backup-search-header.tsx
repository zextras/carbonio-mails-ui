/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import {
	Container,
	Button,
	Text,
	Divider,
	Chip,
	Padding,
	Row
} from '@zextras/carbonio-design-system';
import { removeRoute, replaceHistory, t } from '@zextras/carbonio-shell-ui';

import { BACKUP_SEARCH_ROUTE, MAILS_ROUTE } from '../../../constants';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';

export const BackupSearchHeader = (): React.JSX.Element => {
	const clearSearchText = t('label.clear_search_query', 'CLEAR SEARCH');

	const { queryParams } = useBackupSearchStore();

	const queryParamsArray = Object.entries(queryParams).map(([key, value]) => {
		const isDateProp = key === 'startDate' || key === 'endDate';
		const displayValue = isDateProp ? new Date(value).toLocaleDateString() : value;
		const avatarIcon = isDateProp ? 'CalendarOutline' : undefined;
		return { key, value: displayValue, haveAvatarIcon: isDateProp, avatarIcon };
	});

	const clearSearchCallback = useCallback(() => {
		const backupSearchStoreState = useBackupSearchStore.getState();
		backupSearchStoreState.setMessages([]);
		backupSearchStoreState.setQueryParams({});
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
				<Row takeAvailableSpace orientation="horizontal" mainAlignment="flex-start">
					<Text color="secondary">{t('label.results_for', 'Results for: ')}</Text>
					{queryParamsArray.map(({ key, value, haveAvatarIcon: hasAvatar, avatarIcon }) => (
						<Padding left="small" key={key}>
							<Chip
								label={value}
								background="gray2"
								avatarBackground="secondary"
								avatarColor="white"
								color="text"
								avatarIcon={avatarIcon}
								hasAvatar={hasAvatar}
							/>
						</Padding>
					))}
				</Row>
				<Row mainAlignment="space-between" crossAlignment="flex-end">
					<Button
						label={clearSearchText}
						icon="CloseOutline"
						color="primary"
						type="ghost"
						onClick={clearSearchCallback}
					/>
				</Row>
			</Container>
			<Divider color="gray3" />
		</>
	);
};
