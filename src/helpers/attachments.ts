/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { useTheme } from '@zextras/carbonio-design-system';
import { isNil, reduce } from 'lodash';

import { calcColor } from 'commons/utilities';
import {
	AbstractAttachment,
	MailMessage,
	MailMessagePart,
	MailMessagePartWithDisposition,
	SavedAttachment,
	UnsavedAttachment
} from 'types/index.d';

const FileExtensionRegex = /^.+\.([^.]+)$/;
export const CIDURL_REGEX = '^(?:cid:)*(.+)$';
export const REFERRED_CIDURL_PATTERN = '"cid:([^"]+)"';
export const DOWNLOADSERVICEURL_REGEX = '\\/service\\/home\\/~\\/\\?';
export const EML_FILENAME_REGEX = '^(.+)\\.eml$';
export const MIMETYPE_MULTIPART_ALTERNATIVE = 'multipart/alternative';
export const MIMETYPE_PLAINTEXT = 'text/plain';
export const MIMETYPE_RICHTEXT = 'text/html';
export const MIMETYPE_EML = 'message/rfc822';

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

/**
 * Extract the inner part of the content id removing the
 * angle brackets (if present)
 * @param contentId
 */
export const extractContentIdInnerPart = (contentId: string): string | null => {
	const regex = /^<?([^<>]+)>?$/;
	const tokens = regex.exec(contentId);
	if (!tokens) {
		return null;
	}

	return tokens[1];
};

/**
 * Tells if the 2 given content-id are the same, ignoring the
 * angle brackets. If any of the 2 given arguments is not a
 * valid content-id the result will be false
 *
 * @param contentId
 * @param otherContentId
 */
export const isContentIdEqual = (contentId: string, otherContentId: string): boolean => {
	const contentIdInnerPart = extractContentIdInnerPart(contentId);
	const otherContentIdInnerPart = extractContentIdInnerPart(otherContentId);
	if (!contentIdInnerPart || !otherContentIdInnerPart) {
		return false;
	}

	return contentIdInnerPart === otherContentIdInnerPart;
};

export const isCidUrl = (url: string): boolean => new RegExp(CIDURL_REGEX, 'gi').test(url);

export const getCidFromCidUrl = (cidUrl: string): string | null => {
	const cidUrlTokens = new RegExp(CIDURL_REGEX, 'gi').exec(cidUrl);
	if (!cidUrlTokens) {
		return null;
	}
	return cidUrlTokens[1];
};

const getCidFromReference = (cidReference: string): string | null => {
	const cidReferenceTokens = new RegExp(REFERRED_CIDURL_PATTERN, 'gi').exec(cidReference);
	if (!cidReferenceTokens) {
		return null;
	}
	return cidReferenceTokens[1];
};

/**
 * Extracts CID references from HTML content with proper HTML entity decoding.
 * Handles CIDs with encoded characters like &#64; (@), &#39; ('), etc.
 * @param richText - HTML content to extract CIDs from
 */
