/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Button, Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import type { Folder } from '@zextras/carbonio-ui-commons';

import { getFolderTranslatedName } from 'views/sidebar/utils';

export type ExportFormat = 'tgz' | 'zip';

type FormatOption = {
	value: ExportFormat;
	avatarLabel: string;
	filename: string;
	description: string;
	avatarColor: string;
};

type ExportArchiveModalProps = {
	folder: Folder;
	onFormatChange: (format: ExportFormat) => void;
};

export const ExportArchiveModal: FC<ExportArchiveModalProps> = ({ folder, onFormatChange }) => {
	const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('zip');

	const folderName = getFolderTranslatedName({ folderName: folder.name, folderId: folder.id });

	const formats = useMemo<FormatOption[]>(
		() => [
			{
				value: 'zip',
				avatarLabel: 'ZIP',
				filename: `${folderName}.zip`,
				description: t('modal.export_archive.file_type.zip', 'ZIP · Compressed mailbox archive'),
				avatarColor: '#EEEDFE'
			},
			{
				value: 'tgz',
				avatarLabel: 'TGZ',
				filename: `${folderName}.tgz`,
				description: t('modal.export_archive.file_type.tgz', 'TGZ · Carbonio Archive'),
				avatarColor: '#E1F5EE'
			}
		],
		[folderName]
	);

	const handleSelect = useCallback(
		(fmt: ExportFormat) => {
			setSelectedFormat(fmt);
			onFormatChange(fmt);
		},
		[onFormatChange]
	);

	return (
		<Container mainAlignment="flex-start" crossAlignment="flex-start">
			<Padding bottom="small" />
			<Text color="regular">
				{t(
					'modal.export_archive.description',
					'Chose the format you would like to use for your export.'
				)}
			</Text>
			<Padding bottom="large" />
			<Container
				gap="1rem"
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="stretch"
			>
				{formats.map((fmt) => (
					<Container
						key={fmt.value}
						orientation="horizontal"
						gap="0.75rem"
						padding={{ all: 'medium' }}
						borderRadius="regular"
						borderColor={selectedFormat === fmt.value ? 'primary' : 'gray2'}
						mainAlignment="flex-start"
						crossAlignment="center"
						width="fill"
						onClick={(): void => handleSelect(fmt.value)}
						style={{ cursor: 'pointer', borderRadius: '0.25rem' }}
					>
						<Button
							icon={selectedFormat === fmt.value ? 'RadioButtonOn' : 'RadioButtonOff'}
							type="default"
							backgroundColor="white"
							labelColor={selectedFormat === fmt.value ? 'primary' : 'gray0'}
							size="large"
							onClick={(): void => handleSelect(fmt.value)}
							aria-label={fmt.avatarLabel}
						/>
						<Container
							width="3rem"
							height="3rem"
							minWidth="3rem"
							background={fmt.avatarColor}
							borderRadius="regular"
							mainAlignment="center"
							crossAlignment="center"
							style={{ flexShrink: 0, borderRadius: '0.25rem' }}
						>
							<Text size="small" weight="regular" color="text">
								{fmt.avatarLabel}
							</Text>
						</Container>
						<Container mainAlignment="flex-start" crossAlignment="flex-start" width="fill">
							<Text weight="bold" overflow="ellipsis" style={{ maxWidth: '18rem' }}>
								{fmt.filename}
							</Text>
							<Padding bottom="small" />
							<Text size="small" color="#5c5c5c">
								{fmt.description}
							</Text>
						</Container>
					</Container>
				))}
			</Container>
		</Container>
	);
};
