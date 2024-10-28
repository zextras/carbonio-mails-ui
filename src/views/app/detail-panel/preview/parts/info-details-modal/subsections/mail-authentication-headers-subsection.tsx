/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import {
	Container,
	Divider,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MailAuthenticationHeaders } from '../../../../../../../types';
import { getAuthenticationHeadersIconColor } from '../../utils';

type MailGeneralInfoSubsectionProps = {
	authenticationMailsHeaders: MailAuthenticationHeaders;
};

export const MailAuthenticationHeadersSubsection = ({
	authenticationMailsHeaders
}: MailGeneralInfoSubsectionProps): React.JSX.Element => {
	const [t] = useTranslation();
	const authenticationHeadersIcon = getAuthenticationHeadersIconColor(authenticationMailsHeaders);

	const headerLabel = t(
		'messages.modal.mail_authentication_headers.title',
		'Authentication Headers'
	);

	return (
		<Container
			mainAlignment="flex-start"
			orientation="vertical"
			crossAlignment="flex-start"
			data-testid="mail-info-subsection"
		>
			<Padding top={'medium'} />
			<Divider />
			<Padding top={'medium'} />
			<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
				<Icon
					size="medium"
					icon={'ShieldOutline'}
					color={authenticationHeadersIcon}
					style={{ alignSelf: 'center', paddingRight: '0.5rem' }}
				/>
				<Text weight="bold">{headerLabel}</Text>
			</Row>
			<Padding top={'medium'} />
			{authenticationMailsHeaders?.dkim && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Tooltip placement="top" maxWidth="fit" label={authenticationMailsHeaders.dkim.value}>
						<Text size="small">
							<strong>{'DKIM:'}</strong> {authenticationMailsHeaders.dkim.value}
						</Text>
					</Tooltip>
				</Row>
			)}
			{authenticationMailsHeaders?.dmarc && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Tooltip placement="top" maxWidth="fit" label={authenticationMailsHeaders.dmarc.value}>
						<Text size="small">
							<strong>{'DMARC:'}</strong> {authenticationMailsHeaders.dmarc.value}
						</Text>
					</Tooltip>
				</Row>
			)}
			{authenticationMailsHeaders?.spf && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Tooltip placement="top" maxWidth="fit" label={authenticationMailsHeaders.spf.value}>
						<Text size="small">
							<strong>{'SPF:'}</strong> {authenticationMailsHeaders.spf.value}
						</Text>
					</Tooltip>
				</Row>
			)}
		</Container>
	);
};
