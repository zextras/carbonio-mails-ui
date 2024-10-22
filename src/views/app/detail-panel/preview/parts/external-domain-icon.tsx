/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Icon, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

export const ExternalDomainIcon = ({
	fromExternalDomain
}: {
	fromExternalDomain: boolean;
}): React.JSX.Element => {
	const [t] = useTranslation();
	if (!fromExternalDomain) return <></>;
	return (
		<Tooltip label={t('label.from_external_domain', 'Mail from external domain')}>
			<Row>
				<Icon
					size="medium"
					icon={'MailStatusOutline'}
					color="warning"
					style={{ paddingRight: '0.5rem' }}
					data-testid="external-domain-icon"
				/>
			</Row>
		</Tooltip>
	);
};
