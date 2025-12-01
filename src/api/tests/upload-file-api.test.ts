import { HttpResponse } from 'msw';

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { uploadFileApi } from 'api/upload-file-api';

const createUploadResponse = (res: {
	aid: string;
	filename: string;
	contentType: string;
}): string =>
	`200,'null',[{"aid":"${res.aid}","ct":"${res.contentType}","filename":"${res.filename}","s":232278}]`;

const mockUploadApiSuccess = (file: File, uploadId = '123'): void => {
	createAPIInterceptor(
		'post',
		'/service/upload?fmt=extended,raw&lbfums',
		HttpResponse.text(
			createUploadResponse({
				aid: uploadId,
				filename: file.name,
				contentType: file.type
			})
		)
	);
};
const mockUploadApiEmptyResponse = (): void => {
	createAPIInterceptor('post', '/service/upload?fmt=extended,raw&lbfums', HttpResponse.text(''));
};
describe('uploadFileApi', () => {
	it('returns attachment ID when upload is successful', async () => {
		const file = new File(['content'], 'test.txt', { type: 'text/plain' });
		mockUploadApiSuccess(file, '12345');
		const result = await uploadFileApi(file);

		expect(result).toEqual({ aid: '12345' });
	});

	it('returns default attachment ID when response is empty', async () => {
		const file = new File(['content'], 'test.txt', { type: 'text/plain' });
		mockUploadApiEmptyResponse();

		const result = await uploadFileApi(file);

		expect(result).toEqual({ aid: 'no aid found' });
	});

	it('handles file with no type', async () => {
		const file = new File(['content'], 'test.txt');
		mockUploadApiSuccess(file, '12345');

		const result = await uploadFileApi(file);

		expect(result).toEqual({ aid: '12345' });
	});

	it('handles file with special characters in name', async () => {
		const file = new File(['content'], 'test@#$.txt', { type: 'text/plain' });
		mockUploadApiSuccess(file, '12345');

		const result = await uploadFileApi(file);

		expect(result).toEqual({ aid: '12345' });
	});
});
