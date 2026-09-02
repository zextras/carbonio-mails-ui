/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MailsEditorV2 } from 'types/editor';

/**
 * Lets the send handlers ask the mounted editor to finish converting any `data:`
 * image still in the body before the message leaves.
 *
 * The conversion itself lives in `InlineDataImageUploadPlugin`, which normally
 * runs it on the first real edit. A message can however be sent without ever
 * editing it (reply or forward with the signature only), and the compose board
 * unmounts as soon as the send countdown starts, so the plugin cannot catch up
 * afterwards. The send handler therefore triggers the conversion itself, while
 * the board — and the plugin — are still mounted.
 */
type EnsureInlineImagesConverted = () => Promise<void>;

const converters = new Map<MailsEditorV2['id'], EnsureInlineImagesConverted>();

/**
 * Registers the converter of an editor. Returns the cleanup to be run on
 * unmount.
 */
export const registerInlineImageConverter = (
	editorId: MailsEditorV2['id'],
	ensureConverted: EnsureInlineImagesConverted
): (() => void) => {
	converters.set(editorId, ensureConverted);
	return (): void => {
		if (converters.get(editorId) === ensureConverted) {
			converters.delete(editorId);
		}
	};
};

/**
 * Converts the `data:` images still present in the given editor and resolves
 * once they carry a cid, or immediately when there is nothing to convert and
 * when no editor is mounted (a plain text editor, or an already closed board).
 *
 * It never rejects: a failed conversion must not prevent the message from being
 * sent, it only means the image travels as it is.
 */
export const ensureInlineImagesConverted = (editorId: MailsEditorV2['id']): Promise<void> =>
	converters.get(editorId)?.() ?? Promise.resolve();
