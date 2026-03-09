/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useModal, useSnackbar, Text, Padding } from '@zextras/carbonio-design-system';
import { FOLDERS, isTrash } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { DraftTrashedEvent } from '../../event-bus/events/draft-trashed';
import { useEventPublish } from '../../event-bus/use-event-publish';
import { useEditorsStore } from '../../store/editor';
import { MAILS_ROUTE, MessageActionsDescriptors } from 'constants/index';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { useInSearchModule } from 'ui-actions/utils';

const useRestoreMessage = (): ((
	ids: Array<string>,
	messageFolderId: string,
	closeEditor: boolean | undefined
) => void) => {
	const { createSnackbar } = useUiUtilities();
	const navigate = useNavigate();
	const [t] = useTranslation();
	return useCallback(
		(ids, messageFolderId, closeEditor): void => {
			msgActionEmailStoreAction({ ids, parent: messageFolderId, operation: 'move' }).then((res) => {
				if (!('Fault' in res)) {
					closeEditor &&
						navigate(`/${MAILS_ROUTE}/folder/${messageFolderId}/message/${ids[0]}`, {
							replace: true
						});
					createSnackbar({
						key: `move-${ids}`,
						replace: true,
						severity: 'success',
						label: t('messages.snackbar.email_restored', 'E-mail restored in destination folder'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				} else {
					createSnackbar({
						key: `move-${ids}`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[createSnackbar, navigate, t]
	);
};

type MoveToTrashExecute = {
	ids: Array<string>;
	messageFolderId?: string;
	routeFolderId?: string;
	shouldReplaceHistory?: boolean;
	onActionComplete?: (ids: Array<string>) => void;
};

export const useMsgMoveToTrashFn = ({
	ids,
	messageFolderId = FOLDERS.INBOX,
	routeFolderId,
	shouldReplaceHistory,
	onActionComplete
}: MoveToTrashExecute): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isTrash(messageFolderId) && !isFocusModeMailView(),
		[messageFolderId]
	);
	const createSnackbar = useSnackbar();
	const restoreMessage = useRestoreMessage();
	const inSearchModule = useInSearchModule();
	const [t] = useTranslation();
	const navigate = useNavigate();
	const { createModal, closeModal } = useModal();
	const publishBusEvent = useEventPublish();

	const performPreDeleteChecks = useCallback(
		(): Promise<boolean> =>
			new Promise((resolve) => {
				// Get all possible open editors for these messages (supposing they are drafts)
				const editors = useEditorsStore.getState().getEditorsByDraftsId(ids);

				// If there are no open editors, resolve immediately
				if (!editors || editors.length === 0) {
					resolve(true);
					return;
				}

				// If there is an open editor, show a confirmation dialog to the user
				const modalId = 'confirm-delete-draft-modal';
				createModal({
					id: modalId,
					title: t('label.delete_draft', 'Delete Draft'),
					children: (
						<Padding vertical="1.25rem">
							<Text overflow="break-word">
								{t('messages.confirm_delete_draft', {
									defaultValue_one: 'Are you sure you want to delete this draft?',
									defaultValue_other:
										'One or more drafts are open in the editor. Are you sure you want to delete them?',
									count: ids.length
								})}
							</Text>
						</Padding>
					),
					onConfirm: () => {
						editors.forEach((editor) => {
							publishBusEvent(new DraftTrashedEvent(editor.did));
						});
						closeModal(modalId);
						resolve(true);
					},
					showCloseIcon: true,
					confirmLabel: t('label.delete', 'Delete'),
					confirmColor: 'error',
					onClose: () => {
						closeModal(modalId);
						resolve(false);
					}
				});
			}),
		[ids, createModal, t, closeModal, publishBusEvent]
	);

	const execute = useCallback((): void => {
		if (!canExecute()) {
			return;
		}

		// Check if there is an open editor for this message (supposing it is a draft)
		performPreDeleteChecks()
			.then((canProceed) =>
				canProceed
					? msgActionEmailStoreAction({
							operation: 'trash',
							ids
						})
					: Promise.resolve(undefined)
			)
			.then((res) => {
				// If user cancelled or pre-check failed
				if (!res) {
					return;
				}

				if ('Fault' in res) {
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
					return;
				}
				onActionComplete && onActionComplete(ids);

				if (!inSearchModule) {
					shouldReplaceHistory &&
						navigate(`/${MAILS_ROUTE}/folder/${routeFolderId}`, { replace: true });
				}
				createSnackbar({
					key: `trash-${ids}`,
					replace: true,
					severity: 'info',
					label: t('messages.snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
					autoHideTimeout: 5000,
					hideButton: false,
					actionLabel: t('label.undo', 'Undo'),
					onActionClick: () => restoreMessage(ids, messageFolderId, shouldReplaceHistory)
				});
			});
	}, [
		canExecute,
		performPreDeleteChecks,
		ids,
		onActionComplete,
		inSearchModule,
		createSnackbar,
		t,
		shouldReplaceHistory,
		navigate,
		routeFolderId,
		restoreMessage,
		messageFolderId
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgMoveToTrashDescriptor = ({
	ids,
	messageFolderId,
	routeFolderId,
	shouldReplaceHistory,
	onActionComplete
}: MoveToTrashExecute): UIActionDescriptor => {
	const { canExecute, execute } = useMsgMoveToTrashFn({
		ids,
		messageFolderId,
		routeFolderId,
		shouldReplaceHistory,
		onActionComplete
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.MOVE_TO_TRASH.id,
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		execute,
		canExecute
	};
};
