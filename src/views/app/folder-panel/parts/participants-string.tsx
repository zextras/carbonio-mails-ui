/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useUserAccount } from '@zextras/carbonio-shell-ui';
import { getRootsMap, ParticipantRole, ParticipantRoleType } from '@zextras/carbonio-ui-commons';
import { filter, flatMap, reduce, trimStart, uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { participantToString } from '../../../../commons/utils';
import { getFolderOwnerAccountName, isDraft, isInbox, isSent } from '../../../../helpers/folders';
import { isConversation } from '../../../../helpers/messages';
import {
	getConversationMessagesParents,
	useConversationMessages
} from '../../../../store/emails/store';
import { DetailPanelMessageRouteParams, DetailPanelRoutesParams } from '../../../../types/routes';
import { NormalizedConversation } from 'types/conversations';
import { MailMessage } from 'types/messages';
import { Participant } from 'types/participant';

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

const resolveRoleByFolder = (folderId: string): ParticipantRoleType | undefined => {
	if (isInbox(folderId)) {
		return ParticipantRole.FROM;
	}
	if (isSent(folderId) || isDraft(folderId)) {
		return ParticipantRole.TO;
	}
	return undefined;
};

const resolveConversationRole = (
	item: NormalizedConversation,
	folderId?: string
): ParticipantRoleType => {
	const roleByFolder = folderId ? resolveRoleByFolder(folderId) : undefined;
	if (roleByFolder) {
		return roleByFolder;
	}
	const messagesParents = getConversationMessagesParents(item.id);

	// `[].every()` is `true`, so an empty list would resolve to FROM. That happens whenever the
	// conversation is known but its messages have not been fetched yet (e.g. right after a
	// notification creates it), and it makes a Sent conversation look for a sender it doesn't
	// have, falling back to the "[Empty 'To' Field]" label until something triggers a fetch.
	if (messagesParents.length > 0) {
		if (messagesParents.every(isInbox)) {
			return ParticipantRole.FROM;
		}
		if (messagesParents.every(isSent)) {
			return ParticipantRole.TO;
		}
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
	item,
	folderId: folderIdFromProps
}: {
	item: NormalizedConversation | MailMessage;
	folderId?: string;
}): string => {
	const account = useUserAccount();
	const [t] = useTranslation();
	const { folderId: folderIdFromRoute } = useParams<DetailPanelRoutesParams>();
	const folderId = folderIdFromProps ?? folderIdFromRoute;

	const conversationMessages = useConversationMessages(isConversation(item) ? item.id : '');

	const participantRole = useMemo(() => {
		if (isConversation(item)) {
			return resolveConversationRole(item, folderId);
		}
		return resolveMessageRole(item);
	}, [folderId, item]);

	return useMemo(() => {
		const matchesRole = (participant: Participant): boolean => participant.type === participantRole;
		// A conversation summary does not always carry the participants for the role being
		// displayed: a notification can describe it with the senders only, which left a freshly
		// sent conversation showing the "empty field" placeholder until a later fetch replaced it.
		// The messages of the conversation hold the complete list, so use them as the fallback.
		const activeParticipants = item.participants?.some(matchesRole)
			? filter(item.participants, matchesRole)
			: flatMap(conversationMessages, (message) => filter(message.participants, matchesRole));
		const participantsToReduce = uniqBy(activeParticipants, (em) => em.address);
		if (participantsToReduce.length === 0) {
			return t('recipient.toField.missing', `[Empty 'To' Field]`);
		}
		return reduce(
			participantsToReduce,
			(acc, part) => trimStart(`${acc}, ${participantToString(part, [account])}`, ', '),
			''
		);
	}, [account, participantRole, t, item?.participants, conversationMessages]);
};

export const ParticipantsString = ({
	item,
	folderId: folderIdFromProps
}: {
	item: NormalizedConversation | MailMessage;
	folderId?: string;
}): React.JSX.Element => {
	const participantsString = useParticipantsString({ item, folderId: folderIdFromProps });
	const { folderId: folderIdFromRoute } =
		useParams<DetailPanelRoutesParams>() as DetailPanelMessageRouteParams;
	const folderId = folderIdFromProps ?? folderIdFromRoute;
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
