/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Text, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

export const MailAuthenticationHeaderRow = ({
	label,
	value
}: {
	label: string;
	value?: string;
}): React.JSX.Element => {
	const [t] = useTranslation();
	const missingHeaderLabel = t('messages.modal.mail_authentication_headers.missing', 'Missing');
	return (
		<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
			{value ? (
				<Tooltip placement="top" maxWidth="fit" label={value}>
					<Text size="small">
						<strong>{label}:</strong> {value}
					</Text>
				</Tooltip>
			) : (
				<Text size="small">
					<strong>{label}:</strong> {missingHeaderLabel}
				</Text>
			)}
		</Row>
	);
};
