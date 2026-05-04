/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Action, useActions } from '@zextras/carbonio-shell-ui';

import { PREVIEW_SAVE_ATTACHMENT_PROVIDER_TYPE } from './constants';

export type PreviewSaveAttachmentItem = {
	filename: string;
	contentType: string;
	size: number;
	downloadUrl: string;
};

export type PreviewSaveAttachmentProviderContext = {
	attachments: Array<PreviewSaveAttachmentItem>;
};

export type PreviewSaveAttachmentProvider = Action & { id: string };

export const usePreviewSaveAttachmentProviders = (
	context: PreviewSaveAttachmentProviderContext
): Array<PreviewSaveAttachmentProvider> =>
	useActions<PreviewSaveAttachmentProviderContext, PreviewSaveAttachmentProvider>(
		context,
		PREVIEW_SAVE_ATTACHMENT_PROVIDER_TYPE
	) ?? [];
