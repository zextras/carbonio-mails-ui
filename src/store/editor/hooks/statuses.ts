/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { some } from 'lodash';

import { t } from '@zextras/carbonio-shell-ui';
import { concat, some } from 'lodash';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import { PROCESS_STATUS } from 'constants/index';
import { useEditorsStore } from 'store/editor/store';
import { EditorOperationAllowedStatus, MailsEditorV2 } from 'types/editor';
import { isValidEmail } from 'views/search/parts/utils';

/**
 * Computes whether a draft save is currently allowed for the given editor.
 * The result is derived entirely from other editor fields, so it must not be
 * persisted in the store: consume it through the reactive hook or by calling
 * this function directly in imperative contexts.
 * @param editor
 */
export const computeDraftSaveAllowedStatus = (
	editor: MailsEditorV2
): EditorOperationAllowedStatus => {
	if (editor.draftSaveProcessStatus?.status === PROCESS_STATUS.RUNNING) {
		return {
			allowed: false,
			reason: t('label.draft_save_in_progress', 'Saving draft in progress')
		};
	}

	if (
		some(
			editor.unsavedAttachments,
			(unsavedAttachment) => unsavedAttachment.uploadStatus?.status === 'running'
		)
	) {
		return {
			allowed: false,
			reason: t('label.attachment_error_status.uploading', 'Attachments are being uploaded')
		};
	}

	if (
		some(
			editor.unsavedAttachments,
			(unsavedAttachment) => unsavedAttachment.uploadStatus?.status === 'aborted'
		)
	) {
		return {
			allowed: false,
			reason: t('label.attachment_error_status.failed', 'one or more attachments failed to upload')
		};
	}

	return { allowed: true };
};

/**
 * Computes whether the message send is currently allowed for the given editor.
 * The result is derived entirely from other editor fields, so it must not be
 * persisted in the store: consume it through the reactive hook or by calling
 * this function directly in imperative contexts.
 * @param editor
 */
export const computeSendAllowedStatus = (editor: MailsEditorV2): EditorOperationAllowedStatus => {
	if (editor.draftSaveProcessStatus?.status === PROCESS_STATUS.RUNNING) {
		return {
			allowed: false,
			reason: t('label.draft_save_in_progress', 'Saving draft in progress')
		};
	}

	if (editor.sendProcessStatus?.status === PROCESS_STATUS.RUNNING) {
		return {
			allowed: false,
			reason: t('label.message_send_in_progress', 'Sending message')
		};
	}

	if (!editor.identityId) {
		return {
			allowed: false,
			reason: t('label.missing_sender', 'the identity of the sender is not set')
		};
	}

	if (
		!editor.recipients.to.length &&
		!editor.recipients.cc.length &&
		!editor.recipients.bcc.length
	) {
		return {
			allowed: false,
			reason: t('label.missing_recipients', 'At least one recipient is required to send the email')
		};
	}

	const participants = concat(editor.recipients.to, editor.recipients.bcc, editor.recipients.cc);
	if (
		some(participants, (participant) => participant.error || !isValidEmail(participant.address))
	) {
		return {
			allowed: false,
			reason: t('label.invalid_recipients', `One or more recipients are invalid`)
		};
	}

	if (
		some(
			editor.unsavedAttachments,
			(unsavedAttachment) => unsavedAttachment.uploadStatus?.status === 'running'
		)
	) {
		return {
			allowed: false,
			reason: t('label.attachment_error_status.uploading', 'Attachments are being uploaded')
		};
	}

	if (
		some(
			editor.unsavedAttachments,
			(unsavedAttachment) => unsavedAttachment.uploadStatus?.status === 'aborted'
		)
	) {
		return {
			allowed: false,
			reason: t('label.attachment_error_status.failed', 'one or more attachments failed to upload')
		};
	}

	return { allowed: true };
};

/**
 * Equality function for the allowed-status selectors. The compute functions
 * return a fresh object on every call, so a reference check would re-render on
 * every store change: comparing the meaningful fields keeps re-renders minimal
 * without relying on useShallow.
 * @param a
 * @param b
 */
const isSameAllowedStatus = (
	a: EditorOperationAllowedStatus,
	b: EditorOperationAllowedStatus
): boolean => a.allowed === b.allowed && a.reason === b.reason;

/**
 * Returns the reactive send-allowed status for the given editor, derived on the
 * fly from the editor state (no persisted field to keep synchronized).
 * @param editorId
 */
export const useEditorSendAllowedStatus = (
	editorId: MailsEditorV2['id']
): EditorOperationAllowedStatus =>
	useStoreWithEqualityFn(
		useEditorsStore,
		(state) => computeSendAllowedStatus(state.editors[editorId]),
		isSameAllowedStatus
	);

/**
 * Returns the reactive draft-save-allowed status for the given editor, derived
 * on the fly from the editor state (no persisted field to keep synchronized).
 * @param editorId
 */
export const useEditorDraftSaveAllowedStatus = (
	editorId: MailsEditorV2['id']
): EditorOperationAllowedStatus =>
	useStoreWithEqualityFn(
		useEditorsStore,
		(state) => computeDraftSaveAllowedStatus(state.editors[editorId]),
		isSameAllowedStatus
	);

/**
 * Returns reactive reference to the isModified value and to its setter
 * @param id
 * @returns
 */
export const useEditorIsDirty = (id: MailsEditorV2['id']): MailsEditorV2['isDirty'] =>
	useEditorsStore((state) => state.editors[id].isDirty);

const hasDirtyEditors = (state: EditorsStateTypeV2): boolean =>
	some(state.editors, (editor) => editor.isDirty);

/**
 * Returns a reactive flag which tells if at least one of the open editors
 * holds changes which haven't been persisted in a draft yet
 */
export const useHasDirtyEditors = (): boolean => useEditorsStore(hasDirtyEditors);

/**
 * Returns reactive reference to the isModified value and to its setter
 * @param id
 * @returns
 */
export const useEditorSetDirty = (
	id: MailsEditorV2['id']
): {
	setDirty: () => void;
	resetDirty: () => void;
} => {
	const setter = useEditorsStore.getState().setIsDirty;

	return useMemo(
		() => ({
			setDirty: (): void => {
				setter(id, true);
			},
			resetDirty: (): void => {
				setter(id, false);
			}
		}),
		[id, setter]
	);
};
