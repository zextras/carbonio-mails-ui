/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useComposerIntegrationStore } from 'store/composer-integrations/store';
import type { ComposerIntegrationConfig } from 'types/integrations/composer-integration';

/**
 * Registers a new entry in the composer's "Add Attachments" dropdown.
 *
 * This function is exposed to external Carbonio modules via the shell function registry
 * under the id 'register-composer-integration'. External modules should retrieve it with:
 *
 * ```ts
 * const [registerIntegration, isAvailable] = getIntegratedFunction('register-composer-integration');
 * ```
 *
 * Registering the same `id` twice overwrites the previous entry (last-write-wins).
 * The registration is permanent for the lifetime of the session; call
 * useComposerIntegrationStore.getState().unregister(id) to remove it.
 */
export const registerComposerIntegration = (config: ComposerIntegrationConfig): void => {
	if (
		!config.id ||
		typeof config.id !== 'string' ||
		!config.label ||
		typeof config.label !== 'string' ||
		typeof config.icon !== 'string' ||
		typeof config.onClick !== 'function'
	) {
		console.warn('[carbonio-mails-ui] registerComposerIntegration: invalid config', config);
		return;
	}
	useComposerIntegrationStore.getState().register(config);
};
