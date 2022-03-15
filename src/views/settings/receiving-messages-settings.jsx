/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';
import {
	Container,
	FormSubSection,
	Select,
	Input,
	Checkbox,
	Padding
} from '@zextras/carbonio-design-system';
import Heading from './components/settings-heading';
import { NotifyFolderOpts, ReadReceiptOpts, MsgsFromMeOpts, findLabel } from './components/utils';
import { receivingMessagesSubSection } from './subsections';

export default function ReceivingMessagesSettings({ t, settingsObj, updateSettings }) {
	const notifyFolderOptn = useMemo(() => NotifyFolderOpts(t), [t]);
	const readReceiptOptn = useMemo(() => ReadReceiptOpts(t), [t]);
	const msgsFromMeOpts = useMemo(() => MsgsFromMeOpts(t), [t]);
	const sectionTitle = useMemo(() => receivingMessagesSubSection(t), [t]);

	return (
		<FormSubSection label={sectionTitle.label} id={sectionTitle.id}>
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title="Message Arrival" />
				<Input
					label={t('label.send_notification', 'Send a notification message to')}
					value={settingsObj.zimbraPrefNewMailNotificationAddress}
					onChange={(e) => {
						updateSettings({
							target: {
								name: 'zimbraPrefNewMailNotificationAddress',
								value: e.target.value
							}
						});
					}}
				/>
			</Container>
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title="Arrival Notifications" />
				<Checkbox
					label={t('label.show_popup', 'Show a popup notification')}
					value={settingsObj.zimbraPrefMailToasterEnabled === 'TRUE'}
					onClick={() =>
						updateSettings({
							target: {
								name: 'zimbraPrefMailToasterEnabled',
								value: settingsObj.zimbraPrefMailToasterEnabled === 'TRUE' ? 'FALSE' : 'TRUE'
							}
						})
					}
				/>
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
				/>
			</Container>
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title="Notification Folders" />
				<Select
					label={t('label.select_folder', 'Select folder')}
					name="zimbraPrefShowAllNewMailNotifications"
					items={notifyFolderOptn}
					onChange={(view) =>
						updateSettings({
							target: { name: 'zimbraPrefShowAllNewMailNotifications', value: view }
						})
					}
					defaultSelection={{
						label: findLabel(notifyFolderOptn, settingsObj.zimbraPrefShowAllNewMailNotifications),
						value: settingsObj.zimbraPrefShowAllNewMailNotifications
					}}
				/>
			</Container>
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title="Read Reciept" />
				<Select
					items={readReceiptOptn}
					onChange={(view) =>
						updateSettings({ target: { name: 'zimbraPrefMailSendReadReceipts', value: view } })
					}
					defaultSelection={{
						label: findLabel(readReceiptOptn, settingsObj.zimbraPrefMailSendReadReceipts),
						value: settingsObj.zimbraPrefMailSendReadReceipts
					}}
				/>
			</Container>
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title="Messages from me" />
				<Select
					items={msgsFromMeOpts}
					name="zimbraPrefDedupeMessagesSentToSelf"
					onChange={(view) =>
						updateSettings({
							target: { name: 'zimbraPrefDedupeMessagesSentToSelf', value: view }
						})
					}
					defaultSelection={{
						label: findLabel(msgsFromMeOpts, settingsObj.zimbraPrefDedupeMessagesSentToSelf),
						value: settingsObj.zimbraPrefDedupeMessagesSentToSelf
					}}
				/>
			</Container>
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title="Duplicate Messages" />
				<Checkbox
					label={t(
						'label.automatically_delete_duplicates',
						'Automatically delete duplicate copies of the same message when received'
					)}
					value={settingsObj.zimbraPrefMessageIdDedupingEnabled === 'TRUE'}
					onClick={() =>
						updateSettings({
							target: {
								name: 'zimbraPrefMessageIdDedupingEnabled',
								value: settingsObj.zimbraPrefMessageIdDedupingEnabled === 'TRUE' ? 'FALSE' : 'TRUE'
							}
						})
					}
				/>
			</Container>
		</FormSubSection>
	);
}
