/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { Container, Row, Padding, Text, Divider } from '@zextras/zapp-ui';

function bytesToSize(bytes) {
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes === 0) return '0 Byte';
	const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
	return `${Math.round(bytes / 1024 ** i, 2)} ${sizes[i]}`;
}

const FolderDetails = ({ t, currentFolder }) => (
	<>
		<Container
			mainAlignment="flex-start"
			padding={{ all: 'small' }}
			crossAlignment="flex-start"
			takeAvailableSpace
			width="100%"
			orientation="horizontal"
		>
			<Row orientation="vertical" width="33.33%" crossAlignment="flex-start">
				<Text size="small" color="secondary">
					{t('label.type', 'Type')}
				</Text>
				<Padding top="extrasmall" />
				<Text>{t('label.mail_folder', 'E-mail folder')}</Text>
			</Row>
			<Row orientation="vertical" width="33.33%" crossAlignment="flex-start">
				<Text size="small" color="secondary">
					{t('label.messages', 'Messages')}
				</Text>
				<Padding top="extrasmall" />
				<Text>{currentFolder.itemsCount}</Text>
			</Row>
			<Row orientation="vertical" width="33.33%" crossAlignment="flex-start">
				<Text size="small" color="secondary">
					Size{t('label.size', 'Size')}
				</Text>
				<Padding top="extrasmall" />
				<Text>{bytesToSize(currentFolder.size)}</Text>
			</Row>
		</Container>
		<Divider />
		<Padding bottom="medium" />
	</>
);

export default FolderDetails;
