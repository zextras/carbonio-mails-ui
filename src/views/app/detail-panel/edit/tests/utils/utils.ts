/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSoapAPIInterceptor } from '../../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { SaveDraftRequest, SaveDraftResponse, SoapMailMessage } from '../../../../../../types';

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
