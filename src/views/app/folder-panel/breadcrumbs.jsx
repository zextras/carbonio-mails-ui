/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Divider, Row, Text, Padding } from '@zextras/zapp-ui';
import React from 'react';

export function Breadcrumbs({ folderPath, itemsCount }) {
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
						{folderPath?.split('/')?.join(' / ')}
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
