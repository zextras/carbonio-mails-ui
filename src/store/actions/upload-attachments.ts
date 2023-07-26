/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import axios from 'axios';
import { map } from 'lodash';

import { convertToDecimal } from '../../commons/utilities';

export type UploadAttachmentResponse = Array<{ aid: string }>;

function parse(str: string): Array<Array<{ aid: string }>> {
	// eslint-disable-next-line no-new-func
	return Function(`'use strict'; return (${str})`)();
}

export async function uploadAttachments({
	files
}: {
	files: FileList;
}): Promise<UploadAttachmentResponse> {
	return Promise.all(
		map(files, (file) =>
			fetch('/service/upload?fmt=extended,raw', {
				headers: {
					'Cache-Control': 'no-cache',
					'X-Requested-With': 'XMLHttpRequest',
					'Content-Type': `${file.type || 'application/octet-stream'};`,
					'Content-Disposition': `attachment; filename="${convertToDecimal(file.name)}"`
				},
				method: 'POST',
				body: file
			})
				.then((res) => res.text())
				.then((txt) => parse(`[${txt}]`))
				.then((val) => ({ aid: val[2][0].aid }))
		)
	);
}

export async function uploadAttachmentsv2({
	files
}: {
	files: FileList;
}): Promise<UploadAttachmentResponse> {
	return axios.all(
		map(files, (file) =>
			axios
				.post('/service/upload?fmt=extended,raw', file, {
					headers: {
						'Cache-Control': 'no-cache',
						'X-Requested-With': 'XMLHttpRequest',
						'Content-Type': `${file.type || 'application/octet-stream'};`,
						'Content-Disposition': `attachment; filename="${convertToDecimal(file.name)}"`
					},
					onUploadProgress: (progressEvent) => {
						if (progressEvent) {
							// TODO: add progress bar
							// console.log(`@@ progress ${progressEvent.loaded} ${progressEvent.total}`);
						}
					}
				})
				.then((res) => res.data)
				.then((txt) => parse(`[${txt}]`))
				.then((val) => ({ aid: val[2][0].aid }))
		)
	);
}
