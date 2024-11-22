/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { convertHtmlToPlainText } from './utilities';
import { getTimeLabel } from './utils';
import * as shell from '../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import defaultSettings from '../carbonio-ui-commons/test/mocks/settings/default-settings';

describe('getTimeLabel', () => {
	describe('the date is formatted using local', () => {
		test.each([
			{ locale: 'en', output: 'MM/DD/YYYY', expected: '07/01/2020 12:00 AM' },
			{ locale: 'it', output: 'DD/MM/YYYY', expected: '01/07/2020 00:00' }
		])('when locale is $locale the output is $output', ({ locale, expected }) => {
			shell.getUserSettings.mockReturnValueOnce({
				...defaultSettings,
				prefs: {
					...defaultSettings.prefs,
					zimbraPrefLocale: locale
				}
			});
			const date = 1593554400000;
			const timeLabel = getTimeLabel(date);

			expect(timeLabel).toBe(expected);
		});
	});
	test('if the date is today it will shows only the hours', () => {
		jest.setSystemTime(new Date('2022-01-01'));
		const date = Date.now();
		const expected = '1:00 AM';
		const timeLabel = getTimeLabel(date);
		expect(timeLabel).toBe(expected);
	});
	test('if the date is not today it will shows date and hours', () => {
		jest.setSystemTime(new Date('2022-01-01'));
		const date = new Date('2021-01-01');
		const expected = '01/01/2021 1:00 AM';
		const timeLabel = getTimeLabel(date.getTime());
		expect(timeLabel).toBe(expected);
	});
});

describe('convertHtmlToPlainText', () => {
	test('convertHtmlToPlainText with plain text', () => {
		expect(convertHtmlToPlainText('')).toBe('');
		expect(convertHtmlToPlainText('lorem ipsum')).toBe('lorem ipsum');
		expect(convertHtmlToPlainText('lorem\nipsum')).toBe('lorem\nipsum');
	});

	test('convertHtmlToPlainText with span', () => {
		expect(convertHtmlToPlainText('<span>lorem ipsum</span>')).toBe('lorem ipsum');
		expect(convertHtmlToPlainText('<span>lorem</span> ipsum')).toBe('lorem ipsum');
		expect(convertHtmlToPlainText('lorem <span>ipsum</span>')).toBe('lorem ipsum');
		expect(convertHtmlToPlainText('lorem <span>ipsum</span> dolor')).toBe('lorem ipsum dolor');
	});

	test('convertHtmlToPlainText with html', () => {
		expect(convertHtmlToPlainText('lorem ipsum <p>lorem ipsum</p> <div>lorem ipsum</div>')).toBe(
			'lorem ipsum \n\nlorem ipsum \nlorem ipsum'
		);
	});

	test('removes CDATA tag from html', () => {
		expect(
			convertHtmlToPlainText(`
<html lang="en">
<style>
    /*<![CDATA[*/p { margin: 0; } * {} /*]]>*/
</style>
<body><div><div><p>Sample Text</p></div></body>
</html>`).trim()
		).toBe('Sample Text');
	});

	test('convertHtmlToPlainText with html and script', () => {
		expect(
			convertHtmlToPlainText(
				'lorem ipsum <p>lorem ipsum</p> <div>lorem ipsum</div> <script>lorem ipsum</script>'
			)
		).toBe('lorem ipsum \n\nlorem ipsum \nlorem ipsum ');
	});

	test('convertHtmlToPlainText with html and style', () => {
		expect(
			convertHtmlToPlainText(
				'lorem ipsum <p>lorem ipsum</p> <div>lorem ipsum</div> <style>lorem ipsum</style>'
			)
		).toBe('lorem ipsum \n\nlorem ipsum \nlorem ipsum ');
	});

	test('convertHtmlToPlainText with html and br', () => {
		expect(
			convertHtmlToPlainText(
				'lorem ipsum <p>lorem ipsum</p> <div>lorem ipsum</div> <br><div>lorem ipsum</div>'
			)
		).toBe('lorem ipsum \n\nlorem ipsum \nlorem ipsum \n\nlorem ipsum');
	});

	test('convertHtmlToPlainText with img', () => {
		expect(
			convertHtmlToPlainText(
				'lorem ipsum <img src="https://www.zextras.com/wp-content/uploads/2020/10/Logo_Zextras_2020.png" alt="Zextras">'
			)
		).toBe('lorem ipsum ');
	});
});
