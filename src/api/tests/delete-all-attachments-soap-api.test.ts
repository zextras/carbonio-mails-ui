/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { deleteAttachmentsSoapApi } from 'api/delete-all-attachments-soap-api';

describe('deleteAttachmentsSoapApi', () => {
	it('should call soapFetch with correct params ', async () => {
		const apiInterceptor = createSoapAPIInterceptor('RemoveAttachments', {
			m: [{ id: '1', subject: 'Test Message' }]
		});
		await deleteAttachmentsSoapApi({ id: '123', attachments: ['att1', 'att2'] });
		const request = await apiInterceptor;
		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			m: {
				id: '123',
				part: 'att1,att2'
			}
		});
	});

	// FIXME: This test is all wrong. If api throws the code does not catch errors, so test is invalid
	it.skip('handles error during attachment deletion', async () => {
		// createAPIInterceptor('post', '/service/soap/RemoveAttachmentsRequest', HttpResponse.error());
		createSoapAPIInterceptor('RemoveAttachments', { Fault: {} });
		await expect(deleteAttachmentsSoapApi({ id: '123', attachments: ['att1'] })).rejects.toThrow(
			'Error'
		);
	});
});
