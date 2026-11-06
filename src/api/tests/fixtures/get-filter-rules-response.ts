/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { GetFilterRulesResponse } from 'types/filters';

// GetFilterRules of three rules: two with the tests and actions the editor offers, one with kinds the server
// accepts and the editor doesn't (a real response from the test server). negative and caseSensitive are sent only when
// true, index and d are numbers, fileInto always carries copy, inviteTest's method is a list of _content
export const getFilterRulesResponse = {
	filterRules: [
		{
			filterRule: [
				{
					name: 'ui kinds',
					active: true,
					filterTests: [
						{
							condition: 'anyof',
							headerTest: [
								{
									index: 0,
									header: 'subject',
									caseSensitive: true,
									stringComparison: 'contains',
									value: 'invoice'
								}
							],
							addressTest: [
								{
									index: 1,
									negative: true,
									header: 'from',
									part: 'all',
									stringComparison: 'is',
									value: 'boss@example.com'
								}
							],
							sizeTest: [{ index: 2, numberComparison: 'over', s: '1M' }],
							dateTest: [{ index: 3, dateComparison: 'before', d: 1793664000 }],
							inviteTest: [{ index: 4, method: [{ _content: 'anyrequest' }] }],
							bodyTest: [{ index: 5, value: 'secret' }],
							attachmentTest: [{ index: 6 }]
						}
					],
					filterActions: [
						{
							actionFileInto: [{ index: 0, folderPath: 'Inbox', copy: false }],
							actionTag: [{ index: 1, tagName: 't1' }],
							actionFlag: [{ flagName: 'flagged', index: 2 }],
							actionStop: [{ index: 3 }]
						}
					]
				},
				{
					name: 'server only kinds',
					active: false,
					filterTests: [
						{
							condition: 'allof',
							headerExistsTest: [{ index: 0, header: 'X-Spam' }],
							currentDayOfWeekTest: [{ index: 1, value: '1,2' }],
							currentTimeTest: [{ index: 2, dateComparison: 'after', time: '0900' }],
							importanceTest: [{ index: 3, imp: 'high' }],
							trueTest: [{ index: 4 }],
							envelopeTest: [
								{
									index: 5,
									header: 'to',
									part: 'all',
									stringComparison: 'is',
									value: 'a@example.com'
								}
							]
						}
					],
					filterActions: [
						{
							actionLog: [{ index: 0, level: 'info', _content: 'matched' }],
							actionNotify: [
								{
									index: 1,
									a: 'user2@example.com',
									su: 'notified',
									content: [{ _content: 'body' }]
								}
							],
							actionRedirect: [{ index: 2, a: 'user2@example.com', copy: true }]
						}
					]
				},
				{
					name: 'message and address in',
					active: true,
					filterTests: [
						{
							condition: 'anyof',
							conversationTest: [{ index: 0, where: 'started' }],
							flaggedTest: [{ index: 1, negative: true, flagName: 'flagged' }],
							meTest: [{ index: 2, negative: true, header: 'to' }],
							addressBookTest: [{ index: 3, header: 'from' }],
							bulkTest: [{ index: 4 }]
						}
					],
					filterActions: [{ actionKeep: [{ index: 0 }] }]
				}
			]
		}
	],
	_jsns: 'urn:zimbraMail'
} satisfies GetFilterRulesResponse;
