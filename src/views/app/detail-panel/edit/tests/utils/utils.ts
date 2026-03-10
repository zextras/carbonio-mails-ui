/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { SaveDraftRequest, SaveDraftResponse } from 'types/soap/save-draft';
import { SoapMailMessage } from 'types/soap/soap-mail-message';

export function aSuccessfullSaveDraft(): Promise<SaveDraftRequest> {
	const msg: SoapMailMessage = {
		cid: '',
		d: 0,
		e: [],
		fr: '',
		id: '123-testId',
		l: '',
		mp: [],
		s: 0,
		su: ''
	};
	const response: SaveDraftResponse = {
		m: [msg]
	};
	return createSoapAPIInterceptor<SaveDraftRequest, SaveDraftResponse>('SaveDraft', response);
}

export function aFailingSaveDraft(): Promise<SaveDraftRequest> {
	return createSoapAPIInterceptor<SaveDraftRequest, SaveDraftResponse>('SaveDraft', {
		Fault: {
			Reason: { Text: 'Failed to save draft' },
			Detail: {
				Error: { Code: '123', Detail: 'Failed due to connection timeout' }
			}
		}
	});
}
