/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// this message has got 1 eml attachment

export const getMsgResult = {
	Header: {
		context: {
			session: { id: '165483', _content: '165483' },
			change: { token: 15977 },
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		GetMsgResponse: {
			m: [
				{
					s: 5155,
					d: 1668702161000,
					l: '2',
					cid: '-27291',
					f: 'a',
					rev: 97453,
					id: '27291',
					fr: "This is the mail system at host crb1.zimbraopen.com. I'm sorry to have to inform you that your message could not be delivered to one or more ...",
					su: 'Undelivered Mail Returned to Sender',
					mid: '<4NClZ90XmLz1gwwc@crb1.zimbraopen.com>',
					sd: 1668702161000,
					cm: true,
					e: [
						{
							a: 'MAILER-DAEMON@crb1.zimbraopen.com',
							d: 'Mail',
							p: 'Mail Delivery System',
							t: 'f'
						},
						{
							a: 'ciccio.pasticcio@foo.com',
							d: 'ciccio',
							p: 'ciccio pasticcio',
							t: 't'
						}
					],
					mp: [
						{
							part: 'TEXT',
							ct: 'multipart/report',
							mp: [
								{
									part: '1',
									ct: 'text/plain',
									s: 520,
									body: true,
									content:
										"This is the mail system at host crb1.zimbraopen.com.\r\n\r\nI'm sorry to have to inform you that your message could not\r\nbe delivered to one or more recipients. It's attached below.\r\n\r\nFor further assistance, please send mail to postmaster.\r\n\r\nIf you do so, please include this problem report. You can\r\ndelete your own text from the attached returned message.\r\n\r\n                   The mail system\r\n\r\n<foo@foo.foooooooo>: Host or domain name not found. Name service error for\r\n    name=foo.foooooooo type=A: Host not found\r\n"
								},
								{
									part: '2',
									ct: 'message/delivery-status',
									s: 443
								},
								{
									part: '3',
									ct: 'message/rfc822',
									s: 2985,
									filename: 'fdasfdsa',
									mp: [
										{
											part: '3.TEXT',
											ct: 'multipart/mixed',
											mp: [
												{
													part: '3.1',
													ct: 'multipart/alternative',
													mp: [
														{
															part: '3.1.1',
															ct: 'text/html',
															s: 199
														},
														{
															part: '3.1.2',
															ct: 'text/plain',
															s: 51
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
					sf: ''
				}
			],
			more: false,
			_jsns: 'urn:zimbraMail'
		}
	}
};
