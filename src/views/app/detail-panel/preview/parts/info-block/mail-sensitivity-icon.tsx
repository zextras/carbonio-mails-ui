/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Icon, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { Sensitivity } from 'types/messages';
import {
	getMailSensitivityIconColor,
	getMailSensitivityLabel
} from 'views/app/detail-panel/preview/parts/utils';

export const MailSensitivityIcon = ({
	sensitivity
}: {
	sensitivity: Sensitivity;
}): React.JSX.Element => {
	const [t] = useTranslation();
	return (
		<Tooltip label={getMailSensitivityLabel(t, sensitivity)}>
			<Row>
				<Icon
					size="medium"
					icon={'EyeOff2Outline'}
					color={getMailSensitivityIconColor(sensitivity)}
					style={{ paddingRight: '0.5rem' }}
					data-testid="mail-sensitivity-icon"
				/>
			</Row>
		</Tooltip>
	);
};
