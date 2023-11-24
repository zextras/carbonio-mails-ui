/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserSettings, t } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';

import { computeAndUpdateEditorStatus } from './commons';
import { getEditor } from './editors';
import { createCancelableTimer } from '../../../../helpers/timers';
import { MailsEditorV2 } from '../../../../types';
import { sendMsgFromEditor } from '../../../actions/send-msg';
import { useEditorsStore } from '../store';

export type SendMessageOptions = {
	cancelable?: boolean;
	onCountdownTick?: (countdown: number, cancel: () => void) => void;
	onComplete?: () => void;
	onError?: (error: string) => void;
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
	const editor = getEditor({ id: editorId });
	if (!editor) {
		console.warn('Cannot find the editor', editorId);
		return {};
	}

	if (!editor.sendAllowedStatus?.allowed) {
		return {};
	}

	/**
	 * On each time tick the store will be
	 * @param remain
	 */
	const onTimerTick = (remain: number, cancel: () => void): void => {
		options?.onCountdownTick && options?.onCountdownTick(remain, cancel);
	};

	const onTimerCanceled = (): void => {
		useEditorsStore.getState().setSendProcessStatus(editorId, {
			status: 'aborted',
			abortReason: t('messages.snackbar.message_sending_aborted', 'canceled by the user')
		});
		computeAndUpdateEditorStatus(editorId);
	};

	const delay =
		(find(getUserSettings().props, ['name', 'mails_snackbar_delay'])
			?._content as unknown as number) ?? 3;

	const cancelableTimer = createCancelableTimer({
		secondsDelay: delay,
		onTick: onTimerTick,
		onCancel: onTimerCanceled
	});
	cancelableTimer.promise
		.then(() => {
			editor
				.messagesStoreDispatch(sendMsgFromEditor({ editor }))
				.then((res) => {
					// TODO try to handle the error only inside the sendMsgFromEditor (is the asyncThunk really necessary?)
					if (res.meta.requestStatus === 'rejected') {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						const errorDescription: string = res.payload.Reason.Text;
						useEditorsStore.getState().setSendProcessStatus(editorId, {
							status: 'aborted',
							abortReason: errorDescription
						});
						computeAndUpdateEditorStatus(editorId);
						options?.onError && options.onError(errorDescription);
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
	const sendInvoker = (options?: SendMessageOptions): SendMessageResult =>
		sendFromEditor(editorId, options);

	return {
		status,
		send: sendInvoker
	};
};
