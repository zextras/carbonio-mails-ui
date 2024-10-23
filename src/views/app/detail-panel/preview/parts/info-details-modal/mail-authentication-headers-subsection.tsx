/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Divider, Icon, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import {
	getAuthenticationHeadersIcon,
	getHasAuthenticationHeaders
} from '../../../../../../normalizations/mail-header-utils';
import { IncompleteMessage } from '../../../../../../types';

type MailGeneralInfoSubsectionProps = {
	mailAuthenticationHeaders: IncompleteMessage['authenticationHeaders'] | undefined;
};

export const MailAuthenticationHeadersSubsection = ({
	mailAuthenticationHeaders
}: MailGeneralInfoSubsectionProps): React.JSX.Element => {
	const [t] = useTranslation();
	const hasAuthenticationHeaders = getHasAuthenticationHeaders(mailAuthenticationHeaders);
	const authenticationHeadersIcon = getAuthenticationHeadersIcon(mailAuthenticationHeaders);

	if (!hasAuthenticationHeaders) return <></>;

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
					icon={authenticationHeadersIcon}
					style={{ alignSelf: 'center', paddingRight: '0.5rem' }}
				/>
				<Text weight="bold">{headerLabel}</Text>
			</Row>
			<Padding top={'medium'} />
			{mailAuthenticationHeaders?.dkim && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text weight="bold" size="small">
						{'DKIM:'}
					</Text>
					<Padding right={'medium'} />
					<Text overflow={'break-word'} size="small">
						{mailAuthenticationHeaders.dkim.value}
					</Text>
				</Row>
			)}
			{mailAuthenticationHeaders?.dmarc && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text weight="bold" size="small">
						{'DMARC:'}
					</Text>
					<Padding right={'medium'} />
					<Text overflow={'break-word'} size="small">
						{mailAuthenticationHeaders.dmarc.value}
					</Text>
				</Row>
			)}
			{mailAuthenticationHeaders?.spf && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text weight="bold" size="small">
						{'SPF:'}
					</Text>
					<Padding right={'medium'} />
					<Text overflow={'break-word'} size="small">
						{mailAuthenticationHeaders.spf.value}
					</Text>
				</Row>
			)}
		</Container>
	);
};
