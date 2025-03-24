/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapBodyResponse, soapFetch } from '@zextras/carbonio-shell-ui';

import { SaveDraftResponse } from '../types';

export type SendDraftRequest = {
	_jsns: 'urn:zimbraMail';
	m: { did: string; sfd: number };
	account?: string;
};

export const sendDraft = async (draft: {
	did: string;
	account?: string;
}): Promise<SaveDraftResponse | ErrorSoapBodyResponse> =>
	soapFetch<SendDraftRequest, SaveDraftResponse>(
		'SendMsg',
		{
			_jsns: 'urn:zimbraMail',
			m: { did: draft.did, sfd: 1 }
		},
		draft.account
	);
