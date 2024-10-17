/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { replaceHistory, t } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors, TIMEOUTS } from '../../constants';
import { isDraft, isSpam } from '../../helpers/folders';
import { msgAction } from '../../store/actions';
import { ActionFn, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';

type MsgSetSpam = {
	ids: Array<string>;
	shouldReplaceHistory: boolean;
	folderId: string;
};
export const useMsgSetSpamFn = ({ ids, shouldReplaceHistory, folderId }: MsgSetSpam): ActionFn => {
	const dispatch = useAppDispatch();
	const createSnackbar = useSnackbar();

	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isSpam(folderId),
		[folderId]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			let notCanceled = true;

			createSnackbar({
				key: `trash-${ids}`,
				replace: true,
				severity: 'info',
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
							severity: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000
						});
					}
				});
			}, TIMEOUTS.SET_AS_SPAM);
		}
	}, [canExecute, createSnackbar, dispatch, folderId, ids, shouldReplaceHistory]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgSetSpamDescriptor = ({
	ids,
	shouldReplaceHistory,
	folderId
}: MsgSetSpam): UIActionDescriptor => {
	const { canExecute, execute } = useMsgSetSpamFn({
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
