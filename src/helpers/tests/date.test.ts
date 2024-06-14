/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { replaceTimeZone } from '../date';

describe('replaceTimeZone', () => {
	test('with UTC', () => {
		const inputDate = new Date(2024, 6 - 1, 2, 14, 30);
		const result = replaceTimeZone(inputDate, 'UTC');
		expect(result.toISOString()).toBe('2024-06-02T14:30:00.000Z');
	});

	test('with GMT', () => {
		const inputDate = new Date(2024, 6 - 1, 2, 14, 30);
		const result = replaceTimeZone(inputDate, 'GMT');
		expect(result.toISOString()).toBe('2024-06-02T14:30:00.000Z');
	});

	test('with GMT/UTC', () => {
		const inputDate = new Date(2024, 6 - 1, 2, 14, 30);
		const result = replaceTimeZone(inputDate, 'GMT/UTC');
		expect(result.toISOString()).toBe('2024-06-02T14:30:00.000Z');
	});

	test('with Africa/Monrovia', () => {
		const inputDate = new Date(2024, 6 - 1, 2, 14, 30);
		const result = replaceTimeZone(inputDate, 'Africa/Monrovia');
		expect(result.toISOString()).toBe('2024-06-02T14:30:00.000Z');
	});

	test('with asia/kabul', () => {
		const inputDate = new Date(2024, 6 - 1, 2, 14, 30);
		const result = replaceTimeZone(inputDate, 'Asia/Kabul');
		expect(result.toISOString()).toBe('2024-06-02T10:00:00.000Z');
	});

	test('with europe/rome', () => {
		const inputDate = new Date(2024, 6 - 1, 2, 14, 30);
		const result = replaceTimeZone(inputDate, 'Europe/Rome');
		expect(result.toISOString()).toBe('2024-06-02T12:30:00.000Z');
	});

	test('with Africa/Casablanca', () => {
		const inputDate = new Date(2024, 6 - 1, 2, 14, 30);
		const result = replaceTimeZone(inputDate, 'Africa/Casablanca');
		expect(result.toISOString()).toBe('2024-06-02T13:30:00.000Z');
	});

	test('with Asia/Kamchatka', () => {
		const inputDate = new Date(2024, 6 - 1, 2, 14, 30);
		const result = replaceTimeZone(inputDate, 'Asia/Kamchatka');
		expect(result.toISOString()).toBe('2024-06-02T02:30:00.000Z');
	});

	test('with America/Indiana/Indianapolis', () => {
		const inputDate = new Date(2024, 6 - 1, 2, 14, 30);
		const result = replaceTimeZone(inputDate, 'America/Indiana/Indianapolis');
		expect(result.toISOString()).toBe('2024-06-02T18:30:00.000Z');
	});

	test('with Etc/GMT+12', () => {
		const inputDate = new Date(2024, 6 - 1, 2, 14, 30);
		const result = replaceTimeZone(inputDate, 'Etc/GMT+12'); // this is actually GMT-12 !!
		expect(result.toISOString()).toBe('2024-06-03T02:30:00.000Z');
	});
});
