/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useRef, useState } from 'react';

import {
	Button,
	Dropdown,
	Icon,
	Padding,
	Row,
	Tooltip,
	Text
} from '@zextras/carbonio-design-system';
import { Tag } from '@zextras/carbonio-ui-soap-lib';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { MailMsgPreviewActions } from './mail-message-preview-actions';
import { getCompactDateLabel, getTimeLabel } from 'commons/utils';
import { retrieveAttachmentsType } from 'store/editor-slice-utils';
import { MailMessage } from 'types/messages';

type PreviewHeaderActions = {
	message: MailMessage;
	tags: Tag[];
	open: boolean;
	isWide: boolean;
};

export const PreviewHeaderActions: FC<PreviewHeaderActions> = ({
	message,
	tags,
	open,
	isWide
}): ReactElement => {
	const [t] = useTranslation();
	const textRef = useRef<HTMLInputElement>(null);
	const [showDropdown, setShowDropdown] = useState(false);

	const attachments = retrieveAttachmentsType(message, 'attachment');

	const tagIcon = useMemo(() => (tags.length > 1 ? 'TagsMoreOutline' : 'Tag'), [tags]);

	const tagIconColor = useMemo(() => (tags?.length === 1 ? tags[0].color : undefined), [tags]);

	const showMultiTagIcon = useMemo(() => tags?.length > 1, [tags]);

	const scheduledTime = useMemo(
		() =>
			t('message.schedule_mail', {
				date: moment(message?.autoSendTime).format('DD/MM/YYYY'),
				time: moment(message?.autoSendTime).format('HH:mm'),
				defaultValue: 'Will be sent on: {{date}} at {{time}}'
			}),
		[message?.autoSendTime, t]
	);

	const dateSection = useMemo(
		() => (
			<Row ref={textRef} minWidth="fit" padding={{ horizontal: 'small' }}>
				{message?.isScheduled ? (
					<Text color="primary" data-testid="scheduledLabel" size="small">
						{scheduledTime}
					</Text>
				) : (
					<Tooltip label={getTimeLabel(message.date)}>
						<Text color="gray1" data-testid="DateLabel" size="extrasmall">
							{isWide ? getTimeLabel(message.date) : getCompactDateLabel(message.date)}
						</Text>
					</Tooltip>
				)}
			</Row>
		),
		[message, scheduledTime, isWide]
	);

	const onIconClick = useCallback((ev: { stopPropagation: () => void }): void => {
		ev.stopPropagation();
		setShowDropdown((o) => !o);
	}, []);

	const onDropdownClose = useCallback((): void => {
		setShowDropdown(false);
	}, []);

	const showTagsInHeader = useMemo(() => {
		if (tags.length === 0) return null;
		if (showMultiTagIcon) {
			return (
				<Dropdown items={tags} forceOpen={showDropdown} onClose={onDropdownClose}>
					<Padding left="small">
						<Button
							data-testid={tagIcon}
							icon={tagIcon}
							type="ghost"
							color={'gray0'}
							onClick={onIconClick}
						/>
					</Padding>
				</Dropdown>
			);
		}
		return (
			<Padding left="small">
				<Tooltip label={tags?.[0]?.name} disabled={showMultiTagIcon}>
					<Icon icon={tagIcon} color={`${tagIconColor}`} />
				</Tooltip>
			</Padding>
		);
	}, [tags, showMultiTagIcon, tagIcon, tagIconColor, showDropdown, onDropdownClose, onIconClick]);

	return (
		<Row wrap="nowrap" mainAlignment="flex-end">
			{showTagsInHeader}
			{message.hasAttachment && attachments.length > 0 && (
				<Padding left="small">
					<Icon icon="AttachOutline" />
				</Padding>
			)}
			{message.flagged && (
				<Padding left="small">
					<Icon color="error" icon="Flag" />
				</Padding>
			)}
			{dateSection}
			{open && message && <MailMsgPreviewActions message={message} isWide={isWide} />}
		</Row>
	);
};
