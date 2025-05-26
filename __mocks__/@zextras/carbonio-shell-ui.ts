/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shell from '@zextras/carbonio-shell-ui';
import * as shellMock from '@zextras/carbonio-ui-commons/carbonio-shell-ui-mock';

export default shellMock;

// TODO move it in the Commons submodule
export const useAuthenticated = jest
	.fn<ReturnType<typeof shell.useAuthenticated>, Parameters<typeof shell.useAuthenticated>>()
	.mockReturnValue(true);
