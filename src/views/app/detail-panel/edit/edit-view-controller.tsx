/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Container } from '@zextras/carbonio-design-system';
import {
	updateBoardContext,
	closeBoard,
	t,
	useBoard,
	useBoardHooks,
	getUserSettings
} from '@zextras/carbonio-shell-ui';
import { includes, noop } from 'lodash';

import { getMsgSoapApi } from '../../../../api/get-msg-soap-api';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { generateEditor, resumeEditor } from '../../../../store/editor/editor-generators';
import { getFullMessageEmailStoreAction } from '../../../../store/emails/actions/get-message';
import { useMessageById } from '../../../../store/emails/store';
import { EditViewActions } from 'constants/index';
import { addEditor, useEditorSubject } from 'store/editor/index';
import { EditViewActionsType, MailsEditorV2 } from 'types/editor';
import { MailMessage } from 'types/messages';
import { EditView, EditViewHandle } from 'views/app/detail-panel/edit/edit-view';
import { EditViewBoardContext } from 'views/app/detail-panel/edit/edit-view-board';

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
			EditViewActions.FORWARD_AS_ATTACHMENT,
			EditViewActions.EDIT_AS_NEW,
			EditViewActions.EDIT_AS_DRAFT
		],
		action
	);

type EditViewControllerCoreProps = {
	action: EditViewActionsType;
	entityId?: string;
	// message?: MailMessage;
	editor: MailsEditorV2;
};

const MemoizedEditView = memo(EditView);

const EditViewControllerCore: FC<EditViewControllerCoreProps> = ({ editor }) => {
	const board = useBoard<EditViewBoardContext>();
	const boardUtilities = useBoardHooks();
	const editViewRef = useRef<EditViewHandle>(null);
	const isCloseRequestFromEditor = useRef<boolean>(false);

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
const EditViewController = (): React.JSX.Element => {
	const boardContext = useBoard<EditViewBoardContext>().context;
	const [message, setMessage] = useState<MailMessage | undefined>();
	const { action, id } = parseAndValidateParams(
		boardContext?.originAction,
		boardContext?.originActionTargetId
	);

	const isMessageRequired = useMemo<boolean>(
		(): boolean => isActionRequiringMessage(action) && !!id,
		[action, id]
	);

	const isMessageLoadingRequired = useMemo<boolean>(
		(): boolean => isMessageRequired && !message,
		[isMessageRequired, message]
	);
	const storeMessage = useMessageById(id ?? '');
	/**
	 * Ensures the store message is loaded with the requested format.
	 * Uses the cached store message when complete and not truncated,
	 * otherwise retrieves it from the SOAP API.
	 */
	useEffect(() => {
		if (id && isMessageLoadingRequired) {
			const prefs = getUserSettings()?.prefs;
			const editAsHtml = prefs?.zimbraPrefComposeFormat === 'html';
			const displayAsHtml = prefs?.zimbraPrefMessageViewHtmlPreferred === 'TRUE';
			const canUseStoreMessage =
				storeMessage?.html === editAsHtml &&
				storeMessage?.isComplete &&
				!storeMessage?.body?.truncated;

			const canSaveMessageInStore = editAsHtml === displayAsHtml;
			if (canUseStoreMessage) {
				setMessage(storeMessage);
			} else if (canSaveMessageInStore) {
				getFullMessageEmailStoreAction(id, editAsHtml);
			} else {
				getMsgSoapApi({ msgId: id, html: editAsHtml }).then((response) => {
					if (response?.m?.[0]) {
						setMessage(
							normalizeMailMessageFromSoap({ m: response.m[0], html: editAsHtml, isComplete: true })
						);
					}
				});
			}
		}
	}, [id, isMessageLoadingRequired, storeMessage]);

	/*
	 * If the current component is running inside a board
	 * its context is examined to get an existing editor id
	 * and to try to resume it. This will prevent the reset
	 * of the editor when the board re-renders.
	 *
	 * Otherwise a new editor is generated and added using
	 * the given parameters
	 */
	const existingEditorId = boardContext?.editorId;
	const compositionData = boardContext?.compositionData;

	// Create or resume editor
	const editor = useMemo(() => {
		if (existingEditorId) {
			return resumeEditor(existingEditorId);
		}

		if (action === EditViewActions.RESUME && id) {
			return resumeEditor(id);
		}

		if (isMessageLoadingRequired) {
			return null;
		}

		const generatedEditor = generateEditor({
			action,
			id,
			message,
			compositionData
		});
		if (generatedEditor) {
			addEditor({ id: generatedEditor.id, editor: generatedEditor });
		}

		return generatedEditor;
	}, [action, compositionData, existingEditorId, id, isMessageLoadingRequired, message]);

	return editor ? (
		<MemoizedEditViewControllerCore entityId={id} action={action} editor={editor} />
	) : (
		<Container data-testid={'EditViewControllerLoader'}>
			<Button loading disabled label="" type="ghost" onClick={noop} />
		</Container>
	);
};
export default EditViewController;
