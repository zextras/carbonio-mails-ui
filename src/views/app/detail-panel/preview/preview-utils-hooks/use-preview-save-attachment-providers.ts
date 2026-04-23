/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { Action, useActions } from '@zextras/carbonio-shell-ui';

import { PREVIEW_SAVE_ATTACHMENT_PROVIDER_TYPE } from './constants';

export type PreviewSaveAttachmentProviderContext = {
	filename: string;
	contentType: string;
	size: number;
	downloadUrl: string;
};

export type PreviewSaveAttachmentProvider = Action & { id: string };

export const usePreviewSaveAttachmentProviders = ({
	filename,
	contentType,
	size,
	downloadUrl
}: PreviewSaveAttachmentProviderContext): Array<PreviewSaveAttachmentProvider> => {
	const context = useMemo<PreviewSaveAttachmentProviderContext>(
		() => ({ filename, contentType, size, downloadUrl }),
		[filename, contentType, size, downloadUrl]
	);

	return (
		useActions<PreviewSaveAttachmentProviderContext, PreviewSaveAttachmentProvider>(
			context,
			PREVIEW_SAVE_ATTACHMENT_PROVIDER_TYPE
		) ?? []
	);
};
