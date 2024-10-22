/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Icon, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import {
	getIsSensitive,
	getMailSensitivityIconColor,
	getMailSensitivityLabel
} from '../../../../../normalizations/mail-header-utils';
import { MailSensitivityHeader } from '../../../../../types';

export const MailSensitivityIcon = ({
	sensitivity
}: {
	sensitivity: MailSensitivityHeader;
}): React.JSX.Element => {
	const sensitive = getIsSensitive(sensitivity);

	const [t] = useTranslation();
	if (!sensitive) return <></>;
	return (
		<Tooltip label={getMailSensitivityLabel(t, sensitivity)}>
			<Row>
				<Icon
					size="medium"
					icon={'EyeOff2Outline'}
					color={getMailSensitivityIconColor(sensitivity ?? 'Personal')}
					style={{ paddingRight: '0.5rem' }}
					data-testid="mail-sensitivity-icon"
				/>
			</Row>
		</Tooltip>
	);
};
