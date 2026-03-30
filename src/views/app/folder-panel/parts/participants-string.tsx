/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useUserAccount } from '@zextras/carbonio-shell-ui';
import { getRootsMap, ParticipantRole, ParticipantRoleType } from '@zextras/carbonio-ui-commons';
import { reduce, trimStart, uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { participantToString } from '../../../../commons/utils';
import { getFolderOwnerAccountName, isDraft, isInbox, isSent } from '../../../../helpers/folders';
import { isConversation } from '../../../../helpers/messages';
import { getConversationMessagesParents } from '../../../../store/emails/store';
import { DetailPanelMessageRouteParams, DetailPanelRoutesParams } from '../../../../types/routes';
import { NormalizedConversation } from 'types/conversations';
import { MailMessage } from 'types/messages';

const getUserAddress = (
	item: NormalizedConversation | MailMessage,
	parent: string,
	folderId?: string
): string => {
	const folderRoots = getRootsMap();
	if (folderId) {
		return getFolderOwnerAccountName(folderId, folderRoots);
	}
	if (isConversation(item)) {
		return getFolderOwnerAccountName(parent, folderRoots);
	}
	return getFolderOwnerAccountName(item.parent, folderRoots);
};

const resolveConversationRole = (
	item: NormalizedConversation,
	folderId?: string
): ParticipantRoleType => {
	if (folderId) {
		if (isInbox(folderId)) {
			return ParticipantRole.FROM;
		}
		if (isSent(folderId)) {
			return ParticipantRole.TO;
		}
	}
	const messagesParents = getConversationMessagesParents(item.id);

	if (messagesParents.every(isInbox)) {
		return ParticipantRole.FROM;
	}
	if (messagesParents.every(isSent)) {
		return ParticipantRole.TO;
	}
	const userAddress = getUserAddress(item, messagesParents[0], folderId);

	const iAmFrom = !!item.participants?.some(
		(p) => p.address === userAddress && p.type === ParticipantRole.FROM
	);

	const iAmTo = !!item.participants?.some(
		(p) => p.address === userAddress && p.type === ParticipantRole.TO
	);

	if (iAmFrom && iAmTo) {
		return ParticipantRole.FROM;
	}

	return iAmFrom ? ParticipantRole.TO : ParticipantRole.FROM;
};

const resolveMessageRole = (item: MailMessage): ParticipantRoleType => {
	if (isInbox(item.parent)) {
		return ParticipantRole.FROM;
	}

	if (isDraft(item.parent) || isSent(item.parent)) {
		return ParticipantRole.TO;
	}

	return item.isSentByMe ? ParticipantRole.TO : ParticipantRole.FROM;
};

const useParticipantsString = ({
	item
}: {
	item: NormalizedConversation | MailMessage;
}): string => {
	const account = useUserAccount();
	const [t] = useTranslation();
	const { folderId } = useParams<DetailPanelRoutesParams>();

	const participantRole = useMemo(() => {
		if (isConversation(item)) {
			return resolveConversationRole(item, folderId);
		}
		return resolveMessageRole(item);
	}, [folderId, item]);

	return useMemo(() => {
		const activeParticipants = item.participants?.filter((p) => p.type === participantRole);
		const participantsToReduce = uniqBy(activeParticipants, (em) => em.address);
		if (participantsToReduce.length === 0) {
			return t('recipient.toField.missing', `[Empty 'To' Field]`);
		}
		return reduce(
			participantsToReduce,
			(acc, part) => trimStart(`${acc}, ${participantToString(part, [account])}`, ', '),
			''
		);
	}, [account, participantRole, t, item?.participants]);
};

export const ParticipantsString = ({
	item
}: {
	item: NormalizedConversation | MailMessage;
}): React.JSX.Element => {
	const participantsString = useParticipantsString({ item });
	const { folderId } = useParams<DetailPanelRoutesParams>() as DetailPanelMessageRouteParams;
	const [t] = useTranslation();

	return (
		<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
			{isDraft(folderId ?? (item as MailMessage)?.parent) && (
				<Padding right="small">
					<Text color="error">{t('label.draft_folder', '[DRAFT]')}</Text>
				</Padding>
			)}
			<Tooltip label={participantsString} overflow="break-word" maxWidth="60vw">
				<Text
					data-testid="participants-name-label"
					color={item.read ? 'text' : 'primary'}
					weight={item.read ? 'regular' : 'bold'}
				>
					{participantsString}
				</Text>
			</Tooltip>
		</Row>
	);
};
