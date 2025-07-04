/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as shell from '@zextras/carbonio-shell-ui';

export * from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';

export const useAuthenticated = jest
	.fn<ReturnType<typeof shell.useAuthenticated>, Parameters<typeof shell.useAuthenticated>>()
	.mockReturnValue(true);
