/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import {
	Select,
	Input,
	Checkbox,
	FormSection,
	FormSubSection,
	Container
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { isNil } from 'lodash';

import { MAIL_APP_ID } from 'constants/index';
import { ReceivingMessagesSettingsType } from 'types/settings';
import {
	NotifyFolderOpts,
	ReadReceiptOpts,
	MsgsFromMeOpts,
	findLabel
} from 'views/settings/components/utils';
import { receivingMessagesSubSection } from 'views/settings/subsections';

const ReceivingMessagesSettings: FC<ReceivingMessagesSettingsType> = ({
	settingsObj,
	updateSettings,
	updatedProps,
	updateProps
}) => {
	const notifyFolderOptn = useMemo(() => NotifyFolderOpts(), []);
	const readReceiptOptn = useMemo(() => ReadReceiptOpts(), []);
	const msgsFromMeOpts = useMemo(() => MsgsFromMeOpts(), []);
	const sectionTitle = useMemo(() => receivingMessagesSubSection(), []);

	const mailNotificationSoundDefault = useMemo(
		() =>
			isNil(updatedProps?.mailNotificationSound?.value)
				? true
				: updatedProps?.mailNotificationSound?.value === 'TRUE',
		[updatedProps?.mailNotificationSound?.value]
	);

	return (
		<FormSection label={sectionTitle.label} id={sectionTitle.id}>
			<FormSubSection label={t('label.message_arrival', 'Message Arrival')}>
				<Input
					label={t('label.send_notification', 'Send a notification message to')}
					value={settingsObj.zimbraPrefNewMailNotificationAddress}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
						updateSettings({
							target: {
								name: 'zimbraPrefNewMailNotificationAddress',
								value: e.target.value
							}
						});
					}}
				/>
			</FormSubSection>
			<FormSubSection label={t('label.arrival_notifications', 'Arrival Notifications')}>
				<Container
					gap={'0.5rem'}
					mainAlignment={'flex-start'}
					crossAlignment={'flex-start'}
					height={'fit'}
				>
					<Checkbox
						label={t('label.show_popup', 'Show a popup notification')}
						value={settingsObj.zimbraPrefMailToasterEnabled === 'TRUE'}
						onClick={(): void =>
							updateSettings({
								target: {
									name: 'zimbraPrefMailToasterEnabled',
									value: settingsObj.zimbraPrefMailToasterEnabled === 'TRUE' ? 'FALSE' : 'TRUE'
								}
							})
						}
					/>
					{/* todo: disabled because unsupported yet
				<Padding bottom="small" />
				<Checkbox
					label={t('label.highlight_tab', 'Highlight the Mail tab')}
					value={settingsObj.zimbraPrefMailFlashIcon === 'TRUE'}
					onClick={() =>
						updateSettings({
							target: {
								name: 'zimbraPrefMailFlashIcon',
								value: settingsObj.zimbraPrefMailFlashIcon === 'TRUE' ? 'FALSE' : 'TRUE'
							}
						})
					}
				/>
				<Padding bottom="small" />
				<Checkbox
					label={t('label.flash_browser_title', 'Flash the browser title')}
					value={settingsObj.zimbraPrefMailFlashTitle === 'TRUE'}
					onClick={() =>
						updateSettings({
							target: {
								name: 'zimbraPrefMailFlashTitle',
								value: settingsObj.zimbraPrefMailFlashTitle === 'TRUE' ? 'FALSE' : 'TRUE'
							}
						})
					}
				/> */}
					<Checkbox
						label={t('label.notification_audio', 'Play audio hint when new notification appears')}
						value={mailNotificationSoundDefault}
						onClick={(): void => {
							updateProps({
								target: {
									name: 'mailNotificationSound',
									value: {
										// eslint-disable-next-line @typescript-eslint/ban-ts-comment
										// @ts-ignore
										app: MAIL_APP_ID,
										value: mailNotificationSoundDefault ? 'FALSE' : 'TRUE'
									}
								}
							});
						}}
					/>
				</Container>
			</FormSubSection>
			<FormSubSection label={t('label.notification_folders', 'Notification Folders')}>
				<Select
					label={t('label.select_folder', 'Select folder')}
					items={notifyFolderOptn}
					onChange={(view: any): void =>
						updateSettings({
							target: { name: 'zimbraPrefShowAllNewMailNotifications', value: view }
						})
					}
					defaultSelection={{
						label: findLabel(notifyFolderOptn, settingsObj.zimbraPrefShowAllNewMailNotifications),
						value: settingsObj.zimbraPrefShowAllNewMailNotifications
					}}
				/>
			</FormSubSection>
			<FormSubSection label={t('label.read_receipt', 'Read Receipt')}>
				<Select
					items={readReceiptOptn}
					onChange={(view: any): void =>
						updateSettings({ target: { name: 'zimbraPrefMailSendReadReceipts', value: view } })
					}
					defaultSelection={{
						label: findLabel(readReceiptOptn, settingsObj.zimbraPrefMailSendReadReceipts),
						value: settingsObj.zimbraPrefMailSendReadReceipts
					}}
				/>
			</FormSubSection>
			<FormSubSection label={t('label.message_from_me', 'Messages from me')}>
				<Select
					items={msgsFromMeOpts}
					onChange={(view: any): void =>
						updateSettings({
							target: { name: 'zimbraPrefDedupeMessagesSentToSelf', value: view }
						})
					}
					defaultSelection={{
						label: findLabel(msgsFromMeOpts, settingsObj.zimbraPrefDedupeMessagesSentToSelf),
						value: settingsObj.zimbraPrefDedupeMessagesSentToSelf
					}}
				/>
			</FormSubSection>
			<FormSubSection label={t('label.duplicate_messages', 'Duplicate Messages')}>
				<Checkbox
					label={t(
						'label.automatically_delete_duplicates',
						'Automatically delete duplicate copies of the same message when received'
					)}
					value={settingsObj.zimbraPrefMessageIdDedupingEnabled === 'TRUE'}
					onClick={(): void =>
						updateSettings({
							target: {
								name: 'zimbraPrefMessageIdDedupingEnabled',
								value: settingsObj.zimbraPrefMessageIdDedupingEnabled === 'TRUE' ? 'FALSE' : 'TRUE'
							}
						})
					}
				/>
			</FormSubSection>
		</FormSection>
	);
};

export default ReceivingMessagesSettings;
