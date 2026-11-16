/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $dfs, mergeRegister } from '@lexical/utils';
import {
	$addUpdateTag,
	$getNodeByKey,
	COMMAND_PRIORITY_CRITICAL,
	CONTROLLED_TEXT_INSERTION_COMMAND,
	type LexicalEditor,
	type NodeKey,
	PASTE_TAG
} from 'lexical';

import { registerInlineImageConverter } from './inline-image-conversion-registry';
import { $isImageNode, ImageNode } from './nodes/image-node';
import { areContentIdsEqual } from 'commons/content-id-utils';
import { TIMEOUTS } from 'constants/index';
import { composeAttachmentDownloadUrl, getCidFromCidUrl } from 'helpers/attachments';
import {
	dataUriToFile,
	fetchImageAsFile,
	getDataUriFileName,
	getInlineImageFileName,
	getOwnMessagePartUrl,
	isDataImageUri
} from 'helpers/inline-images';
import { composeCidUrlFromContentId } from 'store/editor/editor-transformations';
import { useEditorIsDirty } from 'store/editor/hooks/statuses';
import { useEditorAttachments } from 'store/editor/index';
import { useEditorsStore } from 'store/editor/store';
import { MailsEditorV2 } from 'types/editor';

type InlineDataImageUploadPluginProps = {
	editorId: MailsEditorV2['id'];
};

type PendingImage = {
	key: NodeKey;
	/** The `data:` URI, or the url to download the copied image from. */
	src: string;
	/**
	 * `data-uri`: the image is embedded in the markup.
	 * `foreign-service-url`: the image is served by the download service from a
	 * part which does not belong to this message, e.g. copied from another email.
	 */
	origin: 'data-uri' | 'foreign-service-url';
};

/**
 * Tags the update which inserts the content dropped from outside the editor, as
 * Lexical does with {@link PASTE_TAG} for a paste.
 */
const DROP_TAG = 'mails-drop';

/**
 * Collects the images which are not backed by an attachment of this message and
 * have not been attempted yet. Must run inside an editor state read, since it
 * walks the current tree.
 *
 * @param getCopiedImageUrl - the url to download an image copied from another
 * message from, or `undefined` when the image is not one to download.
 */
