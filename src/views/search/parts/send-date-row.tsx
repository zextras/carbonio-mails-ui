/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement } from 'react';

import { Container, DateTimePicker } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { Controller, useFormContext } from 'react-hook-form';

import type { SendReceivedDateRowPropType } from '../../../types';
import { extractDateFieldFromQuery } from '../extract-date-field-from-query';

const PICKER_DATE_FORMAT = 'P';

const SendReceivedDateRow: FC<SendReceivedDateRowPropType> = ({
	query,
	sentBeforeInputName,
	sentOnInputName,
	sentAfterInputName
}): ReactElement => {
	const { control } = useFormContext();
	const { zimbraPrefLocale: prefLocale } = useUserSettings().prefs;
	const sentBefore = extractDateFieldFromQuery('before', query);
	const sentAfter = extractDateFieldFromQuery('after', query);
	const sentOn = extractDateFieldFromQuery('on', query);
	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }}>
				<Controller
					control={control}
					name={sentBeforeInputName}
					defaultValue={sentBefore}
					render={({ field: { onChange, value } }) => (
						<DateTimePicker
							width="fill"
							label={t('search.sent_before', 'Sent before')}
							enableChips
							chipProps={{ avatarBackground: 'gray1', avatarIcon: 'CalendarOutline' }}
							dateFormat={PICKER_DATE_FORMAT}
							locale={prefLocale}
							showTimeSelect={false}
							selected={value}
							defaultValue={value}
							onChange={onChange}
							data-testid="sentBeforeInput"
						/>
					)}
				/>
			</Container>
			<Container padding={{ horizontal: 'extrasmall' }}>
				<Controller
					control={control}
					name={sentAfterInputName}
					defaultValue={sentAfter}
					render={({ field: { onChange, value } }) => (
						<DateTimePicker
							width="fill"
							label={t('search.sent_after', 'Sent after')}
							enableChips
							chipProps={{ avatarBackground: 'gray1', avatarIcon: 'CalendarOutline' }}
							dateFormat={PICKER_DATE_FORMAT}
							locale={prefLocale}
							showTimeSelect={false}
							selected={value}
							defaultValue={value}
							onChange={onChange}
							data-testid="sentAfterInput"
						/>
					)}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }}>
				<Controller
					control={control}
					name={sentOnInputName}
					defaultValue={sentOn}
					render={({ field: { onChange, value } }) => (
						<DateTimePicker
							width="fill"
							label={t('search.sent_on', 'Sent on')}
							enableChips
							chipProps={{ avatarBackground: 'gray1', avatarIcon: 'CalendarOutline' }}
							dateFormat={PICKER_DATE_FORMAT}
							locale={prefLocale}
							showTimeSelect={false}
							onChange={onChange}
							selected={value}
							defaultValue={value}
							data-testid="sentOnInput"
						/>
					)}
				/>
			</Container>
		</Container>
	);
};

export default SendReceivedDateRow;
