/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Mock } from 'vitest';

import { getCreatedSignatureId, signatureRequest } from 'api/get-signatures-soap-api';

describe('signatureRequest', () => {
	beforeEach(() => {
		globalThis.fetch = vi.fn();
	});

	it('throws the reason of the fault of the batch', async () => {
		(globalThis.fetch as Mock).mockResolvedValueOnce({
			json: async () => ({
				Body: { BatchResponse: { Fault: [{ Reason: { Text: 'signature name already exists' } }] } }
			})
		});

		await expect(
			signatureRequest({
				itemsAdd: [{ label: 'new', description: 'text' }],
				account: { name: 'user@example.com' }
			})
		).rejects.toThrow('signature name already exists');
	});
});

describe('getCreatedSignatureId', () => {
	it('returns the id of the created signature with that name, from any create response', () => {
		const response = {
			Body: {
				BatchResponse: {
					CreateSignatureResponse: [
						{ signature: [{ id: 'id-1', name: 'first' }] },
						{ signature: [{ id: 'id-2', name: 'second' }] }
					]
				}
			}
		};

		expect(getCreatedSignatureId(response, 'second')).toBe('id-2');
		expect(getCreatedSignatureId(response, 'missing')).toBeUndefined();
		expect(getCreatedSignatureId({ Body: { BatchResponse: {} } }, 'second')).toBeUndefined();
	});
});
