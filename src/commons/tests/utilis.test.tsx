/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as shell from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import defaultSettings from '../../carbonio-ui-commons/test/mocks/settings/default-settings';
import { generateMessage } from '../../tests/generators/generateMessage';
import { MailMessagePart } from '../../types';
import { convertHtmlToPlainText } from '../utilities';
import { buildImageMap, getTimeLabel, updateImageSrc } from '../utils';

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

describe('updateImageSrc', () => {
	let img: HTMLImageElement;
	let imgMap: Record<string, { name: string }>;
	let msgId: string;

	beforeEach(() => {
		img = document.createElement('img');
		imgMap = { cid123: { name: 'image1.png' } };
		msgId = 'test-message-id';
	});

	it('should update src with dfsrc value when showImage is true', () => {
		img.setAttribute('dfsrc', 'https://example.com/image.png');
		updateImageSrc(img, imgMap, true, msgId);
		expect(img).toHaveAttribute('src', 'https://example.com/image.png');
	});

	it('should not update src if dfsrc is missing', () => {
		img.setAttribute('src', 'https://example.com/original.png');
		updateImageSrc(img, imgMap, true, msgId);
		expect(img).toHaveAttribute('src', 'https://example.com/original.png');
	});

	it('should not update src if showImage is false', () => {
		img.setAttribute('dfsrc', 'https://example.com/image.png');
		img.setAttribute('src', 'https://example.com/original.png');
		updateImageSrc(img, imgMap, false, msgId);
		expect(img).toHaveAttribute('src', 'https://example.com/original.png');
	});

	it('should update src if extracted content ID is found in imgMap', () => {
		img.setAttribute('src', 'cid:cid123');
		updateImageSrc(img, imgMap, true, msgId);
		expect(img).toHaveAttribute('pnsrc', 'cid:cid123');
		expect(img).toHaveAttribute(
			'src',
			'/service/home/~/?auth=co&id=test-message-id&part=image1.png'
		);
	});

	it('should not update src if extracted content ID is not in imgMap', () => {
		img.setAttribute('src', 'cid:unknown123');
		updateImageSrc(img, imgMap, true, msgId);
		expect(img).toHaveAttribute('src', 'cid:unknown123');
	});

	it('should set pnsrc attribute to previous src before updating', () => {
		img.setAttribute('src', 'cid:cid123');
		updateImageSrc(img, imgMap, true, msgId);
		expect(img).toHaveAttribute('pnsrc', 'cid:cid123');
	});

	it('should not update src if no match is found in _CI_SRC_REGEX', () => {
		img.setAttribute('src', 'https://example.com/not-a-cid.png');
		updateImageSrc(img, imgMap, true, msgId);
		expect(img).toHaveAttribute('src', 'https://example.com/not-a-cid.png');
	});
});

describe('buildImageMap', () => {
	test('should return correct map when ci values match regex', () => {
		const parts = [
			{ ci: '<ci-123>', name: 'part1' },
			{ ci: '<ci-456>', name: 'part2' }
		] as MailMessagePart[];

		const expected = {
			'ci-123': { ci: '<ci-123>', name: 'part1' },
			'ci-456': { ci: '<ci-456>', name: 'part2' }
		};

		expect(buildImageMap(parts)).toEqual(expected);
	});

	test('should return an empty object when no ci values match regex', () => {
		const parts = [
			{ ci: 'invalid-123', name: 'part1' },
			{ ci: 'another-invalid', name: 'part2' }
		] as MailMessagePart[];

		expect(buildImageMap(parts)).toEqual({});
	});

	test('should return an empty object when ci is missing or null', () => {
		const parts = [
			{ ci: null, name: 'part1' },
			{ ci: undefined, name: 'part2' }
		] as MailMessagePart[];

		expect(buildImageMap(parts)).toEqual({});
	});

	test('should overwrite duplicate keys with the last occurrence', () => {
		const parts = [
			{ ci: '<ci-123>', name: 'part1' },
			{ ci: '<ci-123>', name: 'part2' }
		] as MailMessagePart[];

		const expected = {
			'ci-123': { ci: '<ci-123>', name: 'part2' }
		};

		expect(buildImageMap(parts)).toEqual(expected);
	});

	test('should handle an empty array input', () => {
		expect(buildImageMap([])).toEqual({});
	});
});
