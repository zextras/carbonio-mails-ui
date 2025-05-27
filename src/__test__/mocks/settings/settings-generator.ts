/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AccountSettings } from '@zextras/carbonio-shell-ui';

import defaultSettings from './default-settings';

/**
 *
 * @param customSettings
 */
// TODO remove the any as soon as SHELL-66 will be completed
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const generateSettings = (customSettings?: Partial<AccountSettings>): AccountSettings => ({
	attrs: {
		...defaultSettings.attrs,
		...customSettings?.attrs
	},
	prefs: {
		...defaultSettings.prefs,
		...customSettings?.prefs
	},
	props: [...(customSettings?.props ?? defaultSettings.props)]
});

export { generateSettings };
