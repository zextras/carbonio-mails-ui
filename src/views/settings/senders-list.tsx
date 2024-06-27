/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState, useCallback } from 'react';

import {
	Container,
	Divider,
	TextWithTooltip,
	Padding,
	Tooltip,
	Button,
	Row,
	Input,
	ListV2,
	Text
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';

import { SendersListItem } from './components/senders-list-item';
import Heading from './components/settings-heading';
import { allowedSendersSubSection, blockedSendersSubSection } from './subsections';
import type { InputProps } from '../../types';
import { isValidEmail } from '../search/parts/utils';

export type ListType = 'Allowed' | 'Blocked';

export type SendersListProps = InputProps & {
	listType: ListType;
	showConflictText?: boolean;
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

function getPrefName(listType: ListType): string {
	return listType === 'Allowed' ? 'amavisWhitelistSender' : 'amavisBlacklistSender';
}

export function getList(list: string | string[] | undefined): string[] {
	if (!list) {
		return [];
	}

	return Array.isArray(list) ? list : [list];
}

export const SendersList = ({
	settingsObj,
	updateSettings,
	listType,
	showConflictText = false
}: SendersListProps): React.JSX.Element => {
	const [address, setAddress] = useState<string>('');
	const [sendersList, setSendersList] = useState<string[]>(
		listType === 'Allowed'
			? getList(settingsObj?.amavisWhitelistSender)
			: getList(settingsObj?.amavisBlacklistSender)
	);
	const sectionTitle = useMemo(
		() => (listType === 'Allowed' ? allowedSendersSubSection() : blockedSendersSubSection()),
		[listType]
	);

	const message = useMemo(() => getMessage(listType), [listType]);

	const onAdd = (): void => {
		updateSettings({
			target: {
				name: getPrefName(listType),
				value: [...sendersList, address]
			}
		});
		setAddress('');
		setSendersList([...sendersList, address]);
	};

	const isAddEnabled = useMemo(() => isValidEmail(address), [address]);
	const isInputValid = useMemo(() => isAddEnabled || address === '', [isAddEnabled, address]);

	const warningMessage = useMemo(
		() =>
			isInputValid
				? ''
				: t('messages.invalid_sender_address', 'Please enter only e-mail addresses'),
		[isInputValid]
	);

	const onRemove = useCallback(
		(item: string) => {
			const newList = filter(sendersList, (add) => add !== item);

			updateSettings({
				target: {
					name: getPrefName(listType),
					value: newList
				}
			});
			setSendersList(newList);
		},
		[sendersList, updateSettings, listType]
	);

	return (
		<Container background="gray6" padding={{ horizontal: 'medium', bottom: 'large' }}>
			<Container orientation="vertical" padding={{ all: 'medium', top: 'medium' }}>
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
			>
				<Row mainAlignment="flex-start" width="50vw">
					<Input
						label={t('label.enter_single_email_address', 'Enter email address')}
						value={address}
						hasError={!isInputValid}
						description={warningMessage}
						backgroundColor="gray5"
						onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setAddress(e.target.value)}
					/>
				</Row>
				<Padding left="medium">
					<Tooltip label={warningMessage} disabled={isAddEnabled} maxWidth="100%">
						<Button
							label={t('label.add', 'Add')}
							type="outlined"
							onClick={onAdd}
							disabled={!isAddEnabled}
						/>
					</Tooltip>
				</Padding>
			</Container>
			{showConflictText ? (
				<Container>
					<Text>
						{t(
							'message.senderslist_conflict',
							'If the same address is added to both allowed and blocked senders lists, the system will prioritize the allowed senders list.'
						)}
					</Text>
				</Container>
			) : null}
			<Container
				padding={{ horizontal: 'medium', bottom: 'small' }}
				orientation="vertical"
				mainAlignment="flex-start"
			>
				<ListV2 data-testid={'senders-list'}>
					{sendersList.map((address, idx) => (
						<SendersListItem key={idx} value={address} onRemove={onRemove} />
					))}
				</ListV2>

				{sendersList.length === 0 ? (
					<Container>
						<Text>
							{t('message.senderslist_empty', 'No addresses have been included in the list yet')}
						</Text>
					</Container>
				) : null}
			</Container>
		</Container>
	);
};
