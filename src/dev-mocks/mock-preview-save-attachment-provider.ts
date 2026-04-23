/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * DEV/QA ONLY — simulates an external module registering as a save destination
 * for attachments in the mail preview panel via the
 * 'mails-preview-save-attachment-provider' integration type.
 *
 * This file must NOT be imported in production builds.
 * It is kept in the dev/mock-external-attachment-provider branch for
 * designer and QA testing of the PreviewSaveAttachmentProviders integration.
 */

import { registerActions, t } from '@zextras/carbonio-shell-ui';

import {
	PreviewSaveAttachmentProvider,
	PreviewSaveAttachmentProviderContext
} from 'views/app/detail-panel/preview/preview-utils-hooks/use-preview-save-attachment-providers';

export const registerMockPreviewSaveAttachmentProvider = (): void => {
	registerActions<PreviewSaveAttachmentProvider>({
		id: 'mock-external-storage-preview-save-attachment',
		type: 'mails-preview-save-attachment-provider',
		action: (context): PreviewSaveAttachmentProvider => {
			const { attachments } = context as PreviewSaveAttachmentProviderContext;
			return {
				id: 'mock-external-storage-preview-save-attachment',
				label: t('mock.external_storage.save_attachment', '[MOCK] Save to External Storage'),
				icon: 'CloudUploadOutline',
				execute: (): void => {
					attachments.forEach((att) => {
						fetch(att.downloadUrl, { credentials: 'same-origin' })
							.then((res) => res.blob())
							.then((blob) => {
								const blobUrl = URL.createObjectURL(blob);
								const anchor = document.createElement('a');
								anchor.href = blobUrl;
								anchor.download = att.filename;
								document.body.appendChild(anchor);
								anchor.click();
								document.body.removeChild(anchor);
								URL.revokeObjectURL(blobUrl);
							});
					});
				}
			};
		}
	});
};
