/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Avatar, Chip, Container, Padding, Row, Text } from '@zextras/carbonio-design-system';
import {
	getFolder,
	getUserAccount,
	replaceHistory,
	t,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';

import { BackupSearchMessage } from '../../../types';
import { HoverContainer } from '../../app/folder-panel/parts/hover-container';

type BackupSearchMessageListmessageProps = {
	message: BackupSearchMessage;
	messageIsSelected: boolean;
	toggle: (id: string) => void;
};

export const BackupSearchMessageListItem = ({
	message,
	messageIsSelected,
	toggle
}: BackupSearchMessageListmessageProps): React.JSX.Element => {
	const accountName = getUserAccount()?.name;
	const { zimbraPrefLocale } = useUserSettings().prefs;
	const active = true;
	const emailToDisplay =
		find([message.to, message.sender], (email) => !email.includes(accountName ?? '')) ??
		accountName;
	const dateToDisplay = new Date(message?.creationDate).toLocaleDateString(zimbraPrefLocale);
	const messageId = message.id;
	const folder = getFolder(message.folderId);
	const folderName = folder ? folder.name : t('label.deleted_folder', 'Deleted Folder');

	const handleComponentOnClick = useCallback(() => {
		replaceHistory(`/${messageId}`);
	}, [messageId]);
	const handleAvatarOnClick = useCallback(() => {
		toggle(messageId);
	}, [messageId, toggle]);

	return (
		<HoverContainer
			$hoverBackground={active ? 'highlight' : 'gray6'}
			orientation="horizontal"
			mainAlignment="flex-start"
			padding={{ all: 'medium' }}
		>
			<div style={{ alignSelf: 'center' }}>
				<Avatar
					onClick={handleAvatarOnClick}
					selecting
					selected={messageIsSelected}
					label={message.to}
					colorLabel={message.to}
					size="large"
				/>
			</div>
			<Row
				onClick={handleComponentOnClick}
				wrap="wrap"
				takeAvailableSpace
				padding={{ left: 'medium' }}
			>
				<Container height="fit" width="fill" crossAlignment="flex-start">
					<Row wrap="nowrap" takeAvailableSpace width="fill" mainAlignment="space-between">
						<Text size="medium">{emailToDisplay}</Text>
						<Text size="small">{dateToDisplay}</Text>
					</Row>
					<Padding bottom="small" />
					<Row wrap="nowrap" takeAvailableSpace mainAlignment="space-between">
						<Text size="medium">{message?.subject}</Text>
						<Chip label={folderName} background="gray2" color="text" hasAvatar={false} />
					</Row>
				</Container>
			</Row>
		</HoverContainer>
	);
};
