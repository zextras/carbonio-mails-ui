/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Controller } from 'react-hook-form';

import { CONTACT_TYPES } from '../../../carbonio-ui-commons/integrations/constants';
import { useContactInput } from '../../../carbonio-ui-commons/integrations/hooks';
import { ContactInputProps } from '../../../carbonio-ui-commons/integrations/types';
import { FormValuesControlProps } from '../types/types';

export const ReceivedSentAddressRow = ({ control }: FormValuesControlProps): React.JSX.Element => {
	const ContactInput = useContactInput();

	const labelFactory = useCallback<NonNullable<ContactInputProps['labelFactory']>>(
		(value, defaultLabel): string => {
			if (value.type === CONTACT_TYPES.CONTACT) {
				return value.email;
			}
			return defaultLabel;
		},
		[]
	);

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					name={'receivedFrom'}
					render={({ field: { onChange, value } }): React.JSX.Element => (
						<ContactInput
							data-testid={'received-from-input'}
							placeholder={t('label.from', 'From')}
							onChange={onChange}
							defaultValue={value}
							labelFactory={labelFactory}
						/>
					)}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					name={'sentTo'}
					render={({ field: { onChange, value } }): React.JSX.Element => (
						<ContactInput
							data-testid={'sent-to-input'}
							placeholder={t('label.to', 'To')}
							onChange={onChange}
							defaultValue={value}
							labelFactory={labelFactory}
						/>
					)}
				/>
			</Container>
		</Container>
	);
};
