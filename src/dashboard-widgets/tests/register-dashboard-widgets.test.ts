/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerActions } from '@zextras/carbonio-shell-ui';

import { WIDGET_ACTION_TYPE } from 'dashboard-widgets/constants';
import { formatBytes } from 'dashboard-widgets/folders-size-widget';
import { foldersWidget } from 'dashboard-widgets/folders-widget';
import { registerDashboardWidgets } from 'dashboard-widgets/register-dashboard-widgets';

describe('registerDashboardWidgets', () => {
	it('registers the folders and the invites widgets', () => {
		registerDashboardWidgets();
		expect(registerActions).toHaveBeenCalledWith(
			{
				id: 'carbonio-mails-ui:folders-unread',
				type: WIDGET_ACTION_TYPE,
				action: expect.any(Function)
			},
			{
				id: 'carbonio-mails-ui:folders-size',
				type: WIDGET_ACTION_TYPE,
				action: expect.any(Function)
			},
			{
				id: 'carbonio-mails-ui:pending-invites',
				type: WIDGET_ACTION_TYPE,
				action: expect.any(Function)
			}
		);
	});

	describe('folders widget config', () => {
		it('round-trips a valid config', () => {
			const config = { folderIds: ['2', '3'] };
			expect(foldersWidget.deserialize(foldersWidget.serialize(config))).toEqual(config);
		});

		it.each([
			undefined,
			{ v: 9, data: '{}' },
			{ v: 1, data: 'not json' },
			{ v: 1, data: '{"folderIds":[1]}' }
		])('falls back to the default config on invalid input %j', (input) => {
			expect(foldersWidget.deserialize(input)).toEqual(foldersWidget.defaultConfig);
		});
	});

	it('formats the sizes with the proper unit', () => {
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(2048)).toBe('2.0 KB');
		expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
		expect(formatBytes(3 * 1024 ** 3)).toBe('3.0 GB');
	});
});
