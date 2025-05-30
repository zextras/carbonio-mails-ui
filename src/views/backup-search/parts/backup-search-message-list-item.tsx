/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Avatar, Chip, Container, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { getUserAccount, useUserSettings } from '@zextras/carbonio-shell-ui';
import { getFolder } from '@zextras/carbonio-ui-commons';
import { find } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { BACKUP_SEARCH_ROUTE } from 'constants/index';
import { BackupSearchMessage } from 'types/index.d';
import { HoverContainer } from 'views/app/folder-panel/parts/hover-container';

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
	const navigate = useNavigate();
	const accountName = getUserAccount()?.name;
	const { zimbraPrefLocale } = useUserSettings().prefs;
	const active = true;
	const emailToDisplay =
		find([message.to, message.sender], (email) => !email.includes(accountName ?? '')) ??
		accountName;
	const dateToDisplay = new Date(message?.creationDate).toLocaleDateString(zimbraPrefLocale);
	const messageId = message.id;
	const folder = getFolder(message.folderId);

	const handleComponentOnClick = useCallback(() => {
		navigate(`/${BACKUP_SEARCH_ROUTE}/${messageId}`, { replace: true });
	}, [messageId, navigate]);
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
						{folder && (
							<Chip label={folder.name} background="gray2" color="text" hasAvatar={false} />
						)}
					</Row>
				</Container>
			</Row>
		</HoverContainer>
	);
};
