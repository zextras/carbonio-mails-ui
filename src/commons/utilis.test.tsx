/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getTimeLabel } from './utils';
import * as shell from '../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import defaultSettings from '../carbonio-ui-commons/test/mocks/settings/default-settings';

describe('getTimeLabel', () => {
	describe('the date is formatted using local', () => {
		test.each([
			{ locale: 'en', output: 'MM/DD/YYYY', expected: '07/01/2020 12:00 AM' },
			{ locale: 'it', output: 'DD/MM/YYYY', expected: '01/07/2020 00:00' }
		])('when locale is $locale the output is $output', ({ locale, output, expected }) => {
			shell.getUserSettings.mockImplementation(() => ({
				...defaultSettings,
				prefs: {
					...defaultSettings.prefs,
					zimbraPrefLocale: locale
				}
			}));
			const date = 1593554400000;
			const timeLabel = getTimeLabel(date);

			expect(timeLabel).toBe(expected);
		});
	});
	test.todo('if the date is today it will shows only the hours');
	test.todo('if the date is not today it will shows date and hours');
});
