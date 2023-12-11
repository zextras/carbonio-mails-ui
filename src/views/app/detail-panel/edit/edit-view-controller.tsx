/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo, useCallback, useEffect, useMemo } from 'react';

import { Button, Container } from '@zextras/carbonio-design-system';
import {
	updateBoardContext,
	closeBoard,
	t,
	useBoard,
	useBoardHooks
} from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { EditView } from './edit-view';
import { useKeepOrDiscardDraft } from './parts/delete-draft';
import { CLOSE_BOARD_REASON, EditViewActions } from '../../../../constants';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { useQueryParam } from '../../../../hooks/use-query-param';
import { getMsg } from '../../../../store/actions';
import { selectMessage } from '../../../../store/messages-slice';
import {
	addEditor,
	deleteEditor,
	useEditorDid,
	useEditorDraftSave,
	useEditorSubject
} from '../../../../store/zustand/editor';
import { generateEditor } from '../../../../store/zustand/editor/editor-generators';
import { EditViewBoardContext } from '../../../../types';
import type { CloseBoardReasons, EditViewActionsType, MailMessage } from '../../../../types';

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
	[
		EditViewActions.REPLY,
		EditViewActions.REPLY_ALL,
		EditViewActions.FORWARD,
		EditViewActions.EDIT_AS_NEW,
		EditViewActions.EDIT_AS_DRAFT
	].includes(action);

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

	const onMessageSent = useCallback(() => {
		const callback = board.context?.onConfirm;
		if (!callback) {
			return;
		}
		callback &&
			callback({
				editor: { text: [editor.text.plainText, editor.text.richText] },
				onBoardClose: noop
			});
	}, [board.context?.onConfirm, editor.text.plainText, editor.text.richText]);

	const draftId = useEditorDid(editor.id).did;
	const { saveDraft } = useEditorDraftSave(editor.id);
	const updateBoard = boardUtilities?.updateBoard;
	const keepOrDiscardDraft = useKeepOrDiscardDraft();
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
		[board.id, draftId, editor.id, keepOrDiscardDraft, saveDraft, updateBoard]
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

	return (
		<MemoizedEditView
			editorId={editor.id}
			closeController={onClose}
			onMessageSent={onMessageSent}
		/>
	);
};

const MemoizedEditViewControllerCore = memo(EditViewControllerCore);

/**
 * Get and parse the parameters. Get the original message if it is needed
 * @constructor
 */
const EditViewController: FC = () => {
	const messagesStoreDispatch = useAppDispatch();

	// TODO check why the useQueryParams triggers 2 renders
	const { action, id } = parseAndValidateParams(useQueryParam('action'), useQueryParam('id'));

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
			messagesStoreDispatch(getMsg({ msgId: id }));
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
