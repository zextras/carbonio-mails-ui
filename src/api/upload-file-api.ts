/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parse } from 'api/upload-attachments-api';
import { convertToDecimal } from 'commons/utilities';

/**
 * Uploads a single file to the server and returns the attachment ID.
 *
 * @param file - The file to be uploaded.
 * @returns A promise that resolves to an object containing the attachment ID (`aid`).
 */
export const uploadFileApi = async (file: File): Promise<{ aid: string }> => {
	const response = await fetch('/service/upload?fmt=extended,raw&lbfums', {
		method: 'POST',
		body: file,
		headers: {
			'Cache-Control': 'no-cache',
			'X-Requested-With': 'XMLHttpRequest',
			'Content-Type': `${file.type || 'application/octet-stream'};`,
			'Content-Disposition': `attachment; filename="${convertToDecimal(file.name)}"`
		}
	});
	const data = await response.text();

	if (data) {
		const val = parse(`[${data}]`);
		const { aid } = val[2][0];

		return {
			aid
		};
	}
	return { aid: 'no aid found' };
};
