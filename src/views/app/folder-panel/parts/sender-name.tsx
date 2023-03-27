/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { FOLDERS, t, useUserAccount } from '@zextras/carbonio-shell-ui';
import { filter, findIndex, reduce, trimStart, uniqBy } from 'lodash';
import React, { FC, useMemo } from 'react';
import { ParticipantRole } from '../../../../carbonio-ui-commons/constants/participants';
import { participantToString } from '../../../../commons/utils';
import { SenderNameProps } from '../../../../types';

export const SenderName: FC<SenderNameProps> = ({ item, textValues, isSearchModule = false }) => {
	const account = useUserAccount();
	const folderId = item.parent;
	const participantsString = useMemo(() => {
		const participants = filter(item.participants, (p) => {
			if (folderId === FOLDERS.INBOX) return p.type === ParticipantRole.FROM; // inbox
			if (folderId === FOLDERS.SENT && !isSearchModule) return p.type === ParticipantRole.TO; // sent
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
	}, [account, folderId, isSearchModule, item.participants]);

	return (
		<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
			{!isSearchModule && folderId === FOLDERS.DRAFTS && (
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
