/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { CSSProperties, FC } from 'react';

import { Container, Text, Accordion } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

const containerStyle: CSSProperties = {
	overflowY: 'auto',
	display: 'block'
};

const FolderItem: FC<{ folders: any }> = ({ folders }) =>
	folders.length ? (
		<Container
			style={containerStyle}
			orientation="vertical"
			mainAlignment="flex-start"
			minHeight="30vh"
			maxHeight="60vh"
		>
			<Accordion items={folders} background="gray6" />
		</Container>
	) : (
		<Container padding={{ all: 'small' }}>
			<Text size="large"> {t('folder_panel.modal.lists-item.empty')} </Text>
		</Container>
	);

export default FolderItem;
