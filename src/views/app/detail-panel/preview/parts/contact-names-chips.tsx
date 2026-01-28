/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useRef, useState } from 'react';

import {
	Row,
	Text,
	Chip,
	Container,
	Padding,
	Badge,
	Popover
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { useUiUtilities } from 'hooks/use-ui-utilities';
import type { Participant } from 'types/index.d';
import { copyEmailToClipboard, sendMsg } from 'ui-actions/participant-displayer-actions';

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
					onClick: () => sendMsg(contact)
				},
				{
					id: 'action2',
					label: t('message.copy', 'Copy'),
					type: 'button',
					icon: 'Copy',
					background: 'gray3',
					onClick: () => copyEmailToClipboard(contact.address, createSnackbar)
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
				<ContactChip contact={contact} isExpanded={true} />
				{index !== contacts.length - 1 && <Separator />}
			</Row>
		))}
	</Container>
);

const CompactView = ({ contacts }: { contacts: Participant[] }): ReactElement => {
	const [open, setOpen] = useState(false);
	const popOverRef = useRef(null);

	const toggleOpen = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
		ev.stopPropagation();
		setOpen(true);
	};

	return (
		<Row data-testid={`chip-${contacts[0].address}`}>
			<ContactChip contact={contacts[0]} isExpanded={false} />
			{contacts.length > 1 && (
				<>
					<Separator />
					<Badge
						ref={popOverRef}
						color="gray6"
						maxValue={contacts.length - 1}
						value={contacts.length}
						onClick={toggleOpen}
					/>
					<Popover
						open={open}
						anchorEl={popOverRef}
						placement="bottom"
						disablePortal
						styleAsModal
						onClose={(): void => setOpen(false)}
					>
						<Container style={{ overflowY: 'auto' }} padding={{ all: 'small' }} gap="0.5rem">
							{map(contacts.slice(1), (contact, index) => (
								<Container orientation="horizontal" mainAlignment="flex-start" key={index}>
									<Text color="secondary" size="small">
										{generateChipName(contact)}
									</Text>
									<Padding right="extrasmall" />
									<ContactChip contact={contact} isExpanded={true} />
								</Container>
							))}
						</Container>
					</Popover>
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
