/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { CONTACT_TYPES, ContactInputProps, useContactInput } from '@zextras/carbonio-ui-commons';
import { Controller } from 'react-hook-form';

import { FormValuesControlProps } from 'views/search/types/types';

export const ReceivedSentAddressRow = ({ control }: FormValuesControlProps): React.JSX.Element => {
	const ContactInput = useContactInput();

	const fromChipLabelFactory = useCallback<NonNullable<ContactInputProps['chipLabelFactory']>>(
		(value, defaultLabel): string => {
			if (value.type === CONTACT_TYPES.CONTACT) {
				return value.email.startsWith('from:') ? value.email : `from:${value.email}`;
			}
			return defaultLabel;
		},
		[]
	);

	const toChipLabelFactory = useCallback<NonNullable<ContactInputProps['chipLabelFactory']>>(
		(value, defaultLabel): string => {
			if (value.type === CONTACT_TYPES.CONTACT) {
				return value.email.startsWith('to:') ? value.email : `to:${value.email}`;
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
							chipLabelFactory={fromChipLabelFactory}
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
							chipLabelFactory={toChipLabelFactory}
						/>
					)}
				/>
			</Container>
		</Container>
	);
};
