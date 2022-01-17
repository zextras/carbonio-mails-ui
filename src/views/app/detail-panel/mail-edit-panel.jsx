/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';
import { useReplaceHistoryCallback } from '@zextras/zapp-shell';
import {
	Container,
	Divider,
	Icon,
	IconButton,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import EditView from './edit/edit-view';

const MailEditHeader = ({ folderId, header, toggleAppBoard, setToggleAppBoard }) => {
	const [t] = useTranslation();
	const replaceHistory = useReplaceHistoryCallback();
	const onClose = useCallback(() => {
		replaceHistory(`/folder/${folderId}`);
	}, [folderId, replaceHistory]);

	return (
		<Container height={49} background="gray5">
			<Container
				orientation="horizontal"
				mainAlignment="flex-start"
				height={48}
				padding={{ left: 'large' }}
			>
				<Icon size="medium" icon="EditOutline" />
				<Row takeAvailableSpace mainAlignment="flex-start" padding={{ left: 'large' }}>
					<Text size="large">{header || t('header.edit_draft', 'Edit draft')}</Text>
				</Row>
				<Tooltip label={t('board.show', 'Show board')} placement="bottom">
					<IconButton
						icon={toggleAppBoard ? 'DiagonalArrowRightUpOutline' : 'DiagonalArrowLeftDownOutline'}
						onClick={() => setToggleAppBoard(!toggleAppBoard)}
					/>
				</Tooltip>
				<IconButton icon="Close" onClick={onClose} />
			</Container>

			<Divider />
		</Container>
	);
};

export default function MailEditPanel() {
	const [header, setHeader] = useState(undefined);
	const [toggleAppBoard, setToggleAppBoard] = useState(false);
	const { folderId, editId } = useParams();

	return (
		<>
			<Container style={{ position: 'relative' }}>
				<MailEditHeader
					folderId={folderId}
					header={header}
					toggleAppBoard={toggleAppBoard}
					setToggleAppBoard={setToggleAppBoard}
				/>
				<Container
					mainAlignment="flex-start"
					height="fit"
					background="gray6"
					style={{ maxHeight: 'calc(100% - 49px)', flexGrow: '1' }}
				>
					<EditView
						mailId={editId}
						folderId={folderId}
						setHeader={setHeader}
						panel
						toggleAppBoard={toggleAppBoard}
					/>
				</Container>
			</Container>
		</>
	);
}
