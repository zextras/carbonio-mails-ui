/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect } from 'react';

import { debounce } from 'lodash';

import { useEditorsStore } from './store';
import { TIMEOUTS } from '../../../constants';
import { DraftSaveEndListener, DraftSaveStartListener, MailsEditorV2 } from '../../../types';
import { saveDraftV2 } from '../../actions/save-draft';

/**
 * Returns the editor with given ID or null if not found.
 * @params id
 */
export const useEditor = ({ id }: { id: MailsEditorV2['id'] }): MailsEditorV2 | null =>
	useEditorsStore((s) => s.editors?.[id] ?? null);
export const getEditor = ({ id }: { id: MailsEditorV2['id'] }): MailsEditorV2 | null =>
	useEditorsStore.getState()?.editors?.[id] ?? null;

/**
 *
 * @param editor
 */
const saveDraftFromEditor = (editorId: MailsEditorV2['id']): void => {
	const editor = getEditor({ id: editorId });
	if (!editor) {
		console.warn('Cannot find editor', editorId);
		return;
	}

	// Update messages store
	editor
		.messagesStoreDispatch(saveDraftV2({ editor }))
		.then((res) => {
			// PayloadAction<saveDraftResult, string, {arg: SaveDraftParameters, requestId: string, requestStatus: "fulfilled"}, never> | PayloadAction<...>
			const x = res.payload;
			console.dir(x);

			// Invoke end listeners
			// TODO handle the response or the error
			editor.listeners.draftSaveEndListeners.forEach((listener: DraftSaveEndListener) => {
				listener({ editorId: editor.id, result: { draftId: 'fake DID' } });
			});
		})
		.catch((err) => {
			// Invoke end listeners
			editor.listeners.draftSaveEndListeners.forEach((listener: DraftSaveEndListener) => {
				listener({ editorId: editor.id, result: { error: err } });
			});
		});

	// Invoke start listeners
	editor.listeners.draftSaveStartListeners.forEach((listener: DraftSaveStartListener) => {
		listener({ editorId: editor.id });
	});
};

const debouncedSaveDraftFromEditor = debounce(saveDraftFromEditor, TIMEOUTS.DRAFT_SAVE_DELAY);

/**
 *
 * @param id
 * @param editor
 */
export const addEditor = ({
	id,
	editor
}: {
	id: MailsEditorV2['id'];
	editor: MailsEditorV2;
}): void => useEditorsStore.getState().addEditor(id, editor);

/**
 * Remove a specific editor.
 * @params id
 * */
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
		},
		resetText: () => setter(id, { plainText: '', richText: '' })
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
		setAutoSendTime: (val: MailsEditorV2['autoSendTime']) => setter(id, val)
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

	return { did: value, setDid: (val: MailsEditorV2['did']) => setter(id, val) };
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
		setIsRichText: (val: MailsEditorV2['isRichText']) => setter(id, val)
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
 * */
export const useSetOriginalMessage = ({
	id,
	originalMessage
}: {
	id: MailsEditorV2['id'];
	originalMessage: MailsEditorV2['originalMessage'];
}): void => useEditorsStore((s) => s.setOriginalMessage(id, originalMessage));
export const getSetOriginalMessage = ({
	id,
	originalMessage
}: {
	id: MailsEditorV2['id'];
	originalMessage: MailsEditorV2['originalMessage'];
}): void => useEditorsStore.getState().setOriginalMessage(id, originalMessage);

/**
 * Returns reactive references to the "to" recipients values and to their setter
 * @param id
 */
export const useEditorRecipients = (
	id: MailsEditorV2['id']
): {
	recipients: MailsEditorV2['recipients'];
	setRecipients: (recipient: MailsEditorV2['recipients']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].recipients);
	const setter = useEditorsStore((state) => state.updateRecipients);

	return {
		recipients: value,
		setRecipients: (val: MailsEditorV2['recipients']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
		}
	};
};

/**
 * Returns reactive references to the "to" recipients values and to their setter
 * @param id
 */
export const useEditorToRecipients = (
	id: MailsEditorV2['id']
): {
	toRecipients: MailsEditorV2['recipients']['to'];
	setToRecipients: (recipient: MailsEditorV2['recipients']['to']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].recipients.to);
	const setter = useEditorsStore((state) => state.updateToRecipients);

	return {
		toRecipients: value,
		setToRecipients: (val: MailsEditorV2['recipients']['to']) => setter(id, val)
	};
};

/**
 * Returns reactive references to the "cc" recipients values and to their setter
 * @param id
 */
