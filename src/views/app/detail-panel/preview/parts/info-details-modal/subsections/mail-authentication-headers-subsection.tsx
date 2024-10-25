/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Divider, Icon, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MailAuthenticationHeaders } from '../../../../../../../types';
import { getAuthenticationHeadersIconColor } from '../../utils';

type MailGeneralInfoSubsectionProps = {
	authenticationInfo: MailAuthenticationHeaders;
};

export const MailAuthenticationHeadersSubsection = ({
	authenticationInfo
}: MailGeneralInfoSubsectionProps): React.JSX.Element => {
	const [t] = useTranslation();
	const authenticationHeadersIcon = getAuthenticationHeadersIconColor(authenticationInfo);

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
			{authenticationInfo?.dkim && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text size="small">
						<strong>{'DKIM:'}</strong> {authenticationInfo.dkim.value}
					</Text>
				</Row>
			)}
			{authenticationInfo?.dmarc && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text size="small">
						<strong>{'DMARC:'}</strong> {authenticationInfo.dmarc.value}
					</Text>
				</Row>
			)}
			{authenticationInfo?.spf && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text size="small">
						<strong>{'SPF:'}</strong> {authenticationInfo.spf.value}
					</Text>
				</Row>
			)}
		</Container>
	);
};
