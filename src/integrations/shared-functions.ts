/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { addBoard } from '@zextras/carbonio-shell-ui';

import { EditViewActions, MAILS_ROUTE } from '../constants';
import { EditorPrefillData } from '../types';
import type { Participant } from '../types';

export const mailToSharedFunction: (contacts: Array<Partial<Participant>>) => void = (contacts) => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	addBoard({
		url: `${MAILS_ROUTE}/new?action=mailTo`,
		context: {
			compositionData: {
				recipients: contacts
			}
		}
	});
};

export const openComposerSharedFunction: (
	onConfirm: any,
	compositionData: EditorPrefillData,
	...rest: any[]
) => void = (onConfirm, compositionData, ...rest) => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	addBoard({
		url: `${MAILS_ROUTE}/new?action=compose`,
		context: {
			onConfirm,
			compositionData,
			...rest
		}
	});
};

// function used to open a new mail editor board with prefilled fields set by other modules
export const openPrefilledComposerSharedFunction: (
	editorPrefillData?: EditorPrefillData,
	...rest: never[]
) => void = (editorPrefillData, ...rest) => {
	// // removing values from item which needs normalization
	// const normalizedValues = omit(editorPrefillData, ['aid']);
	//
	// // normalize values
	// const attach =
	// 	editorPrefillData?.aid && editorPrefillData?.aid?.length > 0
	// 		? { aid: editorPrefillData.aid.join(',') }
	// 		: undefined;
	//
	// // removing nil values
	// const editor = omitBy({ ...normalizedValues, attach }, isNil);

	// add board with custom editor
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	addBoard({
		url: `${MAILS_ROUTE}/new?action=${EditViewActions.PREFILL_COMPOSE}`,
		context: {
			compositionData: editorPrefillData,
			...rest
		}
	});
};
