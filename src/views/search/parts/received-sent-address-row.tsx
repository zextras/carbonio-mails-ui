/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';
import { Container, ChipInput, ChipItem } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { t, useIntegratedComponent } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { RcvdSentAddressRowPropType, SearchChipItem } from '../../../types';
import { isValidEmail } from './utils';

const ReceivedSentAddressRow: FC<RcvdSentAddressRowPropType> = ({ compProps }): ReactElement => {
	const { receivedFromAddress, setReceivedFromAddress, sentFromAddress, setSentFromAddress } =
		compProps;

	const [ContactInput, integrationAvailable] = useIntegratedComponent('contact-input');

	const onChange = useCallback((state, stateHandler) => {
		stateHandler(state);
	}, []);

	const recipOnChange = useCallback(
		(label: ChipItem[]): void => onChange(label, setReceivedFromAddress),
		[onChange, setReceivedFromAddress]
	);

	const senderOnChange = useCallback(
		(label: ChipItem[]): void => onChange(label, setSentFromAddress),
		[onChange, setSentFromAddress]
	);

	const chipOnAdded = useCallback(
		(
			label,
			preText,
			hasAvatar,
			isGeneric,
			isQueryFilter,
			hasError,
			avatarIcon
		): SearchChipItem => ({
			label: `${preText}:${label}`,
			hasAvatar,
			isGeneric,
			isQueryFilter,
			value: `${preText}:${label}`,
			hasError,
			avatarIcon
		}),
		[]
	);

	const recipChipOnAdd = useCallback(
		(label: string | unknown): SearchChipItem =>
			chipOnAdded(
				label,
				'from',
				true,
				false,
				true,
				!isValidEmail(typeof label === 'string' ? label : ''),
				'EmailOutline'
			),
		[chipOnAdded]
	);

	const senderChipOnAdd = useCallback(
		(label: string | unknown): SearchChipItem =>
			chipOnAdded(
				label,
				'to',
				true,
				false,
				true,
				!isValidEmail(typeof label === 'string' ? label : ''),
				'EmailOutline'
			),
		[chipOnAdded]
	);

	const chipBackground = 'gray5';

	const handleReceivedFromChange = useCallback(
		(contacts) => {
			const chips = map(contacts, (contact) => ({
				hasAvatar: true,
				avatarIcon: 'EmailOutline',
				isGeneric: false,
				isQueryFilter: true,
				label: /^from:*/.test(contact.fullName || contact.label)
					? contact.fullName || contact.label
					: `from:${contact.fullName || contact.label}`,
				value: /^from:*/.test(contact.email || contact.value)
					? contact.email || contact.value
					: `from:${contact.email}`
			}));
			setReceivedFromAddress(chips);
		},
		[setReceivedFromAddress]
	);

	const handleSendToChange = useCallback(
		(contacts) => {
			const chips = map(contacts, (contact) => ({
				hasAvatar: true,
				avatarIcon: 'EmailOutline',
				isGeneric: false,
				isQueryFilter: true,
				label: /^to:*/.test(contact.fullName || contact.label)
					? contact.fullName || contact.label
					: `to:${contact.fullName || contact.label}`,
				value: /^to:*/.test(contact.email || contact.value)
					? contact.email || contact.value
					: `to:${contact.email}`
			}));
			setSentFromAddress(chips);
		},
		[setSentFromAddress]
	);

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
				{integrationAvailable ? (
					<ContactInput
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						placeholder={t('label.received_from_address', 'Received from (address)')}
						onChange={handleReceivedFromChange}
						defaultValue={receivedFromAddress ?? []}
					/>
				) : (
					<ChipInput
						placeholder={t('label.received_from_address', 'Received from (address)')}
						background={chipBackground}
						value={receivedFromAddress}
						onChange={recipOnChange}
						onAdd={recipChipOnAdd}
						maxChips={1}
						errorLabel={t('label.error_address', 'A valid e-mail is required')}
						hasError={!!(receivedFromAddress && receivedFromAddress[0]?.hasError)}
					/>
				)}
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				{integrationAvailable ? (
					<ContactInput
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						placeholder={t('label.sent_to_address', 'Sent to (address)')}
						onChange={handleSendToChange}
						defaultValue={sentFromAddress ?? []}
					/>
				) : (
					<ChipInput
						placeholder={t('label.sent_to_address', 'Sent to (address)')}
						background={chipBackground}
						value={sentFromAddress}
						onChange={senderOnChange}
						onAdd={senderChipOnAdd}
						maxChips={1}
						errorLabel={t('label.error_address', 'A valid e-mail is required')}
						hasError={!!(sentFromAddress && sentFromAddress[0]?.hasError)}
					/>
				)}
			</Container>
		</Container>
	);
};

export default ReceivedSentAddressRow;
