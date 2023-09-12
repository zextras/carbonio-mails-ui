/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { getBridgedFunctions, getUserSettings, t } from '@zextras/carbonio-shell-ui';
import { debounce, filter, find, reject } from 'lodash';

import {
	buildSavedAttachments,
	composeCidUrlFromContentId,
	convertCidUrlToServiceUrl,
	replaceCidUrlWithServiceUrl
} from './editor-transformations';
import {
	computeDraftSaveAllowedStatus,
	computeSendAllowedStatus,
	getUnsavedAttachmentByUploadId
} from './editor-utils';
import { useEditorsStore } from './store';
import { getDraftSaveDelay, getUnsavedAttachmentIndex } from './store-utils';
import { TIMEOUTS } from '../../../constants';
import { createCancelableTimer } from '../../../helpers/timers';
import { normalizeMailMessageFromSoap } from '../../../normalizations/normalize-message';
import {
	EditViewActionsType,
	AttachmentUploadProcessStatus,
	MailsEditorV2,
	SavedAttachment,
	UnsavedAttachment
} from '../../../types';
import { saveDraftV3 } from '../../actions/save-draft';
import { sendMsgFromEditor } from '../../actions/send-msg';
import {
	uploadAttachment,
	AttachmentUploadOptions,
	UploadCallbacks
} from '../../actions/upload-attachments';

export type SendMessageOptions = {
	cancelable?: boolean;
	onCountdownTick?: (countdown: number, cancel: () => void) => void;
	onComplete?: () => void;
	onError?: (error: string) => void;
	onCancel?: () => void;
};

export type SaveDraftOptions = {
	onComplete?: () => void;
	onError?: (error: string) => void;
};

export type SendMessageResult = {
	cancel?: () => void;
};

const debugLog = (text: string): void => {
	// eslint-disable-next-line no-console
	// console.debug(`***** ${text}`);
};

/**
 * TODO for future refactors
 * instead of calling imperatively the computeAndUpdateEditorStatus function
 * to update the status of the store a subscription-based logic can be implemented.
 *
 * Using the subscriptionWithSelector functionality of Zustand we can subscribe
 * for changes on the store and perform the status update only when the selected
 * fields change.
 * (see https://docs.pmnd.rs/zustand/recipes/recipes#reading/writing-state-and-reacting-to-changes-outside-of-components)
 *
 * The list of the fields to take into consideration can be provide by a specific
 * function/constant so the code will be more clear and future changes/additions
 * will be easier to perform.
 */

/**
 * Returns the editor with given ID or null if not found.
 * @params id
 */
export const useEditor = ({ id }: { id: MailsEditorV2['id'] }): MailsEditorV2 | null =>
	useEditorsStore((s) => s.editors?.[id] ?? null);
export const getEditor = ({ id }: { id: MailsEditorV2['id'] }): MailsEditorV2 | null =>
	useEditorsStore.getState()?.editors?.[id] ?? null;

/**
 * Analyzes the given editor and updates in the store the allow status for the
 * draft save and the send operations
 * @param editorId
 */
