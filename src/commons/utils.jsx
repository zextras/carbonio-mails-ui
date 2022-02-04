/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import moment from 'moment';
import { find } from 'lodash';

export function getTimeLabel(date) {
	const momentDate = moment(date);
	if (momentDate.isSame(new Date(), 'day')) {
		return momentDate.format('LT');
	}
	if (momentDate.isSame(new Date(), 'week')) {
		return momentDate.format('dddd, LT');
	}
	if (momentDate.isSame(new Date(), 'month')) {
		return momentDate.format('DD MMMM');
	}
	return momentDate.format('DD/MM/YYYY');
}

export function participantToString(participant, t, accounts) {
	const me = find(accounts, ['name', participant?.address]);
	if (me) {
		return t('label.me', 'Me');
	}
	return participant?.fullName || participant?.name || participant?.address || '';
}

export const getFileExtension = (contentType, theme) => {
	switch (contentType) {
		case 'text/html':
			return { ext: 'html', color: theme.avatarColors.avatar_15 };

		case 'text/css':
			return { ext: 'css', color: theme.avatarColors.avatar_14 };

		case 'text/xml':
			return { ext: 'xml', color: theme.avatarColors.avatar_9 };

		case 'image/gif':
			return { ext: 'gif', color: theme.avatarColors.avatar_3 };

		case 'image/jpeg':
			return { ext: 'jpg', color: theme.avatarColors.avatar_17 };

		case 'application/x-javascript':
			return { ext: 'js', color: theme.avatarColors.avatar_2 };

		case 'application/atom+xml':
			return { ext: 'atom', color: theme.avatarColors.avatar_3 };

		case 'application/rss+xml':
			return { ext: 'rss', color: theme.avatarColors.avatar_4 };

		case 'text/mathml':
			return { ext: 'mml', color: theme.avatarColors.avatar_5 };

		case 'text/plain':
			return { ext: 'txt', color: theme.avatarColors.avatar_24 };

		case 'text/vnd.sun.j2me.app-descriptor':
			return { ext: 'jad', color: theme.avatarColors.avatar_6 };

		case 'text/vnd.wap.wml':
			return { ext: 'wml', color: theme.avatarColors.avatar_7 };

		case 'text/x-component':
			return { ext: 'htc', color: theme.avatarColors.avatar_8 };

		case 'image/png':
			return { ext: 'png', color: theme.avatarColors.avatar_22 };

		case 'image/tiff':
			return { ext: 'tif,tiff', color: theme.avatarColors.avatar_6 };

		case 'image/vnd.wap.wbmp':
			return { ext: 'wbmp', color: theme.avatarColors.avatar_9 };

		case 'image/x-icon':
			return { ext: 'ico', color: theme.avatarColors.avatar_10 };

		case 'image/x-jng':
			return { ext: 'jng', color: theme.avatarColors.avatar_11 };

		case 'image/x-ms-bmp':
			return { ext: 'bmp', color: theme.avatarColors.avatar_12 };

		case 'image/svg+xml':
			return { ext: 'svg', color: theme.avatarColors.avatar_23 };

		case 'image/webp':
			return { ext: 'webp', color: theme.avatarColors.avatar_20 };

		case 'application/java-archive':
			return { ext: 'jar,war,ear', color: theme.avatarColors.avatar_13 };

		case 'application/mac-binhex40':
			return { ext: 'hqx', color: theme.avatarColors.avatar_14 };

		case 'application/msword':
			return { ext: 'doc', color: theme.avatarColors.avatar_21 };

		case 'application/pdf':
			return { ext: 'pdf', color: theme.avatarColors.avatar_16 };

		case 'application/postscript':
			return { ext: 'ps,eps,ai', color: theme.avatarColors.avatar_17 };

		case 'application/rtf':
			return { ext: 'rtf', color: theme.avatarColors.avatar_18 };

		case 'application/vnd.ms-excel':
			return { ext: 'xls', color: theme.avatarColors.avatar_10 };

		case 'application/vnd.ms-powerpoint':
			return { ext: 'ppt', color: theme.avatarColors.avatar_6 };

		case 'application/vnd.wap.wmlc':
			return { ext: 'wmlc', color: theme.avatarColors.avatar_19 };

		case 'application/vnd.google-earth.kml+xml':
			return { ext: 'kml', color: theme.avatarColors.avatar_20 };

		case 'application/vnd.google-earth.kmz':
			return { ext: 'kmz', color: theme.avatarColors.avatar_21 };

		case 'application/x-7z-compressed':
			return { ext: '7z', color: theme.avatarColors.avatar_22 };

		case 'application/x-cocoa':
			return { ext: 'cco', color: theme.avatarColors.avatar_23 };

		case 'application/x-java-archive-diff':
			return { ext: 'jardiff', color: theme.avatarColors.avatar_24 };

		case 'application/x-java-jnlp-file':
			return { ext: 'jnlp', color: theme.avatarColors.avatar_25 };

		case 'application/x-makeself':
			return { ext: 'run', color: theme.avatarColors.avatar_1 };

		case 'application/x-perl':
			return { ext: 'pl,pm', color: theme.avatarColors.avatar_2 };

		case 'application/x-pilot':
			return { ext: 'prc,pdb', color: theme.avatarColors.avatar_3 };

		case 'application/x-rar-compressed':
			return { ext: 'rar', color: theme.avatarColors.avatar_4 };

		case 'application/x-redhat-package-manager':
			return { ext: 'rpm', color: theme.avatarColors.avatar_5 };

		case 'application/x-sea':
			return { ext: 'sea', color: theme.avatarColors.avatar_6 };

		case 'application/x-shockwave-flash':
			return { ext: 'swf', color: theme.avatarColors.avatar_7 };

		case 'application/x-stuffit':
			return { ext: 'sit', color: theme.avatarColors.avatar_8 };

		case 'application/x-tcl':
			return { ext: 'tcl', color: theme.avatarColors.avatar_9 };

		case 'application/x-x509-ca-cert':
			return { ext: 'der', color: theme.avatarColors.avatar_10 };

		case 'application/x-xpinstall':
			return { ext: 'xpi', color: theme.avatarColors.avatar_11 };

		case 'application/xhtml+xml':
			return { ext: 'xhtml', color: theme.avatarColors.avatar_12 };

		case 'application/zip':
			return { ext: 'zip', color: theme.avatarColors.avatar_14 };

		case 'audio/midi':
			return { ext: 'midi', color: theme.avatarColors.avatar_13 };

		case 'audio/mpeg':
			return { ext: 'mp3', color: theme.avatarColors.avatar_15 };

		case 'audio/ogg':
			return { ext: 'ogg', color: theme.avatarColors.avatar_16 };

		case 'audio/x-realaudio':
			return { ext: 'ra', color: theme.avatarColors.avatar_17 };

		case 'video/3gpp':
			return { ext: '3gp', color: theme.avatarColors.avatar_18 };

		case 'video/mpeg':
			return { ext: 'mpeg', color: theme.avatarColors.avatar_19 };

		case 'video/quicktime':
			return { ext: 'mov', color: theme.avatarColors.avatar_21 };

		case 'video/x-flv':
			return { ext: 'flv', color: theme.avatarColors.avatar_20 };

		case 'video/x-mng':
			return { ext: 'mng', color: theme.avatarColors.avatar_22 };

		case 'video/x-ms-asf':
			return { ext: 'asf', color: theme.avatarColors.avatar_23 };

		case 'video/x-ms-wmv':
			return { ext: 'wmv', color: theme.avatarColors.avatar_24 };

		case 'video/x-msvideo':
			return { ext: 'avi', color: theme.avatarColors.avatar_27 };

		case 'video/mp4':
			return { ext: 'mp4', color: theme.avatarColors.avatar_5 };

		default:
			return { ext: '?', color: theme.avatarColors.avatar_21 };
	}
};
