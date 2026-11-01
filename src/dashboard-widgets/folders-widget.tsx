/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Chip, Container, Divider, Row, Text } from '@zextras/carbonio-design-system';
import { t, useUserAccount } from '@zextras/carbonio-shell-ui';
import type { Folder } from '@zextras/carbonio-ui-commons';
import { FOLDERS, getFolder, useFolder, useRoot } from '@zextras/carbonio-ui-commons';
import { useNavigate } from 'react-router-dom';

import { FOLDERS_WIDGET_ID, WIDGET_CONTRACT_VERSION } from './constants';
import type { DashboardWidgetAction, WidgetProps, WidgetSettingsProps } from './types';
import { MAILS_ROUTE } from 'constants/index';
import { FolderSelector } from 'views/sidebar/commons/folder-selector';

export type FoldersWidgetConfig = { folderIds: string[] };

const DEFAULT_CONFIG: FoldersWidgetConfig = { folderIds: [] };

const FolderRow = ({ folderId }: { folderId: string }): React.JSX.Element | null => {
	const folder = useFolder(folderId);
	const root = useRoot(folderId);
	const accountName = useUserAccount().name;
	const navigate = useNavigate();

	const onClick = useCallback(
		() => navigate(`/${MAILS_ROUTE}/folder/${folderId}`),
		[folderId, navigate]
	);

	if (!folder) {
		return null;
	}

	const unread = folder.u ?? 0;
	return (
		<>
			<Container
				data-testid={`folders-widget-row-${folderId}`}
				orientation="horizontal"
				mainAlignment="space-between"
				padding={{ vertical: 'small', horizontal: 'medium' }}
				gap="0.5rem"
				height="fit"
				onClick={onClick}
				style={{ cursor: 'pointer' }}
			>
				<Container crossAlignment="flex-start" height="fit" width="fill">
					<Text weight="bold" overflow="ellipsis">
						{folder.name}
					</Text>
					<Text size="small" color="secondary" overflow="ellipsis">
						{root?.id === FOLDERS.USER_ROOT ? accountName : root?.name}
					</Text>
				</Container>
				<Chip
					label={String(unread)}
					background={unread > 0 ? 'primary' : 'gray2'}
					color={unread > 0 ? 'gray6' : 'text'}
					hasAvatar={false}
				/>
			</Container>
			<Divider />
		</>
	);
};

const FoldersWidget = ({ config }: WidgetProps<FoldersWidgetConfig>): React.JSX.Element => {
	if (config.folderIds.length === 0) {
		return (
			<Container padding={{ all: 'medium' }}>
				<Text color="secondary" textAlign="center">
					{t('dashboard.folders.empty', 'Select the folders to display from the widget settings')}
				</Text>
			</Container>
		);
	}
	return (
		<Container mainAlignment="flex-start" crossAlignment="stretch" style={{ overflowY: 'auto' }}>
			{config.folderIds.map((id) => (
				<FolderRow key={id} folderId={id} />
			))}
		</Container>
	);
};

const FoldersWidgetSettings = ({
	config,
	onChange
}: WidgetSettingsProps<FoldersWidgetConfig>): React.JSX.Element => {
	const { folderIds } = config;

	const onFolderSelected = useCallback(
		(folder: Folder) => {
			if (!folderIds.includes(folder.id)) {
				onChange({ ...config, folderIds: [...folderIds, folder.id] });
			}
		},
		[config, folderIds, onChange]
	);

	return (
		<Container gap="1rem" crossAlignment="flex-start" mainAlignment="flex-start" height="fit">
			<Row
				gap="0.5rem"
				wrap="wrap"
				mainAlignment="flex-start"
				width="fill"
				style={{ flexShrink: 0 }}
			>
				{folderIds.map((id) => (
					<Chip
						key={id}
						label={getFolder(id)?.name ?? id}
						onClose={(): void =>
							onChange({ ...config, folderIds: folderIds.filter((i) => i !== id) })
						}
					/>
				))}
			</Row>
			<Container crossAlignment="flex-start" mainAlignment="flex-start" height="fit">
				<FolderSelector
					inputLabel={t('dashboard.folders.add', 'Add a folder')}
					onFolderSelected={onFolderSelected}
					showSharedAccounts
					allowRootSelection={false}
					showSpamFolder
					showTrashFolder
				/>
			</Container>
		</Container>
	);
};

export const foldersWidget: DashboardWidgetAction<FoldersWidgetConfig> = {
	id: FOLDERS_WIDGET_ID,
	// evaluated lazily: the translations are not available when the module is loaded
	get label() {
		return t('dashboard.folders.label', 'Folders');
	},
	get description() {
		return t('dashboard.folders.description', 'Unread messages of the selected folders');
	},
	icon: 'FolderOutline',
	execute: () => undefined,
	contractVersion: WIDGET_CONTRACT_VERSION,
	defaultSize: { columns: 4, rows: 4 },
	Component: FoldersWidget,
	SettingsComponent: FoldersWidgetSettings,
	defaultConfig: DEFAULT_CONFIG,
	serialize: (config) => ({ v: 1, data: JSON.stringify(config) }),
	deserialize: (serialized) => {
		try {
			const parsed = serialized?.v === 1 ? JSON.parse(serialized.data) : undefined;
			return Array.isArray(parsed?.folderIds) &&
				parsed.folderIds.every((id: unknown) => typeof id === 'string')
				? { folderIds: parsed.folderIds }
				: DEFAULT_CONFIG;
		} catch {
			return DEFAULT_CONFIG;
		}
	}
};
