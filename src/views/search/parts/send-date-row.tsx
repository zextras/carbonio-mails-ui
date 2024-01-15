/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Container, DateTimePicker } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import moment from 'moment';

import type { SendReceivedDateRowPropType } from '../../../types';

const QUERY_DATE_FORMAT = 'P';
const PICKER_DATE_FORMAT = 'P';

const SendReceivedDateRow: FC<SendReceivedDateRowPropType> = ({ compProps }): ReactElement => {
	const { sentBefore, setSentBefore, sentAfter, setSentAfter, sentOn, setSentOn } = compProps;

	const onSentBeforeChange = useCallback(
		(date) => {
			const tmp = `before:${moment(date).format(QUERY_DATE_FORMAT)}`;
			date
				? setSentBefore([
						{
							hasAvatar: true,
							avatarBackground: 'gray1',
							label: tmp,
							value: tmp,
							isQueryFilter: true,
							avatarIcon: 'CalendarOutline'
						}
				  ])
				: setSentBefore([]);
		},
		[setSentBefore]
	);

	const onSentAfterChange = useCallback(
		(date) => {
			const tmp = `after:${moment(date).format(QUERY_DATE_FORMAT)}`;
			date
				? setSentAfter([
						{
							hasAvatar: true,
							avatarBackground: 'gray1',
							label: tmp,
							value: tmp,
							isQueryFilter: true,
							avatarIcon: 'CalendarOutline'
						}
				  ])
				: setSentAfter([]);
		},
		[setSentAfter]
	);
	const onSentOnChange = useCallback(
		(date) => {
			const tmp = `date:${moment(date).format(QUERY_DATE_FORMAT)}`;
			date
				? setSentOn([
						{
							hasAvatar: true,
							avatarBackground: 'gray1',
							label: tmp,
							value: tmp,
							isQueryFilter: true,
							avatarIcon: 'CalendarOutline'
						}
				  ])
				: setSentOn([]);
		},
		[setSentOn]
	);

	const sentBeforeDefault = useMemo(
		() =>
			sentBefore[0]?.label
				? new Date(moment(sentBefore[0]?.label.split('before:')?.[1], QUERY_DATE_FORMAT).valueOf())
				: undefined,
		[sentBefore]
	);
	const sentAfterDefault = useMemo(
		() =>
			sentAfter[0]?.label
				? new Date(moment(sentAfter[0]?.label.split('after:')?.[1], QUERY_DATE_FORMAT).valueOf())
				: undefined,
		[sentAfter]
	);
	const sentOnDefault = useMemo(
		() =>
			sentOn[0]?.label
				? new Date(moment(sentOn[0]?.label.split('date:')?.[1], QUERY_DATE_FORMAT).valueOf())
				: undefined,
		[sentOn]
	);

	const datePickerLocale = useMemo(() => moment.locale(), []);

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }}>
				<DateTimePicker
					width="fill"
					label={t('search.sent_before', 'Sent before')}
					enableChips
					chipProps={{ avatarBackground: 'gray1', avatarIcon: 'CalendarOutline' }}
					dateFormat={PICKER_DATE_FORMAT}
					includeTime={false}
					defaultValue={sentBeforeDefault}
					onChange={onSentBeforeChange}
				/>
			</Container>
			<Container padding={{ horizontal: 'extrasmall' }}>
				<DateTimePicker
					width="fill"
					label={t('search.sent_after', 'Sent after')}
					enableChips
					chipProps={{ avatarBackground: 'gray1', avatarIcon: 'CalendarOutline' }}
					dateFormat={PICKER_DATE_FORMAT}
					locale={datePickerLocale}
					includeTime={false}
					defaultValue={sentAfterDefault}
					onChange={onSentAfterChange}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }}>
				<DateTimePicker
					width="fill"
					label={t('search.sent_on', 'Sent on')}
					enableChips
					chipProps={{ avatarBackground: 'gray1', avatarIcon: 'CalendarOutline' }}
					dateFormat={PICKER_DATE_FORMAT}
					locale={datePickerLocale}
					includeTime={false}
					onChange={onSentOnChange}
					defaultValue={sentOnDefault}
				/>
			</Container>
		</Container>
	);
};

export default SendReceivedDateRow;
