/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Avatar, Button, Container, IconButton, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import type { Folder } from '@zextras/carbonio-ui-commons';

import { getFolderTranslatedName } from 'views/sidebar/utils';

export type ExportFormat = 'tgz' | 'zip';

type FormatOption = {
	value: ExportFormat;
	avatarLabel: string;
	filename: string;
	description: string;
};

type ExportArchiveModalProps = {
	folder: Folder;
	onFormatChange: (format: ExportFormat) => void;
};

export const ExportArchiveModal: FC<ExportArchiveModalProps> = ({ folder, onFormatChange }) => {
	const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('tgz');

	const folderName = getFolderTranslatedName({ folderName: folder.name, folderId: folder.id });

	const formats = useMemo<FormatOption[]>(
		() => [
			{
				value: 'tgz',
				avatarLabel: 'TGZ',
				filename: `${folderName}.tgz`,
				description: t('modal.export_archive.file_type.tgz', 'TGZ · Carbonio Archive')
			},
			{
				value: 'zip',
				avatarLabel: 'ZIP',
				filename: `${folderName}.zip`,
				description: t('modal.export_archive.file_type.zip', 'ZIP · Compressed mailbox archive')
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
						borderColor={selectedFormat === fmt.value ? 'primary' : 'gray3'}
						mainAlignment="flex-start"
						crossAlignment="center"
						width="fill"
						onClick={(): void => handleSelect(fmt.value)}
						style={{ cursor: 'pointer' }}
					>
						<Button
							icon={selectedFormat === fmt.value ? 'RadioButtonOn' : 'RadioButtonOff'}
							type="default"
							backgroundColor="white"
							labelColor="primary"
							size="large"
							onClick={(): void => handleSelect(fmt.value)}
						/>
						<Avatar
							label={fmt.avatarLabel}
							shape="square"
							size="medium"
							color="text"
							background="#EEEDFE"
						/>
						<Container mainAlignment="flex-start" crossAlignment="flex-start" width="fill">
							<Text weight="bold" overflow="ellipsis">
								{fmt.filename}
							</Text>
							<Text size="small" color="secondary">
								{fmt.description}
							</Text>
						</Container>
					</Container>
				))}
			</Container>
		</Container>
	);
};
