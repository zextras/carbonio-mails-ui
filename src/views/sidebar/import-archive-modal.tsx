/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Banner, Container, Icon, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import type { Folder } from '@zextras/carbonio-ui-commons';

import { getFolderTranslatedName } from 'views/sidebar/utils';

type ImportArchiveModalProps = {
	folder: Folder;
	file: File;
};

// Formats file size in base 10 with appropriate units. System International(SI)
function formatFileSize(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB'];
	const thresholds = [1, 1_000, 1_000_000, 1_000_000_000];
	const i = thresholds.findLastIndex((t) => bytes >= t);
	const value = bytes / thresholds[i];
	return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

export const ImportArchiveModal: FC<ImportArchiveModalProps> = ({ folder, file }) => {
	const fileExtension = file.name.split('.').pop()?.toLowerCase();

	const fileTypeMap: Record<string, { label: string; description: string; avatarColor: string }> = {
		mbox: {
			label: 'MBOX',
			description: t('modal.import_archive.file_type.mbox', 'MBOX · Mailbox archive'),
			avatarColor: '#FEEDED'
		},
		zip: {
			label: 'ZIP',
			description: t('modal.import_archive.file_type.zip', 'ZIP · Compressed mailbox archive'),
			avatarColor: '#EEEDFE'
		},
		tgz: {
			label: 'TGZ',
			description: t('modal.import_archive.file_type.tgz', 'TGZ · Compressed mailbox archive'),
			avatarColor: '#E1F5EE'
		}
	};

	const { label: fileTypeLabel, description: fileTypeDescription } =
		fileTypeMap[fileExtension ?? ''] ?? fileTypeMap.zip;

	const fileSize = formatFileSize(file.size);
	const folderName = getFolderTranslatedName({ folderName: folder.name, folderId: folder.id });

	return (
		<Container mainAlignment="flex-start" crossAlignment="flex-start">
			<Container gap="1rem" mainAlignment="flex-start" crossAlignment="flex-start">
				<Container
					borderColor="gray2"
					padding={{ all: 'medium' }}
					background="gray6"
					orientation="horizontal"
					mainAlignment="flex-start"
					crossAlignment="center"
					gap="0.75rem"
					style={{ borderRadius: '0.25rem' }}
				>
					<Container
						width="3rem"
						height="3rem"
						minWidth="3rem"
						background={fileTypeMap[fileExtension ?? '']?.avatarColor || '#EEEDFE'}
						mainAlignment="center"
						crossAlignment="center"
						style={{ flexShrink: 0, borderRadius: '0.25rem' }}
					>
						<Text size="small" weight="regular" color="text">
							{fileTypeLabel}
						</Text>
					</Container>
					<Container mainAlignment="flex-start" crossAlignment="flex-start" width="fill">
						<Text weight="bold" size="medium" overflow="ellipsis">
							{file.name}
						</Text>
						<Padding bottom="small" />
						<Text size="small" color="#5c5c5c">
							{fileTypeDescription}
						</Text>
					</Container>
				</Container>

				<Container
					gap="1rem"
					orientation="horizontal"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					<Container
						crossAlignment="flex-start"
						mainAlignment="flex-start"
						padding={{ all: 'large' }}
						width="fill"
						background="gray4"
						style={{ borderRadius: '0.25rem' }}
					>
						<Text size="small" color="#5c5c5c">
							{t('modal.import_archive.size_label', 'Size')}
						</Text>
						<Padding top="extrasmall" />
						<Text weight="bold">{fileSize}</Text>
					</Container>

					<Container
						crossAlignment="flex-start"
						mainAlignment="flex-start"
						padding={{ all: 'large' }}
						width="fill"
						background="gray4"
					>
						<Text size="small" color="#5c5c5c">
							{t('modal.import_archive.destination_label', 'Destination')}
						</Text>
						<Padding top="extrasmall" />
						<Row mainAlignment="flex-start" crossAlignment="center" gap="0.25rem" width="fill">
							<Icon icon="FolderOutline" size="medium" style={{ flexShrink: 0 }} />
							<Text weight="bold" overflow="ellipsis" style={{ maxWidth: '80%' }}>
								{folderName}
							</Text>
						</Row>
					</Container>
				</Container>

				<Container gap="1rem">
					<Banner
						severity="warning"
						type="standard"
						description={t(
							'modal.import_archive.warning',
							"This action can't be undone. If the size exceeds your quota, the import will be partial."
						)}
					/>
				</Container>
			</Container>
		</Container>
	);
};
