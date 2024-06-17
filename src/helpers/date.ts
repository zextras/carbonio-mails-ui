/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

function timezoneOffset(targetDateInUtcTZ: Date, timezone: string): string {
	const options: Intl.DateTimeFormatOptions = {
		timeZone: timezone,
		timeZoneName: 'longOffset'
	};
	const formatter = new Intl.DateTimeFormat([], options);
	const formatted = formatter.format(targetDateInUtcTZ);
	const offset = formatted.split('GMT')[1];
	if (offset === '') return '+00:00';
	return offset;
}

function replaceTimeZoneWithUTC(date: Date): Date {
	const result = new Date(date);
	const timezoneOffset = result.getTimezoneOffset();
	result.setMinutes(result.getMinutes() - timezoneOffset);
	return result;
}

function replaceOffset(date: Date, targetOffset: string): Date {
	return new Date(date.toISOString().replace('Z', targetOffset));
}

function normalize(timezone: string): string {
	if (timezone === 'GMT/UTC') return 'UTC';
	return timezone;
}

export function replaceTimeZone(date: Date, timezone: string): Date {
	const targetTimezone = normalize(timezone);
	const dateWithUTCTimezone = replaceTimeZoneWithUTC(date);
	const offset = timezoneOffset(dateWithUTCTimezone, targetTimezone);
	return replaceOffset(dateWithUTCTimezone, offset);
}
