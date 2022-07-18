/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { addBoard } from '@zextras/carbonio-shell-ui';
import { isNil, omit, omitBy } from 'lodash';
import { Participant } from '../types';
import { MAILS_ROUTE } from '../constants';
import { ActionsType } from '../commons/utils';

export const mailToSharedFunction: (contacts: Array<Partial<Participant>>) => void = (contacts) => {
	addBoard({
		url: `${MAILS_ROUTE}/new?action=mailTo`,
		context: {
			contacts
		}
	});
};

export const openComposerSharedFunction: (
	onConfirm: any,
	compositionData: any,
	...rest: any[]
) => void = (onConfirm, compositionData, ...rest) => {
	addBoard({
		url: `${MAILS_ROUTE}/new?action=compose`,
		context: {
			onConfirm,
			compositionData,
			...rest
		}
	});
};

type prefilledEditor = {
	aid?: Array<string>;
	subject?: string;
	urgent?: boolean;
};

// function used to open a new mail editor board with prefilled fields set by other modules
export const openPrefilledComposerSharedFunction: (
	compositionData?: prefilledEditor,
	...rest: never[]
) => void = (compositionData, ...rest) => {
	// removing values from item which needs normalization
	const normalizedValues = omit(compositionData, ['aid']);

	// normalize values
	const attach =
		compositionData?.aid && compositionData?.aid?.length > 0
			? { aid: compositionData.aid.join(',') }
			: undefined;

	// removing nil values
	const editor = omitBy({ ...normalizedValues, attach }, isNil);

	// add board with custom editor
	addBoard({
		url: `${MAILS_ROUTE}/new?action=${ActionsType.PREFILL_COMPOSE}`,
		context: {
			compositionData: editor,
			...rest
		}
	});
};
