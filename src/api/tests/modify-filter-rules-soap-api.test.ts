import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	modifyFilterRulesSoapApi,
	modifyOutgoingFilterRulesSoapApi
} from 'api/modify-filter-rules-soap-api';

vi.mock('@zextras/carbonio-ui-soap-lib', () => ({
	legacySoapFetch: vi.fn()
}));

const mockResponse = { success: true };

describe('modifyFilterRulesSoapApi', () => {
	it('should call soapFetch with correct params', async () => {
		(legacySoapFetch as Mock).mockResolvedValueOnce({ json: async () => mockResponse });
		await modifyFilterRulesSoapApi([{ name: 'rule1' }]);
		expect(legacySoapFetch).toHaveBeenCalledWith('ModifyFilterRules', {
			filterRules: [{ filterRule: [{ name: 'rule1' }] }],
			_jsns: 'urn:zimbraMail'
		});
	});

	it('handles error during filter rule modification', async () => {
		(legacySoapFetch as Mock).mockRejectedValueOnce(new Error('Error'));
		await expect(modifyFilterRulesSoapApi([{ name: 'rule1' }])).rejects.toThrow('Error');
	});
});

describe('modifyOutgoingFilterRulesSoapApi', () => {
	it('should call soapFetch with correct params', async () => {
		(legacySoapFetch as Mock).mockResolvedValueOnce({ json: async () => mockResponse });
		await modifyOutgoingFilterRulesSoapApi([{ name: 'rule1' }]);
		expect(legacySoapFetch).toHaveBeenCalledWith('ModifyOutgoingFilterRules', {
			filterRules: [{ filterRule: [{ name: 'rule1' }] }],
			_jsns: 'urn:zimbraMail'
		});
	});

	it('handles error during outgoing filter rule modification', async () => {
		(legacySoapFetch as Mock).mockRejectedValueOnce(new Error('Error'));
		await expect(modifyOutgoingFilterRulesSoapApi([{ name: 'rule1' }])).rejects.toThrow('Error');
	});
});
