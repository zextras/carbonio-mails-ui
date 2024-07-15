/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EditViewActions } from '../constants';
import { EditorPrefillData } from '../types';
import type { Participant } from '../types';
import { createEditBoard } from '../views/app/detail-panel/edit/edit-view-board';

export const mailToSharedFunction: (contacts: Array<Partial<Participant>>) => void = (contacts) => {
	createEditBoard({
		action: EditViewActions.MAIL_TO,
		compositionData: {
			recipients: contacts
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
