/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Mock } from 'vitest';

import * as saveSettingsModule from 'views/settings/save-settings';
import { saveSignatures } from 'views/settings/save-signatures';

const newSignature = { id: 'temporary-id', name: 'new', label: 'new', description: 'text' };

const mockBatchResponse = (batchResponse: unknown): void => {
	(global.fetch as Mock).mockResolvedValueOnce({
		json: async () => ({ Body: { BatchResponse: batchResponse } })
	});
};

describe('saveSignatures', () => {
	beforeEach(() => {
		global.fetch = vi.fn();
	});

	it('saves the default signature pref with the id of the signature created in the same save', async () => {
		const saveSettingsSpy = vi
			.spyOn(saveSettingsModule, 'saveSettings')
			.mockResolvedValue({} as never);
		mockBatchResponse({
			CreateSignatureResponse: [{ signature: [{ id: 'real-id', name: 'new' }] }]
		});

		const prefsSaved = await saveSignatures({
			itemsAdd: [newSignature],
			itemsEdit: [],
			itemsDelete: [],
			account: { name: 'user@example.com' },
			pendingPrefs: { zimbraPrefDefaultSignatureId: 'temporary-id' }
		});

		expect(prefsSaved).toBe(true);
		expect(saveSettingsSpy).toHaveBeenCalledWith({
			prefs: { zimbraPrefDefaultSignatureId: 'real-id' }
		});
	});

	it('saves no prefs when none points to a new signature', async () => {
		const saveSettingsSpy = vi.spyOn(saveSettingsModule, 'saveSettings');
		mockBatchResponse({});

		const prefsSaved = await saveSignatures({
			itemsAdd: [newSignature],
			itemsEdit: [],
			itemsDelete: [],
			account: { name: 'user@example.com' },
			pendingPrefs: { zimbraPrefDefaultSignatureId: '', zimbraPrefForwardReplySignatureId: 'other' }
		});

		expect(prefsSaved).toBe(false);
		expect(saveSettingsSpy).not.toHaveBeenCalled();
	});

	it('rejects when the signatures batch has a fault', async () => {
		mockBatchResponse({ Fault: [{ Reason: { Text: 'invalid signature' } }] });

		await expect(
			saveSignatures({
				itemsAdd: [newSignature],
				itemsEdit: [],
				itemsDelete: [],
				account: { name: 'user@example.com' },
				pendingPrefs: { zimbraPrefDefaultSignatureId: 'temporary-id' }
			})
		).rejects.toThrow('invalid signature');
	});
});
