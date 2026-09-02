/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $dfs } from '@lexical/utils';
import { $getNodeByKey, type LexicalEditor, type NodeKey } from 'lexical';

import { registerInlineImageConverter } from './inline-image-conversion-registry';
import { $isImageNode } from './nodes/image-node';
import { areContentIdsEqual } from 'commons/content-id-utils';
import { TIMEOUTS } from 'constants/index';
import { composeAttachmentDownloadUrl } from 'helpers/attachments';
import { dataUriToFile, getDataUriFileName, isDataImageUri } from 'helpers/inline-images';
import { composeCidUrlFromContentId } from 'store/editor/editor-transformations';
import { useEditorIsDirty } from 'store/editor/hooks/statuses';
import { useEditorAttachments } from 'store/editor/index';
import { useEditorsStore } from 'store/editor/store';
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
 * that URI is stripped by several mail clients (Gmail among them), so an image
 * arriving in the composer — with the signature, or from an HTML paste — is
 * uploaded as an inline attachment and its node is repointed at the upload. That
 * restores the cid bookkeeping the rest of the compose pipeline relies on
 * (`exportDOM` writes `data-pnsrc`, then `replaceServiceUrlWithCidUrl` puts the
 * `cid:` src back on save draft / send) so the recipient gets a
 * `multipart/related` part instead of base64 markup.
 *
 * The conversion is deliberately **not** run on mount: uploading requires saving
 * the draft, and doing that just because a compose window was opened would leave
 * a draft and an orphan attachment behind for a message the user never wrote.
 * It is therefore triggered by the first real change to the editor
 * (`isDirty`), plus on demand from the send handlers through
 * {@link registerInlineImageConverter}, which covers sending a reply or a forward
 * without editing it at all.
 *
 * All the images found in a pass are uploaded as a **single** batch: one batch
 * means one `onUploadsEnd`, hence one draft save. Uploading them one by one
 * would coalesce several saves into the debounce, and `lodash.debounce` keeps
 * only the arguments of the last call, silently dropping the other batches'
 * completion callbacks.
 *
 * Nodes are repointed by watching `savedAttachments` rather than through the
 * upload's own completion callback, so the conversion completes whichever draft
 * save persists the attachment (its own immediate one, or one already running
 * and which would have made it skip).
 */
export const InlineDataImageUploadPlugin = ({
	editorId
}: InlineDataImageUploadPluginProps): null => {
	const [editor] = useLexicalComposerContext();
	const { addInlineAttachments } = useEditorAttachments(editorId);
	const isDirty = useEditorIsDirty(editorId);
	const savedAttachments = useEditorsStore((state) => state.editors[editorId]?.savedAttachments);

	/** Nodes already uploaded, so an update does not upload them a second time. */
	const attemptedKeysRef = useRef<Set<NodeKey>>(new Set());
	/** Content id -> node waiting to be repointed once the draft save persists it. */
	const pendingRef = useRef<Map<string, NodeKey>>(new Map());
	/** Resolvers of the promises handed to the send handlers. */
	const waitersRef = useRef<Array<() => void>>([]);
	const uploadCountRef = useRef(0);
	/**
	 * Whether the user did something which justifies creating a draft. Latched:
	 * `isDirty` goes back to false after every successful save.
	 */
	const startedRef = useRef(false);

	const releaseWaiters = useCallback((): void => {
		waitersRef.current.forEach((resolve) => resolve());
		waitersRef.current = [];
	}, []);

	const convert = useCallback((): void => {
		const pending = editor
			.getEditorState()
			.read(() => $collectPendingDataUriImages(attemptedKeysRef.current));
		if (pending.length === 0) {
			return;
		}

		const files: Array<File> = [];
		const keys: Array<NodeKey> = [];
		pending.forEach(({ key, src }) => {
			attemptedKeysRef.current.add(key);
			uploadCountRef.current += 1;
			const file = dataUriToFile(src, getDataUriFileName(src, uploadCountRef.current));
			if (file) {
				files.push(file);
				keys.push(key);
			}
		});
		if (files.length === 0) {
			return;
		}

		// The returned unsaved attachments are positional with `files`, and each
		// already carries the content id the draft save will persist.
		const unsavedAttachments = addInlineAttachments(files, { saveImmediately: true });
		unsavedAttachments.forEach((unsavedAttachment, index) => {
			const key = keys[index];
			if (unsavedAttachment.contentId && key !== undefined) {
				pendingRef.current.set(unsavedAttachment.contentId, key);
			}
		});
	}, [addInlineAttachments, editor]);

	// Trigger: the first real change to the message.
	useEffect(() => {
		if (!isDirty) {
			return;
		}
		startedRef.current = true;
		convert();
	}, [convert, isDirty]);

	// Trigger: any later change, e.g. pasting HTML which carries a data URI image.
	useEffect(
		() =>
			editor.registerUpdateListener(() => {
				if (startedRef.current) {
					convert();
				}
			}),
		[convert, editor]
	);

	// Repoint the nodes as soon as the draft save persists their attachments.
	useEffect(() => {
		if (pendingRef.current.size === 0) {
			return;
		}
		pendingRef.current.forEach((key, contentId) => {
			const saved = savedAttachments?.find(
				(attachment) =>
					attachment.isInline &&
					attachment.contentId !== undefined &&
					areContentIdsEqual(attachment.contentId, contentId)
			);
			if (!saved) {
				return;
			}
			const downloadServiceUrl = composeAttachmentDownloadUrl(saved);
			if (downloadServiceUrl && saved.contentId) {
				repointImageNode(
					editor,
					key,
					downloadServiceUrl,
					composeCidUrlFromContentId(saved.contentId) ?? undefined
				);
			}
			pendingRef.current.delete(contentId);
		});
		if (pendingRef.current.size === 0) {
			releaseWaiters();
		}
	}, [editor, releaseWaiters, savedAttachments]);

	/**
	 * Converts whatever is left and resolves once every image carries a cid.
	 * Resolves anyway after a timeout: a stuck upload must not block the send.
	 */
	const ensureConverted = useCallback((): Promise<void> => {
		startedRef.current = true;
		convert();
		if (pendingRef.current.size === 0) {
			return Promise.resolve();
		}
		return new Promise<void>((resolve) => {
			waitersRef.current.push(resolve);
			setTimeout(resolve, TIMEOUTS.INLINE_IMAGES_CONVERSION);
		});
	}, [convert]);

	useEffect(
		() => registerInlineImageConverter(editorId, ensureConverted),
		[editorId, ensureConverted]
	);

	return null;
};
