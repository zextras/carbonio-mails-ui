/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shell from '@zextras/carbonio-shell-ui';

export * from '../../src/carbonio-ui-commons/test/mocks/carbonio-shell-ui';

// TODO move it in the Commons submodule
export const useAuthenticated = jest.fn<
	ReturnType<typeof shell.useAuthenticated>,
	Parameters<typeof shell.useAuthenticated>
>();
