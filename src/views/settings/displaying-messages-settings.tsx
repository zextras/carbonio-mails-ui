/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, FC, useCallback, useMemo } from 'react';
import {
	Container,
	Row,
	FormSubSection,
	Select,
	Input,
	Checkbox,
	RadioGroup,
	Radio,
	SelectItem
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import Heading from './components/settings-heading';
import {
	CheckNewMailOptions,
	DisplayMailOptions,
	MessageSelectionOptions,
	findLabel,
	ConversationSortingSettings
} from './components/utils';
import { displayingMessagesSubSection } from './subsections';
import { DisplayingMessagesSettingsProps } from '../../types';

const DisplayingMessagesSettings: FC<DisplayingMessagesSettingsProps> = ({
	settingsObj,
	updateSettings
}) => {
	const [t] = useTranslation();
	const checkNewMailOptions = useMemo(
		() =>
			CheckNewMailOptions(
				t,
				settingsObj.zimbraPrefMailPollingInterval.includes('s'),
				settingsObj.zimbraPrefMailPollingInterval.includes('m')
			),
		[settingsObj?.zimbraPrefMailPollingInterval, t]
	);
	const displayMailOptions = useMemo(() => DisplayMailOptions(t), [t]);
	const messageSelectionOptions = useMemo(() => MessageSelectionOptions(t), [t]);
	const conversationSortingSettings = useMemo(() => ConversationSortingSettings(t), [t]);
	const sectionTitle = useMemo(() => displayingMessagesSubSection(t), [t]);
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
	return (
		<FormSubSection id={sectionTitle.id} label={sectionTitle.label} padding={{ all: 'medium' }}>
			<Row width="100%" padding={{ horizontal: 'small', vertical: 'small' }}>
				<Select
					label={t('settings.label.conversation_ordering', 'Conversation ordering')}
					items={conversationSortingSettings}
					onChange={onChangeSorting}
					defaultSelection={defaultSelectionSorting}
				/>
			</Row>
			<Row width="100%" padding={{ horizontal: 'small', bottom: 'small' }}>
				<Select
					label={t('settings.label.check_new_mail', 'Check new e-mail')}
					items={checkNewMailOptions}
					onChange={(view: SelectItem[] | string | null): void =>
						updateSettings({
							target: { name: 'zimbraPrefMailPollingInterval', value: (view as string) ?? '' }
						})
					}
					defaultSelection={{
						label: findLabel(checkNewMailOptions, settingsObj.zimbraPrefMailPollingInterval),
						value: settingsObj.zimbraPrefMailPollingInterval
					}}
				/>
			</Row>

			<Row width="100%" padding={{ horizontal: 'small' }}>
				<Select
					label={t('settings.label.display_mail', 'Display mail')}
					items={displayMailOptions}
					onChange={(view: SelectItem[] | string | null): void =>
						updateSettings({
							target: { name: 'zimbraPrefMessageViewHtmlPreferred', value: (view as string) ?? '' }
						})
					}
					defaultSelection={{
						label: findLabel(displayMailOptions, settingsObj.zimbraPrefMessageViewHtmlPreferred),
						value: settingsObj.zimbraPrefMessageViewHtmlPreferred
					}}
				/>
			</Row>
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
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title={t('settings.label.message_selection', 'Message Selection')} />
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
			</Container>
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
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
			</Container>
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title={t('settings.label.visualization_options', 'Visualization Options')} />
				<RadioGroup
					style={{ width: '100%' }}
					value={settingsObj.zimbraPrefGroupMailBy}
					onChange={(newValue: string): void => {
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
			</Container>
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title={t('settings.label.default_mail_search', 'Default Mail Search')} />
				<Input
					label={t('settings.label.search_query', 'Default query')}
					value={settingsObj.zimbraPrefMailInitialSearch}
					onChange={(e: ChangeEvent<HTMLInputElement>): void =>
						updateSettings({
							target: {
								name: 'zimbraPrefMailInitialSearch',
								value: e.target.value
							}
						})
					}
				/>
			</Container>
		</FormSubSection>
	);
};

export default DisplayingMessagesSettings;