function $collectPendingImages(
	attemptedKeys: Set<NodeKey>,
	getCopiedImageUrl: (src: string, cidUrl: string | undefined) => string | undefined
): Array<PendingImage> {
	return $dfs().reduce<Array<PendingImage>>((pending, { node }) => {
		if (!$isImageNode(node) || attemptedKeys.has(node.getKey())) {
			return pending;
		}
		const src = node.getSrc();
		if (isDataImageUri(src)) {
			pending.push({ key: node.getKey(), src, origin: 'data-uri' });
			return pending;
		}
		const copiedImageUrl = getCopiedImageUrl(src, node.getCidUrl());
		if (copiedImageUrl) {
			pending.push({ key: node.getKey(), src: copiedImageUrl, origin: 'foreign-service-url' });
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
 * The same goes for the images copied from another message (alone or together
 * with text): they keep the download url of the part of that message, and the
 * cid it carries, neither of which exists in the message being written, so the
 * recipient would get a broken image. Such an image is downloaded and uploaded
 * as a new inline attachment, but only when the user pasted or dropped it into
 * the editor, its url is a part of the user's own messages on this origin
 * ({@link getOwnMessagePartUrl}), and its cid is not a part of this message. The
 * images of the content loaded in the editor (the quoted message of a reply or
 * a forward, a draft) are never downloaded: that content is written by someone
 * else, who could point its images at any part of the user's mailbox and have
 * them sent back attached to the reply.
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
	/** Downloads of images copied from other messages, still in progress. */
	const fetchesRef = useRef<Set<Promise<void>>>(new Set());
	/**
	 * Urls ({@link getOwnMessagePartUrl}) of the images the user pasted or dropped.
	 * Kept by url rather than by node key, so that the image is still recognised
	 * after it is moved, or after the content is imported again from the store.
	 */
	const insertedPartUrlsRef = useRef<Set<string>>(new Set());
	/**
	 * Whether the user did something which justifies creating a draft. Latched:
	 * `isDirty` goes back to false after every successful save.
	 */
	const startedRef = useRef(false);

	const releaseWaiters = useCallback((): void => {
		waitersRef.current.forEach((resolve) => resolve());
		waitersRef.current = [];
	}, []);

	const upload = useCallback(
		(files: Array<File>, keys: Array<NodeKey>): void => {
			// The returned unsaved attachments are positional with `files`, and each
			// already carries the content id the draft save will persist.
			const unsavedAttachments = addInlineAttachments(files, { saveImmediately: true });
			unsavedAttachments.forEach((unsavedAttachment, index) => {
				const key = keys[index];
				if (unsavedAttachment.contentId && key !== undefined) {
					pendingRef.current.set(unsavedAttachment.contentId, key);
				}
			});
		},
		[addInlineAttachments]
	);

	/**
	 * Whether the cid refers to a part of this very message. Not only the inline
	 * ones: an image of a forwarded message can be a part with a content id but
	 * without an inline disposition, and it is resolved through its cid all the
	 * same (`convertCidUrlToServiceUrl`).
	 */
	const isTrackedCidUrl = useCallback(
		(cidUrl: string | undefined): boolean => {
			const cid = cidUrl ? getCidFromCidUrl(cidUrl) : null;
			if (!cid) {
				return false;
			}
			const { savedAttachments: saved = [], unsavedAttachments: unsaved = [] } =
				useEditorsStore.getState().editors[editorId] ?? {};
			return [...saved, ...unsaved].some(
				(attachment) =>
					attachment.contentId !== undefined && areContentIdsEqual(attachment.contentId, cid)
			);
		},
		[editorId]
	);

	const getCopiedImageUrl = useCallback(
		(src: string, cidUrl: string | undefined): string | undefined => {
			const partUrl = getOwnMessagePartUrl(src);
			if (!partUrl || !insertedPartUrlsRef.current.has(partUrl) || isTrackedCidUrl(cidUrl)) {
				return undefined;
			}
			return partUrl;
		},
		[isTrackedCidUrl]
	);

	/**
	 * Downloads the images copied from another message and uploads them as
	 * inline attachments of this one. Their download url belongs to the other
	 * message, so it cannot be resolved by the recipient: they need a part of
	 * their own. The images whose download fails (or whose node is gone in the
	 * meantime) are left untouched.
	 */
	const fetchAndUpload = useCallback(
		(images: Array<PendingImage>): void => {
			const task: Promise<void> = Promise.all(
				images.map(({ src }) => {
					uploadCountRef.current += 1;
					const index = uploadCountRef.current;
					return fetchImageAsFile(src, (mimeType) => getInlineImageFileName(mimeType, index));
				})
			)
				.then((fetchedFiles) => {
					const stillInEditor = editor
						.getEditorState()
						.read(() => images.map(({ key }) => $getNodeByKey(key) !== null));
					const files: Array<File> = [];
					const keys: Array<NodeKey> = [];
					fetchedFiles.forEach((file, index) => {
						if (file && stillInEditor[index]) {
							files.push(file);
							keys.push(images[index].key);
						}
					});
					if (files.length > 0) {
						upload(files, keys);
					}
				})
				.finally(() => {
					fetchesRef.current.delete(task);
				});
			fetchesRef.current.add(task);
		},
		[editor, upload]
	);

	const convert = useCallback((): void => {
		const pending = editor
			.getEditorState()
			.read(() => $collectPendingImages(attemptedKeysRef.current, getCopiedImageUrl));
		if (pending.length === 0) {
			return;
		}
		pending.forEach(({ key }) => attemptedKeysRef.current.add(key));

		const files: Array<File> = [];
		const keys: Array<NodeKey> = [];
		pending.forEach(({ key, src, origin }) => {
			if (origin !== 'data-uri') {
				return;
			}
			uploadCountRef.current += 1;
			const file = dataUriToFile(src, getDataUriFileName(src, uploadCountRef.current));
			if (file) {
				files.push(file);
				keys.push(key);
			}
		});
		if (files.length > 0) {
			upload(files, keys);
		}

		const copiedImages = pending.filter(({ origin }) => origin === 'foreign-service-url');
		if (copiedImages.length > 0) {
			fetchAndUpload(copiedImages);
		}
	}, [editor, fetchAndUpload, getCopiedImageUrl, upload]);

	// Records the images the user brings in: the pasted ones (Lexical tags the
	// update) and the ones dropped from outside the editor, which Lexical inserts
	// through the controlled text insertion of the `insertFromDrop` input.
	// Mutation listeners run before the update listeners, so an image is recorded
	// before the conversion below looks for it.
	useEffect(
		() =>
			mergeRegister(
				editor.registerCommand(
					CONTROLLED_TEXT_INSERTION_COMMAND,
					(payload) => {
						if (typeof payload !== 'string' && payload.inputType === 'insertFromDrop') {
							$addUpdateTag(DROP_TAG);
						}
						return false;
					},
					COMMAND_PRIORITY_CRITICAL
				),
				editor.registerMutationListener(
					ImageNode,
					(mutations, { updateTags }) => {
						if (!updateTags.has(PASTE_TAG) && !updateTags.has(DROP_TAG)) {
							return;
						}
						editor.getEditorState().read(() => {
							mutations.forEach((mutation, key) => {
								const node = $getNodeByKey(key);
								const partUrl =
									mutation === 'created' && $isImageNode(node)
										? getOwnMessagePartUrl(node.getSrc())
										: undefined;
								if (partUrl) {
									insertedPartUrlsRef.current.add(partUrl);
								}
							});
						});
					},
					{ skipInitialization: true }
				)
			),
		[editor]
	);

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
		const fetching = Array.from(fetchesRef.current);
		if (fetching.length === 0 && pendingRef.current.size === 0) {
			return Promise.resolve();
		}
		return new Promise<void>((resolve) => {
			setTimeout(resolve, TIMEOUTS.INLINE_IMAGES_CONVERSION);
			// The uploads of the images being fetched start only once the fetch is
			// over: until then there is nothing pending to wait for.
			Promise.allSettled(fetching)
				.then(() => {
					if (pendingRef.current.size === 0) {
						resolve();
						return;
					}
					waitersRef.current.push(resolve);
				})
				.catch(() => resolve());
		});
	}, [convert]);

	useEffect(
		() => registerInlineImageConverter(editorId, ensureConverted),
		[editorId, ensureConverted]
	);

	return null;
};
