/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { MAIL_APP_ID } from '../constants';

export const useHighlightTaggedMessages = (): boolean => {
	const userSettings = useUserSettings();

	return useMemo(
		() =>
			userSettings?.props?.some(
				({ name, zimlet, _content }) =>
					zimlet === MAIL_APP_ID && name === 'highlight_tagged_messages' && _content === 'TRUE'
			),
		[userSettings?.props]
	);
};
