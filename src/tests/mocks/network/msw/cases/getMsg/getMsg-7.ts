/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { createFakeIdentity } from '../../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';

/**
 * Email with 2 inline images attachments
 */
const identity1 = createFakeIdentity();
const identity2 = createFakeIdentity();
export const getMsgResult = {
	Header: {
		context: {
			session: {
				id: '1115794',
				_content: '1115794'
			},
			change: {
				token: 22176
			},
			_jsns: 'urn:carbonio'
		}
	},
	Body: {
		GetMsgResponse: {
			m: [
				{
					s: 4473224,
					d: 1670322643000,
					l: '2',
					cid: '-10924',
					f: 'a',
					rev: 21824,
					id: '7',
					fr: identity1.fullName,
					e: [
						{
							a: identity1.email,
							d: identity1.firstName,
							p: identity1.fullName,
							t: 'f'
						},
						{
							a: identity2.email,
							d: identity2.firstName,
							p: identity2.fullName,
							t: 't'
						}
					],
					su: faker.lorem.sentence(1),
					mid: '<455402471.14248390.1670322641702.JavaMail.zextras@zextras.com>',
					sd: 1670322641000,
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
											s: 63
										},
										{
											part: '1.2',
											ct: 'multipart/related',
											mp: [
												{
													part: '1.2.1',
													ct: 'text/html',
													s: 716,
													body: true,
													content: `<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000">\r\n<div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"><br /> <img src="cid:6301e287-32bd-4a66-a4bc-26c11993b4a3&#64;carbonio" /><br /><br /> <img src="cid:616059c8-b2fb-48a5-a0eb-3e0b0e621ca3&#64;carbonio" /><br />\r\n<p><span style="color:#000000;font-family:&#39;helvetica&#39; , &#39;arial&#39; , sans-serif">${
														identity1.fullName
													}</span></p>\r\n<p><span style="color:#e03e2d;font-family:&#39;helvetica&#39; , &#39;arial&#39; , sans-serif"><em>${faker.commerce.department()}<br /><br /><br /><br /></em></span></p>\r\n</div>\r\n</div></div></body></html>`
												},
												{
													part: '1.2.2',
													ct: 'image/jpeg',
													s: 3436,
													cd: 'inline',
													filename: 'Gandalf Meme.jpeg',
													ci: '<6301e287-32bd-4a66-a4bc-26c11993b4a3@carbonio>'
												},
												{
													part: '1.2.3',
													ct: 'image/jpeg',
													s: 3262255,
													cd: 'inline',
													filename: 'IMG_20221125_154437.jpg',
													ci: '<616059c8-b2fb-48a5-a0eb-3e0b0e621ca3@carbonio>'
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
