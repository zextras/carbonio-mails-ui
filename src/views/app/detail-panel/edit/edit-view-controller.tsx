/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { Button, Container } from '@zextras/carbonio-design-system';
import {
	updateBoardContext,
	closeBoard,
	t,
	useBoard,
	useBoardHooks
} from '@zextras/carbonio-shell-ui';
import { includes, noop } from 'lodash';

import { EditView, EditViewHandle } from './edit-view';
import { EditViewBoardContext } from './edit-view-board';
import { EditViewActions } from '../../../../constants';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { getMsgAsyncThunk } from '../../../../store/actions';
import { selectMessage } from '../../../../store/messages-slice';
import { addEditor, useEditorSubject } from '../../../../store/zustand/editor';
import { generateEditor } from '../../../../store/zustand/editor/editor-generators';
import type { EditViewActionsType, MailMessage } from '../../../../types';

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

const isActionRequiringMessage = (action: EditViewActionsType): boolean =>
	includes(
		[
			EditViewActions.REPLY,
			EditViewActions.REPLY_ALL,
			EditViewActions.FORWARD,
			EditViewActions.EDIT_AS_NEW,
			EditViewActions.EDIT_AS_DRAFT
		],
		action
	);

type EditViewControllerCoreProps = {
	action: EditViewActionsType;
	entityId?: string;
	message?: MailMessage;
};

const MemoizedEditView = memo(EditView);

const EditViewControllerCore: FC<EditViewControllerCoreProps> = ({ action, entityId, message }) => {
	const messagesStoreDispatch = useAppDispatch();
	const board = useBoard<EditViewBoardContext>();
	const boardUtilities = useBoardHooks();
	const editViewRef = useRef<EditViewHandle>(null);
	const isCloseRequestFromEditor = useRef<boolean>(false);

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
		entityId = existingEditorId;
	}

	// Create or resume editor
	const compositionData = board.context?.compositionData;
	const editor = generateEditor({
		action,
		id: entityId,
		messagesStoreDispatch,
		message,
		compositionData
	});
	if (!editor) {
		throw new Error('No editor provided');
	}

	if (action !== EditViewActions.RESUME) {
		addEditor({ id: editor.id, editor });
	}

	const updateBoard = useMemo(() => boardUtilities?.updateBoard, [boardUtilities?.updateBoard]);

	// Set the onClose callback for the board
	useEffect(() => {
		updateBoard({
			onClose: () => {
				/*
				 * If the close is requested by the editor there is nothing to do.
				 * Otherwise the closeEditView handle is invoked to inform the editor
				 * about the close event
				 */
				if (isCloseRequestFromEditor.current) {
					return;
				}

				// Reset the flag
				isCloseRequestFromEditor.current = false;

				// Request the editor to close itself
				editViewRef?.current?.closeEditView && editViewRef.current.closeEditView();
			}
		});
	}, [updateBoard]);

	const closeController = useCallback(() => {
		// Flag the closing request as coming from the editor
		isCloseRequestFromEditor.current = true;
		closeBoard(board.id);
	}, [board.id]);

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

	return (
		<MemoizedEditView editorId={editor.id} ref={editViewRef} closeController={closeController} />
	);
};

const MemoizedEditViewControllerCore = memo(EditViewControllerCore);

/**
 * Get and parse the parameters. Get the original message if it is needed
 * @constructor
 */
const EditViewController: FC = () => {
	const messagesStoreDispatch = useAppDispatch();

	const boardContext = useBoard<EditViewBoardContext>().context;
	const { action, id } = parseAndValidateParams(
		boardContext?.originAction,
		boardContext?.originActionTargetId
	);

	const isMessageRequired = useMemo<boolean>(
		(): boolean => isActionRequiringMessage(action) && !!id,
		[action, id]
	);

	const message = useAppSelector((state) =>
		isMessageRequired && id ? selectMessage(state, id) : undefined
	);

	const isMessageLoadingRequired = useMemo<boolean>(
		(): boolean => isMessageRequired && !message?.isComplete,
		[isMessageRequired, message?.isComplete]
	);

	/**
	 * Load the original message if it's required and is not
	 * in the store or is not complete
	 */
	useEffect(() => {
		if (isMessageLoadingRequired && !!id) {
			messagesStoreDispatch(getMsgAsyncThunk({ msgId: id }));
		}
	}, [id, isMessageLoadingRequired, messagesStoreDispatch]);

	return isMessageLoadingRequired ? (
		<Container>
			<Button loading disabled label="" type="ghost" onClick={noop} />
		</Container>
	) : (
		<MemoizedEditViewControllerCore entityId={id} action={action} message={message} />
	);
};
export default EditViewController;
