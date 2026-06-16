/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { addBoard, Board, getBoardById, setCurrentBoard } from '@zextras/carbonio-shell-ui';

import { MAILS_BOARD_VIEW_ID, EditViewActions } from 'constants/index';
import { EditorPrefillData, EditViewActionsType } from 'types/editor';

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
 * Get draft board ID based on action and target ID
 *
 * @param action
 * @param actionTargetId
 */
const getDraftBoardId = (
	action: EditViewActionsType,
	actionTargetId?: string
): string | undefined => {
	if (action === EditViewActions.EDIT_AS_DRAFT && actionTargetId) {
		return `${MAILS_BOARD_VIEW_ID}-edit-draft-${actionTargetId}`;
	}
	return undefined;
};

export const createEditBoard = ({
	action,
	actionTargetId,
	compositionData,
	onConfirm,
	title = ''
}: CreateEditBoardParams): Board => {
	const draftBoardId = getDraftBoardId(action, actionTargetId);

	if (draftBoardId) {
		const existingBoard = getBoardById(draftBoardId);
		if (existingBoard) {
			setCurrentBoard(existingBoard.id);
			return existingBoard;
		}
	}

	return addBoard<EditViewBoardContext>({
		boardViewId: MAILS_BOARD_VIEW_ID,
		title,
		id: draftBoardId,
		context: {
			originAction: action,
			originActionTargetId: actionTargetId,
			onConfirm,
			compositionData
		}
	});
};
