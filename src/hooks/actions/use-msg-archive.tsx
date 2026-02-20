/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from 'constants/index';
import { getArchiveFolderId, isArchive, isSystemArchiveAvailable } from 'helpers/folders';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { useInSearchModule } from 'ui-actions/utils';
import { useMessageDetailPanelControls } from 'views/app/detail-panel/detail-panel-controls-hooks';

type MsgArchiveFunctionsParameter = {
	messagesIds: string[];
	folderId: string;
	onActionComplete?: (messagesIds: string[]) => void;
};

export const useMsgArchiveFn = ({
	messagesIds,
	folderId,
	onActionComplete
}: MsgArchiveFunctionsParameter): ActionFn => {
	const canExecute = useCallback(
		(): boolean => isSystemArchiveAvailable() && !isArchive(folderId),
		[folderId]
	);
	const createSnackbar = useSnackbar();
	const inSearchModule = useInSearchModule();
	const [t] = useTranslation();
	const { closeMessagePanel, currentMessage } = useMessageDetailPanelControls();

	const execute = useCallback((): void => {
		if (!canExecute()) {
			return;
		}
		msgActionEmailStoreAction({
			operation: `move`,
			ids: messagesIds,
			parent: getArchiveFolderId(folderId)
		}).then((res) => {
			if ('Fault' in res) {
				createSnackbar({
					key: `archive-${messagesIds.join(',')}`,
					replace: true,
					severity: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				onActionComplete?.(messagesIds);
				if (currentMessage && !inSearchModule && messagesIds.includes(currentMessage.id)) {
					closeMessagePanel();
				}
				const snackbarLabel =
					messagesIds.length === 1
						? t('snackbar.message_moved_to_archive', 'E-mail moved to Archive')
						: t('snackbar.messages_moved_to_archive', 'E-mails moved to Archive');
				createSnackbar({
					key: `archive-${messagesIds.join(',')}`,
					replace: true,
					severity: 'info',
					label: snackbarLabel,
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	}, [
		canExecute,
		closeMessagePanel,
		createSnackbar,
		currentMessage,
		folderId,
		inSearchModule,
		messagesIds,
		onActionComplete,
		t
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgArchiveDescriptor = ({
	messagesIds,
	folderId,
	onActionComplete
}: MsgArchiveFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useMsgArchiveFn({
		messagesIds,
		folderId,
		onActionComplete
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.ARCHIVE.id,
		icon: 'ArchiveOutline',
		label: t('label.archive', 'Archive'),
		execute,
		canExecute
	};
};
