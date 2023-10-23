/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement } from 'react';

import { Row, Text, Chip, Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import type { Participant } from '../../../../../types';
import {
	copyEmailToClipboard,
	sendMsg
} from '../../../../../ui-actions/participant-displayer-actions';

const ContactNameChip: FC<{
	showOverflow?: boolean;
	contacts: Participant[];
	label: string;
}> = ({ contacts, label }): ReactElement => (
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
				{map(contacts, (contact) => (
					<Chip
						label={contact.address}
						background="gray2"
						color="text"
						data-testid={'Chip'}
						actions={[
							{
								id: 'action1',
								label: t('message.send_email', 'Send e-mail'),
								type: 'button',
								icon: 'EmailOutline',
								// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
								onClick: () => {
									sendMsg(contact);
								}
							},
							{
								id: 'action2',
								label: t('message.copy', 'Copy'),
								type: 'button',
								icon: 'Copy',
								// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
								onClick: () => {
									copyEmailToClipboard(contact.address);
								}
							}
						]}
					/>
				))}
			</Container>
		</Row>
	</>
);

export default ContactNameChip;
