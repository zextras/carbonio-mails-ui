/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes } from 'lodash';

import { ErrorMessageCode, getAttachmentsLink, getSignedIconColor } from '../utils';

jest.mock('lodash', () => ({
	includes: jest.fn()
}));

describe('getAttachmentsLink', () => {
	const messageId = '12345';
	const messageSubject = 'testSubject';
	const getLocationOrigin = jest.fn().mockReturnValue('http://localhost');

	beforeEach(() => {
		getLocationOrigin.mockClear();
	});

	it('should return a zip link when there are multiple attachments', () => {
		const attachments = ['file1', 'file2'];
		const result = getAttachmentsLink({
			messageId,
			messageSubject,
			attachments,
			attachmentType: 'application/zip'
		});
		expect(result).toBe(
			'http://localhost/service/home/~/?auth=co&id=12345&filename=testSubject&charset=UTF-8&part=file1,file2&disp=a&fmt=zip'
		);
	});

	it('should return an image preview link for image attachment types', () => {
		(includes as unknown as jest.Mock).mockReturnValueOnce(true); // Simulating image type

		const attachments = ['image1'];
		const result = getAttachmentsLink({
			messageId,
			messageSubject,
			attachments,
			attachmentType: 'image/tiff'
		});
		expect(result).toBe('http://localhost/service/preview/image/12345/image1/0x0/?quality=high');
		expect(includes).toHaveBeenCalledWith(
			['image/gif', 'image/png', 'image/jpeg', 'image/jpg', 'image/tiff'],
			'image/tiff'
		);
	});

	it('should return a pdf preview link for pdf attachment type', () => {
		(includes as unknown as jest.Mock).mockReturnValueOnce(false).mockReturnValueOnce(true); // Simulating pdf type

		const attachments = ['pdf1'];
		const result = getAttachmentsLink({
			messageId,
			messageSubject,
			attachments,
			attachmentType: 'application/pdf'
		});
		expect(result).toBe('http://localhost/service/preview/pdf/12345/pdf1/?first_page=1');
		expect(includes).toHaveBeenCalledWith(['application/pdf'], 'application/pdf');
	});

	it('should return a document preview link for document attachment types', () => {
		(includes as unknown as jest.Mock)
			.mockReturnValueOnce(false)
			.mockReturnValueOnce(false)
			.mockReturnValueOnce(true); // Simulating document type

		const attachments = ['doc1'];
		const result = getAttachmentsLink({
			messageId,
			messageSubject,
			attachments,
			attachmentType: 'application/msword'
		});
		expect(result).toBe('http://localhost/service/preview/document/12345/doc1');
		expect(includes).toHaveBeenCalledWith(
			[
				'text/csv',
				'text/plain',
				'application/msword',
				'application/vnd.ms-excel',
				'application/vnd.ms-powerpoint',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'application/vnd.openxmlformats-officedocument.presentationml.presentation',
				'application/vnd.oasis.opendocument.spreadsheet',
				'application/vnd.oasis.opendocument.presentation',
				'application/vnd.oasis.opendocument.text'
			],
			'application/msword'
		);
	});

	it('should return a default attachment link for unrecognized attachment types', () => {
		(includes as unknown as jest.Mock)
			.mockReturnValueOnce(false)
			.mockReturnValueOnce(false)
			.mockReturnValueOnce(false); // No match for any type

		const attachments = ['file1'];
		const result = getAttachmentsLink({
			messageId,
			messageSubject,
			attachments,
			attachmentType: 'unknown/type'
		});
		expect(result).toBe('http://localhost/service/home/~/?auth=co&id=12345&part=file1&disp=a');
	});
});

describe('getSignedIconColor', () => {
	test(`should reply 'success' if error message code is VALID`, () => {
		expect(getSignedIconColor(ErrorMessageCode.VALID)).toEqual('success');
	});

	test(`should reply 'warning' if error message code is one of from UNTRUSTED, SIGNER_CERT_NOT_FOUND and ISSUER_CERT_NOT_FOUND`, () => {
		expect(getSignedIconColor(ErrorMessageCode.UNTRUSTED)).toEqual('warning');
		expect(getSignedIconColor(ErrorMessageCode.CERT_NOT_FOUND)).toEqual('warning');
		expect(getSignedIconColor(ErrorMessageCode.ISSUER_NOT_FOUND)).toEqual('warning');
	});

	test(`should reply 'error' if error message code is SIGNER_CERT_EXPIRED or UNTRUSTED`, () => {
		expect(getSignedIconColor(ErrorMessageCode.CERT_EXPIRED)).toEqual('error');
		expect(getSignedIconColor(ErrorMessageCode.INVALID)).toEqual('error');
	});
});
