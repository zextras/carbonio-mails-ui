/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { addBoard, Board, getBoardById, setCurrentBoard } from '@zextras/carbonio-shell-ui';

import { MAILS_BOARD_VIEW_ID, EditViewActions } from 'constants/index';
import { EditorPrefillData, EditViewActionsType } from 'types/index.d';

export type EditViewBoardContext = {
	originAction: EditViewActionsType;
	originActionTargetId?: string;
	editorId?: string;
	compositionData?: EditorPrefillData;
	onConfirm?: (param: { editor: { text: [string, string] }; onBoardClose: () => void }) => void;
};

type CreateEditBoardParams = {
	action: EditViewActionsType;
	actionTargetId?: string;
	title?: string;
	compositionData?: EditorPrefillData;
	onConfirm?: () => void;
};

/**
 * Generate a consistent board ID for draft editing
 */
const generateBoardId = (action: EditViewActionsType, actionTargetId?: string): string => {
	if (action === EditViewActions.EDIT_AS_DRAFT && actionTargetId) {
		return `${MAILS_BOARD_VIEW_ID}-edit-draft-${actionTargetId}`;
	}
	return `${MAILS_BOARD_VIEW_ID}-${action}-${actionTargetId || Date.now()}`;
};

export const createEditBoard = ({
	action,
	actionTargetId,
	compositionData,
	onConfirm,
	title = ''
}: CreateEditBoardParams): Board => {
	const isDraftEdit = action === EditViewActions.EDIT_AS_DRAFT && actionTargetId;
	const boardId = isDraftEdit ? generateBoardId(action, actionTargetId) : undefined;

	if (isDraftEdit) {
		const existingBoard = boardId ? getBoardById(boardId) : undefined;
		if (existingBoard) {
			setCurrentBoard(existingBoard.id);
			return existingBoard;
		}
	}

	return addBoard<EditViewBoardContext>({
		boardViewId: MAILS_BOARD_VIEW_ID,
		title,
		id: boardId,
		context: {
			originAction: action,
			originActionTargetId: actionTargetId,
			onConfirm,
			compositionData
		}
	});
};
