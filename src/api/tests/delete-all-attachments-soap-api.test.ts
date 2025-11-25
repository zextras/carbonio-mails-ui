/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { deleteAttachmentsSoapApi } from 'api/delete-all-attachments-soap-api';

jest.mock('@zextras/carbonio-ui-soap-lib', () => ({
	legacySoapFetch: vi.fn()
}));

describe('deleteAttachmentsSoapApi', () => {
	it('should call soapFetch with correct params ', async () => {
		const mockResponse = { m: [{ id: '1', subject: 'Test Message' }] };
		(legacySoapFetch as Mock).mockResolvedValueOnce({ json: async () => mockResponse });
		deleteAttachmentsSoapApi({ id: '123', attachments: ['att1', 'att2'] });
		expect(legacySoapFetch).toHaveBeenCalledWith('RemoveAttachments', {
			_jsns: 'urn:zimbraMail',
			m: {
				id: '123',
				part: 'att1,att2'
			}
		});
	});

	it('handles error during attachment deletion', async () => {
		(legacySoapFetch as Mock).mockRejectedValueOnce(new Error('Error'));
		await expect(deleteAttachmentsSoapApi({ id: '123', attachments: ['att1'] })).rejects.toThrow(
			'Error'
		);
	});
});
