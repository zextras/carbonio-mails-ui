/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { debounce } from 'lodash';
import { TIMEOUTS } from '../../../constants';
import { DraftSaveEndListener, DraftSaveStartListener, MailsEditorV2 } from '../../../types';
import { saveDraftV2 } from '../../actions/save-draft';
import { useEditorsStore } from './store';

/**
 * Returns the editor with given ID or null if not found.
 * @params id
 * */
export const useEditor = ({ id }: { id: MailsEditorV2['id'] }): MailsEditorV2 | null =>
	useEditorsStore((s) => s.editors?.[id] ?? null);
export const getEditor = ({ id }: { id: MailsEditorV2['id'] }): MailsEditorV2 | null =>
	useEditorsStore.getState()?.editors?.[id] ?? null;

/**
 * Update a specific editor.
 * */
export const useUpdateEditor = ({
	id,
	opt
}: {
	id: MailsEditorV2['id'];
	opt: Partial<MailsEditorV2>;
}): void => useEditorsStore((s) => s.updateEditor(id, opt));
export const getUpdateEditor = ({ id, opt }: { id: string; opt: Partial<MailsEditorV2> }): void =>
	useEditorsStore.getState().updateEditor(id, opt);

/**
 * Update the subject of a specific editor.
 * @params id
 * @params subject
 * */
export const useUpdateSubject = ({
	id,
	subject
}: {
	id: MailsEditorV2['id'];
	subject: MailsEditorV2['subject'];
}): void => useEditorsStore((s) => s.updateSubject(id, subject));
export const getUpdateSubject = ({
	id,
	subject
}: {
	id: MailsEditorV2['id'];
	subject: MailsEditorV2['subject'];
}): void => useEditorsStore.getState().updateSubject(id, subject);

/**
 * add a new editor.
 * @params id
 * @params editor
 * */
