/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS, t, useUserAccount } from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';
import React, { FC, useMemo } from 'react';
import { filter, findIndex, reduce, trimStart, uniqBy } from 'lodash';
import { Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { ParticipantRole, participantToString } from '../../../../commons/utils';
import { IncompleteMessage, Conversation, TextReadValuesProps } from '../../../../types';

type SenderNameProps = {
	item: Conversation | IncompleteMessage;
	isFromSearch?: boolean;
	textValues?: TextReadValuesProps;
};

export const SenderName: FC<SenderNameProps> = ({ item, textValues, isFromSearch = false }) => {
	const account = useUserAccount();
	const { folderId } = useParams<{ folderId: string }>();
	const participantsString = useMemo(() => {
		const participants = filter(item.participants, (p) => {
			if (folderId === FOLDERS.INBOX) return p.type === ParticipantRole.FROM; // inbox
			if (folderId === FOLDERS.SENT && !isFromSearch) return p.type === ParticipantRole.TO; // sent
			if (isFromSearch) return p.type === ParticipantRole.FROM; // search module
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
			(acc, part) => trimStart(`${acc}, ${participantToString(part, t, [account])}`, ', '),
			''
		);
	}, [account, folderId, isFromSearch, item.participants]);

	return (
		<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
			{!isFromSearch && folderId === FOLDERS.DRAFTS && (
				<Padding right="small">
					<Text color="error">{t('label.draft_folder', '[DRAFT]')}</Text>
				</Padding>
			)}
			<Tooltip label={participantsString} overflow="break-word" maxWidth="60vw">
				<Text data-testid="ParticipantLabel" color={textValues?.color} weight={textValues?.weight}>
					{participantsString}
				</Text>
			</Tooltip>
		</Row>
	);
};
