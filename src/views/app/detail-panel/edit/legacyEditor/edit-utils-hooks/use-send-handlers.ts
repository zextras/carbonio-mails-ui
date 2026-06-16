/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { useModal, useSnackbar } from '@zextras/carbonio-design-system';
import { ErrorSoapBodyResponse, t } from '@zextras/carbonio-shell-ui';

import { checkSubjectAndAttachment } from '../check-subject-attachment';
import { getErrorSnackbarProps } from './use-error-handler';
import { createEditBoard } from '../edit-view-board';
import { EDIT_VIEW_CLOSING_REASONS, EditViewActions, TIMEOUTS } from 'constants/index';
import {
	deleteEditor,
	useEditorAttachments,
	useEditorAutoSendTime,
	useEditorDraftSave,
	useEditorSend
} from 'store/editor';
import { EditViewClosingReasons } from 'types/editor';
import { SaveDraftResponse } from 'types/soap/save-draft';

export const useSendHandlers = (
	editorId: string,
	closeController?: () => void
): {
	onSendClick: () => void;
	onSendLaterClick: (scheduledTime: number) => void;
} => {
	const { setAutoSendTime } = useEditorAutoSendTime(editorId);
	const { saveDraft } = useEditorDraftSave(editorId);
	const { send: sendMessage } = useEditorSend(editorId);
	const { savedStandardAttachments } = useEditorAttachments(editorId);
	const createSnackbar = useSnackbar();
	const { createModal, closeModal } = useModal();

	const close = useCallback(
		(reason?: EditViewClosingReasons): void => {
			if (reason !== EDIT_VIEW_CLOSING_REASONS.EXTERNAL_CLOSE_REQUEST) {
				closeController?.();
			}
		},
		[closeController]
	);

	const onSendCountdownTick = useCallback(
		(countdown: number, cancel: () => void): void => {
			createSnackbar({
				key: 'send',
				replace: true,
				severity: 'info',
				label: t('messages.snackbar.sending_mail_in_count', {
					count: countdown,
					defaultValue_one: 'Sending your message in {{count}} second',
					defaultValue_other: 'Sending your message in {{count}} seconds'
				}),
				disableAutoHide: true,
				hideButton: !cancel,
				actionLabel: t('label.undo', 'Undo'),
				onActionClick: (): void => {
					cancel();
					createEditBoard({
						action: EditViewActions.RESUME,
						actionTargetId: editorId
					});
				}
			});
		},
		[createSnackbar, editorId]
	);

	const onSendError = useCallback(
		(error: SaveDraftResponse | ErrorSoapBodyResponse): void => {
			const { message, timeout } = getErrorSnackbarProps(error);
			createSnackbar({
				key: `mail-${editorId}`,
				replace: true,
				severity: 'error',
				label: message,
				autoHideTimeout: timeout,
				hideButton: true
			});
			createEditBoard({
				action: EditViewActions.RESUME,
				actionTargetId: editorId
			});
		},
		[createSnackbar, editorId]
	);

	const onSendComplete = useCallback((): void => {
		createSnackbar({
			key: `mail-${editorId}`,
			replace: true,
			severity: 'success',
			label: t('messages.snackbar.mail_sent', 'Message sent'),
			autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
			hideButton: true
		});
		deleteEditor({ id: editorId });
	}, [createSnackbar, editorId]);

	const onSendClick = useCallback((): void => {
		const onConfirmCallback = async (): Promise<void> => {
			sendMessage({
				onCountdownTick: onSendCountdownTick,
				onComplete: onSendComplete,
				onError: onSendError
			});
			close(EDIT_VIEW_CLOSING_REASONS.MESSAGE_SENT);
		};
		checkSubjectAndAttachment({
			editorId,
			hasAttachments: savedStandardAttachments.length > 0,
			onConfirmCallback,
			createModal,
			closeModal
		});
	}, [
		close,
		closeModal,
		createModal,
		editorId,
		onSendComplete,
		onSendCountdownTick,
		onSendError,
		savedStandardAttachments.length,
		sendMessage
	]);

	const onSendLaterClick = useCallback(
		(scheduledTime: number): void => {
			const onConfirmCallback = async (): Promise<void> => {
				setAutoSendTime(scheduledTime);
				saveDraft();
				close(EDIT_VIEW_CLOSING_REASONS.MESSAGE_SEND_SCHEDULED);
			};
			checkSubjectAndAttachment({
				editorId,
				hasAttachments: savedStandardAttachments.length > 0,
				onConfirmCallback,
				createModal,
				closeModal
			});
		},
		[
			close,
			closeModal,
			createModal,
			editorId,
			savedStandardAttachments.length,
			saveDraft,
			setAutoSendTime
		]
	);

	return { onSendClick, onSendLaterClick };
};
