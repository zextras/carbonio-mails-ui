/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement } from 'react';

import { Container, DateTimePicker } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';

import type { SendReceivedDateRowPropType } from '../../../types';

const PICKER_DATE_FORMAT = 'P';

const SendReceivedDateRow: FC<SendReceivedDateRowPropType> = ({ compProps }): ReactElement => {
	const { zimbraPrefLocale: prefLocale } = useUserSettings().prefs;
	const { sentBefore, setSentBefore, sentAfter, setSentAfter, sentOn, setSentOn } = compProps;
	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }}>
				<DateTimePicker
					width="fill"
					label={t('search.sent_before', 'Sent before')}
					enableChips
					chipProps={{ avatarBackground: 'gray1', avatarIcon: 'CalendarOutline' }}
					dateFormat={PICKER_DATE_FORMAT}
					locale={prefLocale}
					showTimeSelect={false}
					selected={sentBefore}
					defaultValue={sentBefore}
					onChange={setSentBefore}
					data-testid="sentBeforeInput"
				/>
			</Container>
			<Container padding={{ horizontal: 'extrasmall' }}>
				<DateTimePicker
					width="fill"
					label={t('search.sent_after', 'Sent after')}
					enableChips
					chipProps={{ avatarBackground: 'gray1', avatarIcon: 'CalendarOutline' }}
					dateFormat={PICKER_DATE_FORMAT}
					locale={prefLocale}
					showTimeSelect={false}
					selected={sentAfter}
					defaultValue={sentAfter}
					onChange={setSentAfter}
					data-testid="sentAfterInput"
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }}>
				<DateTimePicker
					width="fill"
					label={t('search.sent_on', 'Sent on')}
					enableChips
					chipProps={{ avatarBackground: 'gray1', avatarIcon: 'CalendarOutline' }}
					dateFormat={PICKER_DATE_FORMAT}
					locale={prefLocale}
					showTimeSelect={false}
					onChange={setSentOn}
					selected={sentOn}
					defaultValue={sentOn}
					data-testid="sentOnInput"
				/>
			</Container>
		</Container>
	);
};

export default SendReceivedDateRow;
