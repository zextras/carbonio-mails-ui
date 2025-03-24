/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { sendDraft } from '../../api/send-draft';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { MessageActionsDescriptors } from '../../constants';
import { isDraft } from '../../helpers/folders';
import { getAddressOwnerAccount } from '../../helpers/identities';
import { getParticipantsFromMessage } from '../../helpers/messages';
import { ActionFn, MailMessage, UIActionDescriptor } from '../../types';

export const useMsgSendDraftFn = (message: MailMessage, folderId: string): ActionFn => {
	const canExecute = useCallback((): boolean => isDraft(folderId), [folderId]);

	const execute = useCallback((): void => {
		if (canExecute() && message.isDraft && message.id) {
			const from = getParticipantsFromMessage(message, ParticipantRole.FROM)?.[0].address;
			const account = getAddressOwnerAccount(from);
			sendDraft({ did: message.did ?? message.id, account: account ?? undefined });
		}
	}, [canExecute, message]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgSendDraftDescriptor = (
	message: MailMessage,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useMsgSendDraftFn(message, folderId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.SEND.id,
		icon: 'PaperPlaneOutline',
		label: t('label.send', 'Send'),
		execute,
		canExecute
	};
};
