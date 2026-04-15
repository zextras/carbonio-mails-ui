/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerFunctions } from '@zextras/carbonio-shell-ui';

import { registerComposerIntegration } from 'integrations/composer-integration-functions';
import {
	openComposerSharedFunction,
	openPrefilledComposerSharedFunction
} from 'integrations/shared-functions';

/*
 * Expose 'register-composer-integration' at module-load time — before any React
 * rendering — so that external modules can safely call it during their own
 * bootstrap sequence regardless of mount order.
 */
registerFunctions({
	id: 'register-composer-integration',
	fn: registerComposerIntegration
});

export const registerShellIntegrations = (): void => {
	registerFunctions(
		{
			id: 'compose',
			fn: openComposerSharedFunction
		},
		{
			id: 'composePrefillMessage',
			fn: openPrefilledComposerSharedFunction
		}
	);

};
