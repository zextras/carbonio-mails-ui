/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { buildSavedAttachments, composeAttachMpField } from './editor-transformations';
import { generateMessage } from '../../../tests/generators/generateMessage';

describe('composeAttachMpField', () => {
	it('should correctly transform an array of SavedAttachment to an array of MailAttachmentParts', async () => {
		const savedAttachments = [
			{
				contentType: 'message/rfc822',
				size: 8539,
				isInline: false,
				filename: 'Conquista del mondo senza meeting room.eml',
				partName: '2',
				messageId: '11215',
				requiresSmartLinkConversion: false
			}
		];
		const result = composeAttachMpField(savedAttachments);

		const expectedOutput = [
			{
				requiresSmartLinkConversion: false,
				mid: '11215',
				part: '2'
			}
		];
		expect(result).toEqual(expectedOutput);
	});
});

describe('buildSavedAttachments', () => {
	it('should return an empty array when there are no SavedAttachment', () => {
		const mailMessage = generateMessage({ folderId: '2' });
		const result = buildSavedAttachments(mailMessage);
		expect(result).toEqual([]);
	});
	it('should return an array of SavedAttachment when there are SavedAttachment', () => {
		const message = generateMessage({ folderId: '2' });
		message.parts = [
			{
				contentType: 'text/html',
				content: `<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"> <img src="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a&#64;zimbra" /> <img src="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb&#64;zimbra" alt="pic1" data-testId="picture1"/> <img src="cid:65766eee-4439-438c-a375-1ac111ed1a07&#64;zimbra" /><br /><br />\r\n<div><br />Kind Regards <br /><br />something</div>\r\n</div>\r\n</div>\r\n</div></div></body></html>`,
				size: 999,
				name: 'filename.jpg',
				ci: '<65766eee-4439-438c-a375-1ac111ed1a07@zimbra>',
				requiresSmartLinkConversion: true,
				truncated: false
			}
		];
		const result = buildSavedAttachments(message);

		const expectedOutput = [
			{
				contentId: '65766eee-4439-438c-a375-1ac111ed1a07@zimbra',
				contentType: 'text/html',
				filename: '',
				isInline: false,
				messageId: message.id,
				partName: 'filename.jpg',
				requiresSmartLinkConversion: true,
				size: 999
			}
		];
		expect(result).toMatchObject(expectedOutput);
	});
});
