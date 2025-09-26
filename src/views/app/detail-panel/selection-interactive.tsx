/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { useParams } from 'react-router-dom';

import type { DetailPanelRoutesParams } from '../../../types/routes';
import { getFolderIdParts } from 'helpers/folders';
import { useConversationsIdsByFolder } from 'store/emails/store';
import {
	DraftMessages,
	SentMessages,
	SpamMessages,
	TrashMessages
} from 'views/app/detail-panel/utils';

export const SelectionInteractive = ({ count }: { count: number }): React.JSX.Element => {
	const { folderId } = useParams<DetailPanelRoutesParams>() as DetailPanelRoutesParams;
	const conversationIds = useConversationsIdsByFolder(folderId);
	const spamMessages = useMemo(() => SpamMessages(), []);
	const sentMessages = useMemo(() => SentMessages(), []);
	const draftMessages = useMemo(() => DraftMessages(), []);
	const trashMessages = useMemo(() => TrashMessages(), []);

	const displayerMessage = useMemo(() => {
		if (getFolderIdParts(folderId).id === FOLDERS.SPAM) {
			return conversationIds?.length > 0 ? spamMessages[1] : spamMessages[0];
		}
		if (getFolderIdParts(folderId).id === FOLDERS.SENT) {
			return conversationIds?.length > 0 ? sentMessages[1] : sentMessages[0];
		}
		if (getFolderIdParts(folderId).id === FOLDERS.DRAFTS) {
			return conversationIds?.length > 0 ? draftMessages[1] : draftMessages[0];
		}
		if (getFolderIdParts(folderId).id === FOLDERS.TRASH) {
			return conversationIds?.length > 0 ? trashMessages[1] : trashMessages[0];
		}
		return conversationIds && conversationIds.length > 0
			? {
					title: t('displayer.title4', 'Select an e-mail to read it'),
					description: t(
						'displayer.description4',
						'You can flag it, reply or forward it to other users.'
					)
				}
			: {
					title: t('displayer.title1', 'Compose a new e-mail by clicking the "NEW"button'),
					description: ''
				};
	}, [conversationIds, folderId, spamMessages, sentMessages, draftMessages, trashMessages]);

	const textContentTitle = useMemo(
		() =>
			count > 0
				? t('label.mail_selected', {
						count,
						defaultValue_one: '{{count}} e-mail selected',
						defaultValue_other: '{{count}} e-mails selected'
					})
				: displayerMessage?.title,
		[count, displayerMessage?.title]
	);
	const textContentSubtitle = useMemo(
		() => (count > 0 ? null : displayerMessage?.description),
		[count, displayerMessage?.description]
	);

	return (
		<Container background="gray5" data-testid="selection-interactive">
			<Padding all="medium">
				<Text
					color="gray1"
					overflow="break-word"
					weight="bold"
					size="large"
					style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
				>
					{textContentTitle}
				</Text>
			</Padding>
			<Text
				size="small"
				color="gray1"
				overflow="break-word"
				style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
			>
				{textContentSubtitle}
			</Text>
		</Container>
	);
};
