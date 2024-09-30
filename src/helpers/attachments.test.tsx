/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getReferredContentIds } from './attachments';

describe('getReferredContentIds', () => {
	it('should return an array of strings if content is declared and contentType is text/html ', () => {
		const parts = [
			{
				contentType: 'text/html',
				content: `<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"> <img src="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a&#64;zimbra" /> <img src="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb&#64;zimbra" alt="pic1" data-testId="picture1"/> <img src="cid:65766eee-4439-438c-a375-1ac111ed1a07&#64;zimbra" /><br /><br />\r\n<div><br />Kind Regards <br /><br />something</div>\r\n</div>\r\n</div>\r\n</div></div></body></html>`,
				size: 999,
				name: 'filename.jpg',
				requiresSmartLinkConversion: true,
				truncated: false
			}
		];
		expect(getReferredContentIds(parts)).toStrictEqual([
			'2dbe26b8-2c96-40a0-94c5-ad891bac1f9a@zimbra',
			'b8c321cd-0b7b-4a18-8b86-da38b937b6eb@zimbra',
			'65766eee-4439-438c-a375-1ac111ed1a07@zimbra'
		]);
	});

	it('should return an empty array if content is declared and contentType is not text/html ', () => {
		const parts = [
			{
				contentType: 'wrong/content/type',
				content: `<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"> <img src="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a&#64;zimbra" /> <img src="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb&#64;zimbra" alt="pic1" data-testId="picture1"/> <img src="cid:65766eee-4439-438c-a375-1ac111ed1a07&#64;zimbra" /><br /><br />\r\n<div><br />Kind Regards <br /><br />something</div>\r\n</div>\r\n</div>\r\n</div></div></body></html>`,
				size: 999,
				name: 'filename.jpg',
				requiresSmartLinkConversion: true,
				truncated: false
			}
		];
		expect(getReferredContentIds(parts).length).toBe(0);
	});
});
