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

type SendLaterModalPropTypes = {
	onClose: () => void;
	dispatch: Dispatch;
	editor: MailsEditor;
	closeBoard: () => void;
};
const SendLaterModal: FC<SendLaterModalPropTypes> = ({ onClose, dispatch, editor, closeBoard }) => {
	const [time, setTime] = useState();

	const brdgFn = getBridgedFunctions();

	const modalTitle = useMemo(() => brdgFn?.t('label.send_later', 'Send Later'), [brdgFn]);
	const datePickerLabel = useMemo(
		() => brdgFn?.t('label.select_date_time', 'Select date and time'),
		[brdgFn]
	);

	const handleTimeChange = useCallback((newTime) => {
		setTime(newTime);
	}, []);

	const confirmLabel = useMemo(() => brdgFn?.t('label.set_timing', 'Set timing'), [brdgFn]);
	const onConfirm = useCallback(() => {
		const autoSendTime = moment(time).valueOf();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		dispatch(saveDraft({ data: { ...editor, autoSendTime } })).then((res: any) => {
			if (res.type.includes('fulfilled')) {
				brdgFn?.createSnackbar({
					key: 'send_later',
					replace: true,
					hideButton: true,
					type: 'info',
					label: brdgFn?.t('message.send_later_success', {
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
	}, [brdgFn, closeBoard, dispatch, editor, onClose, time]);
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
					{brdgFn?.t('message.select_date_time', 'Select a date and time to send this message')}
				</Text>
				<Container padding={{ vertical: 'medium' }}>
					<DateTimePicker
						label={datePickerLabel}
						isClearable
						width="fill"
						onChange={handleTimeChange}
						dateFormat="dd/MM/yyyy HH:mm"
					/>
				</Container>
			</Container>
			<ModalFooter onConfirm={onConfirm} label={confirmLabel} disabled={!time} />
		</Container>
	);
};

export default SendLaterModal;
