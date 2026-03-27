/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from 'constants/index';
import { isFocusModeMailView, openMessageStandalonePreview } from 'helpers/external-tabs';
import { ActionFn, UIActionDescriptor } from 'types/actions';

export const useMsgPreviewOnSeparatedWindowFn = ({
	messageId,
	folderId
}: {
	messageId: string;
	folderId: string;
}): ActionFn => {
	const canExecute = useCallback((): boolean => !isFocusModeMailView(), []);

	const execute = useCallback(() => {
		if (canExecute()) {
			openMessageStandalonePreview({ folderId, messageId });
		}
	}, [canExecute, folderId, messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgPreviewOnSeparatedWindowDescriptor = ({
	messageId,
	folderId
}: {
	messageId: string;
	folderId: string;
}): UIActionDescriptor => {
	const { canExecute, execute } = useMsgPreviewOnSeparatedWindowFn({
		messageId,
		folderId
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.PREVIEW_ON_SEPARATED_WINDOW.id,
		icon: 'ExternalLink',
		label: t('action.preview_on_separated_tab', 'Open in a new tab'),
		execute,
		canExecute
	};
};
