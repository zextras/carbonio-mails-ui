/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useMemo, useRef, useState } from 'react';

import {
	Row,
	Text,
	Chip,
	Container,
	Padding,
	Popover,
	Button,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { useUiUtilities } from 'hooks/use-ui-utilities';
import type { Participant } from 'types/index.d';
import { copyEmailToClipboard, sendMsg } from 'ui-actions/participant-displayer-actions';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

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
				<ContactChip contact={contact} isExpanded={true} />
				{index !== contacts.length - 1 && <Separator />}
			</Row>
		))}
	</Container>
);

const CompactView = ({ contacts }: { contacts: Participant[] }): ReactElement => {
	const [t] = useTranslation();

	const [open, setOpen] = useState(false);
	const popOverRef = useRef(null);

	const moreLabel = useMemo(
		() =>
			t('tooltip.view_more', {
				count: contacts.length - 1,
				defaultValue_one: 'View {{count}} more item',
				defaultValue_other: 'View {{count}} more items'
			}),
		[t, contacts]
	);

	const toggleOpen = useCallback(
		(ev: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent): void => {
			ev.stopPropagation();
			setOpen(!open);
		},
		[open]
	);

	const handleClose = useCallback(() => {
		setOpen(false);
	}, []);

	return (
		<Row data-testid={`chip-${contacts[0].address}`}>
			<ContactChip contact={contacts[0]} isExpanded={false} />
			{contacts.length > 1 && (
				<>
					<Separator />
					<Tooltip label={moreLabel}>
						<BadgeButton
							ref={popOverRef}
							onClick={toggleOpen}
							size="small"
							backgroundColor="gray2"
							labelColor="text"
							label={`+${contacts.length - 1}`}
							shape="round"
						/>
					</Tooltip>
					<Popover
						open={open}
						anchorEl={popOverRef}
						placement="bottom-end"
						onClose={handleClose}
						styleAsModal
						disablePortal
						style={{ maxHeight: '300px' }}
					>
						<Container orientation="horizontal" crossAlignment="flex-start">
							<Container padding={{ all: 'small' }} gap="0.5rem">
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
							<Container>
								<Button
									onClick={toggleOpen}
									size="small"
									color="text"
									type="ghost"
									icon="CloseOutline"
								/>
							</Container>
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
