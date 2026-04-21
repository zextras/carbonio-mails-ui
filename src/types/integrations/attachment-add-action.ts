/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Represents a pre-uploaded attachment that can be added to the composer.
 * The attachment must already exist on the server (i.e. have an attachmentId)
 * before being passed to onAttachmentAdded.
 */
export type UploadedAttachment = {
	attachmentId: string;
	name: string;
	contentType: string;
	size: number;
};

/**
 * Context provided by the composer to an integration's onClick handler.
 * Use this to add attachments or insert links into the current editor.
 */
export type AttachmentAddActionContext = {
	/** The id of the editor instance the user is composing in. */
	editorId: string;

	/** Returns the current editor text (both plain and rich formats). */
	getText: () => { plainText: string; richText: string };

	/**
	 * Call this for each pre-uploaded file to attach it to the email.
	 * The attachmentId must be a valid server-side attachment reference.
	 */
	onAttachmentAdded: (attachment: UploadedAttachment) => void;

	/**
	 * Call this to prepend one or more hyperlinks into the email body.
	 * Supply an optional label for the rich-text anchor text; falls back to the URL.
	 */
	onLinksInserted: (links: Array<{ url: string; label?: string }>) => void;

	/**
	 * Upload one or more browser File objects to the mail server attachment service.
	 * Returns a promise that always resolves with the successfully uploaded files
	 * as UploadedAttachment records, ready to pass to onAttachmentAdded.
	 * Files that fail to upload are omitted from the result; compare result.length
	 * against the input length to detect partial failures.
	 *
	 * Use this when your integration delivers browser File objects (e.g. from a
	 * native file picker or a third-party storage module) rather than server-side
	 * attachment references.
	 *
	 * @example
	 * ```ts
	 * onClick: async (ctx) => {
	 *   const files = await openMyPicker();
	 *   const uploaded = await ctx.uploadFiles(files);
	 *   uploaded.forEach(att => ctx.onAttachmentAdded(att));
	 * }
	 * ```
	 */
	uploadFiles: (files: File[]) => Promise<UploadedAttachment[]>;

	/** Current total size of the email in bytes (body + existing attachments). */
	currentEditorSize: number;

	/** Maximum allowed email size in bytes (zimbraMtaMaxMessageSize). */
	maxAllowedSize: number;
};

/**
 * Configuration for a single entry in the composer's "Add Attachments" dropdown.
 *
 * Register an instance of this type by calling the shell-exposed function
 * 'register-attachment-add-action' from your module's bootstrap code.
 *
 * @example
 * ```ts
 * const [registerIntegration, isAvailable] = getIntegratedFunction('register-attachment-add-action');
 * if (isAvailable) {
 *   registerIntegration({
 *     id: 'my-module:attach',
 *     label: t('composer.attachment.mymodule', 'Add from MyModule'),
 *     icon: 'CloudOutline',
 *     onClick: (ctx) => {
 *       // open your picker, upload the file, then:
 *       ctx.onAttachmentAdded({ attachmentId, name, contentType, size });
 *     }
 *   });
 * }
 * ```
 */
export type AttachmentAddActionConfig = {
	/**
	 * Unique identifier for this integration entry.
	 * Convention: '<module-name>:<action>', e.g. 'carbonio-files-ui:attach'.
	 * Registering the same id twice overwrites the previous entry.
	 */
	id: string;

	/**
	 * Display label shown in the dropdown.
	 * The registering module is responsible for translating this string.
	 */
	label: string;

	/** Carbonio Design System icon name shown next to the label. */
	icon: string;

	/**
	 * Called when the user clicks this item in the dropdown.
	 * Use the provided context to add attachments or links to the composer.
	 */
	onClick: (context: AttachmentAddActionContext) => void;
};
