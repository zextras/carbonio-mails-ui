/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, FC } from 'react';

import { Checkbox, Container, Input, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

type ShareNotificationFieldsProps = {
	sendNotification: boolean;
	standardMessage: string;
	onToggleNotification: () => void;
	onMessageChange: (value: string) => void;
};

export const ShareNotificationFields: FC<ShareNotificationFieldsProps> = ({
	sendNotification,
	standardMessage,
	onToggleNotification,
	onMessageChange
}) => (
	<>
		<Container
			height="fit"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			padding={{ vertical: 'medium' }}
			data-testid={'sendNotificationCheckboxContainer'}
		>
			<Checkbox
				value={sendNotification}
				onClick={onToggleNotification}
				label={t('share.send_notification', 'Send a notification about this share')}
			/>
		</Container>
		<Container height="fit">
			<Input
				label={t('share.standard_message', 'Add a note to the standard message')}
				value={standardMessage}
				onChange={(ev: ChangeEvent<HTMLInputElement>): void => onMessageChange(ev.target.value)}
				disabled={!sendNotification}
				background="gray5"
			/>
		</Container>
		<Container
			orientation="horizontal"
			crossAlignment="baseline"
			mainAlignment="baseline"
			padding={{ all: 'small' }}
		>
			<Row padding={{ right: 'small' }}>
				<Text weight="bold" size="small" color="gray0">
					{t('label.note', 'Note:')}
				</Text>
			</Row>
			<Row padding={{ bottom: 'small' }}>
				<Text overflow="break-word" size="small" color="gray1">
					{t(
						'share.share_note',
						'The standard message displays your name, the name of the shared item, permissions granted to the recipients, and sign in information, if necessary.'
					)}
				</Text>
			</Row>
		</Container>
	</>
);