const computeAndUpdateEditorStatus = (editorId: MailsEditorV2['id']): void => {
	const editor = getEditor({ id: editorId });
	if (!editor) {
		console.warn('Cannot find the editor', editorId);
		return;
	}

	useEditorsStore
		.getState()
		.updateDraftSaveAllowedStatus(editorId, computeDraftSaveAllowedStatus(editor));

	useEditorsStore.getState().updateSendAllowedStatus(editorId, computeSendAllowedStatus(editor));
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
		useEditorsStore.getState().updateSendProcessStatus(editorId, {
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
						const errorDescription: string = res.payload.reason;
						useEditorsStore.getState().updateSendProcessStatus(editorId, {
							status: 'aborted',
							abortReason: errorDescription
						});
						computeAndUpdateEditorStatus(editorId);
						options?.onError && options.onError(errorDescription);
					} else {
						useEditorsStore.getState().updateSendProcessStatus(editorId, {
							status: 'completed'
						});
						computeAndUpdateEditorStatus(editorId);
						options?.onComplete && options.onComplete();
					}
				})
				.catch((err) => {
					useEditorsStore.getState().updateSendProcessStatus(editorId, {
						status: 'aborted',
						abortReason: err
					});
					computeAndUpdateEditorStatus(editorId);
					options?.onError && options.onError(err);
				});
		})
		.catch((err) => {
			useEditorsStore.getState().updateSendProcessStatus(editorId, {
				status: 'aborted',
				abortReason: err
			});
			computeAndUpdateEditorStatus(editorId);
			options?.onError && options.onError(err);
		});

	useEditorsStore.getState().updateSendProcessStatus(editorId, {
		status: 'running',
		cancel: cancelableTimer.cancel
	});
	computeAndUpdateEditorStatus(editorId);

	return {
		cancel: cancelableTimer.cancel
	};
};

/**
 *
 * @param editorId
 * @param options
 */
const saveDraftFromEditor = (editorId: MailsEditorV2['id'], options?: SaveDraftOptions): void => {
	const editor = getEditor({ id: editorId });
	if (!editor) {
		console.warn('Cannot find the editor', editorId);
		return;
	}

	if (!editor.draftSaveAllowedStatus?.allowed) {
		return;
	}

	const handleError = (err: string): void => {
		useEditorsStore.getState().updateDraftSaveProcessStatus(editorId, {
			status: 'aborted',
			abortReason: err
		});
		getBridgedFunctions()?.createSnackbar({
			key: `save-draft`,
			replace: true,
			type: 'error',
			label: t('label.error_try_again', 'Something went wrong, please try again'),
			autoHideTimeout: 3000
		});
		computeAndUpdateEditorStatus(editorId);
		options?.onError && options.onError(err);
	};

	// Update messages store
	saveDraftV3({ editor })
		.then((res) => {
			if ('Fault' in res) {
				handleError(res.Fault.Detail?.Error?.Detail);
				return;
			}

			if (!res.m) {
				handleError(
					t('label.save_draft.incomplete_response', 'The save draft response is incomplete')
				);
				return;
			}

			const mailMessage = normalizeMailMessageFromSoap(res.m[0]);
			useEditorsStore.getState().setDid(editorId, mailMessage.id);
			useEditorsStore.getState().removeUnsavedAttachments(editorId);
			const savedAttachments = buildSavedAttachments(mailMessage);
			useEditorsStore.getState().setSavedAttachments(editorId, savedAttachments);

			const text = {
				plainText: editor.text.plainText,
				richText: replaceCidUrlWithServiceUrl(editor.text.richText, savedAttachments)
			};

			// Replace the inline image cid url with the service url
			useEditorsStore.getState().updateText(editorId, text);

			useEditorsStore.getState().updateDraftSaveProcessStatus(editorId, {
				status: 'completed',
				lastSaveTimestamp: new Date()
			});
			// getUpdateDraft({ editorId, res });
			computeAndUpdateEditorStatus(editorId);
			options?.onComplete && options?.onComplete();
		})
		.catch((err) => {
			useEditorsStore.getState().updateDraftSaveProcessStatus(editorId, {
				status: 'aborted',
				abortReason: err
			});
			// FIXME use a subscription to the store update
			computeAndUpdateEditorStatus(editorId);
			handleError(err);
			options?.onError && options?.onError(err);
		});

	useEditorsStore.getState().updateDraftSaveProcessStatus(editorId, {
		status: 'running'
	});
	// FIXME use a subscription to the store update
	computeAndUpdateEditorStatus(editorId);
};

const delay = getDraftSaveDelay();
const debouncedSaveDraftFromEditor = debounce(saveDraftFromEditor, delay);

