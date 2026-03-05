/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MAILS_ROUTE, MessageActionsDescriptors, TIMEOUTS } from 'constants/index';
import { isSpam } from 'helpers/folders';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';

type MsgSetNotSpam = {
	ids: Array<string>;
	shouldReplaceHistory?: boolean;
	folderId?: string;
	onActionComplete?: (ids: Array<string>) => void;
};
export const useMsgSetNotSpamFn = ({
	ids,
	shouldReplaceHistory,
	folderId,
	onActionComplete
}: MsgSetNotSpam): ActionFn => {
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const canExecute = useCallback((): boolean => (folderId ? isSpam(folderId) : false), [folderId]);
	const navigate = useNavigate();

	const execute = useCallback((): void => {
		if (canExecute()) {
			let notCanceled = true;

			createSnackbar({
				key: `trash-${ids}`,
				replace: true,
				severity: 'info',
				label: t('messages.snackbar.marked_as_non_spam', 'You’ve marked this e-mail as Not Spam'),
				autoHideTimeout: TIMEOUTS.SET_AS_SPAM,
				hideButton: false,
				actionLabel: t('label.undo', 'Undo'),
				onActionClick: () => {
					notCanceled = false;
				}
			});
			setTimeout(() => {
				// If the user clicked on the undo button, we skip the action
				if (!notCanceled) {
					return;
				}

				msgActionEmailStoreAction({ operation: '!spam', ids }).then((res) => {
					if ('Fault' in res) {
						createSnackbar({
							key: `trash-${ids}`,
							replace: true,
							severity: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000
						});
						return;
					}

					onActionComplete && onActionComplete(ids);

					if (shouldReplaceHistory) {
						navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
					}
				});
			}, TIMEOUTS.SET_AS_SPAM);
		}
	}, [
		canExecute,
		createSnackbar,
		folderId,
		ids,
		navigate,
		onActionComplete,
		shouldReplaceHistory,
		t
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgSetNotSpamDescriptor = ({
	ids,
	shouldReplaceHistory,
	folderId,
	onActionComplete
}: MsgSetNotSpam): UIActionDescriptor => {
	const { canExecute, execute } = useMsgSetNotSpamFn({
		ids,
		shouldReplaceHistory,
		folderId,
		onActionComplete
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.MARK_AS_NOT_SPAM.id,
		icon: 'AlertCircleOutline',
		label: t('action.mark_as_non_spam', 'Not spam'),
		execute,
		canExecute
	};
};
