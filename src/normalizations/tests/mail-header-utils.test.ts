/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	getAuthenticationHeaders,
	getHasAuthenticationHeaders,
	getIsFromExternalDomain,
	getSensitivityHeader
} from '../mail-header-utils';

describe('getIsFromExternalDomain', () => {
	it('should return false when the From address is from the same domain as the ownerAccount', () => {
		const headers = { From: 'user@domain.com' };
		const ownerAccount = 'owner@domain.com';
		const result = getIsFromExternalDomain(headers, ownerAccount);
		expect(result).toBe(false);
	});

	it('should return true when the From address is from a different domain than the ownerAccount', () => {
		const headers = { From: 'user@external.com' };
		const ownerAccount = 'owner@domain.com';
		const result = getIsFromExternalDomain(headers, ownerAccount);
		expect(result).toBe(true);
	});

	it('should return true when the From address is missing from the headers', () => {
		const headers = {};
		const ownerAccount = 'owner@domain.com';
		const result = getIsFromExternalDomain(headers, ownerAccount);
		expect(result).toBe(true);
	});
});

describe('getAuthenticationHeaders', () => {
	it('should return correct headers when all values are present and valid', () => {
		const headers = {
			'Authentication-Results':
				'Authentication-Results: mx.google.com;dkim=pass header.i=@valimail.com header.s=google2048 header.b=Z8L6tjHb;spf=pass (google.com: domain of [redacted]@valimail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=[redacted]@valimail.com;dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=valimail.com'
		};

		const result = getAuthenticationHeaders(headers);

		expect(result).toEqual({
			dkim: { value: expect.stringContaining('dkim=pass'), pass: true },
			spf: { value: expect.stringContaining('spf=pass'), pass: true },
			dmarc: { value: expect.stringContaining('dmarc=pass'), pass: true }
		});
	});

	it('should return correct headers when some values are present and valid', () => {
		const headers = {
			'Authentication-Results': 'dkim=pass; spf=fail; dmarc=pass'
		};

		const result = getAuthenticationHeaders(headers);

		expect(result).toEqual({
			dkim: { value: 'dkim=pass', pass: true },
			spf: { value: 'spf=fail', pass: false },
			dmarc: { value: 'dmarc=pass', pass: true }
		});
	});

	it('should return correct headers when no values are present', () => {
		const headers = {
			'Authentication-Results': ''
		};

		const result = getAuthenticationHeaders(headers);

		expect(result).toEqual({
			dkim: { value: undefined, pass: false },
			spf: { value: undefined, pass: false },
			dmarc: { value: undefined, pass: false }
		});
	});

	it('should return correct headers when headers are undefined', () => {
		const headers = {};

		const result = getAuthenticationHeaders(headers);

		expect(result).toEqual({
			dkim: { value: undefined, pass: false },
			spf: { value: undefined, pass: false },
			dmarc: { value: undefined, pass: false }
		});
	});
});

describe('getSensitivityHeader', () => {
	it('should return undefined if headers is undefined', () => {
		expect(getSensitivityHeader(undefined)).toBeUndefined();
	});

	it('should return "personal" if headers.Sensitivity is "Personal"', () => {
		const headers = { Sensitivity: 'Personal' };
		expect(getSensitivityHeader(headers)).toBe('personal');
	});

	it('should return "private" if headers.Sensitivity is "Private"', () => {
		const headers = { Sensitivity: 'Private' };
		expect(getSensitivityHeader(headers)).toBe('private');
	});

	it('should return "company-confidential" if headers.Sensitivity is "Company-Confidential"', () => {
		const headers = { Sensitivity: 'Company-Confidential' };
		expect(getSensitivityHeader(headers)).toBe('company-confidential');
	});

	it('should return undefined if headers.Sensitivity is an unrecognized value', () => {
		const headers = { Sensitivity: 'Unknown' };
		expect(getSensitivityHeader(headers)).toBeUndefined();
	});
});

describe('getHasAuthenticationHeaders', () => {
	test('should return false for an empty object', () => {
		const authenticationHeaders = {};
		expect(getHasAuthenticationHeaders(authenticationHeaders)).toBe(false);
	});

	test('should return true if authenticationHeaders contains at least one valid value', () => {
		const authenticationHeaders = {
			dkim: { value: 'pass', pass: true },
			spf: { value: undefined, pass: undefined },
			dmarc: { value: undefined, pass: undefined }
		};
		expect(getHasAuthenticationHeaders(authenticationHeaders)).toBe(true);
	});

	test('should return true if authenticationHeaders contains more than one valid value', () => {
		const authenticationHeaders = {
			dkim: { value: 'dkim=pass', pass: true },
			spf: { value: 'spf=pass', pass: true },
			dmarc: { value: 'dmarc=pass', pass: true }
		};
		expect(getHasAuthenticationHeaders(authenticationHeaders)).toBe(true);
	});

	test('should return false if object contains headers not in the list', () => {
		const authenticationHeaders = {
			'X-Custom-Header': { value: 'custom value', pass: true }
		};
		expect(getHasAuthenticationHeaders(authenticationHeaders)).toBe(false);
	});
});
