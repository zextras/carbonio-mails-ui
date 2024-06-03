/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { Button, Container, Padding, Row, useSnackbar } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map, noop } from 'lodash';
import { useParams } from 'react-router-dom';

import { BackupSearchMessageListItem } from './parts/backup-search-message-list-item';
import { BackupSearchPanel } from './parts/backup-search-panel';
import { CustomList } from '../../carbonio-ui-commons/components/list/list';
import { CustomListItem } from '../../carbonio-ui-commons/components/list/list-item';
import { useSelection } from '../../hooks/use-selection';
import { useBackupSearchStore } from '../../store/zustand/backup-search/store';

const BackupSearchView = (): React.JSX.Element => {
	const [count, setCount] = useState(0);
	const { messages } = useBackupSearchStore();
	const { itemId } = useParams<{ itemId: string }>();

	const {
		selected: selectedMessage,
		toggle,
		deselectAll,
		selectAll,
		isAllSelected
	} = useSelection({
		currentFolderId: 'backup-search',
		setCount,
		count,
		items: [...Object.values(messages ?? {})]
	});

	const listItems = useMemo(
		() =>
			map(messages, (message) => {
				const active = itemId === message.id;
				const isSelected = selectedMessage[message.id];
				return (
					<CustomListItem key={message.id} active={active} background={'gray6'}>
						{(visible: boolean): ReactElement =>
							visible ? (
								<BackupSearchMessageListItem
									message={message}
									messageIsSelected={isSelected}
									toggle={toggle}
								/>
							) : (
								<div style={{ height: '4rem' }} />
							)
						}
					</CustomListItem>
				);
			}),
		[itemId, messages, selectedMessage, toggle]
	);

	const selectedIds = useMemo(() => Object.keys(selectedMessage), [selectedMessage]);
	const ids = Object.values(selectedIds ?? []);
	const createSnackbar = useSnackbar();

	const selectAllOnClick = useCallback(() => {
		selectAll();
		createSnackbar({
			key: `selected-${ids}`,
			replace: true,
			type: 'info',
			label: t('label.all_items_selected', 'All visible backupMessages have been selected'),
			autoHideTimeout: 5000,
			hideButton: true
		});
	}, [selectAll, createSnackbar, ids]);

	return (
		<Container
			orientation="horizontal"
			background="gray4"
			style={{ overflowY: 'auto' }}
			mainAlignment="flex-start"
		>
			<Container
				background="gray6"
				width="25%"
				height="fill"
				mainAlignment="flex-start"
				data-testid="MailsSearchResultListContainer"
			>
				<Container
					background="gray5"
					height="fit"
					orientation="horizontal"
					padding={{ all: 'extrasmall' }}
					mainAlignment="flex-start"
					width="100%"
				>
					<Row
						height="100%"
						width="fill"
						padding={{ all: 'extrasmall' }}
						mainAlignment="flex-start"
						takeAvailableSpace
					>
						<Button
							label={
								isAllSelected
									? t('label.deselect_all', 'DESELECT all')
									: t('label.select_all', 'SELECT all')
							}
							color="primary"
							onClick={isAllSelected ? deselectAll : selectAllOnClick}
							size="medium"
							type="ghost"
						/>
						<Padding left="small" />
						<Row takeAvailableSpace>
							<Button
								label={t('label.recover_selected_emails', 'RECOVER SELECTED E-MAILS')}
								color="primary"
								onClick={noop}
								size="medium"
								type="outlined"
								width="fill"
							/>
						</Row>
					</Row>
				</Container>
				<CustomList>{listItems}</CustomList>
			</Container>
			<BackupSearchPanel itemId={itemId} />
		</Container>
	);
};

export default BackupSearchView;
