/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerFunctions } from '@zextras/carbonio-shell-ui';

import {
	openComposerSharedFunction,
	openPrefilledComposerSharedFunction
} from '../integrations/shared-functions';

export const registerShellIntegrations = (): void => {
	registerFunctions(
		{
			id: 'compose',
			// TOFIX-SHELL: fix the function type definition
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			fn: openComposerSharedFunction
		},
		{
			id: 'composePrefillMessage',
			fn: openPrefilledComposerSharedFunction
		}
	);
};
