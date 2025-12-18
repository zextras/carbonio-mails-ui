/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HttpResponse } from 'msw';

import {
	APIInterceptor,
	createAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';

const createUploadResponse = (res: {
	aid: string;
	filename: string;
	contentType: string;
}): string =>
	`200,'null',[{"aid":"${res.aid}","ct":"${res.contentType}","filename":"${res.filename}","s":232278}]`;

export const mockUploadApiSuccess = (
	file: File,
	attachmentId = '123',
	delayTime = 0
): APIInterceptor =>
	createAPIInterceptor(
		'post',
		'/service/upload',
		HttpResponse.text(
			createUploadResponse({
				aid: attachmentId,
				filename: file.name,
				contentType: file.type
			})
		),
		delayTime
	);

export const mockUploadApiEmptyResponse = (): void => {
	createAPIInterceptor('post', '/service/upload', HttpResponse.text(''));
};
export const mockUploadApiError = (): APIInterceptor =>
	createAPIInterceptor('post', '/service/upload', HttpResponse.error());
