/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ConversationActionsDescriptors, MAILS_ROUTE } from '../../constants';
import { isDraft, isSpam } from '../../helpers/folders';
import { convActionEmailStoreAction } from '../../store/emails/actions/conv-action-action';
import { ActionFn, UIActionDescriptor } from '../../types';

type ConvSetSpamFunctionsParameter = {
	ids: Array<string>;
	shouldReplaceHistory: boolean;
	folderId: string;
};

export const useConvSetSpamFn = ({
	ids,
	shouldReplaceHistory,
	folderId
}: ConvSetSpamFunctionsParameter): ActionFn => {
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isSpam(folderId),
		[folderId]
	);

	const navigate = useNavigate();
	const execute = useCallback((): void => {
		let notCanceled = true;

		const infoSnackbar = (hideButton = false): void => {
			createSnackbar({
				key: `trash-${ids}`,
				replace: true,
				severity: 'info',
				label: t('messages.snackbar.marked_as_spam', 'You’ve marked this e-mail as Spam'),
				autoHideTimeout: 3000,
				hideButton,
				actionLabel: t('label.undo', 'Undo'),
				onActionClick: (): void => {
					notCanceled = false;
				}
			});
		};
		infoSnackbar();
		setTimeout((): void => {
			if (notCanceled) {
				convActionEmailStoreAction({
					operation: 'spam',
					ids
				}).then((res) => {
					if (!('Fault' in res) && shouldReplaceHistory) {
						navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
					}
					if ('Fault' in res) {
						createSnackbar({
							key: `trash-${ids}`,
							replace: true,
							severity: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000
						});
					}
				});
			}
		}, 3000);
	}, [createSnackbar, folderId, ids, navigate, shouldReplaceHistory, t]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvSetSpamDescriptor = ({
	ids,
	shouldReplaceHistory,
	folderId
}: ConvSetSpamFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvSetSpamFn({
		ids,
		shouldReplaceHistory,
		folderId
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.MARK_AS_SPAM.id,
		icon: 'AlertCircle',
		label: t('action.mark_as_spam', 'Mark as spam'),
		execute,
		canExecute
	};
};
