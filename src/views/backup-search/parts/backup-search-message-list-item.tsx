/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Avatar, Container, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { getUserAccount, replaceHistory } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';

import { BackupSearchMessage } from '../../../types';

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
	const emailToDisplay =
		find([message.to, message.sender], (email) => !email.includes(accountName ?? '')) ??
		accountName;
	const dateToDisplay = new Date(message?.creationDate).toLocaleDateString();
	const messageId = message.id;

	const handleComponentOnClick = useCallback(() => {
		replaceHistory(`/${messageId}`);
	}, [messageId]);
	const handleAvatarOnClick = useCallback(() => {
		toggle(messageId);
	}, [messageId, toggle]);
	return (
		<Container orientation="horizontal" mainAlignment="flex-start" padding={{ all: 'medium' }}>
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
					<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
						<Text size="medium">{message?.subject}</Text>
					</Row>
				</Container>
			</Row>
		</Container>
	);
};