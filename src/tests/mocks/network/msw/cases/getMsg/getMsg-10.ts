/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { createFakeIdentity } from '../../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';

/**
 * Email with 1 PDF attachment
 */
const identity1 = createFakeIdentity();
export const getMsgResult = {
	Header: {
		context: {
			session: {
				id: '1209565',
				_content: '1209565'
			},
			change: {
				token: 101595
			},
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		SearchConvResponse: {
			offset: '0',
			sortBy: 'dateDesc',
			m: [
				{
					s: 480239,
					d: 1671801668000,
					l: '3',
					cid: '29492',
					f: 'a',
					rev: 101594,
					id: '29493',
					fr: `Kind Regards ${identity1.fullName}}`,
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
					mid: `<967521559.51018170.1671801667790.JavaMail.${faker.internet.domainName()}`,
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
													content: `<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><img src="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a&#64;zimbra" /> <img src="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb&#64;zimbra" /> <img src="cid:65766eee-4439-438c-a375-1ac111ed1a07&#64;zimbra" /><br /><br />\r\n<div><br />Kind Regards <br /><br />${identity1.fullName}</div>\r\n</div>\r\n</div>\r\n</div></div></body></html>`
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
				},
				{
					s: 480239,
					d: 1671801668000,
					l: '2',
					cid: '29492',
					f: 'a',
					rev: 101593,
					id: '29491',
					fr: ` kind regards ${identity1.fullName}`,
					su: 'test inline attachments',
					mid: `<967521559.51018170.1671801667790.JavaMail.${faker.internet.domainName()}`,
					sd: 1671801667000,
					cm: true,
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
													content: `<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><img src="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a&#64;zimbra" /> <img src="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb&#64;zimbra" /> <img src="cid:65766eee-4439-438c-a375-1ac111ed1a07&#64;zimbra" /><br /><br />\r\n<div><br />Kind Regards <br /><br />${identity1.fullName}</div>\r\n</div>\r\n</div>\r\n</div></div></body></html>`
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
					],
					sf: ''
				},
				{
					s: 478307,
					d: 1671801667000,
					l: '5',
					cid: '29492',
					f: 'sa',
					rev: 101590,
					id: '29490',
					fr: ` kind regards ${identity1.fullName}`,
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
					mid: `<967521559.51018170.1671801667790.JavaMail.${faker.internet.domainName()}`,
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
													s: 676,
													body: true,
													content: `<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><img src="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a&#64;zimbra" /> <img src="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb&#64;zimbra" /> <img src="cid:65766eee-4439-438c-a375-1ac111ed1a07&#64;zimbra" /><br /><br />\n<div><br />Kind Regards <br /><br />${identity1.fullName}</div>\n</div>\n</div>\n</div></div></body></html>`
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
			more: false,
			_jsns: 'urn:zimbraMail'
		}
	},
	_jsns: 'urn:zimbraSoap'
};
