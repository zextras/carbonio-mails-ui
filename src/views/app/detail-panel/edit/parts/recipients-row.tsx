/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { ChipInput, ChipItem } from '@zextras/carbonio-design-system';
import { useIntegratedComponent } from '@zextras/carbonio-shell-ui';
import { map, reject, some } from 'lodash';

import { ParticipantRoleType } from '../../../../../carbonio-ui-commons/constants/participants';
import { isValidEmail, parseEmail } from '../../../../../carbonio-ui-commons/helpers/email-parser';
import { Participant } from '../../../../../types';

export interface ContactType extends ChipItem {
	email: string;
	firstName?: string;
	lastName?: string;
	fullName?: string;
	label?: string;
	error?: boolean;
}

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
	const [ContactInput, isAvailable] = useIntegratedComponent('contact-input');

	const onContactInputChange = useCallback(
		(contacts: Array<ContactType>): void => {
			const updatedRecipients = map<ContactType, Participant>(
				contacts,
				(contact) =>
					({
						...contact,
						type,
						address: contact.email,
						name: contact.firstName
					}) as Participant
			);
			onRecipientsChange(updatedRecipients);
		},
		[onRecipientsChange, type]
	);

	const recipientsAsContacts = map<Participant, ContactType>(recipients, (recipient) => ({
		...recipient,
		label: recipient.address,
		email: recipient.address,
		error: recipient.error
	}));

	const onChipInputAdd = (value: string | unknown): ChipItem => {
		if (typeof value === 'string') {
			const parsed = parseEmail(value) ?? value;
			return { label: parsed, error: !isValidEmail(parsed) };
		}
		return { label: 'unknown data', error: true };
	};

	const onChipInputChange = (contacts: Array<ChipItem>): void => {
		const data = map(
			reject(contacts, ['error', true]),
			(contact) =>
				({
					name: contact.label,
					address: contact.label,
					fullName: contact.label,
					type
				}) as Participant
		);
		onRecipientsChange(data);
	};

	return (
		<>
			{isAvailable ? (
				<ContactInput
					data-testid={dataTestid}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					placeholder={label}
					maxChips={null}
					onChange={onContactInputChange}
					defaultValue={recipientsAsContacts}
					bottomBorderColor="transparent"
					hasError={some(recipients || [], { error: true })}
					dragAndDropEnabled
					orderedAccountIds={orderedAccountIds}
				/>
			) : (
				<ChipInput
					data-testid={dataTestid}
					placeholder={label}
					maxChips={null}
					onAdd={onChipInputAdd}
					onChange={onChipInputChange}
					defaultValue={recipientsAsContacts}
					background="gray5"
					hasError={some(recipients || [], { error: true })}
					createChipOnPaste
					pasteSeparators={[',', ';', ' ', '\n']}
					separators={[
						{ code: 'Enter', ctrlKey: false },
						{ code: 'NumpadEnter', ctrlKey: false },
						{ key: ',', ctrlKey: false },
						{ key: ';', ctrlKey: false }
					]}
				/>
			)}
		</>
	);
};
