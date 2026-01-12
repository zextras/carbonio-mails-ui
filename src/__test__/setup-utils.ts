/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as hooks from '@zextras/carbonio-shell-ui';

import { generateSettings } from '@test-utils/settings/settings-generator';

export const setupViewByMessage = (): void => {
	const settings = generateSettings({
		prefs: {
			zimbraPrefGroupMailBy: 'message'
		}
	});
	vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
};

export const setupViewByConversation = (): void => {
	const settings = generateSettings({
		prefs: {
			zimbraPrefGroupMailBy: 'conversation'
		}
	});
	vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
};
