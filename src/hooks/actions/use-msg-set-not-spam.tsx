/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors, TIMEOUTS } from '../../constants';
import { isSpam } from '../../helpers/folders';
import { msgAction } from '../../store/actions';
import { ActionFn, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';

type MsgSetNotSpam = {
	ids: Array<string>;
	shouldReplaceHistory?: boolean;
	folderId: string;
};
export const useMsgSetNotSpamFn = ({
	ids,
	shouldReplaceHistory,
	folderId
}: MsgSetNotSpam): ActionFn => {
	const dispatch = useAppDispatch();
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const canExecute = useCallback((): boolean => isSpam(folderId), [folderId]);

	const execute = useCallback((): void => {
		if (canExecute()) {
			let notCanceled = true;

			createSnackbar({
				key: `trash-${ids}`,
				replace: true,
				type: 'info',
				label: t('messages.snackbar.marked_as_non_spam', 'You’ve marked this e-mail as Not Spam'),
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
						operation: '!spam',
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
		}
	}, [canExecute, createSnackbar, dispatch, folderId, ids, shouldReplaceHistory, t]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgSetNotSpamDescriptor = ({
	ids,
	shouldReplaceHistory,
	folderId
}: MsgSetNotSpam): UIActionDescriptor => {
	const { canExecute, execute } = useMsgSetNotSpamFn({
		ids,
		shouldReplaceHistory,
		folderId
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
