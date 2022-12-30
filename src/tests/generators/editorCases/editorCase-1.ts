/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createFakeIdentity } from '../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';

const identity1 = createFakeIdentity();

export const editorCase = {
	richText: true,
	text: ['', ''],
	to: [],
	cc: [],
	bcc: [],
	from: {
		address: identity1.email,
		fullName: identity1.fullName,
		name: identity1.fullName,
		type: 'f'
	},
	inline: [],
	sender: {},
	editorId: 'new-1',
	subject: '',
	attach: {
		mp: [
			{
				part: '2',
				mid: '11215'
			},
			{
				part: '3',
				mid: '11215'
			},
			{
				part: '4',
				mid: '11215'
			},
			{
				part: '5',
				mid: '11215'
			},
			{
				part: '6',
				mid: '11215'
			},
			{
				part: '7',
				mid: '11215'
			},
			{
				part: '8',
				mid: '11215'
			},
			{
				part: '9',
				mid: '11215'
			},
			{
				part: '10',
				mid: '11215'
			}
		]
	},
	urgent: false,
	requestReadReceipt: false,
	id: '11215',
	attachmentFiles: [
		{
			contentType: 'message/rfc822',
			size: 8539,
			name: '2',
			disposition: 'attachment',
			parts: [
				{
					contentType: 'multipart/alternative',
					size: 0,
					name: '2.TEXT',
					parts: [
						{
							contentType: 'text/html',
							size: 506,
							name: '2.1'
						},
						{
							contentType: 'text/plain',
							size: 450,
							name: '2.2'
						},
						{
							contentType: 'text/calendar',
							size: 1955,
							name: '2.3',
							filename: 'meeting.ics'
						}
					]
				}
			],
			filename: 'Conquista del mondo senza meeting room.eml'
		},
		{
			contentType: 'message/rfc822',
			size: 7063,
			name: '3',
			disposition: 'attachment',
			parts: [
				{
					contentType: 'multipart/alternative',
					size: 0,
					name: '3.TEXT',
					parts: [
						{
							contentType: 'text/html',
							size: 853,
							name: '3.1'
						},
						{
							contentType: 'text/plain',
							size: 642,
							name: '3.2'
						},
						{
							contentType: 'text/calendar',
							size: 2693,
							name: '3.3',
							filename: 'meeting.ics'
						}
					]
				}
			],
			filename: 'Conquista di Giove (con meeting room) - carbonio.eml'
		},
		{
			contentType: 'message/rfc822',
			size: 9887,
			name: '4',
			disposition: 'attachment',
			parts: [
				{
					contentType: 'multipart/alternative',
					size: 0,
					name: '4.TEXT',
					parts: [
						{
							contentType: 'text/html',
							size: 853,
							name: '4.1'
						},
						{
							contentType: 'text/plain',
							size: 657,
							name: '4.2'
						},
						{
							contentType: 'text/calendar',
							size: 2746,
							name: '4.3',
							filename: 'meeting.ics'
						}
					]
				}
			],
			filename: 'Conquista di Giove (con meeting room) - gmail.eml'
		},
		{
			contentType: 'message/rfc822',
			size: 14261,
			name: '5',
			disposition: 'attachment',
			parts: [
				{
					contentType: 'multipart/alternative',
					size: 0,
					name: '5.TEXT',
					parts: [
						{
							contentType: 'text/html',
							size: 950,
							name: '5.1'
						},
						{
							contentType: 'text/plain',
							size: 642,
							name: '5.2'
						},
						{
							contentType: 'text/calendar',
							size: 2693,
							name: '5.3',
							filename: 'meeting.ics'
						}
					]
				}
			],
			filename: 'Conquista di Giove (con meeting room) - outlook.eml'
		},
		{
			contentType: 'message/rfc822',
			size: 9887,
			name: '6',
			disposition: 'attachment',
			parts: [
				{
					contentType: 'multipart/alternative',
					size: 0,
					name: '6.TEXT',
					parts: [
						{
							contentType: 'text/html',
							size: 853,
							name: '6.1'
						},
						{
							contentType: 'text/plain',
							size: 657,
							name: '6.2'
						},
						{
							contentType: 'text/calendar',
							size: 2746,
							name: '6.3',
							filename: 'meeting.ics'
						}
					]
				}
			],
			filename: 'Conquista di Giove (con meeting room).eml'
		},
		{
			contentType: 'message/rfc822',
			size: 5752,
			name: '7',
			disposition: 'attachment',
			parts: [
				{
					contentType: 'multipart/alternative',
					size: 0,
					name: '7.TEXT',
					parts: [
						{
							contentType: 'text/html',
							size: 509,
							name: '7.1'
						},
						{
							contentType: 'text/plain',
							size: 441,
							name: '7.2'
						},
						{
							contentType: 'text/calendar',
							size: 1920,
							name: '7.3',
							filename: 'meeting.ics'
						}
					]
				}
			],
			filename: 'Conquista di Nettuno (senza meeting room)-carbonio.eml'
		},
		{
			contentType: 'message/rfc822',
			size: 8391,
			name: '8',
			disposition: 'attachment',
			parts: [
				{
					contentType: 'multipart/alternative',
					size: 0,
					name: '8.TEXT',
					parts: [
						{
							contentType: 'text/html',
							size: 509,
							name: '8.1'
						},
						{
							contentType: 'text/plain',
							size: 441,
							name: '8.2'
						},
						{
							contentType: 'text/calendar',
							size: 1920,
							name: '8.3',
							filename: 'meeting.ics'
						}
					]
				}
			],
			filename: 'Conquista di Nettuno (senza meeting room)-gmail.eml'
		},
		{
			contentType: 'message/rfc822',
			size: 12937,
			name: '9',
			disposition: 'attachment',
			parts: [
				{
					contentType: 'multipart/alternative',
					size: 0,
					name: '9.TEXT',
					parts: [
						{
							contentType: 'text/html',
							size: 591,
							name: '9.1'
						},
						{
							contentType: 'text/plain',
							size: 441,
							name: '9.2'
						},
						{
							contentType: 'text/calendar',
							size: 1920,
							name: '9.3',
							filename: 'meeting.ics'
						}
					]
				}
			],
			filename: 'Conquista di Nettuno (senza meeting room)-outlook.eml'
		},
		{
			contentType: 'image/jpeg',
			size: 1433935,
			name: '10',
			disposition: 'attachment',
			filename: 'cool-4k-wallpaper-10.jpg'
		}
	],
	action: 'new',
	oldId: '11215',
	did: '11215',
	original: {
		conversation: '-11215',
		id: '11215',
		date: 1670947197000,
		size: 2041944,
		parent: '6',
		subject: '',
		participants: [
			{
				address: identity1.email,
				fullName: identity1.fullName,
				name: identity1.fullName,
				type: 'f'
			}
		],
		tags: [],
		parts: [
			{
				contentType: 'multipart/mixed',
				size: 0,
				name: 'TEXT',
				parts: [
					{
						contentType: 'multipart/alternative',
						size: 0,
						name: '1',
						parts: [
							{
								contentType: 'text/html',
								size: 120,
								name: '1.1',
								content:
									'<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"></div></body></html>'
							},
							{
								contentType: 'text/plain',
								size: 0,
								name: '1.2'
							}
						]
					},
					{
						contentType: 'message/rfc822',
						size: 8539,
						name: '2',
						disposition: 'attachment',
						parts: [
							{
								contentType: 'multipart/alternative',
								size: 0,
								name: '2.TEXT',
								parts: [
									{
										contentType: 'text/html',
										size: 506,
										name: '2.1'
									},
									{
										contentType: 'text/plain',
										size: 450,
										name: '2.2'
									},
									{
										contentType: 'text/calendar',
										size: 1955,
										name: '2.3',
										filename: 'meeting.ics'
									}
								]
							}
						],
						filename: 'Conquista del mondo senza meeting room.eml'
					},
					{
						contentType: 'message/rfc822',
						size: 7063,
						name: '3',
						disposition: 'attachment',
						parts: [
							{
								contentType: 'multipart/alternative',
								size: 0,
								name: '3.TEXT',
								parts: [
									{
										contentType: 'text/html',
										size: 853,
										name: '3.1'
									},
									{
										contentType: 'text/plain',
										size: 642,
										name: '3.2'
									},
									{
										contentType: 'text/calendar',
										size: 2693,
										name: '3.3',
										filename: 'meeting.ics'
									}
								]
							}
						],
						filename: 'Conquista di Giove (con meeting room) - carbonio.eml'
					},
					{
						contentType: 'message/rfc822',
						size: 9887,
						name: '4',
						disposition: 'attachment',
						parts: [
							{
								contentType: 'multipart/alternative',
								size: 0,
								name: '4.TEXT',
								parts: [
									{
										contentType: 'text/html',
										size: 853,
										name: '4.1'
									},
									{
										contentType: 'text/plain',
										size: 657,
										name: '4.2'
									},
									{
										contentType: 'text/calendar',
										size: 2746,
										name: '4.3',
										filename: 'meeting.ics'
									}
								]
							}
						],
						filename: 'Conquista di Giove (con meeting room) - gmail.eml'
					},
					{
						contentType: 'message/rfc822',
						size: 14261,
						name: '5',
						disposition: 'attachment',
						parts: [
							{
								contentType: 'multipart/alternative',
								size: 0,
								name: '5.TEXT',
								parts: [
									{
										contentType: 'text/html',
										size: 950,
										name: '5.1'
									},
									{
										contentType: 'text/plain',
										size: 642,
										name: '5.2'
									},
									{
										contentType: 'text/calendar',
										size: 2693,
										name: '5.3',
										filename: 'meeting.ics'
									}
								]
							}
						],
						filename: 'Conquista di Giove (con meeting room) - outlook.eml'
					},
					{
						contentType: 'message/rfc822',
						size: 9887,
						name: '6',
						disposition: 'attachment',
						parts: [
							{
								contentType: 'multipart/alternative',
								size: 0,
								name: '6.TEXT',
								parts: [
									{
										contentType: 'text/html',
										size: 853,
										name: '6.1'
									},
									{
										contentType: 'text/plain',
										size: 657,
										name: '6.2'
									},
									{
										contentType: 'text/calendar',
										size: 2746,
										name: '6.3',
										filename: 'meeting.ics'
									}
								]
							}
						],
						filename: 'Conquista di Giove (con meeting room).eml'
					},
					{
						contentType: 'message/rfc822',
						size: 5752,
						name: '7',
						disposition: 'attachment',
						parts: [
							{
								contentType: 'multipart/alternative',
								size: 0,
								name: '7.TEXT',
								parts: [
									{
										contentType: 'text/html',
										size: 509,
										name: '7.1'
									},
									{
										contentType: 'text/plain',
										size: 441,
										name: '7.2'
									},
									{
										contentType: 'text/calendar',
										size: 1920,
										name: '7.3',
										filename: 'meeting.ics'
									}
								]
							}
						],
						filename: 'Conquista di Nettuno (senza meeting room)-carbonio.eml'
					},
					{
						contentType: 'message/rfc822',
						size: 8391,
						name: '8',
						disposition: 'attachment',
						parts: [
							{
								contentType: 'multipart/alternative',
								size: 0,
								name: '8.TEXT',
								parts: [
									{
										contentType: 'text/html',
										size: 509,
										name: '8.1'
									},
									{
										contentType: 'text/plain',
										size: 441,
										name: '8.2'
									},
									{
										contentType: 'text/calendar',
										size: 1920,
										name: '8.3',
										filename: 'meeting.ics'
									}
								]
							}
						],
						filename: 'Conquista di Nettuno (senza meeting room)-gmail.eml'
					},
					{
						contentType: 'message/rfc822',
						size: 12937,
						name: '9',
						disposition: 'attachment',
						parts: [
							{
								contentType: 'multipart/alternative',
								size: 0,
								name: '9.TEXT',
								parts: [
									{
										contentType: 'text/html',
										size: 591,
										name: '9.1'
									},
									{
										contentType: 'text/plain',
										size: 441,
										name: '9.2'
									},
									{
										contentType: 'text/calendar',
										size: 1920,
										name: '9.3',
										filename: 'meeting.ics'
									}
								]
							}
						],
						filename: 'Conquista di Nettuno (senza meeting room)-outlook.eml'
					},
					{
						contentType: 'image/jpeg',
						size: 1433935,
						name: '10',
						disposition: 'attachment',
						filename: 'cool-4k-wallpaper-10.jpg'
					}
				]
			}
		],
		attachments: [
			{
				part: '2',
				ct: 'message/rfc822',
				s: 8539,
				cd: 'attachment',
				filename: 'Conquista del mondo senza meeting room.eml',
				mp: [
					{
						part: '2.TEXT',
						ct: 'multipart/alternative',
						mp: [
							{
								part: '2.1',
								ct: 'text/html',
								s: 506
							},
							{
								part: '2.2',
								ct: 'text/plain',
								s: 450
							},
							{
								part: '2.3',
								ct: 'text/calendar',
								s: 1955,
								filename: 'meeting.ics'
							}
						]
					}
				],
				contentType: 'message/rfc822',
				name: '2',
				size: 8539
			},
			{
				part: '3',
				ct: 'message/rfc822',
				s: 7063,
				cd: 'attachment',
				filename: 'Conquista di Giove (con meeting room) - carbonio.eml',
				mp: [
					{
						part: '3.TEXT',
						ct: 'multipart/alternative',
						mp: [
							{
								part: '3.1',
								ct: 'text/html',
								s: 853
							},
							{
								part: '3.2',
								ct: 'text/plain',
								s: 642
							},
							{
								part: '3.3',
								ct: 'text/calendar',
								s: 2693,
								filename: 'meeting.ics'
							}
						]
					}
				],
				contentType: 'message/rfc822',
				name: '3',
				size: 7063
			},
			{
				part: '4',
				ct: 'message/rfc822',
				s: 9887,
				cd: 'attachment',
				filename: 'Conquista di Giove (con meeting room) - gmail.eml',
				mp: [
					{
						part: '4.TEXT',
						ct: 'multipart/alternative',
						mp: [
							{
								part: '4.1',
								ct: 'text/html',
								s: 853
							},
							{
								part: '4.2',
								ct: 'text/plain',
								s: 657
							},
							{
								part: '4.3',
								ct: 'text/calendar',
								s: 2746,
								filename: 'meeting.ics'
							}
						]
					}
				],
				contentType: 'message/rfc822',
				name: '4',
				size: 9887
			},
			{
				part: '5',
				ct: 'message/rfc822',
				s: 14261,
				cd: 'attachment',
				filename: 'Conquista di Giove (con meeting room) - outlook.eml',
				mp: [
					{
						part: '5.TEXT',
						ct: 'multipart/alternative',
						mp: [
							{
								part: '5.1',
								ct: 'text/html',
								s: 950
							},
							{
								part: '5.2',
								ct: 'text/plain',
								s: 642
							},
							{
								part: '5.3',
								ct: 'text/calendar',
								s: 2693,
								filename: 'meeting.ics'
							}
						]
					}
				],
				contentType: 'message/rfc822',
				name: '5',
				size: 14261
			},
			{
				part: '6',
				ct: 'message/rfc822',
				s: 9887,
				cd: 'attachment',
				filename: 'Conquista di Giove (con meeting room).eml',
				mp: [
					{
						part: '6.TEXT',
						ct: 'multipart/alternative',
						mp: [
							{
								part: '6.1',
								ct: 'text/html',
								s: 853
							},
							{
								part: '6.2',
								ct: 'text/plain',
								s: 657
							},
							{
								part: '6.3',
								ct: 'text/calendar',
								s: 2746,
								filename: 'meeting.ics'
							}
						]
					}
				],
				contentType: 'message/rfc822',
				name: '6',
				size: 9887
			},
			{
				part: '7',
				ct: 'message/rfc822',
				s: 5752,
				cd: 'attachment',
				filename: 'Conquista di Nettuno (senza meeting room)-carbonio.eml',
				mp: [
					{
						part: '7.TEXT',
						ct: 'multipart/alternative',
						mp: [
							{
								part: '7.1',
								ct: 'text/html',
								s: 509
							},
							{
								part: '7.2',
								ct: 'text/plain',
								s: 441
							},
							{
								part: '7.3',
								ct: 'text/calendar',
								s: 1920,
								filename: 'meeting.ics'
							}
						]
					}
				],
				contentType: 'message/rfc822',
				name: '7',
				size: 5752
			},
			{
				part: '8',
				ct: 'message/rfc822',
				s: 8391,
				cd: 'attachment',
				filename: 'Conquista di Nettuno (senza meeting room)-gmail.eml',
				mp: [
					{
						part: '8.TEXT',
						ct: 'multipart/alternative',
						mp: [
							{
								part: '8.1',
								ct: 'text/html',
								s: 509
							},
							{
								part: '8.2',
								ct: 'text/plain',
								s: 441
							},
							{
								part: '8.3',
								ct: 'text/calendar',
								s: 1920,
								filename: 'meeting.ics'
							}
						]
					}
				],
				contentType: 'message/rfc822',
				name: '8',
				size: 8391
			},
			{
				part: '9',
				ct: 'message/rfc822',
				s: 12937,
				cd: 'attachment',
				filename: 'Conquista di Nettuno (senza meeting room)-outlook.eml',
				mp: [
					{
						part: '9.TEXT',
						ct: 'multipart/alternative',
						mp: [
							{
								part: '9.1',
								ct: 'text/html',
								s: 591
							},
							{
								part: '9.2',
								ct: 'text/plain',
								s: 441
							},
							{
								part: '9.3',
								ct: 'text/calendar',
								s: 1920,
								filename: 'meeting.ics'
							}
						]
					}
				],
				contentType: 'message/rfc822',
				name: '9',
				size: 12937
			},
			{
				part: '10',
				ct: 'image/jpeg',
				s: 1433935,
				cd: 'attachment',
				filename: 'cool-4k-wallpaper-10.jpg',
				contentType: 'image/jpeg',
				name: '10',
				size: 1433935
			}
		],
		body: {
			contentType: 'text/html',
			content:
				'<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"></div></body></html>'
		},
		isComplete: true,
		isScheduled: false,
		read: true,
		hasAttachment: true,
		flagged: false,
		urgent: false,
		isDeleted: false,
		isDraft: true,
		isForwarded: false,
		isSentByMe: true,
		isInvite: false,
		isReplied: false,
		isReadReceiptRequested: true
	}
};
