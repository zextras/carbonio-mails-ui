/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useAttachmentSaveActionStore } from 'store/attachment-save-actions/store';
import type { AttachmentSaveActionConfig } from 'types/integrations/attachment-save-action';

/**
 * Registers a new entry in the attachment hover bar's "Save to …" actions.
 *
 * This function is exposed to external Carbonio modules via the shell function registry
 * under the id 'register-attachment-save-action'. External modules should retrieve it with:
 *
 * ```ts
 * const [registerAction, isAvailable] = getIntegratedFunction('register-attachment-save-action');
 * ```
 *
 * Registering the same `id` twice overwrites the previous entry (last-write-wins).
 * The registration is permanent for the lifetime of the session; call
 * useAttachmentSaveActionStore.getState().unregister(id) to remove it.
 */
export const registerAttachmentSaveAction = (config: AttachmentSaveActionConfig): void => {
	if (
		!config.id ||
		typeof config.id !== 'string' ||
		!config.label ||
		typeof config.label !== 'string' ||
		typeof config.icon !== 'string' ||
		typeof config.onClick !== 'function'
	) {
		console.warn('[carbonio-mails-ui] registerAttachmentSaveAction: invalid config', config);
		return;
	}
	useAttachmentSaveActionStore.getState().register(config);
};
