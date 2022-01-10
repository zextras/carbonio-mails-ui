/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getBridgedFunctions } from '@zextras/zapp-shell';
import { Participant } from '../types/participant';
import { MAIL_APP_ID } from '../constants';

export const mailToSharedFunction: (contacts: Array<Partial<Participant>>) => void = (contacts) => {
	getBridgedFunctions().addBoard(`/new?action=mailTo`, {
		app: MAIL_APP_ID,
		contacts
	});
};

export const openComposerSharedFunction: (
	onConfirm: any,
	compositionData: any,
	...rest: any[]
) => void = (onConfirm, compositionData, ...rest) => {
	getBridgedFunctions().addBoard('/new?action=compose', {
		app: MAIL_APP_ID,
		onConfirm,
		compositionData,
		...rest
	});
};
