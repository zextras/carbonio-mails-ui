/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { USER_TYPES_CONST } from '../../../carbonio-ui-commons/integrations/constants';
import { useContactInput } from '../../../carbonio-ui-commons/integrations/hooks';
import { ContactInputItem } from '../../../carbonio-ui-commons/integrations/types';
import type {
	RcvdSentAddressRowPropType,
	ContactInputItem as ContactInputItemInternal
} from '../../../types';
import { getChipItems } from '../utils';

export const ReceivedSentAddressRow: FC<RcvdSentAddressRowPropType> = ({
	compProps
}): ReactElement => {
	const { receivedFromAddress, setReceivedFromAddress, sentToAddress, setSentToAddress } =
		compProps;

	const internalReceivedFromAddress: ContactInputItem[] = useMemo(
		() =>
			map(receivedFromAddress, (address) => ({
				id: address.id,
				label: address.label,
				value: {
					id: address.id,
					email: address.value ?? address.label,
					type: USER_TYPES_CONST.CONTACT
				}
			})),
		[receivedFromAddress]
	);

	const ContactInput = useContactInput();

	const handleReceivedFromChange = useCallback(
		(contacts: Array<ContactInputItem>) => {
			const contactItems: ContactInputItemInternal[] = map(contacts, (contact) => ({
				value: contact.value.email,
				label: contact.label,
				id: contact.value.email,
				error: contact.error
			}));
			const chips = getChipItems(contactItems, 'from');
			setReceivedFromAddress(chips);
		},
		[setReceivedFromAddress]
	);

	const handleSentToChange = useCallback(
		(contacts: Array<ContactInputItem>) => {
			const contactItems: ContactInputItemInternal[] = map(contacts, (contact) => ({
				value: contact.value.email,
				label: contact.label,
				id: contact.value.email,
				error: contact.error
			}));
			const chips = getChipItems(contactItems, 'to');
			setSentToAddress(chips);
		},
		[setSentToAddress]
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
					defaultValue={sentToAddress ?? []}
				/>
			</Container>
		</Container>
	);
};
