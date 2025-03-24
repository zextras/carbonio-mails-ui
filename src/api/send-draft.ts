/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapBodyResponse, soapFetch } from '@zextras/carbonio-shell-ui';

import { JSNS } from '../carbonio-ui-commons/constants';
import { SaveDraftResponse } from '../types';

export type SendDraftRequest = {
	_jsns: JSNS.MAIL;
	m: { did: string; sfd: 1 };
	account?: string;
};

export const sendDraft = async (draft: {
	did: string;
	account?: string;
}): Promise<SaveDraftResponse | ErrorSoapBodyResponse> =>
	soapFetch<SendDraftRequest, SaveDraftResponse>(
		'SendMsg',
		{
			_jsns: JSNS.MAIL,
			m: { did: draft.did, sfd: 1 }
		},
		draft.account
	);
