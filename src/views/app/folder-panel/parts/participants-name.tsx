/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { Account, useUserAccount } from '@zextras/carbonio-shell-ui';
import { getRootsMap, ParticipantRole } from '@zextras/carbonio-ui-commons';
import { reduce, trimStart, uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { participantToString } from '../../../../commons/utils';
import { getFolderOwnerAccountName, isDraft, isInbox, isSent } from '../../../../helpers/folders';
import { isConversation } from '../../../../helpers/messages';
import { getConversationMessagesParents } from '../../../../store/emails/store';
import { DetailPanelMessageRouteParams, DetailPanelRoutesParams } from '../../../../types/routes';
import { MailMessage, NormalizedConversation, Participant } from 'types/index.d';

function removeReplyToParticipants(
	participants: Array<Participant> | undefined
): Array<Participant> {
	if (!participants) return [];
	return participants.filter((p) => p.type !== ParticipantRole.REPLY_TO);
}

export type ParticipantRoleType = (typeof ParticipantRole)[keyof typeof ParticipantRole];

const resolveParticipantRole = ({
	inInbox,
	inDraftsOrSent,
	userAddress,
	participants,
	isAMessageSentByMe
}: {
	inInbox: boolean;
	inDraftsOrSent: boolean;
	userAddress: Account['name'];
	participants: Participant[] | undefined;
	isAMessageSentByMe: boolean;
}): ParticipantRoleType => {
	if (inDraftsOrSent) return ParticipantRole.TO;
	if (inInbox) return ParticipantRole.FROM;

	if (isAMessageSentByMe) {
		return isAMessageSentByMe ? ParticipantRole.TO : ParticipantRole.FROM;
	}

	const iAmInFrom = !!participants?.some(
		(p) => p.address === userAddress && p.type === ParticipantRole.FROM
	);

	const iAmInTo = !!participants?.some(
		(p) => p.address === userAddress && p.type === ParticipantRole.TO
	);

	if (iAmInFrom && iAmInTo) {
		return ParticipantRole.FROM;
	}
	return iAmInFrom ? ParticipantRole.TO : ParticipantRole.FROM;
};

const getFolderContext = (
	item: MailMessage | NormalizedConversation,
	folderId?: string
): {
	inInbox: boolean;
	inDraftsOrSent: boolean;
} => {
	if (!isConversation(item)) {
		return {
			inInbox: isInbox(item.parent),
			inDraftsOrSent: isDraft(item.parent) || isSent(item.parent)
		};
	}

	const folderIds = folderId ? [folderId] : getConversationMessagesParents(item.id);

	return {
		inInbox: folderIds.every((p) => isInbox(p)),
		inDraftsOrSent: folderIds.every((p) => isDraft(p) || isSent(p))
	};
};

export const useParticipantRole = (
	item: MailMessage | NormalizedConversation
): ParticipantRoleType => {
	const { folderId } = useParams<DetailPanelRoutesParams>() as DetailPanelMessageRouteParams;
	const folderRoots = getRootsMap();
	const userAddress = getFolderOwnerAccountName(
		folderId ?? (item as MailMessage)?.parent,
		folderRoots
	);

	return useMemo(() => {
		const { inInbox, inDraftsOrSent } = getFolderContext(item, folderId);

		return resolveParticipantRole({
			inInbox,
			inDraftsOrSent,
			userAddress,
			participants: item.participants,
			isAMessageSentByMe: isConversation(item) ? false : item.isSentByMe
		});
	}, [folderId, item, userAddress]);
};

const useParticipantsString = ({
	item
}: {
	item: NormalizedConversation | MailMessage;
}): string => {
	const account = useUserAccount();
	const [t] = useTranslation();

	const participantRole = useParticipantRole(item);
	const participantsWithoutReplyTo = removeReplyToParticipants(item.participants);

	return useMemo(() => {
		const activeParticipants = participantsWithoutReplyTo.filter((p) => p.type === participantRole);
		const participantsToReduce = uniqBy(activeParticipants, (em) => em.address);
		if (participantsToReduce.length === 0) {
			return t('recipient.toField.missing', `[Empty 'To' Field]`);
		}
		return reduce(
			participantsToReduce,
			(acc, part) => trimStart(`${acc}, ${participantToString(part, [account])}`, ', '),
			''
		);
	}, [account, participantRole, participantsWithoutReplyTo, t]);
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
