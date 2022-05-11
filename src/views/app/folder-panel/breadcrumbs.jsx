/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Divider, Row, Text, Padding } from '@zextras/carbonio-design-system';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function Breadcrumbs({ folderPath, itemsCount, folderId }) {
	const [t] = useTranslation();

	const folderTitle = useMemo(
		() =>
			folderId === FOLDERS.SPAM ? t('label.spam', 'Spam') : folderPath?.split('/')?.join(' / '),
		[t, folderId, folderPath]
	);
	return (
		<Container
			background="gray5"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			height="48px"
			border={{ bottom: '1px solid secondary' }}
		>
			<Row
				height="100%"
				width="fill"
				padding={{ all: 'small' }}
				mainAlignment="space-between"
				takeAvailableSpace
			>
				<Row
					mainAlignment="flex-start"
					takeAvailableSpace
					padding={{ all: 'small', right: 'medium' }}
				>
					<Text size="medium" data-testid="BreadcrumbPath">
						{folderTitle}
					</Text>
				</Row>
				<Text size="extrasmall" data-testid="BreadcrumbCount">
					{itemsCount > 100 ? '100+' : itemsCount}
				</Text>
				<Padding right="large" />
			</Row>
			<Divider />
		</Container>
	);
}
