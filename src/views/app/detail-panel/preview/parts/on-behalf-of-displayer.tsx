/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement } from 'react';
import { Trans } from 'react-i18next';
import { TextWithTooltip } from '@zextras/carbonio-design-system';
import { capitalize } from 'lodash';
import { MailMessage } from '../../../../../types/mail-message';
import { Participant } from '../../../../../types/participant';

const OnBehalfOfDisplayer: FC<{
	compProps: { senderContact: Participant; mainContact: Participant; message: MailMessage };
}> = ({ compProps: { senderContact, mainContact, message } }): ReactElement => (
	<Trans
		i18nKey="label.behalf_of"
		values={{
			fullName: capitalize(senderContact.fullName),
			address: senderContact.address,
			mainContactFullName: capitalize(mainContact.fullName || mainContact.name),
			mainContactAddress: mainContact.address
		}}
		defaults={
			'<Row> <PrimaryText> {{fullName}} </PrimaryText>  <GrayText> {{address}} </GrayText> <NormalText> on behalf of </NormalText> <PrimaryText> {{mainContactFullName}} </PrimaryText> <GrayText> {{mainContactAddress}} </GrayText> </Row>'
		}
		components={{
			Row: <TextWithTooltip size="small" />,
			PrimaryText: (
				<span
					style={{
						color: message.read ? '#333333' : '#2b73d2',
						fontWeight: message.read ? 'normal' : 'bold'
					}}
				/>
			),
			GrayText: <span style={{ color: '#828282', fontWeight: message.read ? 'normal' : 'bold' }} />,
			NormalText: <span />
		}}
	/>
);

export default OnBehalfOfDisplayer;
