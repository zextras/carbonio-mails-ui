/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isEqual, transform, isObject, filter } from 'lodash';

export const ShareCalendarWithOptions = (t) => [
	{
		label: t('share.options.share_calendar_with.internal_users_groups', 'Internal Users or Groups'),
		value: 'usr'
	},
	{
		label: t('share.options.share_calendar_with.external_guests', 'External guests (view only)'),
		value: '',
		disabled: true
	},
	{
		label: t(
			'share.options.share_calendar_with.public',
			'Public (view only, no password required)'
		),
		value: 'pub'
	}
];

export const ShareCalendarRoleOptions = (t, canViewPrvtAppt) => [
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
export const differenceObject = (object, base) => {
	// eslint-disable-next-line no-shadow
	function changes(object, base) {
		return transform(object, (result, value, key) => {
			if (!isEqual(value, base[key])) {
				// eslint-disable-next-line no-param-reassign
				result[key] = isObject(value) && isObject(base[key]) ? changes(value, base[key]) : value;
			}
		});
	}
	return changes(object, base);
};

export const validEmailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

export const validEmail = (email) => !!validEmailRegex.test(email);

export const findLabel = (list, value) => filter(list, (item) => item.value === value)[0]?.label;
