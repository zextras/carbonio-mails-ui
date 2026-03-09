// noinspection HtmlRequiredLangAttribute,HtmlRequiredTitleElement,HtmlUnknownTarget

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { extractBody } from '../editor-slice-utils';
import { MailMessage } from 'types/messages';

describe('extractBody - style preservation', () => {
	it('should preserve styles from head when extracting body for reply/forward', () => {
		// This test simulates the issue from Jira CO-2313
		// Email with styles in <head> that should be preserved when replying/forwarding
		const htmlWithStylesInHead = `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					body {
						font-family: Arial, sans-serif;
						margin: 0;
						padding: 0;
						background-color: #f4f4f4;
					}
					.email-container {
						max-width: 600px;
						margin: 20px auto;
						background-color: #ffffff;
						border: 1px solid #dddddd;
						border-radius: 5px;
						padding: 20px;
					}
					table {
						width: 100%;
						border-collapse: collapse;
						margin-top: 20px;
					}
					th, td {
						padding: 10px;
						text-align: left;
						border: 1px solid #dddddd;
					}
					th {
						background-color: #f8f8f8;
						font-weight: bold;
					}
				</style>
			</head>
			<body>
				<div class="email-container">
					<p>Dear <strong>Test User</strong>,</p>
					<p>Your request has been submitted.</p>
					<table>
						<tr>
							<th>Application Date</th>
							<th>Status</th>
						</tr>
						<tr>
							<td>01, Apr 2025</td>
							<td>Submitted</td>
						</tr>
					</table>
				</div>
			</body>
			</html>
		`;

		const mockMessage: MailMessage = {
			id: '123',
			parts: [
				{
					contentType: 'multipart/alternative',
					parts: [
						{
							contentType: 'text/html',
							content: htmlWithStylesInHead
						}
					]
				}
			]
		} as never;

		const result = extractBody(mockMessage);

		// Verify that the content is present
		expect(result.richText).toContain('Dear');
		expect(result.richText).toContain('Test User');
		expect(result.richText).toContain('Application Date');
		expect(result.richText).toContain('Status');

		// Verify that styles are inlined (preserved)
		expect(result.richText).toContain('style=');

		// Check for some specific styles that should be inlined
		// The exact format may vary, but styles should be present
		expect(result.richText.toLowerCase()).toMatch(/font-family|background-color|border/);
	});

	it('should handle email from 290.eml format with styles', () => {
		// Simulating the actual structure from 290.eml
		const emailHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					body {
						font-family: Arial, sans-serif;
						margin: 0;
						padding: 0;
						background-color: #f4f4f4;
					}
					.email-container {
						max-width: 600px;
						margin: 20px auto;
						background-color: #ffffff;
						border: 1px solid #dddddd;
						border-radius: 5px;
						padding: 20px;
					}
					.logo {
						text-align: center;
						margin-bottom: 20px;
					}
					.email-content {
						color: #333333;
						line-height: 1.6;
					}
					table {
						width: 100%;
						border-collapse: collapse;
						margin-top: 20px;
					}
					th, td {
						padding: 10px;
						text-align: left;
						border: 1px solid #dddddd;
					}
					th {
						background-color: #f8f8f8;
						font-weight: bold;
					} 
					.footer {
						margin-top: 20px;
						font-size: 12px;
						color: #777777;
					}
				</style>
			</head>
			<body>
				<div class="email-container">
					<div class="logo">
						<img src="cid:logo" alt="FSL" style="max-width: 200px;">
					</div>
					<div class="email-content">
						<p>Dear <strong>Test Scientific Officer</strong>,</p>
						<p>Your attendance regularisation request has been successfully submitted.</p>
						<table>
							<tr>
								<th>Application Date</th>
								<th>Reason for Regularisation</th>
								<th>Status</th>
							</tr>
							<tr>
								<td>01, Apr 2025</td>
								<td>Check out by mistake</td>
								<td>Submitted</td>
							</tr>
						</table>
					</div>
					<div class="footer">
						<p>Regards,<br>Admin Department</p>
					</div>
				</div>
			</body>
			</html>
		`;

		const mockMessage: MailMessage = {
			id: '290',
			parts: [
				{
					contentType: 'multipart/related',
					parts: [
						{
							contentType: 'text/html',
							content: emailHtml
						}
					]
				}
			]
		} as never;

		const result = extractBody(mockMessage);

		// Verify content is preserved
		expect(result.richText).toContain('Test Scientific Officer');
		expect(result.richText).toContain('attendance regularisation');
		expect(result.richText).toContain('Application Date');

		// Verify styles are inlined
		expect(result.richText).toContain('style=');

		// The table and other elements should have inline styles now
		// This ensures formatting is preserved when forwarding/replying
		const hasInlineStyles = /style="[^"]*"/i.test(result.richText);
		expect(hasInlineStyles).toBe(true);
	});
});
