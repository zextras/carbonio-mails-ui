/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	getAuthenticationHeadersFromAPI,
	getMessageIsFromDistributionListFromAPI,
	getMessageIsFromExternalDomainFromAPI,
	getMessageIdFromMailHeadersFromAPI,
	getSensitivityHeaderFromAPI
} from 'normalizations/mail-header-utils';

describe('getMessageIsFromExternalDomainFromAPI', () => {
	it('should return false when the From address is from the same domain as the ownerAccount', () => {
		const headers = { From: 'user@domain.com' };
		const ownerAccount = 'owner@domain.com';
		const result = getMessageIsFromExternalDomainFromAPI(headers, ownerAccount);
		expect(result).toBe(false);
	});

	it('should return true when the From address is from a different domain than the ownerAccount', () => {
		const headers = { From: 'user@external.com' };
		const ownerAccount = 'owner@domain.com';
		const result = getMessageIsFromExternalDomainFromAPI(headers, ownerAccount);
		expect(result).toBe(true);
	});

	it('should return false when the From address is missing from the headers', () => {
		const headers = {};
		const ownerAccount = 'owner@domain.com';
		const result = getMessageIsFromExternalDomainFromAPI(headers, ownerAccount);
		expect(result).toBe(false);
	});
});

describe('getAuthenticationHeadersFromAPI', () => {
	it('should return correct headers when all values are present and valid', () => {
		const headers = {
			'Authentication-Results':
				'Authentication-Results: mx.google.com;dkim=pass header.i=@valimail.com header.s=google2048 header.b=Z8L6tjHb;spf=pass (google.com: domain of [redacted]@valimail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=[redacted]@valimail.com;dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=valimail.com'
		};

		const result = getAuthenticationHeadersFromAPI(headers);

		expect(result).toEqual({
			dkim: { value: expect.stringContaining('dkim=pass'), pass: true },
			spf: { value: expect.stringContaining('spf=pass'), pass: true },
			dmarc: { value: expect.stringContaining('dmarc=pass'), pass: true }
		});
	});

	it('should return only dkim if present', () => {
		const headers = {
			'Authentication-Results':
				'Authentication-Results: mx.google.com;dkim=pass header.i=@valimail.com header.s=google2048 header.b=Z8L6tjHb;'
		};

		const result = getAuthenticationHeadersFromAPI(headers);

		expect(result).toEqual({
			dkim: {
				value: 'dkim=pass header.i=@valimail.com header.s=google2048 header.b=Z8L6tjHb',
				pass: true
			}
		});
	});

	it('should return only spf if present', () => {
		const headers = {
			'Authentication-Results':
				'Authentication-Results: mx.google.com;spf=pass (google.com: domain of [redacted]@valimail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=[redacted]@valimail.com;'
		};

		const result = getAuthenticationHeadersFromAPI(headers);

		expect(result).toEqual({
			spf: {
				value:
					'spf=pass (google.com: domain of [redacted]@valimail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=[redacted]@valimail.com',
				pass: true
			}
		});
	});

	it('should return only dmarc if present', () => {
		const headers = {
			'Authentication-Results':
				'Authentication-Results: mx.google.com;dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=valimail.com'
		};

		const result = getAuthenticationHeadersFromAPI(headers);

		expect(result).toEqual({
			dmarc: {
				value: 'dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=valimail.com',
				pass: true
			}
		});
	});

	it('should return correct headers when some values are present and valid', () => {
		const headers = {
			'Authentication-Results': 'dkim=pass; spf=fail; dmarc=pass'
		};

		const result = getAuthenticationHeadersFromAPI(headers);

		expect(result).toEqual({
			dkim: { value: 'dkim=pass', pass: true },
			spf: { value: 'spf=fail', pass: false },
			dmarc: { value: 'dmarc=pass', pass: true }
		});
	});

	it('should return correct headers when headers are empty object', () => {
		const headers = {};

		const result = getAuthenticationHeadersFromAPI(headers);

		expect(result).toEqual({});
	});

	it('should return correct headers when headers are undefined', () => {
		const headers = undefined;

		const result = getAuthenticationHeadersFromAPI(headers);

		expect(result).toEqual({});
	});

	// adding this test in skip mode to document a real case result header
	// to be handled in the future when the implementation is finalized
	it.skip('should return correct headers when headers are undefined', () => {
		const headers = {
			'Authentication-Results': [
				'mtaprx2.zextras.com (amavis); dkim=pass (2048-bit key)\r\n header.d=foundever.com header.b="LG6GLm4E"; dkim=pass (1024-bit key)\r\n header.d=sitel.onmicrosoft.com header.b="wbHUtrcT"',
				'esa17.sitel.iphmx.com; dkim=pass (signature verified) header.i=@sitel.onmicrosoft.com'
			]
		};

		const result = getAuthenticationHeadersFromAPI(headers);

		expect(result).toEqual({});
	});
});

