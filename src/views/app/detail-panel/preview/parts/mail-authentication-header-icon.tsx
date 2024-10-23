/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Icon, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import {
	getAuthenticationHeadersIcon,
	getHasAuthenticationHeaders,
	getMailAuthenticationHeaderLabel
} from '../../../../../normalizations/mail-header-utils';
import { IncompleteMessage } from '../../../../../types';

export const MailAuthenticationHeaderIcon = ({
	mailAuthenticationHeaders
}: {
	mailAuthenticationHeaders: IncompleteMessage['authenticationHeaders'] | undefined;
}): React.JSX.Element => {
	const [t] = useTranslation();
	const hasAuthenticationHeaders = getHasAuthenticationHeaders(mailAuthenticationHeaders);
	const tooltipLabel = getMailAuthenticationHeaderLabel(t, mailAuthenticationHeaders);
	const authenticationHeadersIconColor = getAuthenticationHeadersIcon(mailAuthenticationHeaders);

	if (!hasAuthenticationHeaders) return <></>;
	return (
		<Tooltip label={tooltipLabel}>
			<Row>
				<Icon
					size="medium"
					icon={'ShieldOutline'}
					color={authenticationHeadersIconColor}
					style={{ paddingRight: '0.5rem' }}
					data-testid="mail-authentication-header-icon"
				/>
			</Row>
		</Tooltip>
	);
};