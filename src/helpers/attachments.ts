/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { useTheme } from '@zextras/carbonio-design-system';
import { reduce } from 'lodash';

import {
	areContentIdsEqual,
	extractContentIdsFromHtml,
	removeAngleBrackets
} from 'commons/content-id-utils';
import { calcColor } from 'commons/utilities';
import { AbstractAttachment, SavedAttachment, UnsavedAttachment } from 'types/attachments';
import { EditorAttachmentFiles } from 'types/editor';
import { MailMessage, MailMessagePart, MailMessagePartWithDisposition } from 'types/messages';

/**
 * Content disposition types for email attachments
 */
export const DISPOSITION_INLINE = 'inline' as const;
export const DISPOSITION_ATTACHMENT = 'attachment' as const;

/**
 * Checks if a content disposition indicates an inline attachment.
 *
 * @param disposition - The content disposition value
 * @returns True if the disposition is 'inline'
 */
export const isInlineDisposition = (disposition?: string): boolean =>
	disposition === DISPOSITION_INLINE;

/**
 * Checks if a content disposition indicates a regular attachment.
 *
 * @param disposition - The content disposition value
 * @returns True if the disposition is 'attachment'
 */
export const isAttachmentDisposition = (disposition?: string): boolean =>
	disposition === DISPOSITION_ATTACHMENT;

const FileExtensionRegex = /^.+\.([^.]+)$/;
export const CIDURL_REGEX = '^(?:cid:)*(.+)$';
export const DOWNLOADSERVICEURL_REGEX = '\\/service\\/home\\/~\\/\\?';
export const EML_FILENAME_REGEX = '^(.+)\\.eml$';
export const MIMETYPE_MULTIPART_ALTERNATIVE = 'multipart/alternative';
export const MIMETYPE_PLAINTEXT = 'text/plain';
export const MIMETYPE_RICHTEXT = 'text/html';
export const MIMETYPE_EML = 'message/rfc822';

/**
 * MIME type to file extension mapping
 * Maps content types to their file extensions
 */
const MIME_TYPE_EXTENSIONS: Record<string, { value: string; displayName?: string }> = {
	// Text types
	'text/html': { value: 'html' },
	'text/css': { value: 'css' },
	'text/xml': { value: 'xml' },
	'text/plain': { value: 'txt' },
	'text/mathml': { value: 'mml' },
	'text/vnd.sun.jme.app-descriptor': { value: 'jad' },
	'text/vnd.wap.wml': { value: 'wml' },
	'text/x-component': { value: 'htc' },

	// Image types
	'image/gif': { value: 'gif' },
	'image/jpeg': { value: 'jpg' },
	'image/png': { value: 'png' },
	'image/tiff': { value: 'tif,tiff', displayName: 'tif' },
	'image/vnd.wap.wbmp': { value: 'wbmp' },
	'image/x-icon': { value: 'ico' },
	'image/x-jng': { value: 'jng' },
	'image/x-ms-bmp': { value: 'bmp' },
	'image/svg+xml': { value: 'svg' },
	'image/webp': { value: 'webp' },

	// Application types
	'application/x-javascript': { value: 'js' },
	'application/atom+xml': { value: 'atom' },
	'application/rss+xml': { value: 'rss' },
	'application/java-archive': { value: 'jar,war,ear' },
	'application/mac-binhex': { value: 'hqx' },
	'application/msword': { value: 'doc' },
	'application/pdf': { value: 'pdf' },
	'application/postscript': { value: 'ps,eps,ai' },
	'application/rtf': { value: 'rtf' },
	'application/vnd.ms-excel': { value: 'xls' },
	'application/vnd.ms-powerpoint': { value: 'ppt' },
	'application/vnd.wap.wmlc': { value: 'wmlc' },
	'application/vnd.google-earth.kml+xml': { value: 'kml' },
	'application/vnd.google-earth.kmz': { value: 'kmz' },
	'application/x-z-compressed': { value: 'z' },
	'application/x-cocoa': { value: 'cco' },
	'application/x-java-archive-diff': { value: 'jardiff' },
	'application/x-java-jnlp-file': { value: 'jnlp' },
	'application/x-makeself': { value: 'run' },
	'application/x-perl': { value: 'pl,pm' },
	'application/x-pilot': { value: 'prc,pdb' },
	'application/x-rar-compressed': { value: 'rar' },
	'application/x-redhat-package-manager': { value: 'rpm' },
	'application/x-sea': { value: 'sea' },
	'application/x-shockwave-flash': { value: 'swf' },
	'application/x-stuffit': { value: 'sit' },
	'application/x-tcl': { value: 'tcl' },
	'application/x-x-ca-cert': { value: 'der' },
	'application/x-xpinstall': { value: 'xpi' },
	'application/xhtml+xml': { value: 'xhtml' },
	'application/zip': { value: 'zip' },

	// Audio types
	'audio/midi': { value: 'midi' },
	'audio/mpeg': { value: 'mp' },
	'audio/ogg': { value: 'ogg' },
	'audio/x-realaudio': { value: 'ra' },

	// Video types
	'video/gpp': { value: 'gp' },
	'video/mpeg': { value: 'mpeg' },
	'video/quicktime': { value: 'mov' },
	'video/x-flv': { value: 'flv' },
	'video/x-mng': { value: 'mng' },
	'video/x-ms-asf': { value: 'asf' },
	'video/x-ms-wmv': { value: 'wmv' },
	'video/x-msvideo': { value: 'avi' },
	'video/mp': { value: 'mp' },

	// Message types
	'message/rfc822': { value: 'EML' }
};

