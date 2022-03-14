/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useTranslation } from 'react-i18next';
import { FOLDERS, useUserAccount } from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';
import React, { useMemo } from 'react';
import { filter, findIndex, reduce, trimStart, uniqBy } from 'lodash';
import { Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { participantToString } from '../../../../commons/utils';

export const SenderName = ({ item, textValues, isFromSearch }) => {
	const [t] = useTranslation();
	const account = useUserAccount();
	const { folderId } = useParams();
	const participantsString = useMemo(() => {
		const participants = filter(item.participants, (p) => {
			if (folderId === FOLDERS.INBOX) return p.type === 'f'; // inbox
			if (folderId === FOLDERS.SENT) return p.type === 't'; // sent
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
	}, [account, folderId, item.participants, t]);

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
