/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';
import { Container, Row, Padding, Text, Divider } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { AccordionFolder } from '@zextras/carbonio-shell-ui';

const bytesToSize = (bytes: number): string => {
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes === 0) return '0 Byte';
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${Math.round(bytes / 1024 ** i)} ${sizes[i]}`;
};

const FolderDetails: FC<{ folder: AccordionFolder }> = ({ folder }) => {
	const [t] = useTranslation();
	return (
		<>
			<Container
				mainAlignment="flex-start"
				padding={{ all: 'small' }}
				crossAlignment="flex-start"
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
					<Text>{folder.folder?.n}</Text>
				</Row>
				<Row orientation="vertical" width="33.33%" crossAlignment="flex-start">
					<Text size="small" color="secondary">
						Size{t('label.size', 'Size')}
					</Text>
					<Padding top="extrasmall" />
					<Text>{bytesToSize(folder.folder?.s || 0)}</Text>
				</Row>
			</Container>
			<Divider />
			<Padding bottom="medium" />
		</>
	);
};

export default FolderDetails;
