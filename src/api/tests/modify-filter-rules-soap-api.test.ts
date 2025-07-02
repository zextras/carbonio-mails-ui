/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';

import {
	modifyFilterRulesSoapApi,
	modifyOutgoingFilterRulesSoapApi
} from 'api/modify-filter-rules-soap-api';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	soapFetch: jest.fn()
}));

describe('modifyFilterRulesSoapApi', () => {
	const mockResponse = { success: true };
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call soapFetch with correct params', async () => {
		(soapFetch as jest.Mock).mockResolvedValueOnce({ json: async () => mockResponse });
		await modifyFilterRulesSoapApi([{ name: 'rule1' }]);
		expect(soapFetch).toHaveBeenCalledWith('ModifyFilterRules', {
			filterRules: [{ filterRule: [{ name: 'rule1' }] }],
			_jsns: 'urn:zimbraMail'
		});
	});

	it('handles error during filter rule modification', async () => {
		(soapFetch as jest.Mock).mockRejectedValueOnce(new Error('Error'));
		await expect(modifyFilterRulesSoapApi([{ name: 'rule1' }])).rejects.toThrow('Error');
	});
});

describe('modifyOutgoingFilterRulesSoapApi', () => {
	const mockResponse = { success: true };
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call soapFetch with correct params', async () => {
		(soapFetch as jest.Mock).mockResolvedValueOnce({ json: async () => mockResponse });
		await modifyOutgoingFilterRulesSoapApi([{ name: 'rule1' }]);
		expect(soapFetch).toHaveBeenCalledWith('ModifyOutgoingFilterRules', {
			filterRules: [{ filterRule: [{ name: 'rule1' }] }],
			_jsns: 'urn:zimbraMail'
		});
	});

	it('handles error during outgoing filter rule modification', async () => {
		(soapFetch as jest.Mock).mockRejectedValueOnce(new Error('Error'));
		await expect(modifyOutgoingFilterRulesSoapApi([{ name: 'rule1' }])).rejects.toThrow('Error');
	});
});
