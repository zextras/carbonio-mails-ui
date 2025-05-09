/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { replace } from 'lodash';
import { Controller, useFormContext } from 'react-hook-form';

import { CONTACT_TYPES } from '../../../carbonio-ui-commons/integrations/constants';
import { useContactInput } from '../../../carbonio-ui-commons/integrations/hooks';
import { ContactInputItem } from '../../../carbonio-ui-commons/integrations/types';
import { Query, SearchQueryItem } from '../../../types';

type ReceivedSentAddressRowProps = {
	query: Query;
	receivedFromInputName: string;
	sentToInputName: string;
};

function toContactInput(item: SearchQueryItem): ContactInputItem {
	const email = item.value ?? '';
	return {
		id: email,
		label: email,
		value: {
			id: email,
			email,
			type: CONTACT_TYPES.CONTACT
		}
	};
}
export const ReceivedSentAddressRow: FC<ReceivedSentAddressRowProps> = ({
	query,
	receivedFromInputName,
	sentToInputName
}): ReactElement => {
	const { control } = useFormContext();
	const sentToInQuery = query
		.filter((queryItem) => /^to:*/.test(queryItem.label))
		.map((queryItem) => ({ ...queryItem, label: replace(queryItem.label, 'to:', '') }))
		.map((item) => toContactInput(item));

	const receivedFromInQuery = query
		.filter((queryItem) => /^from:*/.test(queryItem.label))
		.map((queryItem) => ({ ...queryItem, label: replace(queryItem.label, 'from:', '') }))
		.map((item) => toContactInput(item));

	const ContactInput = useContactInput();

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					name={receivedFromInputName}
					defaultValue={receivedFromInQuery}
					render={({ field: { onChange, value } }) => (
						<ContactInput
							data-testid={'received-from-input'}
							placeholder={t('label.from', 'From')}
							onChange={onChange}
							defaultValue={value}
						/>
					)}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					name={sentToInputName}
					defaultValue={sentToInQuery}
					render={({ field: { onChange, value }, fieldState: { error } }) => (
						<ContactInput
							data-testid={'sent-to-input'}
							placeholder={t('label.to', 'To')}
							onChange={onChange}
							defaultValue={value}
						/>
					)}
				/>
			</Container>
		</Container>
	);
};
