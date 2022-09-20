/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes } from 'lodash';

/**
 * Format a size in byte as human readable
 */
export const humanFileSize = (inputSize: number): string => {
	if (inputSize === 0) {
		return '0 B';
	}
	const i = Math.floor(Math.log(inputSize) / Math.log(1024));
	return `${(inputSize / 1024 ** i).toFixed(2).toString()} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
};

export const previewType = (contentType: string): 'image' | 'pdf' | undefined => {
	if (contentType?.startsWith('image') && !contentType?.includes('photoshop')) return 'image';
	if (
		contentType?.endsWith('pdf') ||
		includes(
			[
				'text/csv',
				'text/plain',
				'application/vnd.ms-excel',
				'application/msword',
				'application/vnd.oasis.opendocument.spreadsheet',
				'application/vnd.oasis.opendocument.presentation',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'application/vnd.oasis.opendocument.text'
			],
			contentType
		)
	)
		return 'pdf';
	return undefined;
};
