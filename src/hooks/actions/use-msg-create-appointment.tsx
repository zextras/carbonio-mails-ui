/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { getUserSettings, t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { FOLDERS, getRoot } from '@zextras/carbonio-ui-commons';
import { isNull } from 'lodash';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from 'constants/index';
import { getAttendees, getOptionalsAttendees, getSenderByOwner } from 'helpers/appointmemt';
import { isDraft, isSpam } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { extractBody } from 'store/editor-slice-utils';
import { getMessageEmailStoreAction } from 'store/emails/actions/get-message';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { CalendarType, SenderType } from 'types/calendar';
import { MailMessage } from 'types/messages';

export const useMsgCreateAppointmentFn = (item: MailMessage, folderId: string): ActionFn => {
	const { createSnackbar } = useUiUtilities();
	const [openAppointmentComposer, isAvailable] = useIntegratedFunction('create_appointment');

	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isSpam(folderId),
		[folderId]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			const attendees = getAttendees(item);
			const optionalAttendees = getOptionalsAttendees(item);
			const rooFolder = getRoot(item.parent);
			let calendar: CalendarType | null = null;
			let sender: SenderType | null = null;
			const htmlBody = extractBody(item).richText;
			if (rooFolder && rooFolder?.isLink) {
				const calendarId = `${rooFolder.id.split(':')[0]}:${FOLDERS.CALENDAR}`;
				calendar = {
					id: calendarId,
					owner: rooFolder?.isLink && rooFolder.owner
				};
				sender = getSenderByOwner(rooFolder?.owner);
			}
			if (!item?.isComplete) {
				const prefs = getUserSettings()?.prefs;
				const html = prefs?.zimbraPrefComposeFormat === 'html';
				getMessageEmailStoreAction({ messageId: item.id, html })
					.then((message) => {
						if (!message) return;
						const mailHtmlBody = extractBody(message).richText;
						const mailPlainBody = extractBody(message).plainText;
						isAvailable &&
							openAppointmentComposer({
								title: message.subject,
								isRichText: html,
								richText: html ? mailHtmlBody : undefined,
								plainText: html ? undefined : mailPlainBody,
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
							severity: 'warning',
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
		}
	}, [canExecute, createSnackbar, isAvailable, item, openAppointmentComposer]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgCreateAppointmentDescriptor = (
	message: MailMessage,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useMsgCreateAppointmentFn(message, folderId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.CREATE_APPOINTMENT.id,
		icon: 'CalendarModOutline',
		label: t('action.create_appointment', 'Create Appointment'),
		execute,
		canExecute
	};
};
