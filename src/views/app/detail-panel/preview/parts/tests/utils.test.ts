/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';

import { MAIL_SENSITIVITY_HEADER } from 'constants/index';
import { MailAuthenticationHeader } from 'types/messages';
import {
	getAuthenticationHeadersIconColor,
	getMailAuthenticationHeaderLabel,
	getMailSensitivityIconColor,
	getMailSensitivityLabel
} from 'views/app/detail-panel/preview/parts/utils';

describe('getAuthenticationHeadersIconColor', () => {
	it('should return "warning" when headers is an empty object', () => {
		expect(getAuthenticationHeadersIconColor({})).toBe('warning');
	});

	it('should return "warning" when no headers have pass: true', () => {
		const headers: Record<string, MailAuthenticationHeader> = {
			header1: { pass: false, value: '' },
			header2: { pass: false, value: '' }
		};
		expect(getAuthenticationHeadersIconColor(headers)).toBe('warning');
	});

	it('should return "warning" when some headers have pass: true but less than 3', () => {
		const headers = {
			spf: { pass: true, value: '' },
			dkim: { pass: false, value: '' },
			dmarc: { pass: true, value: '' }
		};
		expect(getAuthenticationHeadersIconColor(headers)).toBe('warning');
	});

	it('should return "warning" when an unknown header has pass: true', () => {
		const headers = {
			dkim: { pass: true, value: '' },
			spf: { pass: true, value: '' },
			header: { pass: true, value: '' }
		};
		expect(getAuthenticationHeadersIconColor(headers)).toBe('warning');
	});

	it('should return "warning" when more than 3 headers have pass: true', () => {
		const headers: Record<string, MailAuthenticationHeader> = {
			header1: { pass: true, value: '' },
			header2: { pass: true, value: '' },
			header3: { pass: true, value: '' },
			header4: { pass: true, value: '' }
		};
		expect(getAuthenticationHeadersIconColor(headers)).toBe('warning');
	});
});

describe('getMailAuthenticationHeaderLabel', () => {
	it('should return a string with passed and missing headers', () => {
		const authenticationHeaders = {
			dkim: { pass: true, value: 'header1Value' },
			spf: { pass: true, value: 'header2Value' }
		};
		const result = getMailAuthenticationHeaderLabel(t, authenticationHeaders);
		expect(result).toBe('dkim=label.pass, spf=label.pass, dmarc=label.missing');
	});

	it('should return a string with failed headers', () => {
		const authenticationHeaders = {
			dkim: { pass: false, value: 'header1Value' },
			spf: { pass: false, value: 'header2Value' }
		};
		const result = getMailAuthenticationHeaderLabel(t, authenticationHeaders);
		expect(result).toBe('dkim=label.fail, spf=label.fail, dmarc=label.missing');
	});

	it('should return a string with mixed headers', () => {
		const authenticationHeaders = {
			dkim: { pass: true, value: 'header1Value' },
			spf: { pass: false, value: 'header2Value' }
		};
		const result = getMailAuthenticationHeaderLabel(t, authenticationHeaders);
		expect(result).toBe('dkim=label.pass, spf=label.fail, dmarc=label.missing');
	});
});

describe('getMailSensitivityIconColor', () => {
	it('returns "error" for Private', () => {
		expect(getMailSensitivityIconColor(MAIL_SENSITIVITY_HEADER.private)).toBe('error');
	});

	it('returns "info" for Company-Confidential', () => {
		expect(getMailSensitivityIconColor(MAIL_SENSITIVITY_HEADER.companyConfidential)).toBe('info');
	});

	it('returns "warning" for unexpected sensitivity', () => {
		expect(getMailSensitivityIconColor('Unexpected' as never)).toBe('warning');
	});
});

describe('getMailSensitivityLabel', () => {
	it('returns the correct label for Private', () => {
		const result = getMailSensitivityLabel(t, MAIL_SENSITIVITY_HEADER.private);
		expect(result).toBe('label.mail_sensitivity_private');
	});

	it('returns the correct label for Company-Confidential', () => {
		const result = getMailSensitivityLabel(t, MAIL_SENSITIVITY_HEADER.companyConfidential);
		expect(result).toBe('label.mail_sensitivity_company_confidential');
	});

	it('returns the label for unexpected sensitivity', () => {
		const result = getMailSensitivityLabel(t, 'Unexpected' as never);
		expect(result).toBe('label.mail_sensitivity_unknown');
	});
});
