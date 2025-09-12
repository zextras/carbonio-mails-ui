/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { t, useUserAccount } from '@zextras/carbonio-shell-ui';
import { FOLDERS, getFolder, ParticipantRole } from '@zextras/carbonio-ui-commons';
import { findIndex, reduce, trimStart, uniqBy } from 'lodash';

import { participantToString } from 'commons/utils';
import { getFolderIdParts, isSentSubfolder } from 'helpers/folders';
import { isConversation } from 'helpers/messages';
import { getConversationMessages } from 'store/emails/store';
import {
	IncompleteMessage,
	NormalizedConversation,
	Participant,
	TextReadValuesProps
} from 'types/index.d';

export type ParticipantsNameProps = {
	item: NormalizedConversation | IncompleteMessage;
	isSearchModule?: boolean;
	textValues?: TextReadValuesProps;
};

function removeReplyToParticipants(
	participants: Array<Participant> | undefined
): Array<Participant> {
	if (!participants) return [];
	return participants.filter((p) => p.type !== ParticipantRole.REPLY_TO);
}

export const ParticipantsName = ({
	item,
	textValues,
	isSearchModule = false
}: ParticipantsNameProps): React.JSX.Element => {
	const account = useUserAccount();

	const parent = isConversation(item) ? getConversationMessages(item.id)[0].parent : item.parent;

	const folder = getFolder(parent);
	const folderId = getFolderIdParts(parent).id;
	const participantsWithoutReplyTo = removeReplyToParticipants(item.participants);

	const participantsString = useMemo(() => {
		const participants = participantsWithoutReplyTo.filter((p) => {
			if (isConversation(item)) return true;
			if (
				folderId !== FOLDERS.SENT &&
				folderId !== FOLDERS.DRAFTS &&
				!isSearchModule &&
				!isSentSubfolder(folder)
			)
				return p.type === ParticipantRole.FROM; // Not sent or drafts
			if (!isSearchModule && (isSentSubfolder(folder) || folderId === FOLDERS.SENT))
				return p.type === ParticipantRole.TO; // sent
			if (isSearchModule) return p.type === ParticipantRole.FROM; // search module
			return true; // keep all
		});
		const meIndex = findIndex(participants, ['address', account?.name]);
		if (meIndex >= 0) {
			// swap index me will be at first
			const activeParticipant = participants[0];
			participants[0] = participants[meIndex];
			participants[meIndex] = activeParticipant;
		}

		return reduce(
			uniqBy(participants, (em) => em.address),
			(acc, part) => trimStart(`${acc}, ${participantToString(part, [account])}`, ', '),
			''
		);
	}, [account, folder, folderId, isSearchModule, item, participantsWithoutReplyTo]);

	return (
		<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
			{!isSearchModule && folderId === FOLDERS.DRAFTS && (
				<Padding right="small">
					<Text color="error">{t('label.draft_folder', '[DRAFT]')}</Text>
				</Padding>
			)}
			{participantsString.length > 0 ? (
				<Tooltip label={participantsString} overflow="break-word" maxWidth="60vw">
					<Text
						data-testid="participants-name-label"
						color={textValues?.color}
						weight={textValues?.weight}
					>
						{participantsString}
					</Text>
				</Tooltip>
			) : (
				<Text
					data-testid="participants-empty-label"
					color={textValues?.color}
					weight={textValues?.weight}
				>
					{t('recipient.toField.missing', `[Empty 'To' Field]`)}
				</Text>
			)}
		</Row>
	);
};
