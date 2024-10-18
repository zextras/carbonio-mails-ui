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
const identity2 = createFakeIdentity();
export const getMsgResult = {
	Header: {
		context: {
			session: {
				id: '1115794',
				_content: '1115794'
			},
			change: {
				token: 22180
			},
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		GetMsgResponse: {
			m: [
				{
					s: 3508820,
					d: 1670944145000,
					l: '2',
					cid: '-11191',
					f: 'au',
					rev: 22180,
					id: '15',
					fr: 'See attachment',
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
					su: 'Signed email with smime certificate',
					mid: `<CANqftiDmvboN=yiAnT3ASaqGm0+K4Tavj6QpyqG+-tJfyXxGhQ@${faker.internet.domainName()}>`,
					sd: 1670944129000,
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
											s: 16
										},
										{
											part: '1.2',
											ct: 'text/html',
											s: 46,
											body: true,
											content: '<div dir="auto">See attachment </div>\r\n'
										}
									]
								},
								{
									part: '2',
									ct: 'text/vcard',
									s: 2560813,
									cd: 'attachment',
									filename: 'designer.vcf',
									ci: '<1850c07eedd85eb836f1>'
								}
							]
						}
					],
					signature: [
						{
							type: 'SMIME',
							certificate: {
								issuer: {
									name: 'Actalis Client Authentication CA G3'
								},
								email: 'sonersivri@gmail.com',
								notBefore: 1728926022000,
								notAfter: 1760462022000
							},
							message: 'Cannot find issuer certificate',
							messageCode: 'ISSUER_CERT_NOT_FOUND',
							valid: false
						}
					]
				}
			],
			_jsns: 'urn:zimbraMail'
		}
	},
	_jsns: 'urn:zimbraSoap'
};
