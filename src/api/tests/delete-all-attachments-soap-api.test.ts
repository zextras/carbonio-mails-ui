/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import {
	deleteAttachmentsSoapApi,
	RemoveAttachmentsResponse
} from 'api/delete-all-attachments-soap-api';
import { createSoapAPIInterceptorWithError } from 'tests/generators/api';

describe('deleteAttachmentsSoapApi', () => {
	it('should call soapFetch with correct params ', async () => {
		const interceptor = createSoapAPIInterceptor<RemoveAttachmentsResponse>('RemoveAttachments');
		deleteAttachmentsSoapApi({ id: '123', attachments: ['att1', 'att2'] });
		const request = await interceptor;
		expect(request.m).toEqual({ id: '123', part: 'att1,att2' });
	});

	it('handles error during attachment deletion', async () => {
		const interceptor = createSoapAPIInterceptorWithError('RemoveAttachments', true);
		await deleteAttachmentsSoapApi({ id: '123', attachments: ['att1'] });
		expect(interceptor).rejects.toThrow();
	});
});
