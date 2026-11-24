/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo, useRef } from 'react';

import { Icon, Padding, Row, Tooltip, Text } from '@zextras/carbonio-design-system';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { MailMsgPreviewActions } from './mail-message-preview-actions';
import { CollapsedCardTags } from './tags/item-tags';
import { getCompactDateLabel, getTimeLabel } from 'commons/utils';
import { retrieveAttachmentsType } from 'store/editor-slice-utils';
import { MailMessage } from 'types/messages';

type PreviewHeaderActions = {
	message: MailMessage;
	open: boolean;
	isWide: boolean;
};

export const PreviewHeaderActions: FC<PreviewHeaderActions> = ({
	message,
	open,
	isWide
}): ReactElement => {
	const [t] = useTranslation();
	const textRef = useRef<HTMLInputElement>(null);

	const attachments = retrieveAttachmentsType(message, 'attachment');

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

	return (
		<Row wrap="nowrap" mainAlignment="flex-end">
			{!open && <CollapsedCardTags tagIds={message.tags} />}
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
