/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createFakeIdentity } from '../../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';

const identity = createFakeIdentity();

const result = {
	Header: {
		context: {
			session: { id: '113405', _content: '113405' },
			change: { token: 21489 },
			notify: [
				{
					seq: 14,
					modified: {
						mbx: [{ s: 248716466 }],
						folder: [
							{
								id: '6',
								uuid: '8d438ed1-5d63-4bfb-8059-0ef93812a488',
								deletable: false,
								n: 2,
								s: 1955,
								i4ms: 21488,
								i4next: 10719
							}
						],
						m: [
							{
								s: 866,
								d: 1669740509000,
								meta: [{}],
								rev: 21488,
								i4uid: 1,
								id: '1',
								e: [{ a: identity.email, d: identity.firstName, p: identity.fullName, t: 'f' }],
								su: ''
							}
						]
					}
				}
			],
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		SaveDraftResponse: {
			m: [
				{
					s: 866,
					d: 1669740509000,
					l: '6',
					cid: '-1',
					f: 'sd',
					rev: 21488,
					id: '1',
					e: [{ a: identity.email, d: identity.firstName, p: identity.fullName, t: 'f' }],
					su: '',
					mid: '\u003C840622014.2092008.1669740509754.JavaMail.zextras@zextras.com\u003E',
					sd: 1669740509000,
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
											ct: 'text/html',
											s: 120,
											body: true,
											content:
												'\u003Chtml\u003E\u003Cbody\u003E\u003Cdiv style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"\u003E\u003C/div\u003E\u003C/body\u003E\u003C/html\u003E'
										},
										{ part: '1.2', ct: 'text/plain', s: 0 }
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
