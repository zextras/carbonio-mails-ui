/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ChangeEvent, FC, useCallback, useMemo } from 'react';

import {
	Row,
	FormSubSection,
	Select,
	Input,
	Padding,
	RadioGroup,
	Radio,
	SelectItem,
	Icon,
	Text,
	FormSection,
	Container
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { MAIL_APP_ID } from 'constants/index';
import { DisplayingMessagesSettingsProps } from 'types/settings';
import {
	CheckNewMailOptions,
	DisplayMailOptions,
	MessageSelectionOptions,
	findLabel,
	ConversationSortingSettings,
	UnsendTimeOptions
} from 'views/settings/components/utils';
import { displayingMessagesSubSection } from 'views/settings/subsections';

export const DisplayMessagesSettings: FC<DisplayingMessagesSettingsProps> = ({
	settingsObj,
	updateSettings,
	updateProps,
	updatedProps
}) => {
	const checkNewMailOptions = useMemo(
		() =>
			CheckNewMailOptions(
				settingsObj.zimbraPrefMailPollingInterval.includes('s'),
				settingsObj.zimbraPrefMailPollingInterval.includes('m')
			),
		[settingsObj?.zimbraPrefMailPollingInterval]
	);
	const displayMailOptions = useMemo(() => DisplayMailOptions(), []);
	const messageSelectionOptions = useMemo(() => MessageSelectionOptions(), []);
	const conversationSortingSettings = useMemo(() => ConversationSortingSettings(), []);
	const unsendTimeOptions = useMemo(() => UnsendTimeOptions(), []);

	const sectionTitle = useMemo(() => displayingMessagesSubSection(), []);

	const onChangeSorting = useCallback(
		(view: SelectItem[] | string | null): void =>
			updateSettings({
				target: { name: 'zimbraPrefConversationOrder', value: (view as string) ?? '' }
			}),
		[updateSettings]
	);

	const defaultSelectionSorting = useMemo(
		() => ({
			label: findLabel(conversationSortingSettings, settingsObj.zimbraPrefConversationOrder),
			value: settingsObj.zimbraPrefConversationOrder
		}),
		[conversationSortingSettings, settingsObj.zimbraPrefConversationOrder]
	);

	const defaultUnsendTime = useMemo(() => {
		const delayValue = updatedProps?.mails_snackbar_delay?.value;
		return delayValue
			? {
					label: findLabel(unsendTimeOptions, delayValue as string),
					value: delayValue
				}
			: // Default to the 3-second option to maintain consistency with the expected default behavior
				unsendTimeOptions[1];
	}, [unsendTimeOptions, updatedProps?.mails_snackbar_delay]);

	return (
		<FormSection id={sectionTitle.id} label={sectionTitle.label} padding={{ all: 'medium' }}>
			<FormSubSection>
				<Container gap={'0.5rem'}>
					<Select
						label={t('settings.label.conversation_ordering', 'Conversation ordering')}
						items={conversationSortingSettings}
						onChange={onChangeSorting}
						defaultSelection={defaultSelectionSorting}
					/>
					<Select
						label={t('settings.label.check_new_mail', 'Check new e-mail')}
						items={checkNewMailOptions}
						onChange={(view: SelectItem[] | string | null): void =>
							updateSettings({
								target: { name: 'zimbraPrefMailPollingInterval', value: (view as string) ?? '' }
							})
						}
						defaultSelection={{
							label:
								findLabel(checkNewMailOptions, settingsObj.zimbraPrefMailPollingInterval) ??
								settingsObj.zimbraPrefMailPollingInterval,
							value: settingsObj.zimbraPrefMailPollingInterval
						}}
					/>
					<Select
						label={t('settings.label.display_mail', 'Display mail')}
						items={displayMailOptions}
						onChange={(view: SelectItem[] | string | null): void =>
							updateSettings({
								target: {
									name: 'zimbraPrefMessageViewHtmlPreferred',
									value: (view as string) ?? ''
								}
							})
						}
						defaultSelection={{
							label: findLabel(displayMailOptions, settingsObj.zimbraPrefMessageViewHtmlPreferred),
							value: settingsObj.zimbraPrefMessageViewHtmlPreferred
						}}
					/>
				</Container>
			</FormSubSection>
			{/* Will be Implemented in starting months of 2022 */}
			{/* <Container crossAlignment="baseline">
				<Heading title={t('settings.label.message_preview_title', 'Message preview and Images')} />
				<Padding bottom="small" />
				<Checkbox
					label={t(
						'settings.label.display_external_images',
						'Automatically display external images in HTML e-mail'
					)}
					value={settingsObj.zimbraPrefDisplayExternalImages === 'TRUE'}
					onClick={() =>
						updateSettings({
							target: {
								name: 'zimbraPrefDisplayExternalImages',
								value: settingsObj.zimbraPrefDisplayExternalImages === 'TRUE' ? 'FALSE' : 'TRUE'
							}
						})
					}
				/>
			</Container> */}
			<FormSubSection label={t('settings.label.message_selection', 'Message Selection')}>
				<Select
					items={messageSelectionOptions}
					onChange={(view: SelectItem[] | string | null): void =>
						updateSettings({
							target: { name: 'zimbraPrefMailSelectAfterDelete', value: (view as string) ?? '' }
						})
					}
					defaultSelection={{
						label: findLabel(messageSelectionOptions, settingsObj.zimbraPrefMailSelectAfterDelete),
						value: settingsObj.zimbraPrefMailSelectAfterDelete
					}}
				/>
			</FormSubSection>
			<FormSubSection label={t('settings.label.unsend_time', 'Set send time')}>
				<Select
					label={t('settings.label.unsend_time', 'Set send time')}
					items={unsendTimeOptions}
					onChange={(view: SelectItem[] | string | null): void =>
						updateProps({
							target: {
								name: 'mails_snackbar_delay',
								value: {
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									app: MAIL_APP_ID,
									value: (view as string) ?? ''
								}
							}
						})
					}
					defaultSelection={defaultUnsendTime}
				/>
			</FormSubSection>
			{/* <Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title={t('settings.label.message_color', 'Message Color')} />
				<Checkbox
					label={t(
						'settings.label.set_message_color',
						'Set color of messages and conversations according to tag color.'
					)}
					value={settingsObj.zimbraPrefColorMessagesEnabled === 'TRUE'}
					onClick={(): void =>
						updateSettings({
							target: {
								name: 'zimbraPrefColorMessagesEnabled',
								value: settingsObj.zimbraPrefColorMessagesEnabled === 'TRUE' ? 'FALSE' : 'TRUE'
							}
						})
					}
				/>
			</Container> */}
			<FormSubSection label={t('settings.label.visualization_options', 'Visualization Options')}>
				<RadioGroup
					style={{ width: '100%' }}
					value={settingsObj.zimbraPrefGroupMailBy}
					onChange={(newValue): void => {
						updateSettings({ target: { name: 'zimbraPrefGroupMailBy', value: newValue } });
					}}
				>
					<Radio
						width="100%"
						label={t('label.by_conversation', 'By Conversation')}
						value="conversation"
					/>
					<Radio width="100%" label={t('label.by_message', 'By Message')} value="message" />
				</RadioGroup>
			</FormSubSection>

			{/* Read after N seconds option managed as a read immediately */}
			<FormSubSection label={t('settings.label.mark_reading_panel', 'Mark as read')}>
				<RadioGroup
					style={{ width: '100%' }}
					value={settingsObj.zimbraPrefMarkMsgRead === '-1' ? '-1' : '0'}
					onChange={(newValue): void => {
						updateSettings({ target: { name: 'zimbraPrefMarkMsgRead', value: newValue } });
					}}
				>
					<Radio
						width="100%"
						label={
							<Row orientation="column" crossAlignment="flex-start">
								<Text weight="bold">{t('settings.label.default', 'Default')}</Text>
								<Padding bottom="0.5rem">
									<Text>
										{t(
											'label.mark_read_message_immediately',
											'Mark as read when opening the message'
										)}
									</Text>
								</Padding>
							</Row>
						}
						value="0"
					/>
					<Radio
						width="100%"
						label={
							<Row orientation="column" crossAlignment="flex-start">
								<Text weight="bold">{t('settings.label.mark_manually', 'Mark Manually')}</Text>
								<Padding bottom="0.5rem">
									<Row gap={'0.5rem'}>
										<Text>
											{t(
												'label.mark_read_message_manually',
												'Manually mark as read by clicking this icon'
											)}
										</Text>
										<Icon size="medium" icon="EmailReadOutline" />
									</Row>
								</Padding>
							</Row>
						}
						value="-1"
					/>
				</RadioGroup>
			</FormSubSection>
		</FormSection>
	);
};
