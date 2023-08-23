/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { useTheme } from '@zextras/carbonio-design-system';
import { isNil, reduce } from 'lodash';

import { calcColor } from '../commons/utilities';
import { SavedAttachment, UnsavedAttachment } from '../types';
import type {
	AbstractAttachment,
	EditorAttachmentFiles,
	MailMessage,
	MailMessagePart
} from '../types';

const FileExtensionRegex = /^.+\.([^.]+)$/;

export function findAttachments(
	parts: MailMessagePart[],
	acc: Array<EditorAttachmentFiles>
): Array<EditorAttachmentFiles> {
	return reduce(
		parts,
		(found, part: MailMessagePart) => {
			if (part && (part.disposition === 'attachment' || part.disposition === 'inline') && part.ci) {
				found.push(part);
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc
	);
}

export function findAttachmentFiles(
	parts: Array<MailMessagePart>,
	acc: Array<EditorAttachmentFiles>
): Array<EditorAttachmentFiles> {
	return reduce(
		parts,
		(found, part) => {
			if (part && part.disposition === 'attachment' && !part.ci) {
				found.push({ ...part, filename: part.filename ?? '' });
			}
			if (part.parts) return findAttachmentFiles(part.parts, found);
			return acc;
		},
		acc as Array<EditorAttachmentFiles>
	);
}

export function filterAttachmentsParts(
	parts: Array<MailMessagePart>,
	filtered: Array<MailMessagePart>
): Array<MailMessagePart> {
	return reduce(
		parts,
		(filtered, part) => {
			// FIXME sometimes the disposition is not set (e.g. when retrieving drafts)
			if (part && (part.disposition === 'attachment' || part.disposition === 'inline') && part.ci) {
				filtered.push(part);
			}
			if (part.parts) {
				return filterAttachmentsParts(part.parts, filtered);
			}
			return filtered;
		},
		filtered
	);
}

export function getAttachmentParts(message: MailMessage): Array<MailMessagePart> {
	return filterAttachmentsParts(message.parts, []);
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
					: FileExtensionRegex.exec(file?.filename ?? '')?.[1] ?? ''
			};
	}
};

export const getSizeDescription = (size: number): string => {
	let value = '';
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
