import type { Mock } from 'vitest';

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { deleteAttachmentsSoapApi } from 'api/delete-all-attachments-soap-api';
import { deleteAttachmentsEmailStoreAction } from 'store/emails/actions/delete-attachments-action';
import { handleDeleteAttachments } from 'store/emails/store';

vi.mock('../../../../api/delete-all-attachments-soap-api');
vi.mock('../../store');

describe('deleteAttachmentsEmailStoreAction', () => {
	const mockResponse = { success: true };

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('handles successful attachment deletion', async () => {
		(deleteAttachmentsSoapApi as Mock).mockResolvedValueOnce(mockResponse);
		const result = await deleteAttachmentsEmailStoreAction({
			id: '123',
			attachments: ['att1', 'att2']
		});
		expect(deleteAttachmentsSoapApi).toHaveBeenCalledWith({
			id: '123',
			attachments: ['att1', 'att2']
		});
		expect(handleDeleteAttachments).toHaveBeenCalledWith(mockResponse);
		expect(result).toEqual(mockResponse);
	});

	it('handles error during attachment deletion', async () => {
		const error = new Error('Error');
		(deleteAttachmentsSoapApi as Mock).mockRejectedValueOnce(error);
		await expect(
			deleteAttachmentsEmailStoreAction({ id: '123', attachments: ['att1', 'att2'] })
		).rejects.toThrow('Error');
		expect(deleteAttachmentsSoapApi).toHaveBeenCalledWith({
			id: '123',
			attachments: ['att1', 'att2']
		});
		expect(handleDeleteAttachments).not.toHaveBeenCalled();
	});

	// there is no early error handling in the function when attachments is empty, so we get & assert undefined
	// just to document the code
	it('handles empty attachments array', async () => {
		const result = await deleteAttachmentsEmailStoreAction({ id: '123', attachments: [] });
		expect(deleteAttachmentsSoapApi).toHaveBeenCalledWith({ id: '123', attachments: [] });
		expect(handleDeleteAttachments).toHaveBeenCalledWith(undefined);
		expect(result).toEqual(undefined);
	});

	it('handles null response from API', async () => {
		(deleteAttachmentsSoapApi as Mock).mockResolvedValueOnce(null);
		const result = await deleteAttachmentsEmailStoreAction({
			id: '123',
			attachments: ['att1', 'att2']
		});
		expect(deleteAttachmentsSoapApi).toHaveBeenCalledWith({
			id: '123',
			attachments: ['att1', 'att2']
		});
		expect(handleDeleteAttachments).toHaveBeenCalledWith(null);
		expect(result).toBeNull();
	});
});
