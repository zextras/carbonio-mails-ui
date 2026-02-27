/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import moment from 'moment';

import { generateConversation } from '../../../__test__/generators/generateConversation';
import * as shellMock from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import defaultSettings from '@test-utils/settings/default-settings';
import { generateMessage } from '__test__/generators/generateMessage';
import { getContentForPrint } from 'commons/print-conversation/print-conversation';

const FIXED_DATE = new Date('2024-06-15T14:30:00.000Z').valueOf();

describe('getContentForPrint', () => {
	afterEach(() => {
		moment.locale('en');
	});

	describe('basic structure', () => {
		it('returns an HTML string wrapping the subject and message content', () => {
			const conv = generateConversation();
			const msg = generateMessage({ cid: conv.id, subject: 'My Subject', body: 'Hello world' });

			const result = getContentForPrint({
				messages: [msg],
				conversations: [conv],
				isMsg: false
			});

			expect(result).toContain('My Subject');
			// noinspection HtmlRequiredLangAttribute
			expect(result).toContain('<html>');
			expect(result).toContain('Hello world');
		});

		it('returns the HTML shell without any message content when conversations array is empty', () => {
			const msg = generateMessage({ cid: '1' });

			const result = getContentForPrint({
				messages: [msg],
				conversations: [],
				isMsg: false
			});

			// The outer HTML wrapper is still returned (from getCompleteHTML), but no message body
			// noinspection HtmlRequiredLangAttribute
			expect(result).toContain('<html>');
			expect(result).not.toContain(msg.subject);
		});

		it('includes content from all provided conversations', () => {
			const conv1 = generateConversation({ id: '1', subject: 'First Subject' });
			const conv2 = generateConversation({ id: '2', subject: 'Second Subject' });
			const msg1 = generateMessage({ cid: '1', subject: 'First Subject' });
			const msg2 = generateMessage({ cid: '2', subject: 'Second Subject' });

			const result = getContentForPrint({
				messages: [msg1, msg2],
				conversations: [conv1, conv2],
				isMsg: false
			});

			expect(result).toContain('First Subject');
			expect(result).toContain('Second Subject');
		});
	});

	describe('message body content types', () => {
		it('renders text/plain body wrapped in a paragraph', () => {
			const conv = generateConversation({ id: '1', subject: 'Plain text' });
			const msg = generateMessage({
				cid: '1',
				body: 'Plain text content',
				subject: 'Plain text'
			});
			// generateMessage sets contentType to text/plain by default
			msg.body = { content: 'Plain text content', contentType: 'text/plain', truncated: false };

			const result = getContentForPrint({
				messages: [msg],
				conversations: [conv],
				isMsg: false
			});

			expect(result).toContain('Plain text content');
		});

		it('renders "No Content" placeholder when text/plain body is empty', () => {
			const conv = generateConversation({ id: '1', subject: 'Empty body' });
			const msg = generateMessage({ cid: '1', subject: 'Empty body' });
			msg.body = { content: '', contentType: 'text/plain', truncated: false };

			const result = getContentForPrint({
				messages: [msg],
				conversations: [conv],
				isMsg: false
			});

			expect(result).toContain('No Content');
		});

		it('renders text/html body with its inner HTML', () => {
			const conv = generateConversation({ id: '1', subject: 'HTML body' });
			const msg = generateMessage({ cid: '1', subject: 'HTML body' });
			msg.body = {
				content: '<p>Hello <strong>world</strong></p>',
				contentType: 'text/html',
				truncated: false
			};

			const result = getContentForPrint({
				messages: [msg],
				conversations: [conv],
				isMsg: false
			});

			expect(result).toContain('Hello');
			expect(result).toContain('world');
		});

		it('renders "No Content" placeholder for unknown content types', () => {
			const conv = generateConversation({ id: '1', subject: 'Unknown type' });
			const msg = generateMessage({ cid: '1', subject: 'Unknown type' });
			msg.body = { content: 'data', contentType: 'application/octet-stream', truncated: false };

			const result = getContentForPrint({
				messages: [msg],
				conversations: [conv],
				isMsg: false
			});

			expect(result).toContain('No Content');
		});
	});

	describe('isMsg flag', () => {
		it('when isMsg=true it prints all messages regardless of conversation id', () => {
			const conv = generateConversation({ id: '1', subject: 'Subject' });
			const msgA = generateMessage({ id: 'a', cid: '1', subject: 'Subject' });
			const msgB = generateMessage({ id: 'b', cid: '99', subject: 'Subject' });
			msgA.body = { content: 'Message A', contentType: 'text/plain', truncated: false };
			msgB.body = { content: 'Message B', contentType: 'text/plain', truncated: false };

			const result = getContentForPrint({
				messages: [msgA, msgB],
				conversations: [conv],
				isMsg: true
			});

			expect(result).toContain('Message A');
			expect(result).toContain('Message B');
		});

		it('when isMsg=false it only prints messages belonging to the conversation', () => {
			const conv = generateConversation({ id: '1', subject: 'Subject' });
			const msgA = generateMessage({ id: 'a', cid: '1', subject: 'Subject' });
			const msgB = generateMessage({ id: 'b', cid: '99', subject: 'Subject' });
			msgA.body = { content: 'Message A', contentType: 'text/plain', truncated: false };
			msgB.body = { content: 'Message B', contentType: 'text/plain', truncated: false };

			const result = getContentForPrint({
				messages: [msgA, msgB],
				conversations: [conv],
				isMsg: false
			});

			expect(result).toContain('Message A');
			expect(result).not.toContain('Message B');
		});
	});

	describe('subject escaping', () => {
		it('escapes HTML special characters in the conversation subject', () => {
			const conv = generateConversation({ id: '1', subject: '<script>alert("xss")</script>' });
			const msg = generateMessage({ cid: '1' });

			const result = getContentForPrint({
				messages: [msg],
				conversations: [conv],
				isMsg: false
			});

			expect(result).not.toContain('<script>');
			expect(result).toContain('&lt;script&gt;');
		});
	});

	describe('timestamp locale (bug: print preview always uses Anglo-Saxon timetable)', () => {
		it('formats the message date using 24h format when locale is Italian (it)', () => {
			shellMock.getUserSettings.mockReturnValue({
				...defaultSettings,
				prefs: {
					...defaultSettings.prefs,
					zimbraPrefLocale: 'it'
				}
			});

			const conv = generateConversation({ id: '1', subject: 'Test' });
			const msg = generateMessage({ cid: '1', receiveDate: FIXED_DATE });

			const result = getContentForPrint({
				messages: [msg],
				conversations: [conv],
				isMsg: false
			});

			// Italian locale uses 24h time; the time 14:30 must appear as-is
			expect(result).toContain('16:30');
			// AM/PM markers must NOT appear
			expect(result).not.toMatch(/\b(AM|PM)\b/);
		});

		it('formats the message date using 12h format when locale is English (en)', () => {
			shellMock.getUserSettings.mockReturnValue({
				...defaultSettings,
				prefs: {
					...defaultSettings.prefs,
					zimbraPrefLocale: 'en'
				}
			});

			const conv = generateConversation({ id: '1', subject: 'Test' });
			const msg = generateMessage({ cid: '1', receiveDate: FIXED_DATE });

			const result = getContentForPrint({
				messages: [msg],
				conversations: [conv],
				isMsg: false
			});

			// English locale uses 12h time; AM/PM marker must appear
			expect(result).toMatch(/\b(AM|PM)\b/);
		});
	});

	describe('participant headers', () => {
		it('includes the sender address in the output', () => {
			const conv = generateConversation({ id: '1', subject: 'Test' });
			const msg = generateMessage({
				cid: '1',
				from: { type: 'f', address: 'sender@example.com', name: 'Sender' }
			});

			const result = getContentForPrint({
				messages: [msg],
				conversations: [conv],
				isMsg: false
			});

			expect(result).toContain('sender@example.com');
		});

		it('includes the recipient address in the output', () => {
			const conv = generateConversation({ id: '1', subject: 'Test' });
			const msg = generateMessage({
				cid: '1',
				to: [{ type: 't', address: 'recipient@example.com', name: 'Recipient' }]
			});

			const result = getContentForPrint({
				messages: [msg],
				conversations: [conv],
				isMsg: false
			});

			expect(result).toContain('recipient@example.com');
		});
	});
});
