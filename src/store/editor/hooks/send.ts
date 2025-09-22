/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { getUserSettings, t } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';

import { computeAndUpdateEditorStatus } from './commons';
import { getEditor } from './editors';
import { sendMsgFromEditor } from '../../../api/send-msg';
import { createCancelableTimer } from '../../../helpers/timers';
import { MailsEditorV2 } from '../../../types';
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
	const editorExist = getEditor({ id: editorId });
	if (!editorExist) {
		console.warn('Cannot find the editor', editorId);
		const customSendErr = 'Errore individuazione editor di posta, prego riprovare ad inviare la mail!';
		useEditorsStore.getState().setSendProcessStatus(editorId, {
			status: 'aborted',
			abortReason: customSendErr
		});
		computeAndUpdateEditorStatus(editorId);
		options?.onError && options.onError(customSendErr);
		return {};
	}

	if (!editorExist.sendAllowedStatus?.allowed) {
		console.warn('Errore, invio bloccato.', editorExist);
		const customSendErr = 'Errore durante il salvataggio della bozza, prego riprovare ad inviare la mail!';
		useEditorsStore.getState().setSendProcessStatus(editorId, {
			status: 'aborted',
			abortReason: customSendErr
		});
		computeAndUpdateEditorStatus(editorId);
		options?.onError && options.onError(customSendErr);
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
	const delay = find(getUserSettings().props, ['name', 'mails_snackbar_delay'])?._content ?? '3';

	const cancelableTimer = createCancelableTimer({
		secondsDelay: parseInt(delay, 10),
		onTick: onTimerTick,
		onCancel: onTimerCanceled
	});

	cancelableTimer.promise
		.then(() => {
			const editor = getEditor({ id: editorId });
			if (!editor) {
				console.log("Editor non trovato: "+ editorId);
				const errorDescription = "Rilevato errore durante l'invio del messaggio, prego contattare l'assistenza";
				useEditorsStore.getState().setSendProcessStatus(editorId, {
					status: 'aborted',
					abortReason: errorDescription
				});
				computeAndUpdateEditorStatus(editorId);
				options?.onError && options.onError(errorDescription);
			}
			editor?.identityId &&
				sendMsgFromEditor({ editor })
					.then((res) => {
						if ('Fault' in res) {
							console.log(editor);
							const errorDescription: string = res.Fault.Reason.Text;
							useEditorsStore.getState().setSendProcessStatus(editorId, {
								status: 'aborted',
								abortReason: errorDescription
							});
							computeAndUpdateEditorStatus(editorId);
							options?.onError && options.onError(errorDescription);
						} else if ( 'm' in res ) {
							useEditorsStore.getState().setSendProcessStatus(editorId, {
								status: 'completed'
							});
							computeAndUpdateEditorStatus(editorId);
							options?.onComplete && options.onComplete();
						} else {
							console.log(editor);
							console.log(res);
							const errorDescription = "Rilevato errore durante l'invio del messaggio, prego contattare l'assistenza";
							useEditorsStore.getState().setSendProcessStatus(editorId, {
								status: 'aborted',
								abortReason: errorDescription
							});
							computeAndUpdateEditorStatus(editorId);
							options?.onError && options.onError(errorDescription);
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
