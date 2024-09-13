/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors, TIMEOUTS } from '../../constants';
import { msgAction } from '../../store/actions';
import type { ActionFn, MailMessage, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';
import { useUiUtilities } from '../use-ui-utilities';

export const useMsgApplyTagFn = (messageId: MailMessage['id']): ActionFn => {
	const { createSnackbar } = useUiUtilities();
	const dispatch = useAppDispatch();
	const [t] = useTranslation();

	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback(
		(tagName: string): void => {
			dispatch(
				msgAction({
					operation: 'tag',
					ids: [messageId],
					tagName
				})
			).then((res: any) => {
				if (res.type.includes('fulfilled')) {
					createSnackbar({
						key: `tag`,
						replace: true,
						hideButton: true,
						type: 'info',
						label: t('snackbar.tag_applied', {
							tag: tagName,
							defaultValue: '"{{tag}}" tag applied'
						}),
						autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
					});
				} else {
					createSnackbar({
						key: `tag`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
						hideButton: true
					});
				}
			});
		},
		[createSnackbar, dispatch, messageId, t]
	);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgApplyTagDescriptor = (messageId: string): UIActionDescriptor => {
	const { canExecute, execute } = useMsgApplyTagFn(messageId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.APPLY_TAG.id,
		label: t('label.tag', 'Tag'),
		icon: 'TagsMoreOutline',
		execute,
		canExecute
	};
};
