/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState, useCallback } from 'react';

import {
	Container,
	Padding,
	Tooltip,
	Button,
	Row,
	Input,
	ListV2,
	Text,
	FormSection,
	FormSubSection
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';

import { InputProps } from 'types/settings';
import { isValidEmail } from 'views/search/parts/utils';
import { SendersListItem } from 'views/settings/components/senders-list-item';
import { allowedSendersSubSection, blockedSendersSubSection } from 'views/settings/subsections';

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
			? // TODO: update types in soap lib to avoid this type assertion
				getList(settingsObj?.amavisWhitelistSender as string[] | undefined)
			: getList(settingsObj?.amavisBlacklistSender as string[] | undefined)
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

	const itemsCount = sendersList?.length || 0;
	const maxItems =
		(listType === 'Allowed'
			? settingsObj?.zimbraMailWhitelistMaxNumEntries
			: settingsObj?.zimbraMailBlacklistMaxNumEntries) || 100;

	// TODO: update types in soap lib to avoid type assertion
	const isInsertEnabled = useMemo(
		() => itemsCount < (typeof maxItems === 'number' ? maxItems : 100),
		[itemsCount, maxItems]
	);

	const isInputValid = useMemo(() => isValidEmail(address) || address === '', [address]);
	const isAddEnabled = useMemo(
		() => isValidEmail(address) && isInsertEnabled,
		[address, isInsertEnabled]
	);

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
		<FormSection id={sectionTitle.id} label={sectionTitle.label}>
			<FormSubSection>
				<Tooltip label={message} overflowTooltip>
					<Text>{message}</Text>
				</Tooltip>
				<Container
					orientation="horizontal"
					height={'fit'}
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					<Row mainAlignment="flex-start" width="50vw">
						<Input
							label={t('label.enter_single_email_address', 'Enter email address')}
							value={address}
							hasError={!isInputValid}
							description={warningMessage || undefined}
							backgroundColor="gray5"
							onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
								setAddress(e.target.value)
							}
							disabled={!isInsertEnabled}
						/>
					</Row>
					<Tooltip label={warningMessage} disabled={isAddEnabled} maxWidth="100%">
						<Padding left="medium" top="extrasmall">
							<Button
								label={t('label.add', 'Add')}
								type="outlined"
								onClick={onAdd}
								disabled={!isAddEnabled}
							/>
						</Padding>
					</Tooltip>
				</Container>
				{showConflictText ? (
					<Container
						crossAlignment="flex-start"
						padding={{ bottom: 'large', horizontal: 'medium' }}
					>
						<Text size="small" color="gray1">
							{t(
								'message.senderslist_conflict',
								'If the same address is added to both allowed and blocked senders lists, the system will prioritize the allowed senders list.'
							)}
						</Text>
					</Container>
				) : null}
				<Container
					orientation="vertical"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					height={'fit'}
				>
					<ListV2 data-testid={'senders-list'}>
						{sendersList.map((address, idx) => (
							<SendersListItem key={idx} value={address} onRemove={onRemove} />
						))}
					</ListV2>

					{sendersList.length === 0 ? (
						<Container>
							<Text color="secondary">
								{t('message.senderslist_empty', 'No addresses have been included in the list yet')}
							</Text>
						</Container>
					) : null}
					<Container
						mainAlignment="flex-start"
						crossAlignment="flex-start"
						padding={{ top: 'extralarge', left: 'small' }}
					>
						<Text size="small">
							{t('label.senderslist_numentries', {
								count: itemsCount,
								max: maxItems,
								defaultValue_one: '{{count}} of {{max}}',
								defaultValue_other: '{{count}} of {{max}}'
							})}
						</Text>
					</Container>
				</Container>
			</FormSubSection>
		</FormSection>
	);
};
