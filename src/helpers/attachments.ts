/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { useTheme } from '@zextras/carbonio-design-system';

import { retrieveAttachmentsFromMail } from 'attachments';
import { calcColor } from 'commons/utilities';
import { MailMessage, SavedAttachment, UnsavedAttachment } from 'types/index.d';

const FileExtensionRegex = /^.+\.([^.]+)$/;
export const CIDURL_REGEX = '^(?:cid:)*(.+)$';
export const DOWNLOADSERVICEURL_REGEX = '\\/service\\/home\\/~\\/\\?';
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

export const isCidUrl = (url: string): boolean => new RegExp(CIDURL_REGEX, 'gi').test(url);

export const getCidFromCidUrl = (cidUrl: string): string | null => {
	const cidUrlTokens = new RegExp(CIDURL_REGEX, 'gi').exec(cidUrl);
	if (!cidUrlTokens) {
		return null;
	}
	return cidUrlTokens[1];
};

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
	const attachmentsParts = retrieveAttachmentsFromMail(message);

	const blockAttachments = attachmentsParts.blockAttachments.map((attachment) => ({
		filename: attachment.filename ?? '',
		messageId: message.id,
		contentId: attachment.ci,
		partName: attachment.name,
		isInline: false,
		size: attachment.size,
		contentType: attachment.contentType
	}));
	const inlineAttachments = attachmentsParts.inlineAttachments.map((attachment) => ({
		filename: attachment.filename ?? '',
		messageId: message.id,
		contentId: attachment.ci,
		partName: attachment.name,
		isInline: true,
		size: attachment.size,
		contentType: attachment.contentType
	}));
	return [...blockAttachments, ...inlineAttachments];
};