export function findAttachments(
	parts: MailMessagePart[],
	acc: Array<Omit<AbstractAttachment, 'isInline'>>
): Array<Omit<AbstractAttachment, 'isInline'>> {
	return reduce(
		parts,
		(found, part: MailMessagePart) => {
			if (part && (part.disposition === 'attachment' || part.disposition === 'inline') && part.ci) {
				found.push({ ...part, filename: part.filename ?? '' });
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc
	);
}

const isEml = (part: MailMessagePart): boolean =>
	part.contentType === MIMETYPE_EML ||
	(part.filename !== undefined && new RegExp(EML_FILENAME_REGEX, 'gi').test(part.filename));

export const isCidUrl = (url: string): boolean => new RegExp(CIDURL_REGEX, 'gi').test(url);

export const getCidFromCidUrl = (cidUrl: string): string | null => {
	const cidUrlTokens = new RegExp(CIDURL_REGEX, 'gi').exec(cidUrl);
	if (!cidUrlTokens) {
		return null;
	}
	return cidUrlTokens[1];
};

/**
 * Extracts all Content-IDs referenced in HTML parts of the message.
 * Now properly handles HTML entity encoded CIDs.
 * @param parts - Message parts to scan for CID references
 */
export const getReferredContentIds = (parts: Array<MailMessagePart>): Array<string> => {
	const result: Array<string> = [];
	parts?.forEach((part) => {
		if (part.contentType === MIMETYPE_RICHTEXT && part.content) {
			const contentIdsFromHtml = extractContentIdsFromHtml(part.content);
			result.push(...contentIdsFromHtml);
		}

		if (part.parts) {
			result.push(...getReferredContentIds(part.parts));
		}
	});
	return result;
};

/**
 * Checks if a Content-ID is referenced in the list of referred CIDs.
 * Uses centralized CID comparison logic.
 *
 * @param cid - Content-ID to check
 * @param referredCIDs - Array of Content-IDs that are referenced in HTML
 * @returns True if the CID is in the referenced list
 */
const isReferredCID = (cid: string, referredCIDs: Array<string>): boolean =>
	referredCIDs.some((referredCid) => areContentIdsEqual(cid, referredCid));

/**
 * Filters the message parts to collect body content and attachments and adds disposition.
 * Uses centralized disposition utilities for consistent behavior.
 *
 * @param parts - Message parts to process
 * @param referredCIDs - Content-IDs referenced in HTML content
 * @param filtered - Accumulated results array
 * @returns Flattened array of parts with proper disposition set
 */
function flattenAndAddDisposition(
	parts: Array<MailMessagePart>,
	referredCIDs: Array<string>,
	filtered: Array<MailMessagePartWithDisposition> = []
): Array<MailMessagePartWithDisposition> {
	return reduce(
		parts,
		(incoming, part) => {
			const isReferredByCid = part.ci && isReferredCID(part.ci, referredCIDs);
			const partShouldBeIncluded =
				isAttachmentDisposition(part.disposition) ||
				(isInlineDisposition(part.disposition) && (part.filename || isReferredByCid)) ||
				(isInlineDisposition(part.disposition) && part.name) ||
				(part.disposition === undefined &&
					(isReferredByCid ||
						(!part.parts &&
							part.contentType !== MIMETYPE_MULTIPART_ALTERNATIVE &&
							part.contentType !== MIMETYPE_PLAINTEXT &&
							part.contentType !== MIMETYPE_RICHTEXT &&
							part.name)));

			if (partShouldBeIncluded && !part.body) {
				// Determine disposition: inline if referenced, attachment otherwise
				if (part.disposition === undefined) {
					incoming.push({
						...part,
						disposition: isReferredByCid ? DISPOSITION_INLINE : DISPOSITION_ATTACHMENT
					});
				} else if (isReferredByCid) {
					incoming.push({
						...part,
						disposition: DISPOSITION_INLINE
					});
				} else {
					incoming.push({ ...part, disposition: part.disposition });
				}
			}

			if (part.parts && !isEml(part)) {
				flattenAndAddDisposition(part.parts, referredCIDs, incoming);
			}
			return incoming;
		},
		filtered
	);
}

/**
 * Flattens the message parts and adds disposition to each part.
 * It returns flattened attachments with disposition.
 */
export function getFlattenedAttachmentParts(
	mailMessage: MailMessage
): Array<MailMessagePartWithDisposition> {
	const mailMessageParts = mailMessage.parts;
	const referredCIDS = getReferredContentIds(mailMessageParts);
	return flattenAndAddDisposition(mailMessageParts, referredCIDS);
}

export const getAttachmentExtension = (
	contentType: string | undefined,
	fileName: string | undefined = undefined
): { value: string; displayName?: string } => {
	// Check if content type has a known mapping
	if (contentType && MIME_TYPE_EXTENSIONS[contentType]) {
		return MIME_TYPE_EXTENSIONS[contentType];
	}

	// Fallback: extract extension from filename
	if (fileName) {
		const match = FileExtensionRegex.exec(fileName);
		if (match?.[1]) {
			return { value: match[1] };
		}
	}

	// Final fallback: unknown extension
	return { value: '?' };
};

export const getSizeDescription = (size: number): string => {
	let value;
	if (size < 1024000) {
		value = `${Math.round((size / 1024) * 100) / 100} KB`;
	} else if (size < 1024000000) {
		value = `${Math.round((size / 1024 / 1024) * 100) / 100} MB`;
	} else {
		value = `${Math.round((size / 1024 / 1024 / 1024) * 100) / 100} GB`;
	}
	return value;
};

export const useAttachmentIconColor = (
	// TODO: This should be refactored to accept a common attachment type instead of three different types, but that requires refactoring all the places where this hook is used, so leaving it for now
	attachment: UnsavedAttachment | SavedAttachment | EditorAttachmentFiles
): string => {
	const theme = useTheme();
	return useMemo<string>(
		(): string => calcColor(attachment.contentType ?? '', theme),
		[attachment.contentType, theme]
	);
};

export const isDownloadServicedUrl = (url: string): boolean =>
	new RegExp(DOWNLOADSERVICEURL_REGEX, 'g').test(url);

export const composeAttachmentDownloadUrl = (attachment: SavedAttachment): string =>
	`/service/home/~/?auth=co&id=${attachment.messageId}&part=${attachment.partName}`;

export const buildSavedAttachments = (message: MailMessage): Array<SavedAttachment> => {
	const attachmentsParts = getFlattenedAttachmentParts(message);
	return attachmentsParts.map((part) => ({
		messageId: message.id,
		isInline: isInlineDisposition(part.disposition) && !!part.ci,
		contentId: (part.ci && removeAngleBrackets(part.ci)) ?? undefined,
		filename: part.filename ?? '',
		partName: part.name,
		contentType: part.contentType,
		size: part.size
	}));
};