export const useEditorCcRecipients = (
	id: MailsEditorV2['id']
): {
	ccRecipients: MailsEditorV2['recipients']['cc'];
	setCcRecipients: (recipient: MailsEditorV2['recipients']['cc']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].recipients.cc);
	const setter = useEditorsStore((state) => state.updateCcRecipients);

	return {
		ccRecipients: value,
		setCcRecipients: (val: MailsEditorV2['recipients']['cc']) => setter(id, val)
	};
};

/**
 * Returns reactive references to the "bcc" recipients values and to their setter
 * @param id
 */
export const useEditorBccRecipients = (
	id: MailsEditorV2['id']
): {
	bccRecipients: MailsEditorV2['recipients']['bcc'];
	setBccRecipients: (recipient: MailsEditorV2['recipients']['bcc']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].recipients.bcc);
	const setter = useEditorsStore((state) => state.updateBccRecipients);

	return {
		bccRecipients: value,
		setBccRecipients: (val: MailsEditorV2['recipients']['bcc']) => setter(id, val)
	};
};

/**
 * Returns reactive reference to the from value and to its setter
 * @param id
 */
export const useEditorFrom = (
	id: MailsEditorV2['id']
): {
	from: MailsEditorV2['from'];
	setFrom: (from: MailsEditorV2['from']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].from);
	const setter = useEditorsStore((state) => state.updateFrom);

	return {
		from: value,
		setFrom: (val: MailsEditorV2['from']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
		}
	};
};

/**
 * Returns reactive reference to the sender value and to its setter
 * @param id
 */
export const useEditorSender = (
	id: MailsEditorV2['id']
): {
	sender: MailsEditorV2['sender'];
	setSender: (sender: MailsEditorV2['sender']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].sender);
	const setter = useEditorsStore((state) => state.updateSender);

	return {
		sender: value,
		setSender: (val: MailsEditorV2['sender']) => setter(id, val)
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
		setIsUrgent: (val: MailsEditorV2['isUrgent']) => setter(id, val)
	};
};

/**
 * add attachments to a specific editor.
 * @params id
 * @params attachments
 * */
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
	attachment: MailsEditorV2['attachments'][0];
}): void => useEditorsStore.getState().addAttachment(id, attachment);

/**
 * remove attachments from a specific editor.
 * @params id
 * @params attachments
 * */
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
 * */
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
 * */
export const useRemoveInlineAttachments = ({
	id,
	inlineAttachments
}: {
	id: MailsEditorV2['id'];
	inlineAttachments: MailsEditorV2['inlineAttachments'];
}): void => useEditorsStore((s) => s.removeInlineAttachment(id, inlineAttachments));
export const getRemoveInlineAttachments = ({
	id,
	inlineAttachments
}: {
	id: MailsEditorV2['id'];
	inlineAttachments: MailsEditorV2['inlineAttachments'];
}): void => useEditorsStore.getState().removeInlineAttachment(id, inlineAttachments);

/**
 * Remove all editors.
 * */
export const useClearEditors = (): void => useEditorsStore((s) => s.clearEditors());
export const getClearEditors = (): void => useEditorsStore.getState().clearEditors();

/** remove the subject of a specific editor.
 * @params id
 * */
export const useClearSubject = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.clearSubject(id));
export const getRemoveSubject = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().clearSubject(id);

/** remove the autoSendTime of a specific editor.
 * @params id
 * */
export const useClearAutoSendTime = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.clearAutoSendTime(id));
export const getRemoveAutoSendTime = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().clearAutoSendTime(id);

/** remove the text of a specific editor.
 * @params id
 * */
export const useClearText = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.clearText(id));
export const getRemoveText = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().clearText(id);

/** remove the attachments of a specific editor.
 * @params id
 * */
export const useClearAttachments = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.clearAttachments(id));
export const getClearAttachments = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().clearAttachments(id);

/** remove the inlineAttachments of a specific editor.
 * @params id
 * */
export const useClearInlineAttachments = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.clearInlineAttachments(id));
export const getClearInlineAttachments = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().clearInlineAttachments(id);

/**
 *
 * @param editorId
 * @param saveStartListener
 * @param saveEndListener
 */
export const useAddDraftListeners = ({
	editorId,
	saveStartListener,
	saveEndListener
}: {
	editorId: MailsEditorV2['id'];
	saveStartListener?: DraftSaveStartListener;
	saveEndListener?: DraftSaveEndListener;
}): void => {
	const addStartListener = useEditorsStore((s) => s.addDraftSaveStartListener);
	const addEndListener = useEditorsStore((s) => s.addDraftSaveEndListener);

	// Invoke changes on the store only when the listeners are actually changed
	useEffect(() => {
		saveStartListener && addStartListener(editorId, saveStartListener);
		saveEndListener && addEndListener(editorId, saveEndListener);
	}, [editorId, saveStartListener, saveEndListener, addStartListener, addEndListener]);
};
