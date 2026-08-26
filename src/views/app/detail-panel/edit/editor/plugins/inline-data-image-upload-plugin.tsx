/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $dfs } from '@lexical/utils';
import { $getNodeByKey, type LexicalEditor, type NodeKey } from 'lexical';

import { $isImageNode } from './nodes/image-node';
import { dataUriToFile, getDataUriFileName, isDataImageUri } from 'helpers/inline-images';
import { useEditorAttachments } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';

type InlineDataImageUploadPluginProps = {
	editorId: MailsEditorV2['id'];
};

type PendingDataUriImage = {
	key: NodeKey;
	src: string;
};

/**
 * Collects the images still carrying a `data:` URI which have not been attempted
 * yet. Must run inside an editor state read, since it walks the current tree.
 */
function $collectPendingDataUriImages(attemptedKeys: Set<NodeKey>): Array<PendingDataUriImage> {
	return $dfs().reduce<Array<PendingDataUriImage>>((pending, { node }) => {
		if ($isImageNode(node) && !attemptedKeys.has(node.getKey()) && isDataImageUri(node.getSrc())) {
			pending.push({ key: node.getKey(), src: node.getSrc() });
		}
		return pending;
	}, []);
}

/** Points an image node at its uploaded counterpart, cid included. */
function repointImageNode(
	editor: LexicalEditor,
	key: NodeKey,
	src: string,
	cidUrl: string | undefined
): void {
	editor.update(() => {
		const node = $getNodeByKey(key);
		if ($isImageNode(node)) {
			node.setSrc(src);
			node.setCidUrl(cidUrl);
		}
	});
}

/**
 * Turns base64 `data:` images into real inline attachments.
 *
 * A signature is stored as a self-contained HTML snippet, so an image embedded
 * in it can only travel as a `data:` URI: while it is being edited in the
 * settings there is no draft to attach it to. Left as such in a sent message
 * that URI is stripped by several mail clients (Gmail among them), so as soon as
 * such an image lands in the composer — with the signature, or from an HTML
 * paste — it is uploaded as an inline attachment and the node is rewritten to
 * point at the upload. That restores the cid bookkeeping the rest of the compose
 * pipeline relies on (`exportDOM` writes `data-pnsrc`, then
 * `replaceServiceUrlWithCidUrl` puts the `cid:` src back on save draft / send)
 * so the recipient gets a `multipart/related` part instead of base64 markup.
 *
 * Every node is attempted at most once, tracked by node key in
 * `attemptedKeysRef`: the upload completes several editor updates after it is
 * started, and a failed conversion must not be retried on each subsequent
 * update. A content replacement (the store -> editor sync in
 * `ControlledContentPlugin`) re-creates the nodes with fresh keys, so an image
 * still carrying a `data:` URI at that point is legitimately attempted again.
 */
export const InlineDataImageUploadPlugin = ({
	editorId
}: InlineDataImageUploadPluginProps): null => {
	const [editor] = useLexicalComposerContext();
	const { addInlineAttachments } = useEditorAttachments(editorId);
	const attemptedKeysRef = useRef<Set<NodeKey>>(new Set());
	const uploadCountRef = useRef(0);

	const uploadImage = useCallback(
		({ key, src }: PendingDataUriImage): void => {
			attemptedKeysRef.current.add(key);
			uploadCountRef.current += 1;
			const file = dataUriToFile(src, getDataUriFileName(src, uploadCountRef.current));
			if (!file) {
				return;
			}

			addInlineAttachments([file], {
				onSaveComplete: (inlineAttachments): void => {
					const { downloadServiceUrl, cidUrl } = inlineAttachments[0] ?? {};
					if (downloadServiceUrl) {
						repointImageNode(editor, key, downloadServiceUrl, cidUrl);
					}
				}
			});
		},
		[addInlineAttachments, editor]
	);

	useEffect(
		() =>
			editor.registerUpdateListener(({ editorState }) => {
				const pending = editorState.read(() =>
					$collectPendingDataUriImages(attemptedKeysRef.current)
				);
				pending.forEach(uploadImage);
			}),
		[editor, uploadImage]
	);

	return null;
};
