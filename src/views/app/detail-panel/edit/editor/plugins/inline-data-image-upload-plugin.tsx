/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $dfs } from '@lexical/utils';
import { $getNodeByKey, type NodeKey } from 'lexical';

import { $isImageNode, ImageNode } from './nodes/image-node';
import { dataUriToFile, getDataUriFileName, isDataImageUri } from 'helpers/inline-images';
import { useEditorAttachments } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';

type InlineDataImageUploadPluginProps = {
	editorId: MailsEditorV2['id'];
};

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

	useEffect(() => {
		const uploadImage = (key: NodeKey, dataUri: string): void => {
			attemptedKeysRef.current.add(key);
			uploadCountRef.current += 1;
			const file = dataUriToFile(dataUri, getDataUriFileName(dataUri, uploadCountRef.current));
			if (!file) {
				return;
			}

			addInlineAttachments([file], {
				onSaveComplete: (inlineAttachments) => {
					const { downloadServiceUrl, cidUrl } = inlineAttachments[0] ?? {};
					if (!downloadServiceUrl) {
						return;
					}
					editor.update(() => {
						const node = $getNodeByKey(key);
						if ($isImageNode(node)) {
							node.setSrc(downloadServiceUrl);
							node.setCidUrl(cidUrl);
						}
					});
				}
			});
		};

		return editor.registerUpdateListener(({ editorState }) => {
			const dataImages = editorState.read(() =>
				$dfs()
					.map(({ node }) => node)
					.filter((node): node is ImageNode => $isImageNode(node))
					.filter(
						(node) => !attemptedKeysRef.current.has(node.getKey()) && isDataImageUri(node.getSrc())
					)
					.map((node) => ({ key: node.getKey(), src: node.getSrc() }))
			);

			dataImages.forEach(({ key, src }) => uploadImage(key, src));
		});
	}, [addInlineAttachments, editor]);

	return null;
};
