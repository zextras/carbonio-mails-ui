/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Container, ChipInput, ChipItem } from '@zextras/carbonio-design-system';
import { t, useIntegratedComponent } from '@zextras/carbonio-shell-ui';

import { isValidEmail } from './utils';
import type { ContactInputItem, RcvdSentAddressRowPropType, SearchChipItem } from '../../../types';
import { getChipItems } from '../utils';

export const ReceivedSentAddressRow: FC<RcvdSentAddressRowPropType> = ({
	compProps
}): ReactElement => {
	const { receivedFromAddress, setReceivedFromAddress, sentToAddress, setSentToAddress } =
		compProps;

	const [ContactInput, integrationAvailable] = useIntegratedComponent('contact-input');

	const onChange = useCallback((state, stateHandler) => {
		stateHandler(state);
	}, []);

	const recipOnChange = useCallback(
		(label: ChipItem[]): void => onChange(label, setReceivedFromAddress),
		[onChange, setReceivedFromAddress]
	);

	const sentToOnChange = useCallback(
		(label: ChipItem[]): void => onChange(label, setSentToAddress),
		[onChange, setSentToAddress]
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

	const sentToChipOnAdd = useCallback(
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
		(contacts: Array<ContactInputItem>) => {
			const chips = getChipItems(contacts, 'from');
			setReceivedFromAddress(chips);
		},
		[setReceivedFromAddress]
	);

	const handleSentToChange = useCallback(
		(contacts) => {
			const chips = getChipItems(contacts, 'to');
			setSentToAddress(chips);
		},
		[setSentToAddress]
	);

	const receivedFromHasError = useMemo(
		() => !!(receivedFromAddress && receivedFromAddress[0]?.hasError),
		[receivedFromAddress]
	);

	const sentFromHasError = useMemo(
		() => !!(sentToAddress && sentToAddress[0]?.hasError),
		[sentToAddress]
	);

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
				{integrationAvailable ? (
					<ContactInput
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						placeholder={t('label.from', 'From')}
						onChange={handleReceivedFromChange}
						defaultValue={receivedFromAddress ?? []}
					/>
				) : (
					<ChipInput
						placeholder={t('label.from', 'From')}
						background={chipBackground}
						value={receivedFromAddress}
						onChange={recipOnChange}
						onAdd={recipChipOnAdd}
						maxChips={1}
						description={
							receivedFromHasError
								? t('label.error_address', 'A valid e-mail is required')
								: undefined
						}
						hasError={receivedFromHasError}
					/>
				)}
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				{integrationAvailable ? (
					<ContactInput
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						placeholder={t('label.to', 'To')}
						onChange={handleSentToChange}
						defaultValue={sentToAddress ?? []}
					/>
				) : (
					<ChipInput
						placeholder={t('label.to', 'To')}
						background={chipBackground}
						value={sentToAddress}
						onChange={sentToOnChange}
						onAdd={sentToChipOnAdd}
						maxChips={1}
						description={
							sentFromHasError ? t('label.error_address', 'A valid e-mail is required') : undefined
						}
						hasError={sentFromHasError}
					/>
				)}
			</Container>
		</Container>
	);
};
