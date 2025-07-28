/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import {
	modifyFilterRulesSoapApi,
	modifyOutgoingFilterRulesSoapApi
} from 'api/modify-filter-rules-soap-api';

jest.mock('@zextras/carbonio-ui-soap-lib', () => ({
	legacySoapFetch: jest.fn()
}));

const mockResponse = { success: true };

describe('modifyFilterRulesSoapApi', () => {
	it('should call soapFetch with correct params', async () => {
		(legacySoapFetch as jest.Mock).mockResolvedValueOnce({ json: async () => mockResponse });
		await modifyFilterRulesSoapApi([{ name: 'rule1' }]);
		expect(legacySoapFetch).toHaveBeenCalledWith('ModifyFilterRules', {
			filterRules: [{ filterRule: [{ name: 'rule1' }] }],
			_jsns: 'urn:zimbraMail'
		});
	});

	it('handles error during filter rule modification', async () => {
		(legacySoapFetch as jest.Mock).mockRejectedValueOnce(new Error('Error'));
		await expect(modifyFilterRulesSoapApi([{ name: 'rule1' }])).rejects.toThrow('Error');
	});
});

describe('modifyOutgoingFilterRulesSoapApi', () => {
	it('should call soapFetch with correct params', async () => {
		(legacySoapFetch as jest.Mock).mockResolvedValueOnce({ json: async () => mockResponse });
		await modifyOutgoingFilterRulesSoapApi([{ name: 'rule1' }]);
		expect(legacySoapFetch).toHaveBeenCalledWith('ModifyOutgoingFilterRules', {
			filterRules: [{ filterRule: [{ name: 'rule1' }] }],
			_jsns: 'urn:zimbraMail'
		});
	});

	it('handles error during outgoing filter rule modification', async () => {
		(legacySoapFetch as jest.Mock).mockRejectedValueOnce(new Error('Error'));
		await expect(modifyOutgoingFilterRulesSoapApi([{ name: 'rule1' }])).rejects.toThrow('Error');
	});
});
