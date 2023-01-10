/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createFakeIdentity } from '../../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';

/**
 * MIME formatted email with PDF attachment
 */
const identity1 = createFakeIdentity();

export const getMsgResult = {
	Header: {
		context: {
			session: {
				id: '1229280',
				_content: '1229280'
			},
			change: {
				token: 101679
			},
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		GetMsgResponse: {
			m: [
				{
					s: 480239,
					d: 1671801668000,
					l: '2',
					cid: '29492',
					f: 'a',
					rev: 101593,
					id: '10',
					fr: `Kind Regards ${identity1.fullName}`,
					e: [
						{
							a: identity1.email,
							d: identity1.firstName,
							p: identity1.fullName,
							t: 'f'
						},
						{
							a: identity1.email,
							d: identity1.firstName,
							p: identity1.fullName,
							t: 't'
						}
					],
					su: 'test inline attachments',
					mid: `<967521559.51018170.1671801667790.JavaMail.${identity1.email}>`,
					sd: 1671801667000,
					mp: [
						{
							part: 'TEXT',
							ct: 'multipart/mixed',
							mp: [
								{
									part: '1',
									ct: 'multipart/alternative',
									mp: [
										{
											part: '1.1',
											ct: 'text/plain',
											s: 52
										},
										{
											part: '1.2',
											ct: 'multipart/related',
											mp: [
												{
													part: '1.2.1',
													ct: 'text/html',
													s: 682,
													body: true,
													content: `<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"> <img src="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a&#64;zimbra" /> <img src="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb&#64;zimbra" alt="pic1" data-testId="picture1"/> <img src="cid:65766eee-4439-438c-a375-1ac111ed1a07&#64;zimbra" /><br /><br />\r\n<div><br />Kind Regards <br /><br />${identity1.fullName}</div>\r\n</div>\r\n</div>\r\n</div></div></body></html>`
												},
												{
													part: '1.2.2',
													ct: 'image/jpeg',
													s: 130815,
													cd: 'inline',
													filename: 'test_2.jpg',
													ci: '<65766eee-4439-438c-a375-1ac111ed1a07@zimbra>'
												},
												{
													part: '1.2.3',
													ct: 'image/jpeg',
													s: 188443,
													cd: 'inline',
													filename: 'test_1.jpg',
													ci: '<b8c321cd-0b7b-4a18-8b86-da38b937b6eb@zimbra>'
												},
												{
													part: '1.2.4',
													ct: 'audio/x-riff',
													s: 28318,
													cd: 'inline',
													filename: 'confused-cat.jpg',
													ci: '<2dbe26b8-2c96-40a0-94c5-ad891bac1f9a@zimbra>'
												}
											]
										}
									]
								}
							]
						}
					]
				}
			],
			_jsns: 'urn:zimbraMail'
		}
	},
	_jsns: 'urn:zimbraSoap'
};