/**
 * @param id
 * @param editor
 */
export const addEditor = ({
	id,
	editor
}: {
	id: MailsEditorV2['id'];
	editor: MailsEditorV2;
}): void => {
	useEditorsStore.getState().addEditor(id, editor);
	// useEditorsStore.subscribe(
	// 	(state) => [state.editors[id].from, state.editors[id].subject],
	// 	(s): void => console.log('*** ho cambiato qualcosa a cui sono sottoscritto')
	// );
};

/**
 * Remove a specific editor.
 * @params id
 */
export const deleteEditor = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().deleteEditor(id);

/**
 * Update an editor
 * @param id
 * @param editor
 */
export const updateEditor = ({
	id,
	editor
}: {
	id: string;
	editor: Partial<MailsEditorV2>;
}): void => useEditorsStore.getState().updateEditor(id, editor);

/**
 * Returns reactive references to the action value and to its setter
 * @param id
 */
export const useEditorAction = (
	id: MailsEditorV2['id']
): { action: string; setAction: (action: EditViewActionsType) => void } => {
	const value = useEditorsStore((state) => state.editors[id].action);
	const setter = useEditorsStore((state) => state.updateAction);

	return {
		action: value,
		setAction: (val: EditViewActionsType): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
			debugLog('save cause: action');
		}
	};
};

/**
 * Returns reactive references to the subject value and to its setter
 * @param id
 */
export const useEditorSubject = (
	id: MailsEditorV2['id']
): { subject: string; setSubject: (subject: string) => void } => {
	const value = useEditorsStore((state) => state.editors[id].subject);
	const setter = useEditorsStore((state) => state.updateSubject);

	return {
		subject: value,
		setSubject: (val: string): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
			debugLog('save cause: subject');
		}
	};
};

/**
 * Returns reactive references to the text values and to their setter
 * @param id
 */
export const useEditorText = (
	id: MailsEditorV2['id']
): {
	text: MailsEditorV2['text'];
	setText: (text: MailsEditorV2['text']) => void;
	resetText: () => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].text);
	const setter = useEditorsStore((state) => state.updateText);
	const setText = useCallback(
		(val: MailsEditorV2['text']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
			debugLog('save cause: text');
		},
		[id, setter]
	);

	const resetText = useCallback((): void => {
		setter(id, { plainText: '', richText: '' });
		debouncedSaveDraftFromEditor(id);
		debugLog('save cause: text reset');
	}, [id, setter]);

	return {
		text: value,
		setText,
		resetText
	};
};

/**
 * Returns reactive references to the auto send time value and to its setter
 * @params id
 */
export const useEditorAutoSendTime = (
	id: MailsEditorV2['id']
): {
	autoSendTime: MailsEditorV2['autoSendTime'];
	setAutoSendTime: (autoSendTime: MailsEditorV2['autoSendTime']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].autoSendTime);
	const setter = useEditorsStore((state) => state.updateAutoSendTime);

	return {
		autoSendTime: value,
		setAutoSendTime: (val: MailsEditorV2['autoSendTime']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
			debugLog('save cause: autoSendTime');
		}
	};
};

/**
 * Returns reactive references to the draft id value and to its setter
 * @params id
 */
export const useEditorDid = (
	id: MailsEditorV2['id']
): {
	did: MailsEditorV2['did'];
	setDid: (did: MailsEditorV2['did']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].did);
	const setter = useEditorsStore((state) => state.setDid);

	return {
		did: value,
		setDid: (val: MailsEditorV2['did']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
			debugLog('save cause: did');
		}
	};
};

/**
 * Returns reactive references to the isRichText value and to its setter
 * @params id
 */
export const useEditorIsRichText = (
	id: MailsEditorV2['id']
): {
	isRichText: MailsEditorV2['isRichText'];
	setIsRichText: (isRichText: MailsEditorV2['isRichText']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].isRichText);
	const setter = useEditorsStore((state) => state.setIsRichText);

	return {
		isRichText: value,
		setIsRichText: (val: MailsEditorV2['isRichText']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
			debugLog('save cause: isRichText');
		}
	};
};

