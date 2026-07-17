/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { Action, useActions } from '@zextras/carbonio-shell-ui';

import { EDITOR_ADD_ATTACHMENT_PROVIDER_TYPE } from './constants';
import { useLocalAttachmentOrSmartlink } from './use-local-attachment-or-smartlink';

export type EditorAddAttachmentProviderContext = {
	onFilesSelected: (files: File[]) => void;
};

export type EditorAddAttachmentProvider = Action & { id: string };

export const useEditorAddAttachmentProviders = ({
	editorId
}: {
	editorId: string;
}): Array<EditorAddAttachmentProvider> => {
	const { addLocalFiles } = useLocalAttachmentOrSmartlink({ editorId });

	const context = useMemo<EditorAddAttachmentProviderContext>(
		() => ({ onFilesSelected: addLocalFiles }),
		[addLocalFiles]
	);

	return (
		useActions<EditorAddAttachmentProviderContext, EditorAddAttachmentProvider>(
			context,
			EDITOR_ADD_ATTACHMENT_PROVIDER_TYPE
		) ?? []
	);
};
