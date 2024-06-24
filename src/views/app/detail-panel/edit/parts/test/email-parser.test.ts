import { emailParser } from '../email-parser';

/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
describe('mail-parser can parse', () => {
	it('single valid email', () => {
		const parsed = emailParser().parseMultipleEmails('daniele@email.it');
		expect(parsed).toStrictEqual(['daniele@email.it']);
	});

	it('multiple valid emails separated by comma', () => {
		const parsed = emailParser().parseMultipleEmails('daniele@email.it,alessio@email.it');
		expect(parsed).toStrictEqual(['daniele@email.it', 'alessio@email.it']);
	});

	it('multiple valid emails separated by comma and spaces', () => {
		const parsed = emailParser().parseMultipleEmails(
			'daniele@email.it, alessio@email.it, nicola@email.it'
		);
		expect(parsed).toStrictEqual(['daniele@email.it', 'alessio@email.it', 'nicola@email.it']);
	});

	it('multiple valid emails separated by semicolon', () => {
		const parsed = emailParser().parseMultipleEmails(
			'daniele@email.it;davide@email.it;pierfrancesco@email.it;alessio@email.it'
		);
		expect(parsed).toStrictEqual([
			'daniele@email.it',
			'davide@email.it',
			'pierfrancesco@email.it',
			'alessio@email.it'
		]);
	});

	it('mix comma, semicolon and spaces', () => {
		const parsed = emailParser().parseMultipleEmails(
			'daniele@email.it, giuliano@email.it,davide@email.it ;pierfrancesco@email.it ; alessio@email.it'
		);
		expect(parsed).toStrictEqual([
			'daniele@email.it',
			'giuliano@email.it',
			'davide@email.it',
			'pierfrancesco@email.it',
			'alessio@email.it'
		]);
	});

	it('ignore empty entries', () => {
		const parsed = emailParser().parseMultipleEmails(
			'daniele@email.it;;alessio@email.it;;nicola@email.it ;'
		);
		expect(parsed).toStrictEqual(['daniele@email.it', 'alessio@email.it', 'nicola@email.it']);
	});

	it('single valid email with name', () => {
		const parsed = emailParser().parseMultipleEmails('"Daniele" <daniele@email.it>');
		expect(parsed).toStrictEqual(['daniele@email.it']);
	});

	it('multiple emails with name', () => {
		const parsed = emailParser().parseMultipleEmails(
			'"Daniele" <daniele@email.it>, "Luca" <luca@email.it>, "Alessio" <alessio@email.it>'
		);
		expect(parsed).toStrictEqual(['daniele@email.it', 'luca@email.it', 'alessio@email.it']);
	});

	it('mix mails with and without name', () => {
		const parsed = emailParser().parseMultipleEmails(
			'nicola@email.it;"Daniele" <daniele@email.it>, "Luca" <luca@email.it>, ; giuliano@email.it; "Alessio" <alessio@email.it>'
		);
		expect(parsed).toStrictEqual([
			'nicola@email.it',
			'daniele@email.it',
			'luca@email.it',
			'giuliano@email.it',
			'alessio@email.it'
		]);
	});

	it('ignore non valid mails', () => {
		const parsed = emailParser().parseMultipleEmails(
			'daniele@email.it;invalid;another@invalid;nicola@email.it,@invalid.it'
		);
		expect(parsed).toStrictEqual(['daniele@email.it', 'nicola@email.it']);
	});

	it('ignore non valid mails with names', () => {
		const parsed = emailParser().parseMultipleEmails(
			'daniele@email.it;"Invalid" <invalid>; "Another" <another@invalid>;"Alessio" <alessio@email.it>'
		);
		expect(parsed).toStrictEqual(['daniele@email.it', 'alessio@email.it']);
	});

	it('separate also with a newline character', () => {
		const parsed = emailParser().parseMultipleEmails(
			'daniele@email.it\n"Valid"\n<a@valid.email>;\n"Another" <another@valid.it>; \n "Alessio" <alessio@email.it>'
		);
		expect(parsed).toStrictEqual([
			'daniele@email.it',
			'a@valid.email',
			'another@valid.it',
			'alessio@email.it'
		]);
	});

	it('empty string', () => {
		const parsed = emailParser().parseMultipleEmails('');
		expect(parsed).toStrictEqual([]);
	});

	it('invalid string', () => {
		const parsed = emailParser().parseMultipleEmails('invalid');
		expect(parsed).toStrictEqual([]);
	});
});