/**
 * Returns reactive references to the signature value and to its setter
 * @params id
 */
export const useEditorSignature = (
	id: MailsEditorV2['id']
): {
	signature: MailsEditorV2['signature'];
	setSignature: (signature: MailsEditorV2['signature']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].signature);
	const setter = useEditorsStore((state) => state.setSignature);

	return {
		signature: value,
		setSignature: (val: MailsEditorV2['signature']) => setter(id, val)
	};
};

/**
 * Returns reactive references to the originalId value and to its setter
 * @params id
 */
export const useEditorOriginalId = (
	id: MailsEditorV2['id']
): {
	originalId: MailsEditorV2['originalId'];
	setOriginalId: (originalId: MailsEditorV2['originalId']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].originalId);
	const setter = useEditorsStore((state) => state.setOriginalId);

	return {
		originalId: value,
		setOriginalId: (val: MailsEditorV2['originalId']) => setter(id, val)
	};
};

/**
 * set the originalMessage of a specific editor.
 * @params id
 * @params originalMessage
 */
export const useSetOriginalMessage = ({
	editorId,
	originalMessage
}: {
	editorId: MailsEditorV2['id'];
	originalMessage: MailsEditorV2['originalMessage'];
}): void => useEditorsStore((s) => s.setOriginalMessage(editorId, originalMessage));

export const getSetOriginalMessage = ({
	id,
	originalMessage
}: {
	id: MailsEditorV2['id'];
	originalMessage: MailsEditorV2['originalMessage'];
}): void => useEditorsStore.getState().setOriginalMessage(id, originalMessage);

/**
 * Returns reactive references to the "to" recipients values and to their setter
 * @param editorId
 */
export const useEditorRecipients = (
	editorId: MailsEditorV2['id']
): {
	recipients: MailsEditorV2['recipients'];
	setRecipients: (recipient: MailsEditorV2['recipients']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[editorId].recipients);
	const setter = useEditorsStore((state) => state.updateRecipients);

	return {
		recipients: value,
		setRecipients: (val: MailsEditorV2['recipients']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
			debugLog('save cause: recipients');
		}
	};
};

/**
 * Returns reactive references to the "to" recipients values and to their setter
 * @param editorId
 */
export const useEditorToRecipients = (
	editorId: MailsEditorV2['id']
): {
	toRecipients: MailsEditorV2['recipients']['to'];
	setToRecipients: (recipient: MailsEditorV2['recipients']['to']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[editorId].recipients.to);
	const setter = useEditorsStore((state) => state.updateToRecipients);

	return {
		toRecipients: value,
		setToRecipients: (val: MailsEditorV2['recipients']['to']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
			debugLog('save cause: to');
		}
	};
};

/**
 * Returns reactive references to the "cc" recipients values and to their setter
 * @param editorId
 */
export const useEditorCcRecipients = (
	editorId: MailsEditorV2['id']
): {
	ccRecipients: MailsEditorV2['recipients']['cc'];
	setCcRecipients: (recipient: MailsEditorV2['recipients']['cc']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[editorId].recipients.cc);
	const setter = useEditorsStore((state) => state.updateCcRecipients);

	return {
		ccRecipients: value,
		setCcRecipients: (val: MailsEditorV2['recipients']['cc']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
			debugLog('save cause: cc');
		}
	};
};

/**
 * Returns reactive references to the "bcc" recipients values and to their setter
 * @param editorId
 */
