/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getUserSettings, t } from '@zextras/carbonio-shell-ui';
import { debounce, find } from 'lodash';

import { computeDraftSaveAllowedStatus, computeSendAllowedStatus } from './editor-utils';
import { useEditorsStore } from './store';
import { EditViewActionsType, TIMEOUTS } from '../../../constants';
import { createCancelableTimer } from '../../../helpers/timers';
import { MailAttachmentParts, MailsEditorV2, SaveDraftResponse } from '../../../types';
import { saveDraftV3 } from '../../actions/save-draft';
import { sendMsgFromEditor } from '../../actions/send-msg';

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

const debugLog = (text: string): void => {
	// eslint-disable-next-line no-console
	console.debug(`***** ${text}`);
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
		delay,
		onTick: onTimerTick,
		onCancel: onTimerCanceled
	});
	cancelableTimer.promise
		.then(() => {
			editor
				.messagesStoreDispatch(sendMsgFromEditor({ editorId }))
				.then(() => {
					useEditorsStore.getState().updateSendProcessStatus(editorId, {
						status: 'completed'
					});
					computeAndUpdateEditorStatus(editorId);
				})
				.catch((err) => {
					useEditorsStore.getState().updateSendProcessStatus(editorId, {
						status: 'aborted',
						abortReason: err
					});
					computeAndUpdateEditorStatus(editorId);
				});
		})
		.catch((err) => {
			useEditorsStore.getState().updateSendProcessStatus(editorId, {
				status: 'aborted',
				abortReason: err
			});
			computeAndUpdateEditorStatus(editorId);
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
 * @param editor
 */
const saveDraftFromEditor = (editorId: MailsEditorV2['id']): void => {
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
		computeAndUpdateEditorStatus(editorId);
	};

	// Update messages store
	saveDraftV3({ editor })
		.then((res) => {
			if ('Fault' in res) {
				handleError(res.Fault.Detail?.Error?.Detail);
				return;
			}

			// TODO extract multipart for attachments?
			res.m && useEditorsStore.getState().setDid(editorId, res.m[0].id);

			useEditorsStore.getState().updateDraftSaveProcessStatus(editorId, {
				status: 'completed',
				lastSaveTimestamp: new Date()
			});
			// FIXME use a subscription to the store update
			useEditorsStore
				.getState()
				.updateDraftSaveAllowedStatus(
					editorId,
					checkDraftSaveAllowedStatus(getEditor({ id: editorId }) ?? {})
				);
		})
		.catch((err) => {
			useEditorsStore.getState().updateDraftSaveProcessStatus(editorId, {
				status: 'aborted',
				abortReason: err
			});
			// FIXME use a subscription to the store update
			useEditorsStore
				.getState()
				.updateDraftSaveAllowedStatus(
					editorId,
					checkDraftSaveAllowedStatus(getEditor({ id: editorId }) ?? {})
				);
		});

	useEditorsStore.getState().updateDraftSaveProcessStatus(editorId, {
		status: 'running'
	});
	// FIXME use a subscription to the store update
	useEditorsStore
		.getState()
		.updateDraftSaveAllowedStatus(
			editorId,
			checkDraftSaveAllowedStatus(getEditor({ id: editorId }) ?? {})
		);
};

const debouncedSaveDraftFromEditor = debounce(saveDraftFromEditor, TIMEOUTS.DRAFT_SAVE_DELAY);

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

	return {
		text: value,
		setText: (val: MailsEditorV2['text']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
			debugLog('save cause: text');
		},
		resetText: (): void => {
			setter(id, { plainText: '', richText: '' });
			debouncedSaveDraftFromEditor(id);
			debugLog('save cause: text reset');
		}
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
 * Returns the attachment files of the editor with given ID or an empty array if not found.
 * @params id
 */
export const useEditorAttachmentFiles = ({
	id
}: {
	id: MailsEditorV2['id'];
}): MailsEditorV2['attachmentFiles'] =>
	useEditorsStore((state) => state.editors[id].attachmentFiles);
export const getEditorAttachmentFiles = ({
	id
}: {
	id: MailsEditorV2['id'];
}): MailsEditorV2['attachmentFiles'] =>
	useEditorsStore.getState()?.editors?.[id]?.attachmentFiles ?? [];

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
 * Returns reactive reference to the from value and to its setter
 * @param editorId
 */
export const useEditorFrom = (
	editorId: MailsEditorV2['id']
): {
	from: MailsEditorV2['from'];
	setFrom: (from: MailsEditorV2['from']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[editorId].from);
	const setter = useEditorsStore((state) => state.updateFrom);

	return {
		from: value,
		setFrom: (val: MailsEditorV2['from']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
			debugLog('save cause: from');
		}
	};
};

/**
 * Returns reactive reference to the sender value and to its setter
 * @param editorId
 */
export const useEditorSender = (
	editorId: MailsEditorV2['id']
): {
	sender: MailsEditorV2['sender'];
	setSender: (sender: MailsEditorV2['sender']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[editorId].sender);
	const setter = useEditorsStore((state) => state.updateSender);

	return {
		sender: value,
		setSender: (val: MailsEditorV2['sender']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
			debugLog('save cause: sender');
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

/**
 * add attachments to a specific editor.
 * @params id
 * @params attachments
 */
export const useAddAttachment = ({
	id,
	attachment
}: {
	id: MailsEditorV2['id'];
	attachment: MailsEditorV2['attachments'][0];
}): void => useEditorsStore((s) => s.addAttachment(id, attachment));
export const getAddAttachment = ({
	id,
	attachment
}: {
	id: MailsEditorV2['id'];
	attachment: MailAttachmentParts;
}): void => useEditorsStore.getState().addAttachment(id, attachment);

/**
 * remove attachments from a specific editor.
 * @params id
 * @params attachments
 */
export const useRemoveAttachment = ({
	id,
	action
}: {
	id: MailsEditorV2['id'];
	action: any; // TODO type this action properly
}): void => useEditorsStore((s) => s.updateAttachments(id, action));
export const getRemoveAttachments = ({
	id,
	action
}: {
	id: MailsEditorV2['id'];
	action: any; // TODO type this action properly
}): void => useEditorsStore.getState().updateAttachments(id, action);

/**
 * add inline attachments to a specific editor.
 * @params id
 * @params inlineAttachments
 */
export const useAddInlineAttachment = ({
	id,
	inlineAttachment
}: {
	id: MailsEditorV2['id'];
	inlineAttachment: MailsEditorV2['inlineAttachments'][0];
}): void => useEditorsStore((s) => s.addInlineAttachment(id, inlineAttachment));
export const getAddInlineAttachment = ({
	id,
	inlineAttachment
}: {
	id: MailsEditorV2['id'];
	inlineAttachment: MailsEditorV2['inlineAttachments'][0];
}): void => useEditorsStore.getState().addInlineAttachment(id, inlineAttachment);

/**
 * remove inline attachments from a specific editor.
 * @params id
 * @params inlineAttachments
 */
export const useRemoveInlineAttachment = ({
	id,
	inlineAttachment
}: {
	id: MailsEditorV2['id'];
	inlineAttachment: MailsEditorV2['inlineAttachments'][0];
}): void => useEditorsStore((s) => s.removeInlineAttachment(id, inlineAttachment));
export const getRemoveInlineAttachments = ({
	id,
	inlineAttachments
}: {
	id: MailsEditorV2['id'];
	inlineAttachments: MailsEditorV2['inlineAttachments'];
}): void => useEditorsStore.getState().removeInlineAttachment(id, inlineAttachments);

/**
 * Remove all editors.
 */
export const useClearEditors = (): void => useEditorsStore((s) => s.clearEditors());
export const getClearEditors = (): void => useEditorsStore.getState().clearEditors();

/** remove the subject of a specific editor.
 * @params id
 */
export const useClearSubject = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.clearSubject(id));
export const getRemoveSubject = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().clearSubject(id);

/** remove the autoSendTime of a specific editor.
 * @params id
 */
export const useClearAutoSendTime = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.clearAutoSendTime(id));
export const getRemoveAutoSendTime = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().clearAutoSendTime(id);

/** remove the text of a specific editor.
 * @params id
 */
export const useClearText = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.clearText(id));
export const getRemoveText = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().clearText(id);

/** remove the attachments of a specific editor.
 * @params id
 */
export const useClearAttachments = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.clearAttachments(id));
export const getClearAttachments = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().clearAttachments(id);

/** remove the inlineAttachments of a specific editor.
 * @params id
 */
export const useClearInlineAttachments = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.clearInlineAttachments(id));
export const getClearInlineAttachments = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().clearInlineAttachments(id);

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

/** updates the draft for a specific editor.
 * @params editorId
 * @params res
 */
export const useUpdateDraft = ({
	editorId,
	res
}: {
	editorId: MailsEditorV2['id'];
	res: SaveDraftResponse;
}): void => {
	useEditorsStore((s) => s.updateDraft({ editorId, res }));
};
export const getUpdateDraft = ({
	editorId,
	res
}: {
	editorId: MailsEditorV2['id'];
	res: SaveDraftResponse;
}): void => {
	useEditorsStore.getState().updateDraft({ editorId, res });
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

/**
 * Returns the reactive status of the message send process
 * @param editorId
 */
export const useEditorSendProcessStatus = (
	editorId: MailsEditorV2['id']
): MailsEditorV2['sendProcessStatus'] =>
	useEditorsStore((state) => state.editors[editorId].sendProcessStatus);
