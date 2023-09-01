/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo, useCallback, useEffect } from 'react';

import {
	updateBoardContext,
	useBoard,
	useUserAccount,
	useUserSettings,
	closeBoard,
	t,
	useBoardHooks
} from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { EditView } from './edit-view-v2';
import { keepOrDiscardDraft } from './parts/delete-draft';
import { CLOSE_BOARD_REASON, EditViewActions } from '../../../../constants';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { useQueryParam } from '../../../../hooks/use-query-param';
import { getMsg } from '../../../../store/actions';
import { selectMessages } from '../../../../store/messages-slice';
import {
	addEditor,
	deleteEditor,
	useEditorDid,
	useEditorDraftSave,
	useEditorSubject
} from '../../../../store/zustand/editor';
import { generateEditor } from '../../../../store/zustand/editor/editor-generators';
import type {
	CloseBoardReasons,
	EditViewActionsType,
	EditViewBoardContext,
	MailMessage
} from '../../../../types';

const parseAndValidateParams = (
	action?: string,
	id?: string
): { action: EditViewActionsType; id: string | undefined } => {
	const resultAction = Object.values(EditViewActions).includes(action as EditViewActionsType)
		? (action as EditViewActionsType)
		: EditViewActions.NEW;

	const resultId = action === EditViewActions.NEW ? undefined : id;

	return { action: resultAction, id: resultId };
};

const MemoizedEditView = memo(EditView);

const EditViewController: FC = () => {
	const messagesStoreDispatch = useAppDispatch();
	const account = useUserAccount();
	const settings = useUserSettings();
	const board = useBoard<EditViewBoardContext>();
	const boardUtilities = useBoardHooks();
	const messages = useAppSelector(selectMessages);

	console.count('*** render controller');

	// TODO check why the useQueryParams triggers 2 renders
	let { action, id } = parseAndValidateParams(useQueryParam('action'), useQueryParam('id'));

	if (action === EditViewActions.REPLY && !!id && !messages?.[id]?.isComplete) {
		messagesStoreDispatch(getMsg({ msgId: id }));
	}

	// TODO do fancy stuff with it ;)
	const compositionData = board.context?.compositionData;

	/*
	 * If the current component is running inside a board
	 * its context is examined to get an existing editor id
	 * and to try to resume it. This will prevent the reset
	 * of the editor when the board re-renders.
	 *
	 * Otherwise a new editor is generated and added using
	 * the given parameters
	 */
	const existingEditorId = board.context?.editorId;
	if (existingEditorId) {
		action = EditViewActions.RESUME;
		id = existingEditorId;
	}

	let message;
	if (id) {
		message = messages?.[id] as MailMessage;
	}

	// Create or resume editor
	const editor = generateEditor({
		action,
		id,
		messagesStoreDispatch,
		account,
		settings,
		message,
		compositionData
	});
	if (!editor) {
		throw new Error('No editor provided');
	}

	if (action !== EditViewActions.RESUME) {
		addEditor({ id: editor.id, editor });
	}

	const draftId = useEditorDid(editor.id).did;
	const { saveDraft } = useEditorDraftSave(editor.id);
	const updateBoard = boardUtilities?.updateBoard;
	const onClose = useCallback(
		({ reason }: { reason?: CloseBoardReasons }) => {
			if (
				(reason === CLOSE_BOARD_REASON.SEND_LATER || reason === CLOSE_BOARD_REASON.SEND) &&
				editor.id
			) {
				updateBoard({
					onClose: noop
				});
			}
			closeBoard(board.id);
			updateBoard({
				onClose: () => {
					if (draftId && editor.id) {
						return keepOrDiscardDraft({
							onConfirm: () => saveDraft(),
							editorId: editor.id,
							draftId
						});
					}
					return deleteEditor({ id: editor.id });
				}
			});
		},
		[board.id, draftId, editor.id, saveDraft, updateBoard]
	);

	/*
	 * Store the editor id inside the board context (if existing)
	 * to retrieve the same editor if the board re-renders
	 */
	if (board && !board.context?.editorId) {
		updateBoardContext(board.id, { ...board.context, editorId: editor.id });
	}

	const { subject } = useEditorSubject(editor.id);
	if (subject && board?.title !== subject) {
		updateBoard({
			title: subject ?? t('messages,new_email', 'new email')
		});
	}

	/*
	 * Add an onClose function to delete the editor from the store
	 * when the board is closed
	 */
	useEffect(() => {
		if (board) {
			updateBoard({
				onClose: () => {
					if (draftId && editor.id) {
						return keepOrDiscardDraft({
							onConfirm: () => saveDraft(),
							editorId: editor.id,
							draftId
						});
					}
					return deleteEditor({ id: editor.id });
				}
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [draftId]);

	return <MemoizedEditView editorId={editor.id} closeController={onClose} />;
};
export default EditViewController;