describe('getSensitivityHeaderFromAPI', () => {
	it('should return undefined if headers is undefined', () => {
		expect(getSensitivityHeaderFromAPI(undefined)).toBeUndefined();
	});

	it('should return undefined if headers.Sensitivity is undefined', () => {
		const headers = { Sensitivity: undefined };
		expect(getSensitivityHeaderFromAPI(headers)).toBeUndefined();
	});

	it('should return undefined if headers.Sensitivity is "Personal"', () => {
		const headers = { Sensitivity: 'Personal' };
		expect(getSensitivityHeaderFromAPI(headers)).toBeUndefined();
	});

	it('should return "private" if headers.Sensitivity is "Private"', () => {
		const headers = { Sensitivity: 'Private' };
		expect(getSensitivityHeaderFromAPI(headers)).toBe('Private');
	});

	it('should return "company-confidential" if headers.Sensitivity is "Company-Confidential"', () => {
		const headers = { Sensitivity: 'Company-Confidential' };
		expect(getSensitivityHeaderFromAPI(headers)).toBe('Company-Confidential');
	});

	it('should return undefined if headers.Sensitivity is an unrecognized value', () => {
		const headers = { Sensitivity: 'Unknown' };
		expect(getSensitivityHeaderFromAPI(headers)).toBeUndefined();
	});
});

describe('getMessageIsFromDistributionListFromAPI', () => {
	test('returns false when input is undefined', () => {
		expect(getMessageIsFromDistributionListFromAPI(undefined)).toBe(false);
	});

	test('returns false when headers object is empty', () => {
		expect(getMessageIsFromDistributionListFromAPI({})).toBe(false);
	});

	test('returns true when X-Zimbra-DL header is present', () => {
		expect(getMessageIsFromDistributionListFromAPI({ 'X-Zimbra-DL': 'some-value' })).toBe(true);
	});

	test('returns true when List-ID header is present', () => {
		expect(getMessageIsFromDistributionListFromAPI({ 'List-ID': 'some-value' })).toBe(true);
	});

	test('returns true when List-Unsubscribe header is present', () => {
		expect(getMessageIsFromDistributionListFromAPI({ 'List-Unsubscribe': 'some-value' })).toBe(
			true
		);
	});

	test('returns true when multiple relevant headers are present', () => {
		expect(
			getMessageIsFromDistributionListFromAPI({
				'X-Zimbra-DL': 'some-value',
				'List-ID': 'some-value',
				'List-Unsubscribe': 'some-value'
			})
		).toBe(true);
	});
});

describe('getMessageIdFromMailHeadersFromAPI', () => {
	it('should return the message ID without angle brackets', () => {
		const headers = { 'Message-Id': '<12345@example.com>' };
		const result = getMessageIdFromMailHeadersFromAPI(headers);
		expect(result).toBe('12345@example.com');
	});

	it('should return the message ID as-is if there are no angle brackets', () => {
		const headers = { 'Message-Id': '12345@example.com' };
		const result = getMessageIdFromMailHeadersFromAPI(headers);
		expect(result).toBe('12345@example.com');
	});

	it('should return undefined if the headers do not contain Message-Id', () => {
		const headers = { 'Other-Header': 'value' } as never;
		const result = getMessageIdFromMailHeadersFromAPI(headers);
		expect(result).toBeUndefined();
	});

	it('should return undefined if the headers are undefined', () => {
		const result = getMessageIdFromMailHeadersFromAPI(undefined as never);
		expect(result).toBeUndefined();
	});

	it('should handle extra spaces around angle brackets', () => {
		const headers = { 'Message-Id': ' <12345@example.com> ' };
		const result = getMessageIdFromMailHeadersFromAPI(headers);
		expect(result).toBe('12345@example.com');
	});
});
