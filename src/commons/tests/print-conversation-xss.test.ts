/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as shell from '@zextras/carbonio-shell-ui';

import { getAttachments } from 'commons/print-conversation/get-attachments';
import { getBodyWrapper } from 'commons/print-conversation/get-body-wrapper';
import { getCompleteHTML } from 'commons/print-conversation/get-complete-html';
import { getParticipantHeader } from 'commons/print-conversation/get-participant-header';
import { getSubject } from 'commons/print-conversation/get-subject';
import { MailMessage } from 'types/messages';
import { Participant } from 'types/participant';

const HTML_TAG_PAYLOADS = [
	'<script>alert("xss")</script>',
	'<img src=x onerror=alert(1)>',
	'"><script>alert(1)</script>',
	"'><script>alert(1)</script>",
	'<svg onload=alert(1)>',
	'<SCRIPT>alert("xss")</SCRIPT>'
];

const FORBIDDEN_RAW_TAGS = ['<script', '<SCRIPT', '<img ', '<svg '];

const assertNoRawTags = (result: string): void => {
	FORBIDDEN_RAW_TAGS.forEach((tag) => {
		expect(result).not.toContain(tag);
	});
};

describe('XSS prevention in print-conversation utilities', () => {
	describe('getParticipantHeader', () => {
		it.each(HTML_TAG_PAYLOADS)(
			'escapes HTML tag payload in participant fullName: %s',
			(payload) => {
				const participants: Participant[] = [
					{ type: 'f', address: 'safe@example.com', fullName: payload }
				];
				const result = getParticipantHeader(participants, 'From');
				expect(result).not.toContain(payload);
				assertNoRawTags(result);
			}
		);

		it.each(HTML_TAG_PAYLOADS)('escapes HTML tag payload in participant address: %s', (payload) => {
			const participants: Participant[] = [{ type: 'f', address: payload, fullName: 'Safe Name' }];
			const result = getParticipantHeader(participants, 'From');
			expect(result).not.toContain(payload);
			assertNoRawTags(result);
		});

		it('returns empty string when participants array is empty', () => {
			expect(getParticipantHeader([], 'From')).toBe('');
		});

		it('escapes angle brackets in address when used as display name', () => {
			const participants: Participant[] = [{ type: 'f', address: '<evil@example.com>' }];
			const result = getParticipantHeader(participants, 'From');
			expect(result).toContain('&lt;evil@example.com&gt;');
			expect(result).not.toContain('<evil@example.com>');
		});
	});

	describe('getSubject', () => {
		it.each(HTML_TAG_PAYLOADS)('escapes HTML tag payload in subject content: %s', (payload) => {
			const result = getSubject(payload, 'Subject');
			expect(result).not.toContain(payload);
			assertNoRawTags(result);
		});

		it('renders safe subject text unchanged', () => {
			const result = getSubject('Hello world', 'Subject');
			expect(result).toContain('Hello world');
		});
	});

	describe('getBodyWrapper', () => {
		it.each(HTML_TAG_PAYLOADS)(
			'escapes HTML tag payload in conversation subject: %s',
			(payload) => {
				const result = getBodyWrapper({ content: '<p>safe</p>', subject: payload });
				expect(result).not.toContain(payload);
				assertNoRawTags(result);
			}
		);

		it('passes email body content through unescaped (it is already-sanitised HTML)', () => {
			const safeContent = '<p>Hello world</p>';
			const result = getBodyWrapper({ content: safeContent, subject: 'Subject' });
			expect(result).toContain(safeContent);
		});
	});

	describe('getAttachments', () => {
		it.each(HTML_TAG_PAYLOADS)('escapes HTML tag payload in attachment filename: %s', (payload) => {
			const msg = {
				attachments: [{ filename: payload, contentType: 'application/octet-stream' }]
			} as MailMessage;
			const result = getAttachments({ msg });
			// Primary guarantee: the verbatim payload must not appear in the output
			expect(result).not.toContain(payload);
			// The template contains a static <svg> icon, so only check for injected script/img
			expect(result).not.toContain('<script');
			expect(result).not.toContain('<SCRIPT');
			expect(result).not.toContain('<img ');
		});

		it('renders a safe filename unchanged', () => {
			const msg = {
				attachments: [{ filename: 'report.pdf', contentType: 'application/pdf' }]
			} as MailMessage;
			const result = getAttachments({ msg });
			expect(result).toContain('report.pdf');
		});

		it('renders multiple attachments and escapes malicious filenames', () => {
			const msg = {
				attachments: [
					{ filename: 'file1.pdf', contentType: 'application/pdf' },
					{ filename: '<evil>.txt', contentType: 'text/plain' }
				]
			} as MailMessage;
			const result = getAttachments({ msg });
			expect(result).toContain('file1.pdf');
			expect(result).not.toContain('<evil>');
			expect(result).toContain('&lt;evil&gt;');
		});
	});

	describe('getCompleteHTML', () => {
		it.each(HTML_TAG_PAYLOADS)('escapes HTML tag payload in account name: %s', (payload) => {
			const result = getCompleteHTML({ content: '' });
			// Primary guarantee: the verbatim payload must not appear in the output
			expect(result).not.toContain(payload);
			// Template has a static <script> for the print trigger, so only check for img/svg injections
			expect(result).not.toContain('<img ');
			expect(result).not.toContain('<svg ');
		});

		it('renders a safe account name unchanged', () => {
			vi.spyOn(shell, 'getUserAccount').mockReturnValueOnce({
				name: 'user@example.com'
			} as shell.Account);
			const result = getCompleteHTML({ content: '' });
			expect(result).toContain('user@example.com');
		});

		it('does not throw and produces a string when getUserAccount returns null', () => {
			expect(() => getCompleteHTML({ content: '' })).not.toThrow();
			expect(typeof getCompleteHTML({ content: '' })).toBe('string');
		});

		it('includes a Content-Security-Policy meta tag as defense-in-depth', () => {
			const result = getCompleteHTML({ content: '' });
			expect(result).toContain('http-equiv="Content-Security-Policy"');
			expect(result).toContain("default-src 'none'");
			expect(result).toContain("img-src 'self' data: cid:");
			expect(result).toContain("base-uri 'none'");
			expect(result).toContain("form-action 'none'");
		});
	});
});
