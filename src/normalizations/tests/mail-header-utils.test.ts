/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getAuthenticationHeaders, getIsFromExternalDomain } from '../mail-header-utils';

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