const getCidReferences = (richText: string): Array<string> => {
	const result: Array<string> = [];

	// Match cid: followed by anything until quote, whitespace, or >
	// This handles HTML entities like &#64; (encoded @) properly
	const matches = richText.match(/cid:([^"\s>]+)/g);
	if (!matches) {
		return result;
	}

	matches.forEach((match) => {
		// Remove 'cid:' prefix
		let cid = match.replace('cid:', '');

		// Decode HTML entities using DOMParser for accurate decoding
		// This handles &#64; -> @, &#39; -> ', &amp; -> &, etc.
		try {
			const doc = new DOMParser().parseFromString(
				`<!DOCTYPE html><html><body>${cid}</body></html>`,
				MIMETYPE_RICHTEXT
			);
			const decodedCid = doc.body.textContent;
			if (decodedCid) {
				cid = decodedCid;
			}
		} catch (e) {
			// Fallback: decode common entities manually if DOMParser fails
			cid = cid
				.replace(/&#64;/g, '@')
				.replace(/&#39;/g, "'")
				.replace(/&#34;/g, '"')
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>');
		}

		result.push(cid);
	});

	return result;
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
			// getCidReferences now returns decoded CIDs directly
			const cids = getCidReferences(part.content);
			result.push(...cids);
		}

		if (part.parts) {
			result.push(...getReferredContentIds(part.parts));
		}
	});
	return result;
};

const isReferredCID = (cid: string, referredCIDs: Array<string>): boolean =>
	referredCIDs.reduce((result, referredCid) => isContentIdEqual(cid, referredCid) || result, false);

/**
 * Filters the message parts to collect body content and attachments and adds disposition.
 *
 * @param parts
 * @param referredCIDs
 * @param filtered
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
				part.disposition === 'attachment' ||
				(part.disposition === 'inline' && (part.filename || isReferredByCid)) ||
				(part.disposition === 'inline' && part.name) ||
				(part.disposition === undefined &&
					(isReferredByCid ||
						(!part.parts &&
							part.contentType !== MIMETYPE_MULTIPART_ALTERNATIVE &&
							part.contentType !== MIMETYPE_PLAINTEXT &&
							part.contentType !== MIMETYPE_RICHTEXT &&
							part.name)));
			if (partShouldBeIncluded && !part.body) {
				// Force the inline disposition if the part is referred by something else in the body
				if (part.disposition === undefined) {
					if (isReferredByCid) {
						incoming.push({
							...part,
							disposition: 'inline'
						});
					} else {
						incoming.push({
							...part,
							disposition: 'attachment'
						});
					}
				} else if (isReferredByCid) {
					incoming.push({
						...part,
						disposition: 'inline'
					});
				} else {
					const { disposition } = part;
					incoming.push({ ...part, disposition });
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
	file: AbstractAttachment
): { value: string; displayName?: string } => {
	switch (file.contentType) {
		case 'text/html':
			return { value: 'html' };

		case 'text/css':
			return { value: 'css' };

		case 'text/xml':
			return { value: 'xml' };

		case 'image/gif':
			return { value: 'gif' };

		case 'image/jpeg':
			return { value: 'jpg' };

		case 'application/x-javascript':
			return { value: 'js' };

		case 'application/atom+xml':
			return { value: 'atom' };

		case 'application/rss+xml':
			return { value: 'rss' };

		case 'text/mathml':
			return { value: 'mml' };

		case 'text/plain':
			return { value: 'txt' };

		case 'text/vnd.sun.jme.app-descriptor':
			return { value: 'jad' };

		case 'text/vnd.wap.wml':
			return { value: 'wml' };

		case 'text/x-component':
			return { value: 'htc' };

		case 'image/png':
			return { value: 'png' };

		case 'image/tiff':
			return { value: 'tif,tiff', displayName: 'tif' };

		case 'image/vnd.wap.wbmp':
			return { value: 'wbmp' };

		case 'image/x-icon':
			return { value: 'ico' };

		case 'image/x-jng':
			return { value: 'jng' };

		case 'image/x-ms-bmp':
			return { value: 'bmp' };

		case 'image/svg+xml':
			return { value: 'svg' };

		case 'image/webp':
			return { value: 'webp' };

		case 'application/java-archive':
			return { value: 'jar,war,ear' };

		case 'application/mac-binhex':
			return { value: 'hqx' };

		case 'application/msword':
			return { value: 'doc' };

		case 'application/pdf':
			return { value: 'pdf' };

		case 'application/postscript':
			return { value: 'ps,eps,ai' };

		case 'application/rtf':
			return { value: 'rtf' };

		case 'application/vnd.ms-excel':
			return { value: 'xls' };

		case 'application/vnd.ms-powerpoint':
			return { value: 'ppt' };

		case 'application/vnd.wap.wmlc':
			return { value: 'wmlc' };

		case 'application/vnd.google-earth.kml+xml':
			return { value: 'kml' };

		case 'application/vnd.google-earth.kmz':
			return { value: 'kmz' };

		case 'application/x-z-compressed':
			return { value: 'z' };

		case 'application/x-cocoa':
			return { value: 'cco' };

		case 'application/x-java-archive-diff':
			return { value: 'jardiff' };

		case 'application/x-java-jnlp-file':
			return { value: 'jnlp' };

		case 'application/x-makeself':
			return { value: 'run' };

		case 'application/x-perl':
			return { value: 'pl,pm' };

		case 'application/x-pilot':
			return { value: 'prc,pdb' };

		case 'application/x-rar-compressed':
			return { value: 'rar' };

		case 'application/x-redhat-package-manager':
			return { value: 'rpm' };

		case 'application/x-sea':
			return { value: 'sea' };

		case 'application/x-shockwave-flash':
			return { value: 'swf' };

		case 'application/x-stuffit':
			return { value: 'sit' };

		case 'application/x-tcl':
			return { value: 'tcl' };

		case 'application/x-x-ca-cert':
			return { value: 'der' };

		case 'application/x-xpinstall':
			return { value: 'xpi' };

		case 'application/xhtml+xml':
			return { value: 'xhtml' };

		case 'application/zip':
			return { value: 'zip' };

		case 'audio/midi':
			return { value: 'midi' };

		case 'audio/mpeg':
			return { value: 'mp' };

		case 'audio/ogg':
			return { value: 'ogg' };

		case 'audio/x-realaudio':
			return { value: 'ra' };

		case 'video/gpp':
			return { value: 'gp' };

		case 'video/mpeg':
			return { value: 'mpeg' };

		case 'video/quicktime':
			return { value: 'mov' };

		case 'video/x-flv':
			return { value: 'flv' };

		case 'video/x-mng':
			return { value: 'mng' };

		case 'video/x-ms-asf':
			return { value: 'asf' };

		case 'video/x-ms-wmv':
			return { value: 'wmv' };

		case 'video/x-msvideo':
			return { value: 'avi' };

		case 'video/mp':
			return { value: 'mp' };

		case 'message/rfc822':
			return { value: 'EML' };

		default:
			return {
				value: isNil(FileExtensionRegex.exec(file?.filename ?? ''))
					? '?'
					: (FileExtensionRegex.exec(file?.filename ?? '')?.[1] ?? '')
			};
	}
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

export const useAttachmentIconColor = (attachment: UnsavedAttachment | SavedAttachment): string => {
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
	return attachmentsParts.map<SavedAttachment>((part) => ({
		messageId: message.id,
		isInline: part.disposition === 'inline',
		contentId: (part.ci && extractContentIdInnerPart(part.ci)) ?? undefined,
		filename: part.filename ?? '',
		partName: part.name,
		contentType: part.contentType,
		size: part.size
	}));
};