export const useAddEditor = ({
	id,
	editor
}: {
	id: MailsEditorV2['id'];
	editor: MailsEditorV2;
}): void => useEditorsStore((s) => s.addEditor(id, editor));
export const getAddEditor = ({
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
export const useDeleteEditor = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore((s) => s.deleteEditor(id));
export const getDeleteEditor = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().deleteEditor(id);

/**
 * update the text of a specific editor.
 * @params id
 * @params text
 * */
export const useUpdateText = ({
	id,
	text
}: {
	id: MailsEditorV2['id'];
	text: MailsEditorV2['text'];
}): void => useEditorsStore((s) => s.updateText(id, text));
export const getUpdateText = ({
	id,
	text
}: {
	id: MailsEditorV2['id'];
	text: MailsEditorV2['text'];
}): void => useEditorsStore.getState().updateText(id, text);

/**
 * update the autoSendTime of a specific editor.
 * @params id
 * @params autoSendTime
 * */
export const useUpdateAutoSendTime = ({
	id,
	autoSendTime
}: {
	id: MailsEditorV2['id'];
	autoSendTime: MailsEditorV2['autoSendTime'];
}): void => useEditorsStore((s) => s.updateAutoSendTime(id, autoSendTime));
export const getUpdateAutoSendTime = ({
	id,
	autoSendTime
}: {
	id: MailsEditorV2['id'];
	autoSendTime: MailsEditorV2['autoSendTime'];
}): void => useEditorsStore.getState().updateAutoSendTime(id, autoSendTime);

/**
 * set the did of a specific editor.
 * @params id
 * @params did
 * */
export const useSetDid = ({
	id,
	did
}: {
	id: MailsEditorV2['id'];
	did: MailsEditorV2['did'];
}): void => useEditorsStore((s) => s.setDid(id, did));
export const getSetDid = ({
	id,
	did
}: {
	id: MailsEditorV2['id'];
	did: MailsEditorV2['did'];
}): void => useEditorsStore.getState().setDid(id, did);

/**
 * set the isRichText flag for a specific editor.
 * @params id
 * @params isRichText
 * */
export const useSetIsRichText = ({
	id,
	isRichText
}: {
	id: MailsEditorV2['id'];
	isRichText: MailsEditorV2['isRichText'];
}): void => useEditorsStore((s) => s.setIsRichText(id, isRichText));
export const getSetIsRichText = ({
	id,
	isRichText
}: {
	id: MailsEditorV2['id'];
	isRichText: MailsEditorV2['isRichText'];
}): void => useEditorsStore.getState().setIsRichText(id, isRichText);

/**
 * set the originalId of a specific editor.
 * @params id
 * @params originalId
 * */
export const useSetOriginalId = ({
	id,
	originalId
}: {
	id: MailsEditorV2['id'];
	originalId: MailsEditorV2['originalId'];
}): void => useEditorsStore((s) => s.setOriginalId(id, originalId));
export const getSetOriginalId = ({
	id,
	originalId
}: {
	id: MailsEditorV2['id'];
	originalId: MailsEditorV2['originalId'];
}): void => useEditorsStore.getState().setOriginalId(id, originalId);

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
 * update the recipients of a specific editor.
 * @params id
 * @params recipients
 * */
export const useUpdateRecipients = ({
	id,
	recipients
}: {
	id: MailsEditorV2['id'];
	recipients: MailsEditorV2['recipients'];
}): void => useEditorsStore((s) => s.updateRecipients(id, recipients));
export const getUpdateRecipients = ({
	id,
	recipients
}: {
	id: MailsEditorV2['id'];
	recipients: MailsEditorV2['recipients'];
}): void => useEditorsStore.getState().updateRecipients(id, recipients);

/**
 * update the from of a specific editor.
 * @params id
 * @params from
 * */
export const useUpdateFrom = ({
	id,
	from
}: {
	id: MailsEditorV2['id'];
	from: MailsEditorV2['from'];
}): void => useEditorsStore((s) => s.updateFrom(id, from));
export const getUpdateFrom = ({
	id,
	from
}: {
	id: MailsEditorV2['id'];
	from: MailsEditorV2['from'];
}): void => useEditorsStore.getState().updateFrom(id, from);

/**
 * update the isUrgent of a specific editor.
 * @params id
 * @params isUrgent
 * */
export const useUpdateIsUrgent = ({
	id,
	isUrgent
}: {
	id: MailsEditorV2['id'];
	isUrgent: MailsEditorV2['isUrgent'];
}): void => useEditorsStore((s) => s.updateIsUrgent(id, isUrgent));
export const getUpdateIsUrgent = ({
	id,
	isUrgent
}: {
	id: MailsEditorV2['id'];
	isUrgent: MailsEditorV2['isUrgent'];
}): void => useEditorsStore.getState().updateIsUrgent(id, isUrgent);

/**
 * add attachments to a specific editor.
 * @params id
 * @params attachments
 * */
export const useAddAttachments = ({
	id,
	attachments
}: {
	id: MailsEditorV2['id'];
	attachments: MailsEditorV2['attachments'];
}): void => useEditorsStore((s) => s.addAttachment(id, attachments));
export const getAddAttachments = ({
	id,
	attachments
}: {
	id: MailsEditorV2['id'];
	attachments: MailsEditorV2['attachments'];
}): void => useEditorsStore.getState().addAttachment(id, attachments);

/**
 * remove attachments from a specific editor.
 * @params id
 * @params attachments
 * */
export const useRemoveAttachments = ({
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
export const useAddInlineAttachments = ({
	id,
	inlineAttachments
}: {
	id: MailsEditorV2['id'];
	inlineAttachments: MailsEditorV2['inlineAttachments'];
}): void => useEditorsStore((s) => s.addInlineAttachments(id, inlineAttachments));
export const getAddInlineAttachments = ({
	id,
	inlineAttachments
}: {
	id: MailsEditorV2['id'];
	inlineAttachments: MailsEditorV2['inlineAttachments'];
}): void => useEditorsStore.getState().addInlineAttachments(id, inlineAttachments);

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
}): void => useEditorsStore((s) => s.removeInlineAttachments(id, inlineAttachments));
export const getRemoveInlineAttachments = ({
	id,
	inlineAttachments
}: {
	id: MailsEditorV2['id'];
	inlineAttachments: MailsEditorV2['inlineAttachments'];
}): void => useEditorsStore.getState().removeInlineAttachments(id, inlineAttachments);

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
	useEditorsStore((s) => {
		saveStartListener && s.addDraftSaveStartListener(editorId, saveStartListener);
	});
	useEditorsStore((s) => {
		saveEndListener && s.addDraftSaveEndListener(editorId, saveEndListener);
	});
};

/**
 *
 * @param editorId
 * @param saveStartListener
 * @param saveEndListener
 */
export const useRemoveDraftListeners = ({
	editorId,
	saveStartListener,
	saveEndListener
}: {
	editorId: MailsEditorV2['id'];
	saveStartListener?: DraftSaveStartListener;
	saveEndListener?: DraftSaveEndListener;
}): void => {
	useEditorsStore((s) => {
		saveStartListener && s.removeDraftSaveStartListener(editorId, saveStartListener);
	});
	useEditorsStore((s) => {
		saveEndListener && s.removeDraftSaveEndListener(editorId, saveEndListener);
	});
};

/**
 *
 * @param editor
 */
const _saveEditorImpl = (editor: MailsEditorV2): void => {
	// TODO handle the dispatch to the store
	saveDraftV2({ editor }).then();
};

/**
 *
 * @param editor
 */
const saveEditor = (editor: MailsEditorV2): void => {
	debounce(_saveEditorImpl, TIMEOUTS.DRAFT_SAVE_DELAY);
};
