/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { findIconFromChip } from './use-find-icon';

describe('findIconFromChip', () => {
	it('should handle is:flagged case', () => {
		const chip = { label: 'is:flagged' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			avatarIcon: 'FlagOutline',
			avatarBackground: 'error',
			value: 'is:flagged',
			hasAvatar: true,
			isQueryFilter: true
		});
	});

	it('should handle is:unread case', () => {
		const chip = { label: 'is:unread' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			hasAvatar: true,
			avatarIcon: 'EmailOutline',
			value: 'is:unread',
			isQueryFilter: true
		});
	});

	it('should handle has:attachment case', () => {
		const chip = { label: 'has:attachment' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			hasAvatar: true,
			avatarIcon: 'AttachOutline',
			value: 'has:attachment',
			isQueryFilter: true,
			avatarBackground: 'gray1'
		});
	});

	it('should handle in: prefix case', () => {
		const chip = { label: 'in:inbox' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			hasAvatar: true,
			value: 'in:inbox',
			avatarIcon: 'FolderOutline',
			isQueryFilter: true,
			avatarBackground: 'gray1'
		});
	});

	it('should handle subject: prefix case', () => {
		const chip = { label: 'subject:test' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			hasAvatar: true,
			value: 'subject:test',
			avatarIcon: 'EmailOutline',
			isQueryFilter: true,
			avatarBackground: 'gray1'
		});
	});

	it('should handle tag: prefix case', () => {
		const chip = { label: 'tag:important' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			hasAvatar: true,
			value: 'tag:important',
			avatarIcon: 'TagOutline',
			isQueryFilter: true,
			avatarBackground: 'gray1'
		});
	});

	it('should handle from: prefix case', () => {
		const chip = { label: 'from:test@example.com' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			hasAvatar: true,
			value: 'from:test@example.com',
			avatarIcon: 'PersonOutline',
			isQueryFilter: true,
			avatarBackground: 'gray1'
		});
	});

	it('should handle to: prefix case', () => {
		const chip = { label: 'to:recipient@example.com' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			hasAvatar: true,
			value: 'to:recipient@example.com',
			avatarIcon: 'PersonOutline',
			isQueryFilter: true,
			avatarBackground: 'gray1'
		});
	});

	it('should handle after: prefix case', () => {
		const chip = { label: 'after:2023-12-01' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			hasAvatar: true,
			value: 'after:2023-12-01',
			avatarIcon: 'CalendarOutline',
			isQueryFilter: true,
			avatarBackground: 'gray1'
		});
	});

	it('should handle date: prefix case', () => {
		const chip = { label: 'date:2023-12-01' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			hasAvatar: true,
			value: 'date:2023-12-01',
			avatarIcon: 'CalendarOutline',
			isQueryFilter: true,
			avatarBackground: 'gray1'
		});
	});

	it('should handle before: prefix case', () => {
		const chip = { label: 'before:2023-12-01' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			hasAvatar: true,
			value: 'before:2023-12-01',
			avatarIcon: 'CalendarOutline',
			isQueryFilter: true,
			avatarBackground: 'gray1'
		});
	});

	it('should handle default case for unknown prefix', () => {
		const chip = { label: 'unknown:value' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			value: 'unknown:value',
			avatarIcon: 'MailModOutline',
			avatarBackground: 'gray1',
			isQueryFilter: true
		});
	});

	it('should handle default case for no prefix', () => {
		const chip = { label: 'simple text' };
		const result = findIconFromChip(chip);

		expect(result).toEqual({
			...chip,
			value: 'simple text',
			avatarIcon: 'MailModOutline',
			avatarBackground: 'gray1',
			isQueryFilter: true
		});
	});
});
