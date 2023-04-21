/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ChipType } from '../../../types';

export const findIconFromChip = (chip: ChipType): ChipType => {
	switch (chip.label) {
		case 'is:flagged':
			return {
				...chip,
				avatarIcon: 'FlagOutline',
				avatarBackground: 'error',
				value: 'is:flagged',
				hasAvatar: true,
				isQueryFilter: true
			};
		case 'is:unread':
			return {
				...chip,
				hasAvatar: true,
				avatarIcon: 'EmailOutline',
				value: 'is:unread',
				isQueryFilter: true
			};
		case 'has:attachment':
			return {
				...chip,
				hasAvatar: true,
				avatarIcon: 'AttachOutline',
				value: 'has:attachment',
				isQueryFilter: true,
				avatarBackground: 'gray1'
			};

		case chip.label.match(/^in:*/)?.input:
			return {
				...chip,
				hasAvatar: true,
				value: chip.label,
				avatarIcon: 'FolderOutline',
				isQueryFilter: true,
				avatarBackground: 'gray1'
			};

		case chip.label.match(/^subject:*/)?.input:
			return {
				...chip,
				hasAvatar: true,
				value: chip.label,
				avatarIcon: 'EmailOutline',
				isQueryFilter: true,
				avatarBackground: 'gray1'
			};
		case chip.label.match(/^tag:*/)?.input:
			return {
				...chip,
				hasAvatar: true,
				value: chip.label,
				avatarIcon: 'TagOutline',
				isQueryFilter: true,
				avatarBackground: 'gray1'
			};

		case chip.label.match(/^before:*/)?.input:
			return {
				...chip,
				hasAvatar: true,
				value: chip.label,
				avatarIcon: 'CalendarOutline',
				isQueryFilter: true,
				avatarBackground: 'gray1'
			};

		case chip.label.match(/^after:*/)?.input:
			return {
				...chip,
				hasAvatar: true,
				value: chip.label,
				avatarIcon: 'CalendarOutline',
				isQueryFilter: true,
				avatarBackground: 'gray1'
			};
		case chip.label.match(/^date:*/)?.input:
			return {
				...chip,
				hasAvatar: true,
				value: chip.label,
				avatarIcon: 'CalendarOutline',
				isQueryFilter: true,
				avatarBackground: 'gray1'
			};

		default:
			return {
				...chip,
				value: chip.label,
				avatarIcon: 'MailModOutline',
				avatarBackground: 'gray1',
				isQueryFilter: true
			};
	}
};
