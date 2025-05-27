/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as shell from '@zextras/carbonio-shell-ui';

export * from '../../src/__test__/mocks/carbonio-shell-ui';

// TODO move it in the Commons submodule
export const useAuthenticated = jest
	.fn<ReturnType<typeof shell.useAuthenticated>, Parameters<typeof shell.useAuthenticated>>()
	.mockReturnValue(true);
