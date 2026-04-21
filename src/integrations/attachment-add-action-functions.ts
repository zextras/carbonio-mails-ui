/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useAttachmentAddActionStore } from 'store/attachment-add-actions/store';
import type { AttachmentAddActionConfig } from 'types/integrations/attachment-add-action';

/**
 * Registers a new entry in the composer's "Add Attachments" dropdown.
 *
 * This function is exposed to external Carbonio modules via the shell function registry
 * under the id 'register-attachment-add-action'. External modules should retrieve it with:
 *
 * ```ts
 * const [registerIntegration, isAvailable] = getIntegratedFunction('register-attachment-add-action');
 * ```
 *
 * Registering the same `id` twice overwrites the previous entry (last-write-wins).
 * The registration is permanent for the lifetime of the session; call
 * useAttachmentAddActionStore.getState().unregister(id) to remove it.
 */
export const registerAttachmentAddAction = (config: AttachmentAddActionConfig): void => {
	if (
		!config.id ||
		typeof config.id !== 'string' ||
		!config.label ||
		typeof config.label !== 'string' ||
		typeof config.icon !== 'string' ||
		typeof config.onClick !== 'function'
	) {
		console.warn('[carbonio-mails-ui] registerAttachmentAddAction: invalid config', config);
		return;
	}
	useAttachmentAddActionStore.getState().register(config);
};
