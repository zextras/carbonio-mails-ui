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
const identity2 = createFakeIdentity();
const identity3 = createFakeIdentity();
export const getMsgResult = {
	Header: {
		context: {
			session: {
				id: '159354',
				_content: '159354'
			},
			change: {
				token: 21835
			},
			notify: [
				{
					seq: 17,
					deleted: {
						id: 'c0ae924f-9e12-462a-8de2-ca4ddc04638d:173099,c0ae924f-9e12-462a-8de2-ca4ddc04638d:-173099'
					}
				}
			],
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		GetMsgResponse: {
			offset: '0',
			sortBy: 'dateDesc',
			m: [
				{
					s: 1081398,
					d: 1665666903000,
					l: '1091',
					cid: '-911',
					f: 'a!',
					tn: 'Missing attachment',
					rev: 2438,
					id: '5',
					fr: `Buongiorno, trasmettiamo in allegato modulo di versamento. Cordiali saluti. ${identity1.fullName} NB. QUESTA MAIL E' GENERATA ...`,
					su: 'Invio moduli di versamento',
					mid: '<64-013de24d-00001753ae0d53016000-000-27a2dd85@foo.com>',
					sd: 1663056653000,
					rd: 1665666902000,
					cm: true,
					e: [
						{
							a: identity1.email,
							d: identity1.fullName,
							t: 'f'
						},
						{
							a: identity2.email,
							d: identity2.fullName,
							t: 't'
						},
						{
							a: identity3.email,
							d: identity3.firstName,
							p: identity3.fullName,
							t: 'rf'
						}
					],
					mp: [
						{
							part: 'TEXT',
							ct: 'multipart/mixed',
							mp: [
								{
									part: '1',
									ct: 'text/plain',
									s: 236,
									body: true,
									content: ` Buongiorno,\r\ntrasmettiamo in allegato modulo di versamento.\r\nCordiali saluti.\r\n${identity1.fullName}\r\nUfficio Iscrizioni-Contributi\r\n\r\nNB. QUESTA MAIL E' GENERATA AUTOMATICAMENTE.\r\n       NON RISPONDERE POICHE' NON VERRA' LETTA DA NESSUN OPERATORE.\r\n`
								},
								{
									part: '2',
									ct: 'application/pdf',
									s: 783828,
									filename: '000011716950.pdf',
									body: true
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
