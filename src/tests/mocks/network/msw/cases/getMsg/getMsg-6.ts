/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { createFakeIdentity } from '../../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';

/**
 * MIME formatted email with 6 image attachments
 */
const identity1 = createFakeIdentity();
const identity2 = createFakeIdentity();
export const getMsgResult = {
	Header: {
		context: {
			session: {
				id: '159354',
				_content: '159354'
			},
			change: {
				token: 21837
			},
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		GetMsgResponse: {
			offset: '0',
			sortBy: 'dateDesc',
			m: [
				{
					s: 302668,
					d: 1666877762000,
					l: '1091',
					cid: '1047',
					f: 'aw',
					rev: 2757,
					id: '6',
					fr: faker.lorem.paragraph(3),
					su: faker.lorem.paragraph(1),
					mid: '<fakeid@fakeid.foo.com>',
					sd: 1657202803000,
					rd: 1666877762000,
					cm: true,
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
						},
						{
							a: identity2.email,
							d: identity2.firstName,
							p: identity2.fullName,
							t: 'rf'
						}
					],
					mp: [
						{
							part: 'TEXT',
							ct: 'multipart/related',
							mp: [
								{
									part: '1',
									ct: 'multipart/alternative',
									mp: [
										{
											part: '1.1',
											ct: 'text/plain',
											s: 2700
										},
										{
											part: '1.2',
											ct: 'text/html',
											s: 255111,
											body: true,
											content: `<html><head><style style="display:none">/*<![CDATA[*/P {\n\tmargin-top: 0;\n\tmargin-bottom: 0;\n}\n/*]]>*/</style></head><body dir="ltr">\r\n<div style="font-family:&#39;calibri&#39; , &#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:rgb( 0 , 0 , 0 )" class="elementToProof">\r\n<span style="color:black;font-family:&#39;calibri&#39; , sans-serif;font-size:11pt">Gentile sig. ${identity2.lastName},</span><br />\r\n</div>\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div></body></html>\r\n`
										}
									]
								},
								{
									part: '2',
									ct: 'image/jpeg',
									s: 7056,
									cd: 'inline',
									filename: 'Outlook-1x1g1hrl.jpg',
									ci: '<d3f1a3d8-d183-4bc6-b7e7-9dc18b221822>'
								},
								{
									part: '3',
									ct: 'image/jpeg',
									s: 2139,
									cd: 'inline',
									filename: 'Outlook-ilsh22rk.jpg',
									ci: '<672c7645-7578-497e-83a4-e12430643c07>'
								},

								{
									part: '4',
									ct: 'image/jpeg',
									s: 2778,
									cd: 'inline',
									filename: 'Outlook-wzehgcke.jpg',
									ci: '<73fa1971-16b3-4a44-81d5-eef617271c72>'
								},
								{
									part: '5',
									ct: 'image/png',
									s: 1134,
									cd: 'inline',
									filename: 'Outlook-qyhk2jqr.png',
									ci: '<14709f65-f185-4d40-9d70-31a34fab14d5>'
								},
								{
									part: '6',
									ct: 'image/png',
									s: 1176,
									cd: 'inline',
									filename: 'Outlook-3ypg122c.png',
									ci: '<220ff923-3fc3-468f-b9ff-410fd2f0a3d0>'
								},
								{
									part: '7',
									ct: 'image/png',
									s: 2706,
									cd: 'inline',
									filename: 'Outlook-s3qk5vmt.png',
									ci: '<d6b2fc7d-e736-409d-8645-8598b5cb8720>'
								}
							]
						}
					],
					sf: ''
				}
			],
			more: false,
			_jsns: 'urn:zimbraMail'
		}
	},
	_jsns: 'urn:zimbraSoap'
};
