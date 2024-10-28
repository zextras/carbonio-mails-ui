/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from '../../constants';
import { isSpam } from '../../helpers/folders';
import { convAction } from '../../store/actions';
import { ActionFn, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';

type ConvSetNotSpamFunctionsParameter = {
	ids: Array<string>;
	shouldReplaceHistory: boolean;
	folderId: string;
};

export const useConvSetNotSpamFn = ({
	ids,
	shouldReplaceHistory,
	folderId
}: ConvSetNotSpamFunctionsParameter): ActionFn => {
	const dispatch = useAppDispatch();
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const canExecute = useCallback((): boolean => isSpam(folderId), [folderId]);

	const execute = useCallback((): void => {
		let notCanceled = true;

		const infoSnackbar = (hideButton = false): void => {
			createSnackbar({
				key: `trash-${ids}`,
				replace: true,
				severity: 'info',
				label: t('messages.snackbar.marked_as_non_spam', 'You’ve marked this e-mail as Not Spam'),
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
				dispatch(
					convAction({
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
							severity: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000
						});
					}
				});
			}
		}, 3000);
	}, [createSnackbar, dispatch, folderId, ids, shouldReplaceHistory, t]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvSetNotSpamDescriptor = ({
	ids,
	shouldReplaceHistory,
	folderId
}: ConvSetNotSpamFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvSetNotSpamFn({
		ids,
		shouldReplaceHistory,
		folderId
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.MARK_AS_NOT_SPAM.id,
		icon: 'AlertCircleOutline',
		label: t('action.mark_as_non_spam', 'Not spam'),
		execute,
		canExecute
	};
};
