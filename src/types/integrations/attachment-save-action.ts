/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Context provided to an attachment save action's onClick handler.
 * Contains all the information needed to save or process the attachment.
 */
export type AttachmentSaveActionContext = {
	/** The id of the mail message containing the attachment. */
	messageId: string;

	/**
	 * The MIME part name of the attachment (att.name).
	 * Used for server-side operations such as the CopyToFiles SOAP call.
	 */
	partName: string;

	/** The display filename of the attachment. */
	filename: string;

	/** The MIME content type of the attachment. */
	contentType: string;

	/** The size of the attachment in bytes. */
	size: number;

	/** The direct download URL for the attachment. */
	downloadUrl: string;

	/**
	 * Downloads the attachment from the mail server and returns it as a browser
	 * File object. Use this when your integration needs to upload the attachment
	 * to a third-party storage service (e.g. Nextcloud).
	 *
	 * The promise always resolves with the File; it rejects on network failure.
	 *
	 * @example
	 * ```ts
	 * onClick: async (ctx) => {
	 *   const file = await ctx.getFile();
	 *   await myStorage.upload(file);
	 * }
	 * ```
	 */
	getFile(): Promise<File>;
};

/**
 * Configuration for a single entry in the attachment hover bar's "Save to …" actions.
 *
 * Register an instance of this type by calling the shell-exposed function
 * 'register-attachment-save-action' from your module's bootstrap code.
 *
 * @example
 * ```ts
 * const [registerAction, isAvailable] = getIntegratedFunction('register-attachment-save-action');
 * if (isAvailable) {
 *   registerAction({
 *     id: 'my-module:save',
 *     label: t('label.save_to_my_storage', 'Save to MyStorage'),
 *     icon: 'CloudUploadOutline',
 *     onClick: async (ctx) => {
 *       const file = await ctx.getFile();
 *       await myStorage.upload(file);
 *     }
 *   });
 * }
 * ```
 */
export type AttachmentSaveActionConfig = {
	/**
	 * Unique identifier for this save action.
	 * Convention: '<module-name>:<action>', e.g. 'carbonio-files-ui:save'.
	 * Registering the same id twice overwrites the previous entry.
	 */
	id: string;

	/**
	 * Display label shown in the save dropdown (when multiple actions are registered)
	 * or as a tooltip (when a single action is shown as a direct button).
	 * The registering module is responsible for translating this string.
	 */
	label: string;

	/** Carbonio Design System icon name shown next to the label. */
	icon: string;

	/**
	 * Called when the user clicks this save action.
	 * Use the provided context to access attachment metadata and content.
	 */
	onClick(context: AttachmentSaveActionContext): void;
};
