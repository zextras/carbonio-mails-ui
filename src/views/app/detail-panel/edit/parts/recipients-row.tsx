/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useState } from 'react';

import { map, some } from 'lodash';

import { ParticipantRoleType } from '../../../../../carbonio-ui-commons/constants/participants';
import { USER_TYPES_CONST } from '../../../../../carbonio-ui-commons/integrations/constants';
import { useContactInput } from '../../../../../carbonio-ui-commons/integrations/hooks';
import { ContactInputItem } from '../../../../../carbonio-ui-commons/integrations/types';
import { Participant } from '../../../../../types';

export type RecipientsRowProps = {
	type: ParticipantRoleType;
	label: string;
	recipients: Array<Participant>;
	onRecipientsChange: (recipients: Array<Participant>) => void;
	dataTestid?: string;
	orderedAccountIds?: Array<string>;
};

/**
 * The component handle the input for participants of the given type
 * @param type
 * @param label
 * @param recipients
 * @param onRecipientsChange
 * @param dataTestid
 * @param orderedAccountIds
 * @constructor
 */
export const RecipientsRow: FC<RecipientsRowProps> = ({
	type,
	label,
	recipients,
	onRecipientsChange,
	dataTestid,
	orderedAccountIds
}) => {
	const ContactInput = useContactInput();
	const [contacts, setContacts] = useState<Record<string, ContactInputItem | undefined>>({});

	const onContactInputChange = useCallback(
		(contactChips: Array<ContactInputItem>): void => {
			const newContactsState = {} as Record<string, ContactInputItem>;
			contactChips.forEach((contact) => {
				newContactsState[contact.value.email] = contact;
			});
			setContacts(newContactsState);
			const updatedRecipients = map<ContactInputItem, Participant>(contactChips, (contact) => {
				const alreadyExists = recipients.find(
					(recipient) => recipient.address === contact.value.email
				);
				const isGroup = contact.value.type === USER_TYPES_CONST.CONTACT;
				return (
					alreadyExists || {
						id: contact.id,
						type,
						address: contact.value.email,
						isGroup,
						name:
							contact.value.type === USER_TYPES_CONST.CONTACT ? contact.value.firstName : undefined
					}
				);
			});
			onRecipientsChange(updatedRecipients);
		},
		[onRecipientsChange, recipients, type]
	);

	const recipientsAsContacts = map<Participant, ContactInputItem>(recipients, (recipient) => {
		const email = recipient.address;
		const exists = contacts[email];
		return (
			exists || {
				id: recipient.address,
				label: recipient.address,
				value: {
					id: recipient.address,
					email: recipient.address,
					type: recipient.isGroup ? USER_TYPES_CONST.DISTRIBUTION_LIST : USER_TYPES_CONST.CONTACT
				},
				error: recipient.error
			}
		);
	});

	return (
		<ContactInput
			data-testid={dataTestid}
			placeholder={label}
			onChange={onContactInputChange}
			defaultValue={recipientsAsContacts}
			hasError={some(recipients || [], { error: true })}
			dragAndDropEnabled
			orderedAccountIds={orderedAccountIds}
		/>
	);
};
