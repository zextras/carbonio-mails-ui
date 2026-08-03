/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { ErrorSoapBodyResponse, getUserSettings, t } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';

import { sendMsgFromEditor } from 'api/send-msg';
import { createCancelableTimer } from 'helpers/timers';
import { getEditor } from 'store/editor/hooks/editors';
import { computeSendAllowedStatus, useEditorSendAllowedStatus } from 'store/editor/hooks/statuses';
import { useEditorsStore } from 'store/editor/store';
import { EditorOperationAllowedStatus, MailsEditorV2 } from 'types/editor';
import { SaveDraftResponse } from 'types/soap/save-draft';

export type SendMessageOptions = {
	cancelable?: boolean;
	onCountdownTick?: (countdown: number, cancel: () => void) => void;
	onSendStart?: () => void;
	onComplete?: () => void;
	onError?: (error: SaveDraftResponse | ErrorSoapBodyResponse) => void;
	onCancel?: () => void;
};

export type SendMessageResult = {
	cancel?: () => void;
};

const waitForDraftSaveComplete = (editorId: MailsEditorV2['id']): Promise<void> =>
	new Promise<void>((resolve) => {
		const status = useEditorsStore.getState().editors[editorId]?.draftSaveProcessStatus?.status;
		if (status !== 'running') {
			resolve();
			return;
		}
		const unsubscribe = useEditorsStore.subscribe((state) => {
			const newStatus = state.editors[editorId]?.draftSaveProcessStatus?.status;
			if (newStatus !== 'running') {
				unsubscribe();
				resolve();
			}
		});
		const statusAfterSubscribe =
			useEditorsStore.getState().editors[editorId]?.draftSaveProcessStatus?.status;
		if (statusAfterSubscribe !== 'running') {
			unsubscribe();
			resolve();
		}
	});

/**
 * Issues the send request to the server and updates the editor status according to the outcome.
 * Notifies the caller through the relevant callback when the request starts, completes or fails.
 * @param editorId
 * @param options
 */
const issueSendRequest = (editorId: MailsEditorV2['id'], options?: SendMessageOptions): void => {
	const editor = getEditor({ id: editorId });
	if (!editor?.identityId) {
		return;
	}
	options?.onSendStart && options.onSendStart();
	sendMsgFromEditor({ editor })
		.then((res) => {
			if ('Fault' in res) {
				const errorDescription: string = res.Fault.Reason.Text;
				useEditorsStore.getState().setSendProcessStatus(editorId, {
					status: 'aborted',
					abortReason: errorDescription
				});
				options?.onError && options.onError(res);
			} else {
				useEditorsStore.getState().setSendProcessStatus(editorId, {
					status: 'completed'
				});
				options?.onComplete && options.onComplete();
			}
		})
		.catch((err) => {
			useEditorsStore.getState().setSendProcessStatus(editorId, {
				status: 'aborted',
				abortReason: err
			});
			options?.onError && options.onError(err);
		});
};

/**
 *
 * @param editorId
 * @param options
 */
const sendFromEditor = (
	editorId: MailsEditorV2['id'],
	options?: SendMessageOptions
): SendMessageResult => {
	const editorExist = getEditor({ id: editorId });
	if (!editorExist) {
		console.warn('Cannot find the editor', editorId);
		return {};
	}

	if (!computeSendAllowedStatus(editorExist).allowed) {
		return {};
	}

	/**
	 * On each time tick the store will be
	 * @param remain
	 */
	const onTimerTick = (remain: number, cancel: () => void): void => {
		options?.onCountdownTick && options?.onCountdownTick(remain, cancel);
	};

	const onBeforeUnload = (event: Event): void => {
		event.preventDefault();
	};

	const onTimerCanceled = (): void => {
		window.removeEventListener('beforeunload', onBeforeUnload);
		useEditorsStore.getState().setSendProcessStatus(editorId, {
			status: 'aborted',
			abortReason: t('messages.snackbar.message_sending_aborted', 'canceled by the user')
		});
	};
	const delay = find(getUserSettings().props, ['name', 'mails_snackbar_delay'])?._content ?? '3';

	window.addEventListener('beforeunload', onBeforeUnload);

	const cancelableTimer = createCancelableTimer({
		secondsDelay: parseInt(delay, 10),
		onTick: onTimerTick,
		onCancel: onTimerCanceled
	});

	cancelableTimer.promise
		.then(async () => {
			await waitForDraftSaveComplete(editorId);
			const sendStatus = useEditorsStore.getState().editors[editorId]?.sendProcessStatus?.status;
			if (sendStatus !== 'running') {
				return;
			}
			issueSendRequest(editorId, options);
		})
		.catch((err) => {
			useEditorsStore.getState().setSendProcessStatus(editorId, {
				status: 'aborted',
				abortReason: err
			});
			options?.onError && options.onError(err);
		})
		.finally(() => {
			window.removeEventListener('beforeunload', onBeforeUnload);
		});

	useEditorsStore.getState().setSendProcessStatus(editorId, {
		status: 'running',
		cancel: cancelableTimer.cancel
	});

	return {
		cancel: cancelableTimer.cancel
	};
};

export const useEditorSend = (
	editorId: MailsEditorV2['id']
): {
	status: EditorOperationAllowedStatus;
	send: (options?: SendMessageOptions) => SendMessageResult;
} => {
	const status = useEditorSendAllowedStatus(editorId);
	const sendInvoker = useCallback(
		(options?: SendMessageOptions): SendMessageResult => sendFromEditor(editorId, options),
		[editorId]
	);

	return useMemo(
		() => ({
			status,
			send: sendInvoker
		}),
		[sendInvoker, status]
	);
};
