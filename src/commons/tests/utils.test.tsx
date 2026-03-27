/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Account } from '@zextras/carbonio-shell-ui';

import * as shellMock from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import defaultSettings from '@test-utils/settings/default-settings';
import { convertHtmlToPlainText } from 'commons/utilities';
import {
	buildImageMap,
	decodeSurrogatePairs,
	getTimeLabel,
	participantToString,
	updateImageSrc
} from 'commons/utils';
import { MailMessagePart } from 'types/messages';

describe('getTimeLabel', () => {
	describe('the date is formatted using local', () => {
		test.each([
			{ locale: 'en', output: 'MM/DD/YYYY', expected: '07/01/2020 12:00 AM' },
			{ locale: 'it', output: 'DD/MM/YYYY', expected: '01/07/2020 00:00' }
		])('when locale is $locale the output is $output', ({ locale, expected }) => {
			shellMock.getUserSettings.mockReturnValueOnce({
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
		vi.setSystemTime(new Date('2022-01-01'));
		const date = Date.now();
		const expected = '1:00 AM';
		const timeLabel = getTimeLabel(date);
		expect(timeLabel).toBe(expected);
	});
	test('if the date is not today it will shows date and hours', () => {
		vi.setSystemTime(new Date('2022-01-01'));
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

describe('participantToString', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return "Me" if the participant address matches an account', () => {
		const participant = { address: 'testAddress' };
		const accounts = [{ name: 'testAddress' } as Account];

		const result = participantToString(participant, accounts);
		expect(result).toBe('label.me');
	});

	it('should return the fullName if available', () => {
		const participant = { fullName: 'john doe' };
		const accounts = [] as Array<Account>;

		const result = participantToString(participant, accounts);
		expect(result).toBe('john doe');
	});

	it('should not change the casing of the fullName', () => {
		const participant = { fullName: 'joHn Doe' };
		const accounts = [] as Array<Account>;

		const result = participantToString(participant, accounts);
		expect(result).toBe('joHn Doe');
	});

	it('should not change the casing of the name', () => {
		const participant = { name: 'joHn' };
		const accounts = [] as Array<Account>;

		const result = participantToString(participant, accounts);
		expect(result).toBe('joHn');
	});

	it('should return the  name if fullName is not available', () => {
		const participant = { name: 'jane smith' };
		const accounts = [] as Array<Account>;

		const result = participantToString(participant, accounts);
		expect(result).toBe('jane smith');
	});

	it('should return the address if fullName and name are not available', () => {
		const participant = { address: 'example@test.com' };
		const accounts = [] as Array<Account>;

		const result = participantToString(participant, accounts);
		expect(result).toBe('example@test.com');
	});

	it('should return an empty string if no participant data is available', () => {
		const accounts = [] as Array<Account>;

		const result = participantToString(undefined, accounts);
		expect(result).toBe('');
	});

	it('should handle a single word correctly', () => {
		const participant = { name: 'single' };
		const accounts = [] as Array<Account>;

		const result = participantToString(participant, accounts);
		expect(result).toBe('single');
	});

	it('should handle an empty string for name and fullname', () => {
		const participant = { address: 'test@test.com', name: '', fullName: '' };
		const accounts = [] as Array<Account>;
		const result = participantToString(participant, accounts);
		expect(result).toBe('test@test.com');
	});

	it('should handle an empty string for address', () => {
		const participant = { address: '', name: 'test', fullName: 'test name' };
		const accounts = [] as Array<Account>;
		const result = participantToString(participant, accounts);
		expect(result).toBe('test name');
	});
});

describe('decodeSurrogatePairs', () => {
	it('decodes valid surrogate pairs', () => {
		const input = '\\uD83D\\uDE00'; // 😀 emoji
		const expected = '😀';
		expect(decodeSurrogatePairs(input)).toBe(expected);
	});

	it('returns original string for invalid surrogate pairs', () => {
		const input = '\\uD83D\\u1234'; // Invalid low surrogate
		const expected = '\\uD83D\\u1234';
		expect(decodeSurrogatePairs(input)).toBe(expected);
	});

	it('handles multiple valid surrogate pairs', () => {
		const input = '\\uD83D\\uDE00\\uD83D\\uDE02'; // 😀😂 emojis
		const expected = '😀😂';
		expect(decodeSurrogatePairs(input)).toBe(expected);
	});

	it('handles mixed valid and invalid surrogate pairs', () => {
		const input = '\\uD83D\\uDE00\\uD83D\\u1234'; // 😀 and invalid pair
		const expected = '😀\\uD83D\\u1234';
		expect(decodeSurrogatePairs(input)).toBe(expected);
	});

	it('returns original string if no surrogate pairs are present', () => {
		const input = 'Hello World';
		const expected = 'Hello World';
		expect(decodeSurrogatePairs(input)).toBe(expected);
	});

	it('handles edge case with only high surrogate', () => {
		const input = '\\uD83D';
		const expected = '\\uD83D';
		expect(decodeSurrogatePairs(input)).toBe(expected);
	});

	it('handles edge case with only low surrogate', () => {
		const input = '\\uDE00';
		const expected = '\\uDE00';
		expect(decodeSurrogatePairs(input)).toBe(expected);
	});

	it('handles empty string input', () => {
		const input = '';
		const expected = '';
		expect(decodeSurrogatePairs(input)).toBe(expected);
	});
});
