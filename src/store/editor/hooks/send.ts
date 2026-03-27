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
import { computeAndUpdateEditorStatus } from 'store/editor/hooks/statuses';
import { useEditorsStore } from 'store/editor/store';
import { MailsEditorV2 } from 'types/editor';
import { SaveDraftResponse } from 'types/soap/save-draft';

export type SendMessageOptions = {
	cancelable?: boolean;
	onCountdownTick?: (countdown: number, cancel: () => void) => void;
	onComplete?: () => void;
	onError?: (error: SaveDraftResponse | ErrorSoapBodyResponse) => void;
	onCancel?: () => void;
};

export type SendMessageResult = {
	cancel?: () => void;
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

	if (!editorExist.sendAllowedStatus?.allowed) {
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
		computeAndUpdateEditorStatus(editorId);
	};
	const delay = find(getUserSettings().props, ['name', 'mails_snackbar_delay'])?._content ?? '3';

	window.addEventListener('beforeunload', onBeforeUnload);

	const cancelableTimer = createCancelableTimer({
		secondsDelay: parseInt(delay, 10),
		onTick: onTimerTick,
		onCancel: onTimerCanceled
	});

	cancelableTimer.promise
		.then(() => {
			const editor = getEditor({ id: editorId });
			editor?.identityId &&
				sendMsgFromEditor({ editor })
					.then((res) => {
						if ('Fault' in res) {
							const errorDescription: string = res.Fault.Reason.Text;
							useEditorsStore.getState().setSendProcessStatus(editorId, {
								status: 'aborted',
								abortReason: errorDescription
							});
							computeAndUpdateEditorStatus(editorId);
							options?.onError && options.onError(res);
						} else {
							useEditorsStore.getState().setSendProcessStatus(editorId, {
								status: 'completed'
							});
							computeAndUpdateEditorStatus(editorId);
							options?.onComplete && options.onComplete();
						}
					})
					.catch((err) => {
						useEditorsStore.getState().setSendProcessStatus(editorId, {
							status: 'aborted',
							abortReason: err
						});
						computeAndUpdateEditorStatus(editorId);
						options?.onError && options.onError(err);
					});
		})
		.catch((err) => {
			useEditorsStore.getState().setSendProcessStatus(editorId, {
				status: 'aborted',
				abortReason: err
			});
			computeAndUpdateEditorStatus(editorId);
			options?.onError && options.onError(err);
		})
		.finally(() => {
			window.removeEventListener('beforeunload', onBeforeUnload);
		});

	useEditorsStore.getState().setSendProcessStatus(editorId, {
		status: 'running',
		cancel: cancelableTimer.cancel
	});
	computeAndUpdateEditorStatus(editorId);

	return {
		cancel: cancelableTimer.cancel
	};
};

export const useEditorSend = (
	editorId: MailsEditorV2['id']
): {
	status: MailsEditorV2['sendAllowedStatus'];
	send: (options?: SendMessageOptions) => SendMessageResult;
} => {
	const status = useEditorsStore((state) => state.editors[editorId].sendAllowedStatus);
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
