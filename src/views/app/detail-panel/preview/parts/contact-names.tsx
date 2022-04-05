/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { capitalize, map } from 'lodash';
import React, { FC, ReactElement } from 'react';
import styled from 'styled-components';
import { Tooltip } from '@zextras/carbonio-design-system';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { participantToString } from '../../../../../commons/utils';
import { Participant } from '../../../../../types/participant';

const ContactText = styled.span`
	font-family: 'Roboto';
	font-style: normal;
	font-weight: 300;
	font-size: 12px;
	line-height: 18px;
	display: flex;
	align-items: center;
	color: #828282;
	&:not(:first-child) {
		&:before {
			content: '';
			padding: 0 2px;
		}
	}
`;
const ContactSubText = styled.span`
	font-family: 'Roboto';
	font-style: normal;
	font-weight: 300;
	font-size: 12px;
	line-height: 18px;
	display: flex;
	align-items: center;
	color: #828282;
	&:not(:last-child) {
		&:after {
			content: ',';
			padding: 0 2px;
		}
	}
`;

const ContactName: FC<{ contacts: Participant[]; label: string }> = ({
	contacts,
	label
}): ReactElement => {
	const accounts = useUserAccounts();
	const [t] = useTranslation();
	return (
		<>
			<ContactText> {label} </ContactText>
			{map(contacts, (contact) => (
				<Tooltip label={contact.address} key={contact.address}>
					<ContactSubText>{capitalize(participantToString(contact, t, accounts))}</ContactSubText>
				</Tooltip>
			))}
		</>
	);
};

export default ContactName;
