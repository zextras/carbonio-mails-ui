/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	CONTACT_TYPES,
	ContactInputItem,
	ParticipantRoleType,
	useContactInput
} from '@zextras/carbonio-ui-commons';
import { map, some } from 'lodash';

import { Participant } from 'types/participant';
import { isValidEmail } from 'views/search/parts/utils';

/**
 * Get the name for a contact based on available fields
 * @param contact - The contact input item
 * @returns The contact name or undefined
 */
const getContactName = (contact: ContactInputItem): string | undefined => {
	const { value } = contact;

	if (value.type === CONTACT_TYPES.DISTRIBUTION_LIST) {
		return value.fullName;
	}

	if (value.type !== CONTACT_TYPES.CONTACT) {
		return undefined;
	}

	if (value.fullName) {
		return value.fullName;
	}

	if (value.firstName && value.lastName) {
		return `${value.firstName} ${value.lastName}`;
	}

	return value.firstName;
};

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
				const isGroup = contact.value.type === CONTACT_TYPES.DISTRIBUTION_LIST;
				return (
					alreadyExists || {
						id: contact.id,
						type,
						address: contact.value.email,
						isGroup,
						name: getContactName(contact)
					}
				);
			});
			onRecipientsChange(updatedRecipients);
		},
		[onRecipientsChange, recipients, type]
	);

	const recipientsAsContacts = useMemo(
		() =>
			map<Participant, ContactInputItem>(recipients, (recipient) => {
				const email = recipient.address;
				const exists = contacts[email];
				const name = recipient.fullName ?? recipient.name;
				return (
					exists ?? {
						id: recipient.address,
						label: name ?? recipient.address,
						value: {
							id: recipient.address,
							email: recipient.address,
							fullName: name,
							type: recipient.isGroup ? CONTACT_TYPES.DISTRIBUTION_LIST : CONTACT_TYPES.CONTACT
						},
						error: !isValidEmail(recipient.address)
					}
				);
			}),
		[contacts, recipients]
	);

	return (
		<ContactInput
			data-testid={dataTestid}
			placeholder={label}
			onChange={onContactInputChange}
			defaultValue={recipientsAsContacts}
			hasError={some(recipientsAsContacts ?? [], { error: true })}
			dragAndDropEnabled
			orderedAccountIds={orderedAccountIds}
		/>
	);
};
