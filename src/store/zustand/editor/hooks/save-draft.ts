/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';

import { computeAndUpdateEditorStatus } from './commons';
import { getEditor } from './editors';
import { useUiUtilities } from '../../../../hooks/use-ui-utilities';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { MailsEditorV2 } from '../../../../types';
import { saveDraftAsyncThunk, saveDraftV3 } from '../../../actions/save-draft';
import { buildSavedAttachments } from '../editor-transformations';
import { useEditorsStore } from '../store';
import { getDraftSaveDelay } from '../store-utils';

export type SaveDraftOptions = {
	onComplete?: () => void;
	onError?: (error: string) => void;
};

export type SaveDraftFunction = (editorId: MailsEditorV2['id'], options?: SaveDraftOptions) => void;

/**
 *
 * @param editorId
 * @param options
 */
export const useSaveDraftFromEditor = (): {
	debouncedSaveDraft: ReturnType<typeof debounce<SaveDraftFunction>>;
	immediateSaveDraft: SaveDraftFunction;
} => {
	const { createSnackbar } = useUiUtilities();
	const [t] = useTranslation();

	const saveDraftFromEditor = useCallback(
		(editorId: MailsEditorV2['id'], options?: SaveDraftOptions): void => {
			const editor = getEditor({ id: editorId });
			if (!editor) {
				console.warn('Cannot find the editor', editorId);
				return;
			}

			if (!editor.draftSaveAllowedStatus?.allowed) {
				return;
			}

			const handleError = (err: string): void => {
				useEditorsStore.getState().setDraftSaveProcessStatus(editorId, {
					status: 'aborted',
					abortReason: err
				});

				createSnackbar({
					key: `save-draft`,
					replace: true,
					severity: 'error',
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
					useEditorsStore.getState().setSize(editorId, mailMessage.size);
					useEditorsStore.getState().removeUnsavedAttachments(editorId);
					const savedAttachments = buildSavedAttachments(mailMessage);

					useEditorsStore.getState().setSavedAttachments(editorId, savedAttachments);
					useEditorsStore.getState().setTotalSmartLinksSize(editorId);
					useEditorsStore.getState().setDraftSaveProcessStatus(editorId, {
						status: 'completed',
						lastSaveTimestamp: new Date()
					});
					computeAndUpdateEditorStatus(editorId);
					options?.onComplete && options?.onComplete();

					editor.messagesStoreDispatch && editor.messagesStoreDispatch(saveDraftAsyncThunk(res));
				})
				.catch((err) => {
					useEditorsStore.getState().setDraftSaveProcessStatus(editorId, {
						status: 'aborted',
						abortReason: err
					});
					// FIXME use a subscription to the store update
					computeAndUpdateEditorStatus(editorId);
					handleError(err);
					options?.onError && options?.onError(err);
				});

			useEditorsStore.getState().setDraftSaveProcessStatus(editorId, {
				status: 'running'
			});
			// FIXME use a subscription to the store update
			computeAndUpdateEditorStatus(editorId);
		},
		[createSnackbar, t]
	);

	const delay = getDraftSaveDelay();
	return useMemo(
		() => ({
			debouncedSaveDraft: debounce(saveDraftFromEditor, delay),
			immediateSaveDraft: saveDraftFromEditor
		}),
		[delay, saveDraftFromEditor]
	);
};

/**
 * Returns the reactive status for the draft save operation.
 * If some change on the editor data will cause the ability/inability to
 * perform a draft save the status will be updated.
 *
 * The hook returns also the functions to invoke the draft save, a debounced version
 * and a normal version
 *
 * @param editorId
 */
export const useEditorDraftSave = (
	editorId: MailsEditorV2['id']
): {
	status: MailsEditorV2['draftSaveAllowedStatus'];
	saveDraft: () => void;
} => {
	const { immediateSaveDraft, debouncedSaveDraft } = useSaveDraftFromEditor();
	const status = useEditorsStore((state) => state.editors[editorId].draftSaveAllowedStatus);
	const immediateInvoker = useCallback((): void => {
		debouncedSaveDraft.cancel();
		immediateSaveDraft(editorId);
	}, [debouncedSaveDraft, editorId, immediateSaveDraft]);

	return useMemo(
		() => ({
			status,
			saveDraft: immediateInvoker
		}),
		[immediateInvoker, status]
	);
};

/**
 * Returns the reactive status of the draft save process
 * @param editorId
 */
export const useEditorDraftSaveProcessStatus = (
	editorId: MailsEditorV2['id']
): MailsEditorV2['draftSaveProcessStatus'] =>
	useEditorsStore((state) => state.editors[editorId].draftSaveProcessStatus);
