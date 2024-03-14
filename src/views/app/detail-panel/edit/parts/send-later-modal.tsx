/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container, DateTimePicker, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import moment from 'moment';

import { DatePickerCustomComponent } from './date-picker-custom-component';
import { AnimatedLoader } from '../../../../../assets/animated-loader';
import ModalFooter from '../../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../../carbonio-ui-commons/components/modals/modal-header';

type SendLaterModalProps = {
	onAutoSendTimeSelected: (autoSendTime: number) => void;
	onClose: () => void;
	isLoading?: boolean;
};

export const SendLaterModal: FC<SendLaterModalProps> = ({
	onAutoSendTimeSelected,
	onClose,
	isLoading = false
}) => {
	const [selectedTime, setSelectedTime] = useState<Date | null>(null);
	const modalTitle = t('label.send_later', 'Send Later');
	const datePickerLabel = t('label.select_date_time', 'Select date and time');
	const confirmLabel = t('label.schedule_send', 'Schedule send');

	const onTimeSelected = useCallback((time: Date | null) => {
		setSelectedTime(time);
	}, []);

	const onConfirm = useCallback(() => {
		if (!selectedTime) {
			return;
		}
		onAutoSendTimeSelected(moment(selectedTime).valueOf());
	}, [onAutoSendTimeSelected, selectedTime]);

	const minTime = useMemo(() => {
		if (moment(selectedTime).isBefore(moment(), 'hour') || !selectedTime) {
			return new Date();
		}
		return moment().hours(0).minutes(0);
	}, [selectedTime]);

	const maxTime = useMemo(() => new Date(0, 0, 0, 23, 45, 0, 0), []);

	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<ModalHeader onClose={onClose} title={modalTitle} />
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<Text>{t('message.select_date_time', 'Select a date and time to send this message')}</Text>
				<Container padding={{ vertical: 'medium' }}>
					<DateTimePicker
						label={datePickerLabel}
						isClearable
						width="fill"
						onChange={onTimeSelected}
						dateFormat="dd/MM/yyyy HH:mm"
						minDate={new Date()}
						minTime={minTime}
						maxTime={maxTime}
						timeCaption={t('label.time', 'Time')}
						customInput={
							<DatePickerCustomComponent
								label={datePickerLabel}
								value={selectedTime?.toDateString() ?? ''}
								onClick={noop}
							/>
						}
					/>
				</Container>
			</Container>
			<ModalFooter
				onConfirm={onConfirm}
				label={confirmLabel}
				confirmButtonIcon={isLoading ? AnimatedLoader : undefined}
				disabled={!selectedTime}
				secondaryAction={onClose}
				secondaryLabel={t('label.cancel', 'Cancel')}
			/>
		</Container>
	);
};
