/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useContext, useMemo, useState } from 'react';
import { Container, DateTimePicker, Text, Padding, Select } from '@zextras/carbonio-design-system';
import { getBridgedFunctions } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from '@reduxjs/toolkit';
import ModalFooter from '../../../../sidebar/commons/modal-footer';
import { ModalHeader } from '../../../../sidebar/commons/modal-header';
import { timeZoneList } from './timezones';
import { saveDraft } from '../../../../../store/actions/save-draft';
import { EditViewContext } from './edit-view-context';
import { selectEditors } from '../../../../../store/editor-slice';

const SendLaterModal: FC<{ onClose: () => void; editorId: string; dispatch: Dispatch }> = ({
	onClose,
	editorId
}) => {
	const [time, setTime] = useState(new Date());
	const [timeZone, setTimeZone] = useState('UTC');
	const dispatch = useDispatch();
	const brdgFn = getBridgedFunctions();
	const editors = useSelector(selectEditors);
	const editor = useMemo(() => editors[editorId], [editorId, editors]);
	const timezones = useMemo(() => timeZoneList(), []);
	const modalTitle = useMemo(() => brdgFn?.t('label.send_later', 'Send Later'), [brdgFn]);
	const datePickerLabel = useMemo(
		() => brdgFn?.t('label.select_date_time', 'Select date and time'),
		[brdgFn]
	);

	const handleTimeChange = useCallback((e) => {
		console.log('abc:', { e: moment(e).valueOf() });
		setTime(e);
	}, []);
	const defaultTimeZone = useMemo(() => find(timezones, { value: 'UTC' }), [timezones]);

	const handleTimeZoneChange = useCallback((tz) => {
		setTimeZone(tz);
	}, []);
	console.log('abc:', { editor });
	const confirmLabel = useMemo(() => brdgFn?.t('label.set_timing', 'Set timing'), [brdgFn]);
	const onConfirm = useCallback(() => {
		// const autoSendTime = moment(time).utc().tz(timeZone).valueOf();
		// console.log('abc:', { editor, autoSendTime });
		// dispatch(saveDraft({ ...editor, autoSendTime }));
	}, []);
	return (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
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
				<Select
					items={timezones}
					background="gray5"
					label={brdgFn?.t('label.time_zone', 'Time Zone')}
					onChange={handleTimeZoneChange}
					selection={defaultTimeZone}
					showCheckbox={false}
					dropdownMaxHeight="200px"
					selectedBackgroundColor="highlight"
				/>
				<ModalFooter onConfirm={onConfirm} label={confirmLabel} disabled={false} />
			</Container>
		</Container>
	);
};

export default SendLaterModal;
