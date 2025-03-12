/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { t, useUserAccount } from '@zextras/carbonio-shell-ui';
import { filter, findIndex, reduce, trimStart, uniqBy } from 'lodash';

import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { ParticipantRole } from '../../../../carbonio-ui-commons/constants/participants';
import { participantToString } from '../../../../commons/utils';
import { getFolderIdParts } from '../../../../helpers/folders';
import { isConversation } from '../../../../helpers/messages';
import { getConversationMessages } from '../../../../store/emails/store';
import { NormalizedConversation, IncompleteMessage, TextReadValuesProps } from '../../../../types';

export type ParticipantsNameProps = {
	item: NormalizedConversation | IncompleteMessage;
	isSearchModule?: boolean;
	textValues?: TextReadValuesProps;
};

export const ParticipantsName = ({
	item,
	textValues,
	isSearchModule = false
}: ParticipantsNameProps): React.JSX.Element => {
	const account = useUserAccount();

	console.log('ParticipantsNameProps:', item.participants);
	const parent = isConversation(item) ? getConversationMessages(item.id)[0].parent : item.parent;

	const folderId = getFolderIdParts(parent).id;
	console.log('ParticipantsNameProps:', folderId);

	const participantsString = useMemo(() => {
		const participants = filter(item.participants, (p) => {
			if (isConversation(item)) return true;
			if (folderId === FOLDERS.INBOX) return p.type === ParticipantRole.FROM; // inbox
			if (folderId === FOLDERS.SENT && !isSearchModule) return p.type === ParticipantRole.TO; // sent
			if (isSearchModule) return p.type === ParticipantRole.FROM; // search module
			return true; // keep all
		});
		console.log('participants', participants);
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
	}, [account, folderId, isSearchModule, item]);
	console.log('ParticipantsNameProps:', participantsString);

	return (
		<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
			{!isSearchModule && folderId === FOLDERS.DRAFTS && (
				<Padding right="small">
					<Text color="error">{t('label.draft_folder', '[DRAFT]')}</Text>
				</Padding>
			)}
			<Tooltip label={participantsString} overflow="break-word" maxWidth="60vw">
				<Text
					data-testid="participants-name-label"
					color={textValues?.color}
					weight={textValues?.weight}
				>
					{participantsString}
				</Text>
			</Tooltip>
		</Row>
	);
};
