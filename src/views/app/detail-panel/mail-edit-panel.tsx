/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useState } from 'react';
import { replaceHistory, t } from '@zextras/carbonio-shell-ui';
import { Container, Divider, Icon, IconButton, Row, Text } from '@zextras/carbonio-design-system';
import { useParams } from 'react-router-dom';
import EditView from './edit/edit-view';
import type { MailEditHeaderType } from '../../../types';

const MailEditHeader: FC<MailEditHeaderType> = ({ folderId, header }) => {
	const onClose = useCallback(() => {
		replaceHistory(`/folder/${folderId}`);
	}, [folderId]);

	return (
		<Container height="3.0625rem" background="gray5">
			<Container
				orientation="horizontal"
				mainAlignment="flex-start"
				height="3rem"
				padding={{ left: 'large' }}
			>
				<Icon size="medium" icon="EditOutline" />
				<Row takeAvailableSpace mainAlignment="flex-start" padding={{ left: 'large' }}>
					<Text size="large">{header || t('header.edit_draft', 'Edit draft')}</Text>
				</Row>
				<IconButton icon="Close" onClick={onClose} />
			</Container>

			<Divider />
		</Container>
	);
};

export const MailEditPanel: FC = () => {
	const [header, setHeader] = useState();
	const { folderId } = useParams<{ folderId: string }>();

	return (
		<>
			<Container style={{ position: 'relative' }}>
				<MailEditHeader folderId={folderId} header={header} />
				<Container
					mainAlignment="flex-start"
					height="fit"
					background="gray6"
					style={{ maxHeight: 'calc(100% - 3.0625rem)', flexGrow: '1' }}
				>
					<EditView setHeader={setHeader} />
				</Container>
			</Container>
		</>
	);
};
