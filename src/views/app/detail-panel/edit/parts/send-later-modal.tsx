/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';
import { Container, DateTimePicker, Text } from '@zextras/carbonio-design-system';
import { getBridgedFunctions } from '@zextras/carbonio-shell-ui';
import moment from 'moment';
import { Dispatch } from '@reduxjs/toolkit';
import ModalFooter from '../../../../sidebar/commons/modal-footer';
import { ModalHeader } from '../../../../sidebar/commons/modal-header';
import { saveDraft } from '../../../../../store/actions/save-draft';
import { MailsEditor } from '../../../../../types';
import DatePickerCustomComponent from './date-picker-custm-component';

type SendLaterModalPropTypes = {
	onClose: () => void;
	dispatch: Dispatch;
	editor: MailsEditor;
	closeBoard: () => void;
};
const SendLaterModal: FC<SendLaterModalPropTypes> = ({ onClose, dispatch, editor, closeBoard }) => {
	const [time, setTime] = useState();
	const bridgedFn = getBridgedFunctions();

	const modalTitle = useMemo(() => bridgedFn?.t('label.send_later', 'Send Later'), [bridgedFn]);
	const datePickerLabel = useMemo(
		() => bridgedFn?.t('label.select_date_time', 'Select date and time'),
		[bridgedFn]
	);

	const handleTimeChange = useCallback((newTime) => {
		setTime(newTime);
	}, []);

	const confirmLabel = useMemo(
		() => bridgedFn?.t('label.schedule_send', 'Schedule send'),
		[bridgedFn]
	);
	const onConfirm = useCallback(() => {
		const autoSendTime = moment(time).valueOf();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		dispatch(saveDraft({ data: { ...editor, autoSendTime } })).then((res: any) => {
			if (res.type.includes('fulfilled')) {
				bridgedFn?.createSnackbar({
					key: 'send_later',
					replace: true,
					hideButton: true,
					type: 'info',
					label: bridgedFn?.t('message.send_later_success', {
						date: moment(time).format('DD/MM/YYYY'),
						time: moment(time).format('HH:mm'),
						defaultValue: 'Your e-mail will be send on {{date}} at {{time}}'
					}),
					autoHideTimeout: 3000
				});

				onClose();
				closeBoard();
			}
		});
	}, [bridgedFn, closeBoard, dispatch, editor, onClose, time]);

	const minTime = useMemo(() => {
		if (moment(time).isBefore(moment(), 'hour') || !time) {
			return new Date();
		}
		return moment().hours(0).minutes(0);
	}, [time]);

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
				<Text>
					{bridgedFn?.t('message.select_date_time', 'Select a date and time to send this message')}
				</Text>
				<Container padding={{ vertical: 'medium' }}>
					<DateTimePicker
						label={datePickerLabel}
						isClearable
						width="fill"
						onChange={handleTimeChange}
						dateFormat="dd/MM/yyyy HH:mm"
						minDate={new Date()}
						minTime={minTime}
						maxTime={maxTime}
						customInput={<DatePickerCustomComponent label={datePickerLabel} value={time} />}
					/>
				</Container>
			</Container>
			<ModalFooter onConfirm={onConfirm} label={confirmLabel} disabled={!time} />
		</Container>
	);
};

export default SendLaterModal;
