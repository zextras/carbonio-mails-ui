/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import axios from 'axios';
import { map } from 'lodash';

import { convertToDecimal } from '../../commons/utilities';
import { OnUploadProgressProps } from '../../helpers/attachments';
import { MailsEditorV2 } from '../../types';

export type UploadAttachmentResponse = Array<{ aid: string } | null>;

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
	files,
	onUploadProgress,
	editorId,
	attachmentFiles
}: {
	files: FileList;
	attachmentFiles: MailsEditorV2['attachmentFiles'];
	editorId: MailsEditorV2['id'];
	onUploadProgress: ({
		editorId,
		attachmentFiles,
		file,
		progressEvent
	}: OnUploadProgressProps) => void;
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
						if (progressEvent && progressEvent.loaded && progressEvent.total) {
							onUploadProgress({ file, progressEvent, attachmentFiles, editorId });
						}
					}
				})
				.then((res) => res.data)
				.then((txt) => parse(`[${txt}]`))
				.then((val) => {
					if (val[2]) return { aid: val[2][0].aid };
					return null;
				})
		)
	);
}
