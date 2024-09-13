/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ActionFn, UIActionDescriptor } from './use-redirect-msg';
import { MessageActionsDescriptors } from '../../constants';
import { getLocationOrigin } from '../../views/app/detail-panel/preview/utils';

export const useMsgDownloadEmlFn = (messageId: string): ActionFn => {
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((): void => {
		const link = document.createElement('a');
		link.download = `${messageId}.eml`;
		link.href = `${getLocationOrigin()}/service/home/~/?auth=co&id=${messageId}`;
		link.click();
		link.remove();
	}, [messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgDownloadEmlDescriptor = (messageId: string): UIActionDescriptor => {
	const { canExecute, execute } = useMsgDownloadEmlFn(messageId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.DOWNLOAD_EML.id,
		icon: 'DownloadOutline',
		label: t('action.download_eml', 'Download EML'),
		execute,
		canExecute
	};
};
