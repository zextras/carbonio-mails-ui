/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { installRangeRectPolyfill, setupEditor } from './rich-toolbar-plugin-test-utils';
import { screen } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateSettings } from '@test-utils/settings/settings-generator';

beforeAll(() => {
	installRangeRectPolyfill();
});

describe('RichToolbarPlugin - default font from account settings', () => {
	it('shows the account default font and size when no explicit style has been applied', () => {
		useUserSettings.mockReturnValue(
			generateSettings({
				prefs: {
					zimbraPrefHtmlEditorDefaultFontFamily: 'tahoma, arial, helvetica, sans-serif',
					zimbraPrefHtmlEditorDefaultFontSize: '18pt'
				}
			})
		);

		setupEditor();

		expect(screen.getByText('Tahoma')).toBeInTheDocument();
		expect(screen.getByText('18pt')).toBeInTheDocument();
	});
});
