/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { Account, useUserAccount } from '@zextras/carbonio-shell-ui';
import { FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';
import { every, filter, find, map, reduce, trimStart, uniq, uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { participantToString } from '../../../../commons/utils';
import { isConversation } from '../../../../helpers/messages';
import { getConversationMessages } from '../../../../store/emails/store';
import { DetailPanelMessageRouteParams, DetailPanelRoutesParams } from '../../../../types/routes';
import { MailMessage, NormalizedConversation, Participant } from 'types/index.d';

function removeReplyToParticipants(
	participants: Array<Participant> | undefined
): Array<Participant> {
	if (!participants) return [];
	return participants.filter((p) => p.type !== ParticipantRole.REPLY_TO);
}

export type ParticipantRoleType = (typeof ParticipantRole)[keyof typeof ParticipantRole];

const getSearchConversationParticipantRole = ({
	conversationId,
	userParticipantRole
}: {
	conversationId: string;
	userParticipantRole: Participant[];
}): ParticipantRoleType => {
	const messagesParents = map(getConversationMessages(conversationId), 'parent');
	const uniqParents = uniq(messagesParents);
	const inDraftsOrSent = every(uniqParents, (id) => id === FOLDERS.DRAFTS || id === FOLDERS.SENT);
	const inInbox = every(uniqParents, (id) => id === FOLDERS.INBOX);
	const iAmInFrom = !!find(userParticipantRole, ['type', ParticipantRole.FROM]);
	const iAmInTo = !!find(userParticipantRole, ['type', ParticipantRole.TO]);
	if (inDraftsOrSent) {
		return ParticipantRole.TO;
	}
	if (inInbox) {
		return ParticipantRole.FROM;
	}
	if (iAmInFrom && iAmInTo) {
		return ParticipantRole.FROM;
	}
	if (iAmInFrom && !iAmInTo) {
		return ParticipantRole.TO;
	}
	return ParticipantRole.FROM;
};

const getConversationParticipantRole = ({
	account,
	participants,
	folderId,
	conversationId
}: {
	account: Account;
	participants: Participant[];
	folderId: string | undefined;
	conversationId: string;
}): ParticipantRoleType => {
	const me = filter(participants, ['address', account?.name]);
	const iAmInFrom = !!find(me, ['type', ParticipantRole.FROM]);
	const iAmInTo = !!find(me, ['type', ParticipantRole.TO]);
	if (folderId) {
		if (folderId === FOLDERS.INBOX) {
			return ParticipantRole.FROM;
		}
		if (folderId === FOLDERS.SENT) {
			return ParticipantRole.TO;
		}
		if (iAmInFrom && iAmInTo) {
			return ParticipantRole.FROM;
		}
		if (iAmInFrom && !iAmInTo) {
			return ParticipantRole.TO;
		}
	}
	return getSearchConversationParticipantRole({ conversationId, userParticipantRole: me });
};

const useParticipantRole = (item: MailMessage | NormalizedConversation): ParticipantRoleType => {
	const account = useUserAccount();
	const { folderId } = useParams<DetailPanelRoutesParams>() as DetailPanelMessageRouteParams;
	return useMemo(() => {
		if (isConversation(item)) {
			return getConversationParticipantRole({
				account,
				participants: item.participants,
				folderId,
				conversationId: item.id
			});
		}
		if (item.parent === FOLDERS.INBOX) {
			return ParticipantRole.FROM;
		}
		if (item.parent === FOLDERS.DRAFTS || item.parent === FOLDERS.SENT) {
			return ParticipantRole.TO;
		}
		return ParticipantRole.FROM;
	}, [account, folderId, item]);
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
	return (
		<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
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
