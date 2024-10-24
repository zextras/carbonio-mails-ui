/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Icon, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

export const ExternalDomainIcon = (): React.JSX.Element => {
	const [t] = useTranslation();
	return (
		<Tooltip label={t('label.from_external_domain', 'This email is from an external Domain')}>
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
