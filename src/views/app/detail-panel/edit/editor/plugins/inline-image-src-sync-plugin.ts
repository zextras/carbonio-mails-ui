/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $nodesOfType } from 'lexical';

import { REPLACE_INLINE_IMAGE_SRC_COMMAND } from './image-plugin';
import { ImageNode } from './nodes/image-node';
import { isBlobUrl } from 'helpers/attachments';
import { convertCidUrlToServiceUrl } from 'store/editor/editor-transformations';
import { useEditorsStore } from 'store/editor/store';
import { MailsEditorV2 } from 'types/editor';

type InlineImageSrcSyncPluginProps = {
	editorId: MailsEditorV2['id'];
};

/**
 * Replaces the local preview of a freshly inserted inline image with the real
 * download url, as soon as the image shows up among the saved attachments of the
 * draft.
 *
 * The swap is driven by the store rather than by the callback of the draft save
 * which follows the upload: that save is debounced per hook instance, and the
 * one carrying the callback is dropped whenever another save is already running
 * (see `computeDraftSaveAllowedStatus`), so it cannot be relied upon. Watching
 * the saved attachments instead covers every save that persists the image, no
 * matter which one got there first.
 */
export const InlineImageSrcSyncPlugin = ({ editorId }: InlineImageSrcSyncPluginProps): null => {
	const [editor] = useLexicalComposerContext();
	const savedAttachments = useEditorsStore((state) => state.editors[editorId]?.savedAttachments);

	useEffect(() => {
		if (!savedAttachments?.length) {
			return;
		}

		const resolvedSrcByCidUrl = new Map<string, string>();
		editor.getEditorState().read(() => {
			$nodesOfType(ImageNode).forEach((node) => {
				const cidUrl = node.getCidUrl();
				if (!cidUrl || !isBlobUrl(node.getSrc()) || resolvedSrcByCidUrl.has(cidUrl)) {
					return;
				}
				const serviceUrl = convertCidUrlToServiceUrl(cidUrl, savedAttachments);
				// Unchanged means the image is not part of the saved draft yet: its
				// preview stays in place until a later save picks it up.
				if (serviceUrl !== cidUrl) {
					resolvedSrcByCidUrl.set(cidUrl, serviceUrl);
				}
			});
		});

		resolvedSrcByCidUrl.forEach((src, cidUrl) => {
			editor.dispatchCommand(REPLACE_INLINE_IMAGE_SRC_COMMAND, { cidUrl, src });
		});
	}, [editor, savedAttachments]);

	return null;
};
