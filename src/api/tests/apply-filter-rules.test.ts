/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';

import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import {
	applyFilterRules,
	ApplyFilterRulesSoapRequest,
	ApplyFilterRulesSoapResponse,
	composeFoldersIdSoapCriteria,
	composeMessagesIdSoapCriteria,
	extractMessagesIdFromSoapResponse
} from '../apply-filter-rules';

describe('composeMessagesIdCriteria', () => {
	it('returns undefined if an undefined value is provided as parameter', () => {
		const result = composeMessagesIdSoapCriteria(undefined);
		expect(result).toBeUndefined();
	});

	it('returns undefined if an empty array is provided as parameter', () => {
		const result = composeMessagesIdSoapCriteria([]);
		expect(result).toBeUndefined();
	});

	it('returns {"ids": "4567"} if a single "4567" element is provided', () => {
		const result = composeMessagesIdSoapCriteria(['4567']);
		expect(result).toEqual({ ids: '4567' });
	});

	it('return {"ids": "1,2,3,4,789,10"} if the array ["1", "2", "3", "4", "789", "10"] is provided', () => {
		const result = composeMessagesIdSoapCriteria(['1', '2', '3', '4', '789', '10']);
		expect(result).toEqual({ ids: '1,2,3,4,789,10' });
	});
});

describe('composeFoldersIdCriteria', () => {
	it('return undefined if an undefined value is provided as parameter', () => {
		const result = composeFoldersIdSoapCriteria(undefined);
		expect(result).toBeUndefined();
	});

	it('return undefined if an empty array is provided as parameter', () => {
		const result = composeFoldersIdSoapCriteria([]);
		expect(result).toBeUndefined();
	});

	it('return {_content: "(inid:"2")"}  string if an array with a single "2" element is provided', () => {
		const result = composeFoldersIdSoapCriteria(['2']);
		expect(result).toEqual({ _content: '(inid:"2")' });
	});

	it('return {_content: "(inid:"1" OR inid:"789" OR inid:"10")"} if the array ["1", "789", "10"] is provided', () => {
		const result = composeFoldersIdSoapCriteria(['1', '789', '10']);
		expect(result).toEqual({ _content: '(inid:"1" OR inid:"789" OR inid:"10")' });
	});
});

describe('extractMessagesIdFromSoapResponse', () => {
	it('returns an empty array if an undefined value is provided as response', () => {
		// We're testing a corner case here
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const result = extractMessagesIdFromSoapResponse(undefined);
		expect(result).toEqual([]);
	});

	it('returns an empty array if SOAP error is provided as response', () => {
		const response: ErrorSoapBodyResponse = {
			Fault: {
				Detail: { Error: { Code: 'code', Detail: 'detail' } },
				Reason: { Text: 'something horrible happened' }
			}
		};
		const result = extractMessagesIdFromSoapResponse(response);
		expect(result).toEqual([]);
	});

	it("returns an empty array if the provided response doesn't contain the m property", () => {
		const response: ApplyFilterRulesSoapResponse = {};
		const result = extractMessagesIdFromSoapResponse(response);
		expect(result).toEqual([]);
	});

	it('returns an empty array if the provided response contains an empty string for the m.ids property', () => {
		const response: ApplyFilterRulesSoapResponse = {
			m: [{ ids: '' }]
		};
		const result = extractMessagesIdFromSoapResponse(response);
		expect(result).toEqual([]);
	});

	it('returns ["1"] if the provided response contains the value "1" for the m.ids property', () => {
		const response: ApplyFilterRulesSoapResponse = {
			m: [
				{
					ids: '1'
				}
			]
		};
		const result = extractMessagesIdFromSoapResponse(response);
		expect(result).toEqual(['1']);
	});

	it('returns ["1", "2"] if the provided response contains the value "1,2" for the m.ids property', () => {
		const response: ApplyFilterRulesSoapResponse = {
			m: [
				{
					ids: '1,2'
				}
			]
		};
		const result = extractMessagesIdFromSoapResponse(response);
		expect(result).toEqual(['1', '2']);
	});
});

describe('applyFilterRules', () => {
	it('calls the API passing the given rule name', async () => {
		const ruleName = 'test';
		const interceptor = createSoapAPIInterceptor<ApplyFilterRulesSoapRequest>('ApplyFilterRules');
		applyFilterRules({ ruleName });
		const apiParams = await interceptor;
		expect(apiParams.filterRules[0].filterRule.name).toEqual(ruleName);
	});

	it('calls the API passing the given list of messages id', async () => {
		const messagesId = ['123', '456', '789'];
		const interceptor = createSoapAPIInterceptor<ApplyFilterRulesSoapRequest>('ApplyFilterRules');
		applyFilterRules({ ruleName: 'test', messagesId });
		const apiParams = await interceptor;
		expect(apiParams.m?.ids).toEqual('123,456,789');
		expect(apiParams.query).toBeUndefined();
	});

	it('calls the API passing the given list of folders id', async () => {
		const foldersId = ['321', '654', '987'];
		const interceptor = createSoapAPIInterceptor<ApplyFilterRulesSoapRequest>('ApplyFilterRules');
		applyFilterRules({ ruleName: 'test', foldersId });
		const apiParams = await interceptor;
		expect(apiParams.query?._content).toEqual('(inid:"321" OR inid:"654" OR inid:"987")');
		expect(apiParams.m).toBeUndefined();
	});

	it('calls the API passing only the given list of folders id if both messages id and folders id are provided', async () => {
		const messagesId = ['123', '456', '789'];
		const foldersId = ['321', '654', '987'];
		const interceptor = createSoapAPIInterceptor<ApplyFilterRulesSoapRequest>('ApplyFilterRules');
		applyFilterRules({ ruleName: 'test', messagesId, foldersId });
		const apiParams = await interceptor;
		expect(apiParams.query?._content).toEqual('(inid:"321" OR inid:"654" OR inid:"987")');
		expect(apiParams.m).toBeUndefined();
	});
});
