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
import { removeRoute, replaceHistory, t, useUserSettings } from '@zextras/carbonio-shell-ui';

import { BACKUP_SEARCH_ROUTE, MAILS_ROUTE } from '../../../constants';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';

export const BackupSearchHeader = (): React.JSX.Element => {
	const clearSearchText = t('label.clear_search_query', 'CLEAR SEARCH');
	const endDateString = t('label.end_date', 'End Date');
	const startDateString = t('label.start_date', 'Start Date');
	const { searchParams: queryParams } = useBackupSearchStore();
	const { zimbraPrefLocale } = useUserSettings().prefs;

	const queryParamsArray = [];

	if (queryParams.searchString)
		queryParamsArray.push({
			value: queryParams.searchString,
			hasAvatarIcon: false
		});

	if (queryParams.startDate)
		queryParamsArray.push({
			value: `${startDateString}: ${queryParams.startDate.toLocaleDateString(zimbraPrefLocale)}`,
			hasAvatarIcon: true,
			avatarIcon: 'CalendarOutline'
		});

	if (queryParams.endDate)
		queryParamsArray.push({
			value: `${endDateString}: ${queryParams.endDate.toLocaleDateString(zimbraPrefLocale)}`,
			hasAvatarIcon: true,
			avatarIcon: 'CalendarOutline'
		});

	const clearSearchCallback = useCallback(() => {
		const backupSearchStoreState = useBackupSearchStore.getState();
		backupSearchStoreState.setMessages([]);
		backupSearchStoreState.setSearchParams({});
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
					{queryParamsArray.map(({ value, hasAvatarIcon, avatarIcon }, index) => (
						<Padding left="small" key={`query-params-${index}`}>
							<Chip
								label={value}
								background="gray2"
								avatarBackground="secondary"
								avatarColor="white"
								color="text"
								avatarIcon={avatarIcon}
								hasAvatar={hasAvatarIcon}
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
