/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { CONTACT_TYPES } from '../../../carbonio-ui-commons/integrations/constants';
import { useContactInput } from '../../../carbonio-ui-commons/integrations/hooks';
import { ContactInputItem } from '../../../carbonio-ui-commons/integrations/types';
import { SearchEmailValue } from '../../../types';

type ReceivedSentAddressRowProps = {
	compProps: {
		receivedFromAddresses: Array<SearchEmailValue>;
		handleReceivedFromInput: (arg: Array<ContactInputItem>) => void;
		sentToAddresses: Array<SearchEmailValue>;
		handleSentToInput: (arg: Array<ContactInputItem>) => void;
	};
};

function newChipFromAddress(searchValue: SearchEmailValue): ContactInputItem {
	const { email } = searchValue;
	return {
		id: email,
		label: email,
		value: {
			id: email,
			email,
			type: CONTACT_TYPES.CONTACT
		}
	};
}
export const ReceivedSentAddressRow: FC<ReceivedSentAddressRowProps> = ({
	compProps
}): ReactElement => {
	const { receivedFromAddresses, handleReceivedFromInput, sentToAddresses, handleSentToInput } =
		compProps;

	const [sentToChips, setSentToChips] = useState<Record<string, ContactInputItem | undefined>>({});
	const [receivedFromChips, setReceivedFromChips] = useState<
		Record<string, ContactInputItem | undefined>
	>({});

	const ContactInput = useContactInput();

	const handleReceivedFromChange = useCallback(
		(contacts: Array<ContactInputItem>) => {
			const newValues = {} as Record<string, ContactInputItem>;
			contacts.forEach((contact: ContactInputItem) => {
				newValues[contact.value.email] = contact;
			});
			setReceivedFromChips(newValues);
			handleReceivedFromInput(contacts);
		},
		[handleReceivedFromInput]
	);

	const handleSentToChange = useCallback(
		(contacts: Array<ContactInputItem>) => {
			const newValues = {} as Record<string, ContactInputItem>;
			contacts.forEach((contact: ContactInputItem) => {
				newValues[contact.value.email] = contact;
			});
			setSentToChips(newValues);
			handleSentToInput(contacts);
		},
		[handleSentToInput]
	);

	const internalReceivedFromAddress: ContactInputItem[] = useMemo(
		() =>
			map(receivedFromAddresses, (address) => {
				const existingChip = receivedFromChips[address.email];
				return existingChip || newChipFromAddress(address);
			}),
		[receivedFromAddresses, receivedFromChips]
	);
	const internalSentToAddress: ContactInputItem[] = useMemo(
		() =>
			map(sentToAddresses, (address) => {
				const existingChip = sentToChips[address.email];
				return existingChip || newChipFromAddress(address);
			}),
		[sentToAddresses, sentToChips]
	);

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
				<ContactInput
					data-testid={'received-from-input'}
					placeholder={t('label.from', 'From')}
					onChange={handleReceivedFromChange}
					defaultValue={internalReceivedFromAddress}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				<ContactInput
					data-testid={'sent-to-input'}
					placeholder={t('label.to', 'To')}
					onChange={handleSentToChange}
					defaultValue={internalSentToAddress}
				/>
			</Container>
		</Container>
	);
};
