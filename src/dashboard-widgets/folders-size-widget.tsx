/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { Container, Radio, RadioGroup, Text } from '@zextras/carbonio-design-system';
import { t, useUserAccount } from '@zextras/carbonio-shell-ui';
import type { Folder } from '@zextras/carbonio-ui-commons';
import { FOLDERS, useRootsArray } from '@zextras/carbonio-ui-commons';

import { SIZES_WIDGET_ID, WIDGET_CONTRACT_VERSION } from './constants';
import type { DashboardWidgetAction, WidgetProps, WidgetSettingsProps } from './types';

export type SizeUnit = 'messages' | 'bytes';
export type FoldersSizeWidgetConfig = { unit: SizeUnit };

const DEFAULT_CONFIG: FoldersSizeWidgetConfig = { unit: 'bytes' };

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];

export const formatBytes = (bytes: number): string => {
	let value = bytes;
	let index = 0;
	while (value >= 1024 && index < BYTE_UNITS.length - 1) {
		value /= 1024;
		index += 1;
	}
	return `${index === 0 ? value : value.toFixed(1)} ${BYTE_UNITS[index]}`;
};

type SizeEntry = { id: string; path: string; value: number };
type AccountSizes = { id: string; entries: SizeEntry[] };

const flatten = (folder: Folder): Folder[] =>
	folder.children.flatMap((child) => [child, ...flatten(child)]);

/** Folders of every account, sorted by size within each account */
export const computeAccountSizes = (roots: Folder[], unit: SizeUnit): AccountSizes[] =>
	roots.map((root) => ({
		id: root.id,
		entries: flatten(root)
			.map((f) => ({
				id: f.id,
				path: f.absFolderPath ?? f.name,
				value: (unit === 'bytes' ? f.s : f.n) ?? 0
			}))
			.sort((a, b) => b.value - a.value)
	}));

const AccountSection = ({
	account,
	root,
	unit
}: {
	account: AccountSizes;
	root: Folder | undefined;
	unit: SizeUnit;
}): React.JSX.Element => {
	const userAccountName = useUserAccount().name;
	const max = Math.max(1, ...account.entries.map((e) => e.value));
	return (
		<Container crossAlignment="stretch" height="fit" padding={{ vertical: 'small' }} gap="0.25rem">
			<Text weight="bold" overflow="ellipsis">
				{account.id === FOLDERS.USER_ROOT ? userAccountName : root?.name}
			</Text>
			{account.entries.map((e) => (
				<Container
					key={e.id}
					data-testid={`folders-size-row-${e.id}`}
					orientation="horizontal"
					mainAlignment="flex-start"
					gap="0.5rem"
					height="fit"
				>
					<Container width="40%" crossAlignment="flex-start" height="fit">
						<Text size="small" overflow="ellipsis">
							{e.path}
						</Text>
					</Container>
					<Container width="fill" crossAlignment="flex-start" height="fit">
						<div
							style={{
								width: `${(e.value / max) * 100}%`,
								minWidth: e.value > 0 ? '2px' : 0,
								height: '0.75rem',
								borderRadius: '0.125rem',
								background: 'var(--carbonio-primary, #2b73d2)'
							}}
						/>
					</Container>
					<Container width="5rem" crossAlignment="flex-end" height="fit">
						<Text size="small">{unit === 'bytes' ? formatBytes(e.value) : e.value}</Text>
					</Container>
				</Container>
			))}
		</Container>
	);
};

const FoldersSizeWidget = ({ config }: WidgetProps<FoldersSizeWidgetConfig>): React.JSX.Element => {
	const roots = useRootsArray();
	const accounts = useMemo(() => computeAccountSizes(roots, config.unit), [roots, config.unit]);
	return (
		<Container mainAlignment="flex-start" crossAlignment="stretch" style={{ overflowY: 'auto' }}>
			{accounts.map((account) => (
				<AccountSection
					key={account.id}
					account={account}
					root={roots.find((r) => r.id === account.id)}
					unit={config.unit}
				/>
			))}
		</Container>
	);
};

const FoldersSizeWidgetSettings = ({
	config,
	onChange
}: WidgetSettingsProps<FoldersSizeWidgetConfig>): React.JSX.Element => (
	<Container crossAlignment="flex-start" height="fit">
		<RadioGroup
			value={config.unit}
			onChange={(v: string): void => onChange({ ...config, unit: v as SizeUnit })}
		>
			<Radio label={t('dashboard.sizes.bytes', 'Size (B, KB, MB, GB)')} value="bytes" />
			<Radio label={t('dashboard.sizes.messages', 'Number of messages')} value="messages" />
		</RadioGroup>
	</Container>
);

export const foldersSizeWidget: DashboardWidgetAction<FoldersSizeWidgetConfig> = {
	id: SIZES_WIDGET_ID,
	// evaluated lazily: the translations are not available when the module is loaded
	get label() {
		return t('dashboard.sizes.label', 'Folders size');
	},
	get description() {
		return t('dashboard.sizes.description', 'Size of the folders, grouped by account');
	},
	icon: 'BarChartOutline',
	execute: () => undefined,
	contractVersion: WIDGET_CONTRACT_VERSION,
	defaultSize: { columns: 6, rows: 5 },
	Component: FoldersSizeWidget,
	SettingsComponent: FoldersSizeWidgetSettings,
	defaultConfig: DEFAULT_CONFIG,
	serialize: (config) => ({ v: 1, data: JSON.stringify(config) }),
	deserialize: (serialized) => {
		try {
			const parsed = serialized?.v === 1 ? JSON.parse(serialized.data) : undefined;
			return parsed?.unit === 'bytes' || parsed?.unit === 'messages'
				? { unit: parsed.unit }
				: DEFAULT_CONFIG;
		} catch {
			return DEFAULT_CONFIG;
		}
	}
};