export const useEditorBccRecipients = (
	editorId: MailsEditorV2['id']
): {
	bccRecipients: MailsEditorV2['recipients']['bcc'];
	setBccRecipients: (recipient: MailsEditorV2['recipients']['bcc']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[editorId].recipients.bcc);
	const setter = useEditorsStore((state) => state.updateBccRecipients);

	return {
		bccRecipients: value,
		setBccRecipients: (val: MailsEditorV2['recipients']['bcc']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
			debugLog('save cause: bcc');
		}
	};
};

/**
 * Returns reactive reference to the identity id and to its setter
 * @param editorId
 */
export const useEditorIdentityId = (
	editorId: MailsEditorV2['id']
): {
	identityId: MailsEditorV2['identityId'];
	setIdentityId: (from: MailsEditorV2['identityId']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[editorId].identityId);
	const setter = useEditorsStore((state) => state.updateIdentityId);

	return {
		identityId: value,
		setIdentityId: (val: MailsEditorV2['identityId']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
			debugLog('save cause: identityId');
		}
	};
};

/**
 * Returns reactive reference to the isUrgent value and to its setter
 * @param id
 */
export const useEditorIsUrgent = (
	id: MailsEditorV2['id']
): {
	isUrgent: MailsEditorV2['isUrgent'];
	setIsUrgent: (isUrgent: MailsEditorV2['isUrgent']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].isUrgent);
	const setter = useEditorsStore((state) => state.updateIsUrgent);

	return {
		isUrgent: value,
		setIsUrgent: (val: MailsEditorV2['isUrgent']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
			debugLog('save cause: isUrgent');
		}
	};
};

/**
 * Returns reactive reference to the requestReadReceipt value and to its setter
 * @param id
 */
export const useEditorRequestReadReceipt = (
	id: MailsEditorV2['id']
): {
	requestReadReceipt: MailsEditorV2['requestReadReceipt'];
	setRequestReadReceipt: (requestReadReceipt: MailsEditorV2['requestReadReceipt']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].requestReadReceipt);
	const setter = useEditorsStore((state) => state.updateRequestReadReceipt);

	return {
		requestReadReceipt: value,
		setRequestReadReceipt: (val: MailsEditorV2['requestReadReceipt']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
			debugLog('save cause: requestReadReceipt');
		}
	};
};

const notifyUploadError = (file: File, err: string): void => {
	getBridgedFunctions()?.createSnackbar({
		key: `upload-error`,
		replace: true,
		type: 'error',
		label: t('label.errors.upload_failed_generic', {
			filename: file.name,
			defaultValue: 'Upload failed for the file "{{filename}}"'
		}),
		autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
	});
};

export const useEditorSavedInlineAttachment = (
	editorId: MailsEditorV2['id']
): Array<SavedAttachment> =>
	filter(
		useEditorsStore((state) => state.editors[editorId].savedAttachments),
		'isInline'
	);

