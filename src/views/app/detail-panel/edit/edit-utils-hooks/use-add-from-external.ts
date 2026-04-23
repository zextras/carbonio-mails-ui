/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { Action, useActions } from '@zextras/carbonio-shell-ui';

import { ADD_ATTACHMENT_PROVIDER_TYPE } from './constants';
import { useLocalAttachmentOrSmartlink } from './use-local-attachment-or-smartlink';

export type AddAttachmentProviderContext = {
	onFilesSelected: (files: File[]) => void;
};

export type AddAttachmentProvider = Action & { id: string };

export const useAddFromExternal = ({
	editorId
}: {
	editorId: string;
}): Array<AddAttachmentProvider> => {
	const { addLocalFiles } = useLocalAttachmentOrSmartlink({ editorId });

	const context = useMemo<AddAttachmentProviderContext>(
		() => ({ onFilesSelected: addLocalFiles }),
		[addLocalFiles]
	);

	return (
		useActions<AddAttachmentProviderContext, AddAttachmentProvider>(
			context,
			ADD_ATTACHMENT_PROVIDER_TYPE
		) ?? []
	);
};
