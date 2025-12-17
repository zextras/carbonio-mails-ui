/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createEditBoard } from '../views/editor/edit-view-board';
import { EditViewActions } from 'constants/index';
import { EditorPrefillData } from 'types/index.d';
import type { Participant } from 'types/index.d';

export const mailToSharedFunction: (recipients: Array<Participant>, subject?: string) => void = (
	recipients,
	subject
) => {
	createEditBoard({
		action: EditViewActions.MAIL_TO,
		compositionData: {
			recipients,
			subject
		}
	});
};

export const openComposerSharedFunction: (
	onConfirm: () => void,
	compositionData: EditorPrefillData,
	...rest: never[]
) => void = (onConfirm, compositionData, ...rest) => {
	createEditBoard({
		action: EditViewActions.COMPOSE,
		onConfirm,
		compositionData
	});
};

// function used to open a new mail editor board with prefilled fields set by other modules
export const openPrefilledComposerSharedFunction: (
	editorPrefillData?: EditorPrefillData,
	...rest: never[]
) => void = (editorPrefillData, ...rest) => {
	createEditBoard({
		action: EditViewActions.PREFILL_COMPOSE,
		compositionData: editorPrefillData
	});
};