export const useEditorAttachments = (
	editorId: MailsEditorV2['id']
): {
	hasStandardAttachments: boolean;
	unsavedStandardAttachments: MailsEditorV2['unsavedAttachments'];
	savedStandardAttachments: MailsEditorV2['savedAttachments'];
	addStandardAttachment: (file: File, callbacks?: UploadCallbacks) => UnsavedAttachment;
	addInlineAttachment: (
		file: File,
		options?: UploadCallbacks & {
			onSaveComplete?: (contentId: string | undefined) => void;
			position?: number;
		}
	) => UnsavedAttachment;
	removeSavedAttachment: (partName: string) => void;
	removeUnsavedAttachment: (uploadId: string) => void;
	removeStandardAttachments: () => void;
} => {
	const unsavedStandardAttachments = reject(
		useEditorsStore((state) => state.editors[editorId].unsavedAttachments),
		'isInline'
	);
	const savedStandardAttachments = reject(
		useEditorsStore((state) => state.editors[editorId].savedAttachments),
		'isInline'
	);
	const removeStandardAttachmentsInvoker = useEditorsStore(
		(state) => state.clearStandardAttachments
	);
	const removeSavedAttachmentsInvoker = useEditorsStore((state) => state.removeSavedAttachment);
	const removeUnsavedAttachmentsInvoker = useEditorsStore((state) => state.removeUnsavedAttachment);

	const addGenericAttachment = (
		file: File,
		isInline: boolean,
		callbacks?: UploadCallbacks & { onSaveComplete?: (contentId: string | undefined) => void }
	): UnsavedAttachment => {
		const options: AttachmentUploadOptions = {
			onUploadProgress: (uploadId: string, percentage: number): void => {
				const setUploadStatus = useEditorsStore.getState().setAttachmentUploadStatus;
				const status: AttachmentUploadProcessStatus = {
					status: 'running',
					progress: percentage
				};
				setUploadStatus(editorId, uploadId, status);
				callbacks?.onUploadProgress && callbacks.onUploadProgress(uploadId, percentage);
			},

			onUploadError: (uploadId: string, error: string): void => {
				const setUploadStatus = useEditorsStore.getState().setAttachmentUploadStatus;
				const status: AttachmentUploadProcessStatus = {
					status: 'aborted',
					abortReason: error
				};
				notifyUploadError(file, error);
				setUploadStatus(editorId, uploadId, status);
				computeAndUpdateEditorStatus(editorId);
				callbacks?.onUploadError && callbacks.onUploadError(uploadId, error);
			},

			onUploadComplete: (uploadId: string, attachmentId: string): void => {
				const setUploadCompleted = useEditorsStore.getState().setAttachmentUploadCompleted;
				setUploadCompleted(editorId, uploadId, attachmentId);
				computeAndUpdateEditorStatus(editorId);
				callbacks?.onUploadComplete && callbacks.onUploadComplete(uploadId, attachmentId);
			}
		};

		const { uploadId, abortController } = uploadAttachment(file, options);
		const { addUnsavedAttachment } = useEditorsStore.getState();
		const attachment: UnsavedAttachment = {
			filename: file.name,
			contentType: file.type,
			size: file.size,
			uploadId,
			isInline,
			uploadStatus: {
				status: 'running',
				progress: 0
			},
			uploadAbortController: abortController
		};
		isInline && (attachment.contentId = `${attachment.uploadId}@carbonio`);

		const saveDraftOptions: SaveDraftOptions = {
			onComplete: (): void => {
				callbacks?.onSaveComplete && callbacks.onSaveComplete(attachment.contentId);
			}
		};

		addUnsavedAttachment(editorId, attachment);
		computeAndUpdateEditorStatus(editorId);
		debouncedSaveDraftFromEditor(editorId, saveDraftOptions);

		return attachment;
	};

	const addStandardAttachment = (file: File, callbacks?: UploadCallbacks): UnsavedAttachment =>
		addGenericAttachment(file, false, callbacks);

	const addInlineAttachment = (
		file: File,
		options?: UploadCallbacks & {
			onSaveComplete?: (contentId: string | undefined) => void;
			position?: number;
		}
	): UnsavedAttachment => {
		const attachmentAdditionOptions = {
			onUploadProgress: (uploadId: string, percentage: number): void => {
				options?.onUploadProgress && options.onUploadProgress(uploadId, percentage);
			},

			onUploadError: (uploadId: string, error: string): void => {
				options?.onUploadError && options.onUploadError(uploadId, error);
			},

			onUploadComplete: (uploadId: string, attachmentId: string): void => {
				const { unsavedAttachments } = useEditorsStore.getState().editors[editorId];
				const uploadedAttachment = getUnsavedAttachmentByUploadId({
					uploadId,
					unsavedAttachments
				});
				if (!uploadedAttachment || !uploadedAttachment.contentId) {
					return;
				}

				/*
				 * Creates and concat the img tag to the richtext body
				 */
				const cid = composeCidUrlFromContentId(uploadedAttachment.contentId);
				const inlineImg = `<img pnsrc="${cid}" src="${cid}" data-src="${cid}" data-mce-src="${cid}" alt="${uploadedAttachment.filename}"/><br/>`;
				const { text } = useEditorsStore.getState().editors[editorId];
				useEditorsStore.getState().updateText(editorId, {
					plainText: text.plainText,
					richText: inlineImg.concat(text.richText)
				});
				options?.onUploadComplete && options.onUploadComplete(uploadId, attachmentId);
			},

			onSaveComplete: (contentId: string | undefined): void => {
				options?.onSaveComplete && options.onSaveComplete(contentId);
			}
		};

		return addGenericAttachment(file, true, attachmentAdditionOptions);
	};

	return {
		hasStandardAttachments: unsavedStandardAttachments.length + savedStandardAttachments.length > 0,
		unsavedStandardAttachments,
		savedStandardAttachments,
		removeUnsavedAttachment: (uploadId: string): void => {
			removeUnsavedAttachmentsInvoker(editorId, uploadId);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		},

		removeSavedAttachment: (partName: string): void => {
			removeSavedAttachmentsInvoker(editorId, partName);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		},
		removeStandardAttachments: (): void => {
			removeStandardAttachmentsInvoker(editorId);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		},
		addStandardAttachment,
		addInlineAttachment
	};
};

