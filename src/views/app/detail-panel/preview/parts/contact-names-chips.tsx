/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement } from 'react';

import { Row, Text, Chip, Container, Padding } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { useUiUtilities } from 'hooks/use-ui-utilities';
import type { Participant } from 'types/index.d';
import { copyEmailToClipboard, sendMsg } from 'ui-actions/participant-displayer-actions';

export function generateChipName(contact: Participant): string {
	const chipName = contact.fullName ?? contact.name ?? '';
	if (chipName.includes(',')) {
		return `"${chipName}"`;
	}
	return chipName;
}

export const ContactNameChip: FC<{
	showOverflow?: boolean;
	contacts: Participant[];
	label: string;
}> = ({ contacts, label }): ReactElement => {
	const { createSnackbar } = useUiUtilities();
	const separator = ',';
	return (
		<>
			<Row mainAlignment="flex-start">
				<Text color="secondary" size="small" style={{ paddingRight: '0.25rem' }}>
					{label}
				</Text>
			</Row>
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
							<Chip
								label={contact.address}
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
							{index !== contacts.length - 1 && (
								<Padding left="extrasmall">
									<Text color="secondary" size="small">
										{separator}
									</Text>
								</Padding>
							)}
						</Row>
					))}
				</Container>
			</Row>
		</>
	);
};
