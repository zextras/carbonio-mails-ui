/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerFunctions } from '@zextras/carbonio-shell-ui';

import { registerAttachmentAddAction } from 'integrations/attachment-add-action-functions';
import { registerAttachmentSaveAction } from 'integrations/attachment-save-action-functions';
import {
	openComposerSharedFunction,
	openPrefilledComposerSharedFunction
} from 'integrations/shared-functions';

/*
 * Expose integration registration functions at module-load time — before any React
 * rendering — so that external modules can safely call them during their own
 * bootstrap sequence regardless of mount order.
 */
registerFunctions({
	id: 'register-attachment-add-action',
	fn: registerAttachmentAddAction
});

registerFunctions({
	id: 'register-attachment-save-action',
	fn: registerAttachmentSaveAction
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