export const useEditorInlineUrlConverter = (
	editorId: MailsEditorV2['id']
): ((cidUrl: string) => string) => {
	const savedInlineAttachments = useEditorSavedInlineAttachment(editorId);

	return (cidUrl: string): string => convertCidUrlToServiceUrl(cidUrl, savedInlineAttachments);
};

export const useEditorUploadProcess = (
	editorId: MailsEditorV2['id'],
	uploadId: string
): { status: AttachmentUploadProcessStatus; cancel: () => void } | null => {
	const attachmentStateInfo = useEditorsStore((state) => {
		const unsavedAttachmentIndex = getUnsavedAttachmentIndex(state, editorId, uploadId);
		if (unsavedAttachmentIndex === null) {
			return null;
		}

		return {
			status: state.editors[editorId].unsavedAttachments[unsavedAttachmentIndex].uploadStatus,
			abortController:
				state.editors[editorId].unsavedAttachments[unsavedAttachmentIndex].uploadAbortController
		};
	});
	if (!attachmentStateInfo || !attachmentStateInfo.status || !attachmentStateInfo.abortController) {
		return null;
	}

	return {
		status: attachmentStateInfo.status,
		cancel: (): void => {
			attachmentStateInfo.abortController?.abort();
			useEditorsStore.getState().removeUnsavedAttachment(editorId, uploadId);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		}
	};
};

/**
 * Returns the reactive status for the draft save operation.
 * If some change on the editor data will cause the ability/inability to
 * perform a draft save the status will be updated.
 *
 * The hook returns also the function to invoke the draft save
 * NOTE: the save operation is debounced
 *
 * @param editorId
 */
export const useEditorDraftSave = (
	editorId: MailsEditorV2['id']
): { status: MailsEditorV2['draftSaveAllowedStatus']; saveDraft: () => void } => {
	const status = useEditorsStore((state) => state.editors[editorId].draftSaveAllowedStatus);
	const invoker = (): void => debouncedSaveDraftFromEditor(editorId);

	return {
		status,
		saveDraft: invoker
	};
};

/**
 * Returns the reactive status of the draft save process
 * @param editorId
 */
export const useEditorDraftSaveProcessStatus = (
	editorId: MailsEditorV2['id']
): MailsEditorV2['draftSaveProcessStatus'] =>
	useEditorsStore((state) => state.editors[editorId].draftSaveProcessStatus);

/**
 * Returns the reactive status for the message send operation.
 * If some change on the editor data will cause the ability/inability to
 * perform the send the status will be updated.
 *
 * The hook returns also the function to invoke the message send action
 *
 * @param editorId
 */
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
