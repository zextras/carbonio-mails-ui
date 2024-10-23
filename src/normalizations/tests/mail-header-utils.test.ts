/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';

import { MAIL_SENSITIVITY_HEADER } from '../../constants';
import { MailAuthenticationHeader } from '../../types';
import {
	getAuthenticationHeaders,
	getAuthenticationHeadersIcon,
	getHasAuthenticationHeaders,
	getIsDistributionList,
	getIsFromExternalDomain,
	getIsSensitive,
	getMailAuthenticationHeaderLabel,
	getMailSensitivityIconColor,
	getMailSensitivityLabel,
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

	it('should return false when the From address is missing from the headers', () => {
		const headers = {};
		const ownerAccount = 'owner@domain.com';
		const result = getIsFromExternalDomain(headers, ownerAccount);
		expect(result).toBe(false);
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

	it('should return correct headers when headers are empty object', () => {
		const headers = {};

		const result = getAuthenticationHeaders(headers);

		expect(result).toEqual({});
	});

	it('should return correct headers when headers are undefined', () => {
		const headers = undefined;

		const result = getAuthenticationHeaders(headers);

		expect(result).toEqual({});
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
	test('should return false for undefined', () => {
		const authenticationHeaders = undefined;
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

	test('should return false if object contains headers not in the valid list', () => {
		const authenticationHeaders = {
			'X-Custom-Header': { value: 'custom value', pass: true }
		};
		expect(getHasAuthenticationHeaders(authenticationHeaders)).toBe(false);
	});
});

describe('getAuthenticationHeadersIcon', () => {
	it('should return "warning" when there are no headers', () => {
		const headers: Record<string, MailAuthenticationHeader> = {};
		expect(getAuthenticationHeadersIcon(headers)).toBe('warning');
	});

	it('should return "warning" when headers is an empty object', () => {
		const headers = undefined;
		expect(getAuthenticationHeadersIcon(headers)).toBe('warning');
	});

	it('should return "warning" when no headers have pass: true', () => {
		const headers: Record<string, MailAuthenticationHeader> = {
			header1: { pass: false },
			header2: { pass: false }
		};
		expect(getAuthenticationHeadersIcon(headers)).toBe('warning');
	});

	it('should return "warning" when some headers have pass: true but less than 3', () => {
		const headers: Record<string, MailAuthenticationHeader> = {
			header1: { pass: true },
			header2: { pass: false },
			header3: { pass: true }
		};
		expect(getAuthenticationHeadersIcon(headers)).toBe('warning');
	});

	it('should return "success" when exactly 3 headers have pass: true', () => {
		const headers: Record<string, MailAuthenticationHeader> = {
			header1: { pass: true },
			header2: { pass: true },
			header3: { pass: true }
		};
		expect(getAuthenticationHeadersIcon(headers)).toBe('success');
	});

	it('should return "warning" when more than 3 headers have pass: true', () => {
		const headers: Record<string, MailAuthenticationHeader> = {
			header1: { pass: true },
			header2: { pass: true },
			header3: { pass: true },
			header4: { pass: true }
		};
		expect(getAuthenticationHeadersIcon(headers)).toBe('warning');
	});
});

describe('getIsSensitive', () => {
	it('returns false for Personal', () => {
		expect(getIsSensitive(MAIL_SENSITIVITY_HEADER.personal)).toBe(false);
	});

	it('returns false for Personal in lowercase', () => {
		expect(getIsSensitive('personal' as never)).toBe(false);
	});

	it('returns true for Private in mixed case', () => {
		expect(getIsSensitive('pRiVate' as never)).toBe(true);
	});

	it('returns true for Private', () => {
		expect(getIsSensitive(MAIL_SENSITIVITY_HEADER.private)).toBe(true);
	});

	it('returns true for Company-Confidential', () => {
		expect(getIsSensitive(MAIL_SENSITIVITY_HEADER.companyConfidential)).toBe(true);
	});

	it('returns false for undefined sensitivity', () => {
		expect(getIsSensitive(undefined)).toBe(false);
	});

	it('returns false for unexpected sensitivity', () => {
		expect(getIsSensitive('Unexpected' as never)).toBe(false);
	});
});

describe('getMailSensitivityIconColor', () => {
	it('returns "warning" for Personal', () => {
		expect(getMailSensitivityIconColor(MAIL_SENSITIVITY_HEADER.personal)).toBe('warning');
	});

	it('returns "error" for Private', () => {
		expect(getMailSensitivityIconColor(MAIL_SENSITIVITY_HEADER.private)).toBe('error');
	});

	it('returns "info" for Company-Confidential', () => {
		expect(getMailSensitivityIconColor(MAIL_SENSITIVITY_HEADER.companyConfidential)).toBe('info');
	});

	it('returns "warning" for undefined sensitivity', () => {
		expect(getMailSensitivityIconColor(undefined)).toBe('warning');
	});

	it('returns "warning" for unexpected sensitivity', () => {
		expect(getMailSensitivityIconColor('Unexpected' as never)).toBe('warning');
	});
});

describe('getMailSensitivityLabel', () => {
	it('returns the correct label for Personal', () => {
		const result = getMailSensitivityLabel(t, MAIL_SENSITIVITY_HEADER.personal);
		expect(result).toBe('label.mail_sensitivity_personal');
	});

	it('returns the correct label for Private', () => {
		const result = getMailSensitivityLabel(t, MAIL_SENSITIVITY_HEADER.private);
		expect(result).toBe('label.mail_sensitivity_private');
	});

	it('returns the correct label for Company-Confidential', () => {
		const result = getMailSensitivityLabel(t, MAIL_SENSITIVITY_HEADER.companyConfidential);
		expect(result).toBe('label.mail_sensitivity_company_confidential');
	});

	it('returns the label for undefined sensitivity', () => {
		const result = getMailSensitivityLabel(t, undefined);
		expect(result).toBe('label.mail_sensitivity_unknown');
	});

	it('returns the label for unexpected sensitivity', () => {
		const result = getMailSensitivityLabel(t, 'Unexpected' as never);
		expect(result).toBe('label.mail_sensitivity_unknown');
	});
});

describe('getMailAuthenticationHeaderLabel', () => {
	it('should return undefined if authenticationHeaders is undefined', () => {
		const result = getMailAuthenticationHeaderLabel(t, undefined);
		expect(result).toBeUndefined();
	});

	it('should return a string with passed headers', () => {
		const authenticationHeaders = {
			dkim: { pass: true, value: 'header1Value' },
			spf: { pass: true, value: 'header2Value' }
		};
		const result = getMailAuthenticationHeaderLabel(t, authenticationHeaders);
		expect(result).toBe('dkim=label.pass, spf=label.pass');
	});

	it('should return a string with failed headers', () => {
		const authenticationHeaders = {
			dkim: { pass: false, value: 'header1Value' },
			spf: { pass: false, value: 'header2Value' }
		};
		const result = getMailAuthenticationHeaderLabel(t, authenticationHeaders);
		expect(result).toBe('dkim=label.fail, spf=label.fail');
	});

	it('should return a string with mixed headers', () => {
		const authenticationHeaders = {
			dkim: { pass: true, value: 'header1Value' },
			spf: { pass: false, value: 'header2Value' }
		};
		const result = getMailAuthenticationHeaderLabel(t, authenticationHeaders);
		expect(result).toBe('dkim=label.pass, spf=label.fail');
	});
});

describe('getIsDistributionList', () => {
	test('returns false when input is undefined', () => {
		expect(getIsDistributionList(undefined)).toBe(false);
	});

	test('returns false when headers object is empty', () => {
		expect(getIsDistributionList({})).toBe(false);
	});

	test('returns true when X-Zimbra-DL header is present', () => {
		expect(getIsDistributionList({ 'X-Zimbra-DL': 'some-value' })).toBe(true);
	});

	test('returns true when List-ID header is present', () => {
		expect(getIsDistributionList({ 'List-ID': 'some-value' })).toBe(true);
	});

	test('returns true when List-Unsubscribe header is present', () => {
		expect(getIsDistributionList({ 'List-Unsubscribe': 'some-value' })).toBe(true);
	});

	test('returns true when multiple relevant headers are present', () => {
		expect(
			getIsDistributionList({
				'X-Zimbra-DL': 'some-value',
				'List-ID': 'some-value',
				'List-Unsubscribe': 'some-value'
			})
		).toBe(true);
	});
});
