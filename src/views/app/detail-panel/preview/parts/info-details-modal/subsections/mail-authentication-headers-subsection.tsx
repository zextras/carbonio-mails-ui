/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Divider, Icon, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MailAuthenticationHeaders } from 'types/messages';
import { MailAuthenticationHeaderRow } from 'views/app/detail-panel/preview/parts/info-details-modal/subsections/mail-authentication-header-row';
import { getAuthenticationHeadersIconColor } from 'views/app/detail-panel/preview/parts/utils';

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
			<MailAuthenticationHeaderRow label={'DKIM'} value={authenticationMailsHeaders.dkim?.value} />
			<MailAuthenticationHeaderRow label={'SPF'} value={authenticationMailsHeaders.spf?.value} />
			<MailAuthenticationHeaderRow
				label={'DMARC'}
				value={authenticationMailsHeaders.dmarc?.value}
			/>
		</Container>
	);
};
