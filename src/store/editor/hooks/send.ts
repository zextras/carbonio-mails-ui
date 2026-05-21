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
import { computeAndUpdateEditorStatus } from 'store/editor/hooks/statuses';
import { getEditor } from 'store/editor/hooks/editors';
import { useEditorsStore } from 'store/editor/store';
import { MailsEditorV2, SaveDraftResponse } from 'types/index.d';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { getMessageEmailStoreAction } from 'store/emails/actions/get-message';

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
		// editor doesn't exist — report error and allow recovery
		useEditorsStore.getState().setSendProcessStatus(editorId, {
			status: 'aborted',
			abortReason: 'Editor not found'
		});
		computeAndUpdateEditorStatus(editorId);
		options?.onError &&
			options.onError({
				Fault: {
					Reason: {
						Text: 'Editor not found'
					},
					Detail: {
						Error: {
							Code: 'EditorNotFound',
							Trace: ''
						}
					}
				}
			} as SaveDraftResponse);
		return {};
	}

	if (!editorExist.sendAllowedStatus?.allowed) {
		// sending is not allowed — report error and allow recovery
		useEditorsStore.getState().setSendProcessStatus(editorId, {
			status: 'aborted',
			abortReason: 'Sending not allowed in the current editor state'
		});
		computeAndUpdateEditorStatus(editorId);
		options?.onError &&
			options.onError({
				Fault: {
					Reason: {
						Text: 'Sending not allowed in the current editor state'
					},
					Detail: {
						Error: {
							Code: 'SendingNotAllowed',
							Trace: ''
						}
					}
				}
			} as SaveDraftResponse);
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

	let delay = find(getUserSettings().props, ['name', 'mails_snackbar_delay'])?._content ?? '3';
	if ( isFocusModeMailView() ) {
		delay = '0';
	}

	window.addEventListener('beforeunload', onBeforeUnload);

	const cancelableTimer = createCancelableTimer({
		secondsDelay: parseInt(delay, 10),
		onTick: onTimerTick,
		onCancel: onTimerCanceled
	});

	cancelableTimer.promise
		.then(() => {
			const editor = getEditor({ id: editorId });

			if (editor?.isDirty) {
				// Unsaved changes — report error and allow recovery
				useEditorsStore.getState().setSendProcessStatus(editorId, {
					status: 'aborted',
					abortReason: 'Editor has unsaved changes'
				});
				computeAndUpdateEditorStatus(editorId);
				options?.onError &&
					options.onError({
						Fault: {
							Reason: {
								Text: 'Editor has unsaved changes'
							},
							Detail: {
								Error: {
									Code: 'EditorHasUnsavedChanges',
									Trace: ''
								}
							}
						}
					} as SaveDraftResponse);
				return;
			}

			if (editor?.identityId) {
				sendMsgFromEditor({ editor })
					.then((res) => {
						if (res && 'm' in res) {
							useEditorsStore.getState().setSendProcessStatus(editorId, {
								status: 'completed'
							});
							computeAndUpdateEditorStatus(editorId);
							options?.onComplete && options.onComplete();
							if (res.m?.[0]?.id) {
								// Refreshing the message in the store to update its status to "sent"
								getMessageEmailStoreAction(res.m[0].id);
							}
						} else {
							const errorDescription: string = res.Fault?.Reason?.Text ?? 'Unknown error';
							useEditorsStore.getState().setSendProcessStatus(editorId, {
								status: 'aborted',
								abortReason: errorDescription
							});
							computeAndUpdateEditorStatus(editorId);
							options?.onError && options.onError(res);
						}
					})
					.catch((err) => {
						useEditorsStore.getState().setSendProcessStatus(editorId, {
							status: 'aborted',
							abortReason: err?.Fault?.Reason?.Text ?? 'Unknown error'
						});
						computeAndUpdateEditorStatus(editorId);
						options?.onError && options.onError(err);
					});
			} else {
				// Missing identity — report error and allow recovery
				useEditorsStore.getState().setSendProcessStatus(editorId, {
					status: 'aborted',
					abortReason: 'Identity not found'
				});
				computeAndUpdateEditorStatus(editorId);
				options?.onError &&
					options.onError({
						Fault: {
							Reason: {
								Text: 'Identity not found'
							},
							Detail: {
								Error: {
									Code: 'IdentityNotFound',
									Trace: ''
								}
							}
						}
					} as SaveDraftResponse);
			}
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
