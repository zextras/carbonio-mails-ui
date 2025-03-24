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

/**
 * Sends a draft email using its draft ID.
 *
 * This function triggers the `SendMsg` API request with the draft ID (`did`).
 *
 * @param {Object} params - The draft details.
 * @param {string} params.did - The draft ID of the message to be sent.
 * @param {string} [params.account] - (Optional) The account associated with the draft, if applicable.
 * @returns {Promise<SendMsgResponse | ErrorSoapBodyResponse>}
 * A promise resolving to the `SendMsgResponse` on success or an `ErrorSoapBodyResponse` if the request fails.
 *
 * @example
 * // Sending a draft with ID "12345"
 * sendDraft({ did: '12345' })
 *   .then(response => console.log('Draft sent successfully', response))
 *   .catch(error => console.error('Failed to send draft', error));
 */
export const sendDraft = async (params: {
	did: string;
	account?: string;
}): Promise<SaveDraftResponse | ErrorSoapBodyResponse> =>
	soapFetch<SendDraftRequest, SaveDraftResponse>(
		'SendMsg',
		{
			_jsns: JSNS.MAIL,
			m: { did: params.did, sfd: 1 }
		},
		params.account
	);
