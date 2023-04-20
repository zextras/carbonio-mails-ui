/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, DateTimePicker, Text } from '@zextras/carbonio-design-system';
import {
	getBridgedFunctions,
	replaceHistory,
	t,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import moment from 'moment';
import React, { FC, useCallback, useMemo, useState } from 'react';
import ModalFooter from '../../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../../carbonio-ui-commons/components/modals/modal-header';
import { saveDraft } from '../../../../../store/actions/save-draft';
import { AppDispatch } from '../../../../../store/redux';
import type { MailsEditor } from '../../../../../types';
import DatePickerCustomComponent from './date-picker-custom-component';

type SendLaterModalPropTypes = {
	onClose: () => void;
	dispatch: AppDispatch;
	editor: MailsEditor;
	closeBoard: () => void;
	folderId?: string;
	setShowRouteGuard: (arg: boolean) => void;
	setSendLater: (arg: boolean) => void;
};

/*
 * SendLaterModal is used for set the date and time for sending mail later on selected date and time
 */
const SendLaterModal: FC<SendLaterModalPropTypes> = ({
	onClose,
	dispatch,
	editor,
	closeBoard,
	folderId,
	setShowRouteGuard,
	setSendLater
}) => {
	const [time, setTime] = useState();
	const modalTitle = useMemo(() => t('label.send_later', 'Send Later'), []);
	const datePickerLabel = useMemo(() => t('label.select_date_time', 'Select date and time'), []);

	const handleTimeChange = useCallback((newTime) => {
		setTime(newTime);
	}, []);

	const confirmLabel = useMemo(() => t('label.schedule_send', 'Schedule send'), []);
	const { prefs } = useUserSettings();
	const onConfirm = useCallback(() => {
		setSendLater(true);
		const autoSendTime = moment(time).valueOf();
		dispatch(saveDraft({ data: { ...editor, autoSendTime }, prefs })).then((res: any) => {
			if (res.type.includes('fulfilled')) {
				getBridgedFunctions()?.createSnackbar({
					key: 'send_later',
					replace: true,
					hideButton: true,
					type: 'info',
					label: t('message.send_later_success', {
						date: moment(time).format('DD/MM/YYYY'),
						time: moment(time).format('HH:mm'),
						defaultValue: 'Your e-mail will be send on {{date}} at {{time}}'
					}),
					autoHideTimeout: 3000
				});

				onClose();
				closeBoard && closeBoard();
				setShowRouteGuard(false);
				setTimeout(() => {
					if (folderId) {
						replaceHistory(`/folder/${folderId}/`);
					}
				}, 10);
			}
		});
	}, [
		closeBoard,
		dispatch,
		editor,
		folderId,
		onClose,
		prefs,
		setSendLater,
		setShowRouteGuard,
		time
	]);

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
				<Text>{t('message.select_date_time', 'Select a date and time to send this message')}</Text>
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
						customInput={<DatePickerCustomComponent label={datePickerLabel} value={time ?? ''} />}
					/>
				</Container>
			</Container>
			<ModalFooter onConfirm={onConfirm} label={confirmLabel} disabled={!time} />
		</Container>
	);
};

export default SendLaterModal;
