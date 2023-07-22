/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo, useCallback } from 'react';

import {
	updateBoardContext,
	useBoard,
	useUserAccount,
	useUserSettings,
	closeBoard,
	t,
	useBoardHooks
} from '@zextras/carbonio-shell-ui';

import { EditView } from './edit-view-v2';
import { EditViewActions, EditViewActionsType } from '../../../../constants';
import { useAppDispatch } from '../../../../hooks/redux';
import { useQueryParam } from '../../../../hooks/use-query-param';
import { addEditor, useEditorSubject } from '../../../../store/zustand/editor';
import { generateEditor } from '../../../../store/zustand/editor/editor-generators';
import { EditViewBoardContext } from '../../../../types';

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

const EditViewController: FC = (x) => {
	const messagesStoreDispatch = useAppDispatch();
	const account = useUserAccount();
	const settings = useUserSettings();
	const board = useBoard<EditViewBoardContext>();
	const boardUtilities = useBoardHooks();

	const onClose = useCallback(() => {
		closeBoard(board.id);
	}, [board.id]);

	// TODO check why the useQueryParams triggers 2 renders
	let { action, id } = parseAndValidateParams(useQueryParam('action'), useQueryParam('id'));

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

	// Create or resume editor
	const editor = generateEditor({
		action,
		id,
		messagesStoreDispatch,
		account,
		settings
	});
	if (!editor) {
		throw new Error('No editor provided');
	}

	if (action !== EditViewActions.RESUME) {
		addEditor({ id: editor.id, editor });
	}

	/*
	 * Store the editor id inside the board context (if existing)
	 * to retrieve the same editor if the board re-renders
	 */
	if (board && !board.context?.editorId) {
		updateBoardContext(board.id, { ...board.context, editorId: editor.id });
	}

	const { subject } = useEditorSubject(editor.id);
	if (subject && board?.title !== subject) {
		boardUtilities?.updateBoard({
			title: subject ?? t('messages,new_email', 'new email')
		});
	}

	return <MemoizedEditView editorId={editor.id} closeController={onClose} />;
};
export default EditViewController;
