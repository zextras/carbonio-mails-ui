/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

import { deleteAttachmentsSoapApi } from 'api/delete-all-attachments-soap-api';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	soapFetch: jest.fn()
}));

describe('deleteAttachmentsSoapApi', () => {
	const mockResponse = { m: [{ id: '1', subject: 'Test Message' }] };
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call soapFetch with correct params ', async () => {
		(soapFetch as jest.Mock).mockResolvedValueOnce({ json: async () => mockResponse });
		await deleteAttachmentsSoapApi({ id: '123', attachments: ['att1', 'att2'] });
		expect(soapFetch).toHaveBeenCalledWith('RemoveAttachments', {
			_jsns: 'urn:zimbraMail',
			m: {
				id: '123',
				part: 'att1,att2'
			}
		});
	});

	it('handles error during attachment deletion', async () => {
		(soapFetch as jest.Mock).mockRejectedValueOnce(new Error('Error'));
		await expect(
			deleteAttachmentsSoapApi({ id: '123', attachments: ['att1', 'att2'] })
		).rejects.toThrow('Error');
	});
});
