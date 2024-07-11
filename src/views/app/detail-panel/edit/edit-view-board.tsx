/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { addBoard, Board } from '@zextras/carbonio-shell-ui';

import { MAILS_BOARD_VIEW_ID } from '../../../../constants';
import { EditorPrefillData, EditViewActionsType } from '../../../../types';

export type EditViewBoardContext = {
	originAction: EditViewActionsType;
	originActionTargetId?: string;
	editorId?: string;
	compositionData?: EditorPrefillData;
	onConfirm?: (param: { editor: { text: [string, string] }; onBoardClose: () => void }) => void;
};

export type BoardContext = {
	action: EditViewActionsType;
	id?: string;
};

type CreateEditBoardParams = {
	action: EditViewActionsType;
	actionTargetId?: string;
	title?: string;
	compositionData?: EditorPrefillData;
	onConfirm?: () => void;
};

export const createEditBoard = ({
	action,
	actionTargetId,
	compositionData,
	onConfirm,
	title = ''
}: CreateEditBoardParams): Board =>
	addBoard<EditViewBoardContext>({
		boardViewId: MAILS_BOARD_VIEW_ID,
		title,
		context: {
			originAction: action,
			originActionTargetId: actionTargetId,
			onConfirm,
			compositionData
		}
	});
