/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { isNull } from 'lodash';
import { useTranslation } from 'react-i18next';

import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { getRoot } from '../../carbonio-ui-commons/store/zustand/folder';
import { MessageActionsDescriptors } from '../../constants';
import { getAttendees, getOptionalsAttendees, getSenderByOwner } from '../../helpers/appointmemt';
import { getMsgCall } from '../../store/actions';
import { extractBody } from '../../store/editor-slice-utils';
import type { ActionFn, MailMessage, UIActionDescriptor } from '../../types';
import { CalendarType, SenderType } from '../../types/calendar';
import { useUiUtilities } from '../use-ui-utilities';

export const useMsgCreateAppointmentFn = (item: MailMessage): ActionFn => {
	const { createSnackbar } = useUiUtilities();
	const [openAppointmentComposer, isAvailable] = useIntegratedFunction('create_appointment');

	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((): void => {
		const attendees = getAttendees(item);
		const optionalAttendees = getOptionalsAttendees(item);
		const rooFolder = getRoot(item.parent);
		let calendar: CalendarType | null = null;
		let sender: SenderType | null = null;
		const htmlBody = extractBody(item)[1];
		if (rooFolder && rooFolder?.isLink) {
			const calendarId = `${rooFolder.id.split(':')[0]}:${FOLDERS.CALENDAR}`;
			calendar = {
				id: calendarId,
				owner: rooFolder?.isLink && rooFolder.owner
			};
			sender = getSenderByOwner(rooFolder?.owner);
		}
		if (!item?.isComplete) {
			getMsgCall({ msgId: item.id })
				.then((message: MailMessage) => {
					const mailHtmlBody = extractBody(message)[1];
					isAvailable &&
						openAppointmentComposer({
							title: message.subject,
							isRichText: true,
							richText: mailHtmlBody,
							...(!isNull(calendar) ? { calendar } : {}),
							...(!isNull(sender) ? { sender } : {}),
							attendees,
							optionalAttendees
						});
				})
				.catch(() => {
					createSnackbar({
						key: `get-msg-on-new-appointment`,
						replace: true,
						type: 'warning',
						hideButton: true,
						label: t(
							'message.snackbar.att_err',
							'There seems to be a problem when saving, please try again'
						),
						autoHideTimeout: 3000
					});
				});
		} else {
			openAppointmentComposer({
				title: item.subject,
				isRichText: true,
				richText: htmlBody,
				...(!isNull(calendar) ? { calendar } : {}),
				...(!isNull(sender) ? { sender } : {}),
				attendees,
				optionalAttendees
			});
		}
	}, [createSnackbar, isAvailable, item, openAppointmentComposer]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgCreateAppointmentDescriptor = (message: MailMessage): UIActionDescriptor => {
	const { canExecute, execute } = useMsgCreateAppointmentFn(message);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.CREATE_APPOINTMENT.id,
		icon: 'CalendarModOutline',
		label: t('action.create_appointment', 'Create Appointment'),
		execute,
		canExecute
	};
};
