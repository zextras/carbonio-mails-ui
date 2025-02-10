/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SelectItem } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
// TODO refactor IRIS-4324
import { filter } from 'lodash';

export const ShareCalendarRoleOptions = (t: TFunction, canViewPrvtAppt?: boolean): SelectItem[] => [
	{ label: t('share.options.share_calendar_role.none', 'None'), value: '' },
	{
		label: t('share.options.share_calendar_role.viewer', 'Viewer'),
		value: canViewPrvtAppt ? 'rp' : 'r'
	},
	{
		label: t('share.options.share_calendar_role.admin', 'Admin'),
		value: canViewPrvtAppt ? 'rwidxap' : 'rwidxa'
	},
	{
		label: t('share.options.share_calendar_role.manager', 'Manager'),
		value: canViewPrvtAppt ? 'rwidxp' : 'rwidx'
	}
];

export const findLabel = (
	list: { value: unknown; label: string }[],
	value: unknown
): string | undefined => filter(list, (item) => item.value === value)[0]?.label;
