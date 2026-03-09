/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import {
	Row,
	Text,
	Chip,
	Container,
	Padding,
	Button,
	DropdownItem,
	Dropdown,
	Tooltip
} from '@zextras/carbonio-design-system';
import { map, noop } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useUiUtilities } from 'hooks/use-ui-utilities';
import { Participant } from 'types/participant';
import { copyEmailToClipboard, sendMsg } from 'ui-actions/participant-displayer-actions';

const BadgeButton = styled(Button)`
	padding: 0.125rem 0.5rem;
`;

export function generateChipName(contact: Participant): string {
	const chipName = contact.fullName ?? contact.name ?? '';

	const capitalizedName = chipName
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');

	if (capitalizedName.includes(',')) {
		return `"${capitalizedName}"`;
	}
	return capitalizedName;
}

const Separator = (): React.JSX.Element => (
	<Padding horizontal="extrasmall">
		<Text color="secondary" size="small">
			{','}
		</Text>
	</Padding>
);

export const ContactChip: FC<{
	contact: Participant;
	isExpanded: boolean;
}> = ({ contact, isExpanded }): ReactElement => {
	const { createSnackbar } = useUiUtilities();
	const [t] = useTranslation();

	const handleSendMsg = useCallback(
		(e: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => {
			e.stopPropagation();
			sendMsg(contact);
		},
		[contact]
	);

	const handleCopyEmailToClipboard = useCallback(
		(e: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => {
			e.stopPropagation();
			copyEmailToClipboard(contact.address, createSnackbar);
		},
		[contact, createSnackbar]
	);

	return (
		<Chip
			label={contact.address}
			hasAvatar={isExpanded}
			background="gray2"
			color="text"
			actions={[
				{
					id: 'action1',
					label: t('message.send_email', 'Send e-mail'),
					type: 'button',
					icon: 'EmailOutline',
					background: 'gray3',
					onClick: handleSendMsg
				},
				{
					id: 'action2',
					label: t('message.copy', 'Copy'),
					type: 'button',
					icon: 'Copy',
					background: 'gray3',
					onClick: handleCopyEmailToClipboard
				}
			]}
		/>
	);
};

const PlainView = ({ contacts }: { contacts: Participant[] }): ReactElement => (
	<Container
		orientation="horizontal"
		wrap="wrap"
		mainAlignment="flex-start"
		style={{ gap: '0.5rem' }}
	>
		{map(contacts, (contact, index) => (
			<Row data-testid={`chip-${contact.address}`} key={index}>
				<Text color="secondary" size="small">
					{generateChipName(contact)}
				</Text>
				<Padding right="extrasmall" />
				<ContactChip contact={contact} isExpanded />
				{index !== contacts.length - 1 && <Separator />}
			</Row>
		))}
	</Container>
);

const CompactView = ({ contacts }: { contacts: Participant[] }): ReactElement => {
	const { createSnackbar } = useUiUtilities();

	const [t] = useTranslation();

	const moreLabel = t('tooltip.view_more', {
		defaultValue_one: 'View {{count}} more item',
		defaultValue_other: 'View {{count}} more items',
		count: contacts.length - 1
	});

	const handleCopyEmailToClipboard = useCallback(
		(e: React.SyntheticEvent<HTMLElement> | KeyboardEvent, contact: Participant) => {
			e.stopPropagation();
			copyEmailToClipboard(contact.address, createSnackbar);
		},
		[createSnackbar]
	);

	const options: DropdownItem[] = useMemo(
		() => [
			...map(contacts.slice(1), (contact, index) => ({
				id: `contact-${index}`,
				label: contact.name,
				onClick: (ev: React.SyntheticEvent<HTMLElement> | KeyboardEvent) =>
					handleCopyEmailToClipboard(ev, contact),
				customComponent: (
					<Container orientation="horizontal" mainAlignment="flex-start" key={index}>
						<Text color="secondary" size="small">
							{generateChipName(contact)}
						</Text>
						<Padding right="extrasmall" />
						<ContactChip contact={contact} isExpanded />
					</Container>
				)
			}))
		],
		[contacts, handleCopyEmailToClipboard]
	);

	return (
		<Row data-testid={`chip-${contacts[0].address}`}>
			<ContactChip contact={contacts[0]} isExpanded={false} />
			{contacts.length > 1 && (
				<>
					<Separator />
					<Tooltip label={moreLabel}>
						<Dropdown
							disableAutoFocus
							items={options}
							data-testid="options-dropdown"
							maxWidth="500px"
						>
							<BadgeButton
								onClick={noop}
								size="small"
								backgroundColor="gray2"
								labelColor="text"
								label={`+${contacts.length - 1}`}
								shape="round"
							/>
						</Dropdown>
					</Tooltip>
				</>
			)}
		</Row>
	);
};

export const ContactNameChip: FC<{
	contacts: Participant[];
	label: string;
	isWide: boolean;
}> = ({ contacts, label, isWide }): ReactElement => (
	<Row mainAlignment="flex-start" crossAlignment="flex-start">
		<Text color="secondary" size="small" style={{ paddingRight: '0.25rem' }}>
			{label}
		</Text>
		<Row
			mainAlignment="flex-start"
			takeAvailableSpace
			height="fit"
			orientation="vertical"
			display="flex"
			wrap={'nowrap'}
			style={{
				lineHeight: '1.125rem',
				flexDirection: 'row',
				overflow: 'hidden'
			}}
		>
			{isWide ? <PlainView contacts={contacts} /> : <CompactView contacts={contacts} />}
		</Row>
	</Row>
);
