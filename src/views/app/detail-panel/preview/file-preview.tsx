/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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

export const previewType = (contentType: string): string | undefined =>
	// eslint-disable-next-line no-nested-ternary
	contentType?.startsWith('image') ? 'image' : contentType?.endsWith('pdf') ? 'pdf' : undefined;
