/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { capitalize, map } from 'lodash';
import React, { FC, ReactElement } from 'react';
import styled from 'styled-components';
import { Tooltip, Text, Padding } from '@zextras/carbonio-design-system';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { participantToString } from '../../../../../commons/utils';
import { Participant } from '../../../../../types/participant';

const ContactSubText = styled(Text)`
	padding: 0 2px;
	&:not(:last-child) {
		&:after {
			content: ',';
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
			<Text color="secondary" size="small">
				{label}
			</Text>
			{map(contacts, (contact) => (
				<Tooltip label={contact.address} key={contact.address}>
					<ContactSubText color="secondary" size="small">
						{capitalize(participantToString(contact, t, accounts))}
					</ContactSubText>
				</Tooltip>
			))}
		</>
	);
};

export default ContactName;
