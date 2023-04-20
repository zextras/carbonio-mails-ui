/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isNil } from 'lodash';
import { DefaultTheme } from 'styled-components';
import type { EditorAttachmentFiles } from '../types/editor';
import type { AttachmentPart } from '../types/messages';

const FileExtensionRegex = /^.+\.([^.]+)$/;

export const calcColor = (label: string, theme: DefaultTheme): string => {
	let sum = 0;
	for (let i = 0; i < label.length; i += 1) {
		sum += label.charCodeAt(i);
	}
	return theme.avatarColors[`avatar_${(sum % 50) + 1}`];
};

export const getFileExtension = (
	file: EditorAttachmentFiles | AttachmentPart
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

// eslint-disable-next-line no-shadow
export enum FOLDER_ACTIONS {
	MOVE = 'move',
	EMPTY_TRASH = 'emptyTrash',
	REMOVE_FROM_LIST = 'removeFromList',
	SHARES_INFO = 'sharesInfo',
	EDIT = 'edit',
	NEW = 'new',
	DELETE = 'delete',
	SHARE = 'share',
	SHARE_URL = 'share_url'
}

// eslint-disable-next-line no-shadow
export enum CONVACTIONS {
	MOVE = 'move',
	FLAG = 'flag',
	UNFLAG = '!flag',
	MARK_READ = 'read',
	MARK_UNREAD = '!read',
	TAG = 'tag',
	UNTAG = '!tag',
	TRASH = 'trash',
	DELETE = 'delete',
	MARK_SPAM = 'spam',
	MARK_NOT_SPAM = '!spam'
}

export const convertToDecimal = (source: string): string => {
	let result = '';
	for (let i = 0; i < source.length; i += 1) {
		const charCode = source.charCodeAt(i);
		// Encode non-ascii or double quotes
		if (charCode > 127 || charCode === 34) {
			let temp = charCode.toString(10);
			while (temp.length < 4) {
				temp = `0${temp}`;
			}
			result += `&#${temp};`;
		} else {
			result += source.charAt(i);
		}
	}
	return result;
};
