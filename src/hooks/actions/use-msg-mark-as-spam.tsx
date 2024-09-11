/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { replaceHistory, t } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { ActionFn, UIActionDescriptor } from './use-redirect-msg';
import { MessageActionsDescriptors, TIMEOUTS } from '../../constants';
import { msgAction } from '../../store/actions';
import { useAppDispatch } from '../redux';

type MsgMarkAsSpam = {
	ids: Array<string>;
	shouldReplaceHistory: boolean;
	folderId: string;
};
export const useMsgMarkAsSpamFn = ({
	ids,
	shouldReplaceHistory,
	folderId
}: MsgMarkAsSpam): ActionFn => {
	const dispatch = useAppDispatch();
	const createSnackbar = useSnackbar();

	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((): void => {
		let notCanceled = true;

		createSnackbar({
			key: `trash-${ids}`,
			replace: true,
			type: 'info',
			label: t('messages.snackbar.marked_as_spam', 'You’ve marked this e-mail as Spam'),
			autoHideTimeout: TIMEOUTS.SET_AS_SPAM,
			hideButton: false,
			actionLabel: t('label.undo', 'Undo'),
			onActionClick: () => {
				notCanceled = false;
			}
		});
		setTimeout(() => {
			/** If the user has not clicked on the undo button, we can proceed with the action */
			if (!notCanceled) return;
			dispatch(
				msgAction({
					operation: 'spam',
					ids
				})
			).then((res) => {
				if (res.type.includes('fulfilled') && shouldReplaceHistory) {
					replaceHistory(`/folder/${folderId}`);
				}
				if (!res.type.includes('fulfilled')) {
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000
					});
				}
			});
		}, TIMEOUTS.SET_AS_SPAM);
	}, [createSnackbar, dispatch, folderId, ids, shouldReplaceHistory]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgMarkAsSpamDescriptor = ({
	ids,
	shouldReplaceHistory,
	folderId
}: MsgMarkAsSpam): UIActionDescriptor => {
	const { canExecute, execute } = useMsgMarkAsSpamFn({
		ids,
		shouldReplaceHistory,
		folderId
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.MARK_AS_SPAM.id,
		icon: 'AlertCircle',
		label: t('action.mark_as_spam', 'Mark as spam'),
		execute,
		canExecute
	};
};
