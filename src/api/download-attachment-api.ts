/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Downloads an email attachment from the mail server and returns it as a
 * browser File object.
 *
 * The downloadUrl must already contain authentication parameters (auth=co)
 * as produced by getAttachmentsDownloadLink() or composeAttachmentDownloadUrl().
 *
 * @param downloadUrl - Authenticated download URL for the attachment.
 * @param filename - The filename to assign to the returned File object.
 * @param contentType - The MIME type of the attachment.
 */
export const downloadAttachmentAsFile = async (
	downloadUrl: string,
	filename: string,
	contentType: string
): Promise<File> => {
	const response = await fetch(downloadUrl, { credentials: 'include' });
	const blob = await response.blob();
	return new File([blob], filename, {
		type: contentType || 'application/octet-stream'
	});
};
