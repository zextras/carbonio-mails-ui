/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ActionFn, UIActionDescriptor } from './use-redirect-msg';
import { MessageActionsDescriptors } from '../../constants';

export const useMsgShowOriginalFn = (messageId: string): ActionFn => {
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((): void => {
		window.open(`/service/home/~/?auth=co&view=text&id=${messageId}`, '_blank');
	}, [messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgShowOriginalDescriptor = (messageId: string): UIActionDescriptor => {
	const { canExecute, execute } = useMsgShowOriginalFn(messageId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.SHOW_SOURCE.id,
		icon: 'CodeOutline',
		label: t('action.show_original', 'Show original'),
		execute,
		canExecute
	};
};
