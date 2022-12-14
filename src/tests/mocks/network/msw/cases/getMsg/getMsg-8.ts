/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { createFakeIdentity } from '../../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';

/**
 * Email with 1 image attachment
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
				token: 22178
			},
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		GetMsgResponse: {
			m: [
				{
					s: 223795,
					d: 1670943295000,
					l: '2',
					cid: '-11190',
					f: 'a',
					rev: 22177,
					id: '8',
					fr: 'Check it out',
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
					su: 'Important attachment',
					mid: `<CAAofgROPGAEWP3aEMnRpbwdKhusRk8VLXve3ekDJaXru7VrOAA@${faker.internet.domainName()}>`,
					sd: 1670943277000,
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
											s: 14
										},
										{
											part: '1.2',
											ct: 'text/html',
											s: 36,
											body: true,
											content: '<div dir="auto">Check it out</div>\r\n'
										}
									]
								},
								{
									part: '2',
									ct: 'image/gif',
									s: 160261,
									cd: 'attachment',
									filename: 'giphy.gif',
									ci: '<1850bfa36a91fd592b51>'
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
