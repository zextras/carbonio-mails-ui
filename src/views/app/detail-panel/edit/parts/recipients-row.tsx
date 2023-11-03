/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { ChipInput, ChipItem } from '@zextras/carbonio-design-system';
import { useIntegratedComponent } from '@zextras/carbonio-shell-ui';
import { map, reject, some } from 'lodash';

import { ParticipantRoleType } from '../../../../../carbonio-ui-commons/constants/participants';
import { Participant } from '../../../../../types';

const emailRegex =
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, max-len, no-control-regex
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

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
};

/**
 * The component handle the input for participants of the given type
 * @param type
 * @param label
 * @param recipients
 * @param onRecipientsChange
 * @param dataTestid
 * @constructor
 */
export const RecipientsRow: FC<RecipientsRowProps> = ({
	type,
	label,
	recipients,
	onRecipientsChange,
	dataTestid
}) => {
	const [ContactInput, isAvailable] = useIntegratedComponent('contact-input');

	const onContactInputChange = (contacts: Array<ContactType>): void => {
		const updatedRecipients = map<ContactType, Participant>(
			contacts,
			(contact) =>
				({
					...contact,
					email: contact.email,
					error: contact.error,
					type,
					address: contact.email,
					name: contact.firstName,
					fullName: contact.fullName
				} as Participant)
		);
		onRecipientsChange(updatedRecipients);
	};

	const chipInputValues = map<Participant, ChipItem<string>>(recipients, (recipient) => ({
		label: recipient.address
	}));

	const onChipInputAdd = (value: string | unknown): ChipItem =>
		typeof value === 'string'
			? { label: value, error: !emailRegex.test(value) }
			: { label: 'unknown data', error: true };

	const onChipInputChange = (contacts: Array<ChipItem<string>>): void => {
		const data = map(
			reject(contacts, ['error', true]),
			(contact) =>
				({
					name: contact.label,
					address: contact.label,
					fullName: contact.label,
					type
				} as Participant)
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
					defaultValue={recipients}
					bottomBorderColor="transparent"
					hasError={some(recipients || [], { error: true })}
					dragAndDropEnabled
				/>
			) : (
				<ChipInput
					data-testid={dataTestid}
					placeholder={label}
					maxChips={null}
					onAdd={onChipInputAdd}
					onChange={onChipInputChange}
					defaultValue={chipInputValues}
					background="gray5"
					hasError={some(recipients || [], { error: true })}
				/>
			)}
		</>
	);
};
