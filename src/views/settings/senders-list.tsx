/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState } from 'react';

import {
	Container,
	Divider,
	TextWithTooltip,
	Padding,
	Tooltip,
	Button,
	Row,
	Input
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import Heading from './components/settings-heading';
import { allowedSendersSubSection, blockedSendersSubSection } from './subsections';
import type { InputProps } from '../../types';

export type ListType = 'Allowed' | 'Blocked';

export type SendersListProps = InputProps & {
	listType: ListType;
};

function getMessage(listType: ListType): string {
	return listType === 'Allowed'
		? t(
				'messages.allowed_addresses',
				'Mails sent from addresses on your allowed senders list will always bypass your spam filter and land directly in your inbox.'
			)
		: t(
				'messages.blocked_addresses',
				'Mails sent from addresses on the blocked senders list will be automatically moved to your spam folder.'
			);
}

export const SendersList = ({
	settingsObj,
	updateSettings,
	listType
}: SendersListProps): React.JSX.Element => {
	const [address, setAddress] = useState<string>('');
	const [sendersList, setSendersList] = useState<string[]>([]);
	const sectionTitle = useMemo(
		() => (listType === 'Allowed' ? allowedSendersSubSection() : blockedSendersSubSection()),
		[listType]
	);

	const message = useMemo(() => getMessage(listType), [listType]);

	const onAdd = (): void => {
		setSendersList([...sendersList, address]);
	};
	const isInvalid = false;

	const warningMessage = useMemo(
		() =>
			isInvalid ? t('messages.invalid_sender_address', 'Please enter only e-mail addresses') : '',
		[isInvalid]
	);

	return (
		<Container background="gray6" padding={{ horizontal: 'medium', bottom: 'large' }}>
			<Container orientation="vertical" padding={{ vertical: 'medium', top: 'medium' }}>
				<Container id={sectionTitle.id}>
					<Heading title={sectionTitle.label} size="medium" />
				</Container>
				<Container crossAlignment="flex-start" padding={'none'}>
					<TextWithTooltip size="extrasmall">{message}</TextWithTooltip>
				</Container>
			</Container>
			<Divider />
			<Container
				padding={{ all: 'medium', bottom: 'small' }}
				orientation="horizontal"
				mainAlignment="flex-start"
			></Container>
			<Divider />
			<Container
				padding={{ all: 'medium', bottom: 'small' }}
				orientation="horizontal"
				mainAlignment="flex-start"
			>
				<Row mainAlignment="flex-start" width="50vw">
					<Input
						label={t('label.enter_single_email_address', 'Enter email address')}
						value={address}
						hasError={isInvalid}
						description={warningMessage}
						backgroundColor="gray5"
						onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setAddress(e.target.value)}
					/>
				</Row>
				<Padding left="medium">
					<Tooltip label={warningMessage} disabled={!isInvalid} maxWidth="100%">
						<Button
							label={t('label.add', 'Add')}
							type="outlined"
							onClick={onAdd}
							disabled={isInvalid}
						/>
					</Tooltip>
				</Padding>
			</Container>
			<div data-testid="senders-list">
				{sendersList.map((s, idx) => (
					<span key={idx}>{s}</span>
				))}
			</div>
		</Container>
	);
};
