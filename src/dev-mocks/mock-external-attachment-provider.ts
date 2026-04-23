/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * DEV/QA ONLY — simulates an external module registering as an attachment provider
 * for the mail editor via the 'mails-editor-add-attachment-provider' integration type.
 *
 * This file must NOT be imported in production builds.
 * It is kept in a dedicated branch (dev/mock-external-attachment-provider) for
 * designer and QA testing of the EditorAddAttachmentProviders integration.
 */

import { registerActions, t } from '@zextras/carbonio-shell-ui';

import {
	EditorAddAttachmentProvider,
	EditorAddAttachmentProviderContext
} from 'views/app/detail-panel/edit/edit-utils-hooks/use-editor-add-attachment-providers';

export const registerMockExternalAttachmentProvider = (): void => {
	registerActions<EditorAddAttachmentProvider>({
		id: 'mock-external-storage-editor-add-attachment',
		type: 'mails-editor-add-attachment-provider',
		action: (context): EditorAddAttachmentProvider => {
			const { onFilesSelected } = context as EditorAddAttachmentProviderContext;
			return {
				id: 'mock-external-storage-editor-add-attachment',
				label: t('mock.external_storage.add_attachment', '[MOCK] Add from External Storage'),
				icon: 'CloudUploadOutline',
				execute: (): void => {
					const input = document.createElement('input');
					input.type = 'file';
					input.multiple = true;
					input.onchange = (): void => {
						if (input.files && input.files.length > 0) {
							onFilesSelected(Array.from(input.files));
						}
					};
					input.click();
				}
			};
		}
	});
};
