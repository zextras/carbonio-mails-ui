/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createFakeIdentity } from '../../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';

/**
 * Email with an inline attachment without content disposition
 */
const identity1 = createFakeIdentity();
const identity2 = createFakeIdentity();

export const getMsgResult = {
	Header: {
		context: {
			session: {
				id: '154557',
				_content: '154557'
			},
			change: {
				token: 48598
			},
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		GetMsgResponse: {
			m: [
				{
					s: 40567,
					d: 1692794194000,
					l: '2',
					cid: '24112',
					f: 'aw',
					rev: 45411,
					id: '23449',
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
					su: 'Test 2 - inline image sent via Outlook as ActiveSync client',
					mid: '<1752150646.6396125.1691648702500.JavaMail.zextras@df3>',
					sd: 1691648702000,
					rd: 1692794194000,
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
											s: 4
										},
										{
											part: '1.2',
											ct: 'text/html',
											s: 2024,
											body: true,
											content:
												'<html xmlns="http://www.w3.org/TR/REC-html40"><head><style>/*<![CDATA[*/p.MsoNormal, li.MsoNormal, div.MsoNormal {\n\tmargin: 0.0in;\n\tfont-size: 11.0pt;\n\tfont-family: Calibri , sans-serif;\n}\nspan.StileMessaggioDiPostaElettronica18 {\n\tfont-family: Calibri , sans-serif;\n\tcolor: windowtext;\n}\n*.MsoChpDefault {\n\tfont-size: 10.0pt;\n}\ndiv.WordSection1 {\n\tpage: WordSection1;\n}\n/*]]>*/</style></head><body lang="EN-US" style="word-wrap:break-word"><div class="WordSection1"><p class="MsoNormal"><img width="474" height="474" style="width:4.9375in;height:4.9375in" id="Immagine_x0020_1" src="cid:image001.jpg&#64;01D9CB62.1AADEDA0" alt="Immagine che contiene clipart, cartone animato\n\nDescrizione generata automaticamente" /></p></div></body></html>'
										}
									]
								},
								{
									part: '2',
									ct: 'image/jpeg',
									s: 22848,
									filename: 'image001.jpg',
									ci: '<image001.jpg@01D9CB62.1AADEDA0>'
								}
							]
						}
					]
				}
			],
			_jsns: 'urn:zimbraMail'
		}
	}
};
