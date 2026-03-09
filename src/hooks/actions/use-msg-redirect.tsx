/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from 'constants/index';
import { isDraft, isTrash } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import RedirectAction from 'ui-actions/redirect-message-action';

export const useMsgRedirectFn = (messageId: string, folderId: string): ActionFn => {
	const { createModal, closeModal } = useUiUtilities();

	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isTrash(folderId),
		[folderId]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			const modalId = Date.now().toString();
			createModal(
				{
					id: modalId,
					maxHeight: '90vh',
					onClose: (): void => {
						closeModal(modalId);
					},
					children: <RedirectAction onClose={(): void => closeModal(modalId)} id={messageId} />
				},
				true
			);
		}
	}, [canExecute, closeModal, createModal, messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgRedirectDescriptor = (
	messageId: string,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useMsgRedirectFn(messageId, folderId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.REDIRECT.id,
		icon: 'CornerUpRight',
		label: t('action.redirect', 'Redirect'),
		execute,
		canExecute
	};
};
